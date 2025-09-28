import { PrismaClient } from "@database/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export interface WorkflowStep {
  id: string;
  name: string;
  description?: string;
  type: "task" | "condition" | "parallel" | "delay";
  taskType?: string;
  dependencies?: string[];
  assigneeRole?: string;
  estimatedHours?: number;
  dueOffsetDays?: number;
  configuration?: Record<string, any>;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  type: string;
  steps: WorkflowStep[];
  taskTemplates: Record<string, any>;
  requirements?: Record<string, any>;
  settings?: Record<string, any>;
}

export interface WorkflowExecutionContext {
  organizationId: string;
  engagementId?: string;
  clientId?: string;
  assignedToId?: string;
  variables?: Record<string, any>;
}

export class WorkflowService {
  constructor(private prisma: PrismaClient) {}

  async createWorkflowFromTemplate(
    templateId: string,
    name: string,
    context: WorkflowExecutionContext,
    scheduledFor?: Date,
    dueDate?: Date
  ) {
    try {
      // Get the template
      const template = await this.prisma.workflowTemplate.findFirst({
        where: {
          id: templateId,
          isActive: true,
          OR: [
            { organizationId: context.organizationId },
            { isSystemTemplate: true }
          ]
        }
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workflow template not found"
        });
      }

      // Create workflow execution
      const execution = await this.prisma.workflowExecution.create({
        data: {
          name,
          description: template.description,
          templateId: template.id,
          organizationId: context.organizationId,
          engagementId: context.engagementId,
          clientId: context.clientId,
          assignedToId: context.assignedToId,
          scheduledFor,
          dueDate,
          configuration: template.settings,
          context: context.variables,
          createdBy: context.assignedToId || "system"
        }
      });

      // Create task executions from template
      const steps = template.steps as WorkflowStep[];
      const taskExecutions = [];

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        if (step.type === "task") {
          const taskDueDate = dueDate && step.dueOffsetDays
            ? new Date(dueDate.getTime() - (step.dueOffsetDays * 24 * 60 * 60 * 1000))
            : undefined;

          const taskExecution = await this.prisma.taskExecution.create({
            data: {
              title: step.name,
              description: step.description,
              taskType: step.taskType || "preparation",
              stepIndex: i,
              estimatedHours: step.estimatedHours,
              dueDate: taskDueDate,
              workflowExecutionId: execution.id,
              organizationId: context.organizationId,
              configuration: step.configuration,
              dependencies: { requiresCompletion: step.dependencies || [] },
              createdBy: context.assignedToId || "system"
            }
          });

          taskExecutions.push(taskExecution);
        }
      }

      // Auto-assign tasks based on role or assignee
      await this.autoAssignTasks(execution.id, context.organizationId);

      // Start execution if scheduled for now or past
      if (!scheduledFor || scheduledFor <= new Date()) {
        await this.startWorkflow(execution.id);
      }

      return execution;
    } catch (error) {
      console.error("Error creating workflow from template:", error);
      throw error;
    }
  }

  async executeWorkflow(executionId: string, organizationId: string) {
    try {
      const execution = await this.prisma.workflowExecution.findFirst({
        where: {
          id: executionId,
          organizationId,
          status: { in: ["pending", "paused"] }
        },
        include: {
          taskExecutions: {
            orderBy: { stepIndex: "asc" }
          }
        }
      });

      if (!execution) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workflow execution not found or cannot be executed"
        });
      }

      return await this.startWorkflow(executionId);
    } catch (error) {
      console.error("Error executing workflow:", error);
      throw error;
    }
  }

  async pauseWorkflow(executionId: string, organizationId: string) {
    try {
      const execution = await this.prisma.workflowExecution.update({
        where: {
          id: executionId,
          organizationId,
          status: "running"
        },
        data: {
          status: "paused",
          pausedAt: new Date()
        }
      });

      // Pause all running tasks
      await this.prisma.taskExecution.updateMany({
        where: {
          workflowExecutionId: executionId,
          status: "running"
        },
        data: {
          status: "pending"
        }
      });

      return execution;
    } catch (error) {
      console.error("Error pausing workflow:", error);
      throw error;
    }
  }

  async resumeWorkflow(executionId: string, organizationId: string) {
    try {
      const execution = await this.prisma.workflowExecution.update({
        where: {
          id: executionId,
          organizationId,
          status: "paused"
        },
        data: {
          status: "running",
          resumedAt: new Date()
        }
      });

      // Resume eligible tasks
      await this.processNextTasks(executionId);

      return execution;
    } catch (error) {
      console.error("Error resuming workflow:", error);
      throw error;
    }
  }

  async cancelWorkflow(executionId: string, organizationId: string) {
    try {
      const execution = await this.prisma.workflowExecution.update({
        where: {
          id: executionId,
          organizationId,
          status: { in: ["pending", "running", "paused"] }
        },
        data: {
          status: "cancelled",
          cancelledAt: new Date()
        }
      });

      // Cancel all pending and running tasks
      await this.prisma.taskExecution.updateMany({
        where: {
          workflowExecutionId: executionId,
          status: { in: ["pending", "ready", "running"] }
        },
        data: {
          status: "cancelled"
        }
      });

      return execution;
    } catch (error) {
      console.error("Error cancelling workflow:", error);
      throw error;
    }
  }

  async getWorkflowStatus(executionId: string, organizationId: string) {
    try {
      const execution = await this.prisma.workflowExecution.findFirst({
        where: {
          id: executionId,
          organizationId
        },
        include: {
          template: true,
          engagement: true,
          client: true,
          assignedTo: true,
          taskExecutions: {
            include: {
              assignedTo: true
            },
            orderBy: { stepIndex: "asc" }
          }
        }
      });

      if (!execution) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workflow execution not found"
        });
      }

      // Calculate progress
      const totalTasks = execution.taskExecutions.length;
      const completedTasks = execution.taskExecutions.filter(
        task => task.status === "completed"
      ).length;
      const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Update progress in database
      if (progress !== execution.progress) {
        await this.prisma.workflowExecution.update({
          where: { id: executionId },
          data: { progress }
        });
      }

      return {
        ...execution,
        progress,
        completedTasks,
        totalTasks
      };
    } catch (error) {
      console.error("Error getting workflow status:", error);
      throw error;
    }
  }

  async handleTaskCompletion(taskExecutionId: string, organizationId: string) {
    try {
      const taskExecution = await this.prisma.taskExecution.findFirst({
        where: {
          id: taskExecutionId,
          organizationId
        },
        include: {
          workflowExecution: true
        }
      });

      if (!taskExecution) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task execution not found"
        });
      }

      // Mark task as completed
      await this.prisma.taskExecution.update({
        where: { id: taskExecutionId },
        data: {
          status: "completed",
          completedAt: new Date()
        }
      });

      // Process next tasks in workflow
      await this.processNextTasks(taskExecution.workflowExecutionId);

      // Check if workflow is complete
      await this.checkWorkflowCompletion(taskExecution.workflowExecutionId);

      return { success: true };
    } catch (error) {
      console.error("Error handling task completion:", error);
      throw error;
    }
  }

  async scheduleRecurringWorkflow(
    templateId: string,
    cronExpression: string,
    context: WorkflowExecutionContext,
    name: string
  ) {
    try {
      // Validate cron expression
      const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;

      if (!cronRegex.test(cronExpression)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid cron expression"
        });
      }

      // Create recurring workflow execution
      const execution = await this.prisma.workflowExecution.create({
        data: {
          name,
          templateId,
          organizationId: context.organizationId,
          engagementId: context.engagementId,
          clientId: context.clientId,
          assignedToId: context.assignedToId,
          isRecurring: true,
          cronExpression,
          status: "pending",
          context: context.variables,
          createdBy: context.assignedToId || "system"
        }
      });

      // Calculate next run time
      const nextRunAt = this.calculateNextRunTime(cronExpression);
      await this.prisma.workflowExecution.update({
        where: { id: execution.id },
        data: { nextRunAt }
      });

      return execution;
    } catch (error) {
      console.error("Error scheduling recurring workflow:", error);
      throw error;
    }
  }

  private async startWorkflow(executionId: string) {
    const execution = await this.prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status: "running",
        startedAt: new Date()
      }
    });

    // Process first tasks
    await this.processNextTasks(executionId);

    return execution;
  }

  private async processNextTasks(workflowExecutionId: string) {
    const execution = await this.prisma.workflowExecution.findUnique({
      where: { id: workflowExecutionId },
      include: {
        taskExecutions: {
          orderBy: { stepIndex: "asc" }
        }
      }
    });

    if (!execution) return;

    // Find tasks that are ready to be executed
    const readyTasks = execution.taskExecutions.filter(task => {
      if (task.status !== "pending") return false;

      // Check dependencies
      const deps = task.dependencies as { requiresCompletion?: string[] };
      if (deps?.requiresCompletion?.length) {
        const completedSteps = execution.taskExecutions
          .filter(t => t.status === "completed")
          .map(t => t.stepIndex.toString());

        return deps.requiresCompletion.every(dep =>
          completedSteps.includes(dep)
        );
      }

      return true;
    });

    // Mark ready tasks
    for (const task of readyTasks) {
      await this.prisma.taskExecution.update({
        where: { id: task.id },
        data: { status: "ready" }
      });
    }
  }

  private async checkWorkflowCompletion(workflowExecutionId: string) {
    const execution = await this.prisma.workflowExecution.findUnique({
      where: { id: workflowExecutionId },
      include: {
        taskExecutions: true
      }
    });

    if (!execution) return;

    const allCompleted = execution.taskExecutions.every(
      task => task.status === "completed" || task.status === "skipped"
    );

    if (allCompleted) {
      await this.prisma.workflowExecution.update({
        where: { id: workflowExecutionId },
        data: {
          status: "completed",
          completedAt: new Date(),
          progress: 100
        }
      });

      // If recurring, schedule next execution
      if (execution.isRecurring && execution.cronExpression) {
        const nextRunAt = this.calculateNextRunTime(execution.cronExpression);
        await this.prisma.workflowExecution.update({
          where: { id: workflowExecutionId },
          data: {
            nextRunAt,
            lastRunAt: new Date()
          }
        });
      }
    }
  }

  private async autoAssignTasks(executionId: string, organizationId: string) {
    const tasks = await this.prisma.taskExecution.findMany({
      where: {
        workflowExecutionId: executionId,
        assignedToId: null
      }
    });

    for (const task of tasks) {
      const config = task.configuration as { assigneeRole?: string };
      if (config?.assigneeRole) {
        // Find user with matching role
        const user = await this.prisma.user.findFirst({
          where: {
            organizationId,
            role: config.assigneeRole,
            isActive: true
          }
        });

        if (user) {
          await this.prisma.taskExecution.update({
            where: { id: task.id },
            data: { assignedToId: user.id }
          });
        }
      }
    }
  }

  private calculateNextRunTime(cronExpression: string): Date {
    // Simple cron calculation - in production, use a library like node-cron
    const now = new Date();
    const nextRun = new Date(now);

    // Basic implementation for daily execution
    if (cronExpression.includes("0 0 * * *")) {
      nextRun.setDate(nextRun.getDate() + 1);
      nextRun.setHours(0, 0, 0, 0);
    } else {
      // Default to next hour for other expressions
      nextRun.setHours(nextRun.getHours() + 1, 0, 0, 0);
    }

    return nextRun;
  }
}
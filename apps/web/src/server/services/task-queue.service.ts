import { PrismaClient } from "@database/client";
import { TRPCError } from "@trpc/server";
import { v4 as uuidv4 } from "uuid";

export interface QueueItem {
  id: string;
  queueName: string;
  itemType: "workflow_execution" | "task_execution" | "report_generation" | "email_notification";
  entityId: string;
  entityType: string;
  priority: number;
  payload?: Record<string, any>;
  scheduledFor?: Date;
  maxAttempts?: number;
}

export interface ProcessingResult {
  success: boolean;
  result?: any;
  error?: string;
  retry?: boolean;
}

export class TaskQueueService {
  private readonly LOCK_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private readonly RETRY_DELAYS = [60000, 300000, 900000]; // 1min, 5min, 15min

  constructor(private prisma: PrismaClient) {}

  async enqueue(
    queueName: string,
    itemType: QueueItem["itemType"],
    entityId: string,
    entityType: string,
    organizationId: string,
    options: {
      priority?: number;
      payload?: Record<string, any>;
      scheduledFor?: Date;
      maxAttempts?: number;
      createdBy?: string;
    } = {}
  ) {
    try {
      const item = await this.prisma.taskQueueItem.create({
        data: {
          queueName,
          itemType,
          entityId,
          entityType,
          organizationId,
          priority: options.priority || 0,
          payload: options.payload,
          scheduledFor: options.scheduledFor,
          maxAttempts: options.maxAttempts || 3,
          createdBy: options.createdBy
        }
      });

      return item;
    } catch (error) {
      console.error("Error enqueuing item:", error);
      throw error;
    }
  }

  async dequeue(
    queueNames: string[],
    organizationId: string,
    limit: number = 10
  ) {
    try {
      const lockId = uuidv4();
      const lockExpires = new Date(Date.now() + this.LOCK_TIMEOUT);

      // Get available items
      const items = await this.prisma.taskQueueItem.findMany({
        where: {
          organizationId,
          queueName: { in: queueNames },
          status: "pending",
          OR: [
            { scheduledFor: null },
            { scheduledFor: { lte: new Date() } }
          ],
          attempts: { lt: this.prisma.taskQueueItem.fields.maxAttempts }
        },
        orderBy: [
          { priority: "desc" },
          { createdAt: "asc" }
        ],
        take: limit
      });

      if (items.length === 0) {
        return [];
      }

      // Acquire locks
      const itemIds = items.map(item => item.id);
      await this.prisma.taskQueueItem.updateMany({
        where: {
          id: { in: itemIds },
          status: "pending",
          processingLockId: null
        },
        data: {
          status: "processing",
          processingLockId: lockId,
          lockAcquiredAt: new Date(),
          lockExpiresAt: lockExpires,
          attempts: { increment: 1 },
          startedAt: new Date()
        }
      });

      // Return only successfully locked items
      const lockedItems = await this.prisma.taskQueueItem.findMany({
        where: {
          id: { in: itemIds },
          processingLockId: lockId
        }
      });

      return lockedItems;
    } catch (error) {
      console.error("Error dequeuing items:", error);
      throw error;
    }
  }

  async processItem(
    itemId: string,
    processor: (item: any) => Promise<ProcessingResult>
  ) {
    try {
      const item = await this.prisma.taskQueueItem.findUnique({
        where: { id: itemId }
      });

      if (!item || item.status !== "processing") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Queue item not found or not in processing state"
        });
      }

      // Process the item
      const result = await processor(item);

      if (result.success) {
        // Mark as completed
        await this.prisma.taskQueueItem.update({
          where: { id: itemId },
          data: {
            status: "completed",
            completedAt: new Date(),
            result: result.result,
            processingLockId: null,
            lockAcquiredAt: null,
            lockExpiresAt: null
          }
        });
      } else {
        // Handle failure
        await this.handleFailure(itemId, result.error || "Unknown error", result.retry);
      }

      return result;
    } catch (error) {
      console.error("Error processing item:", error);
      await this.handleFailure(itemId, error.message, true);
      throw error;
    }
  }

  async retryFailedItems(organizationId: string, queueName?: string) {
    try {
      const where: any = {
        organizationId,
        status: "failed",
        nextRetryAt: { lte: new Date() },
        attempts: { lt: this.prisma.taskQueueItem.fields.maxAttempts }
      };

      if (queueName) {
        where.queueName = queueName;
      }

      const items = await this.prisma.taskQueueItem.updateMany({
        where,
        data: {
          status: "pending",
          nextRetryAt: null,
          errorMessage: null,
          errorDetails: null
        }
      });

      return items.count;
    } catch (error) {
      console.error("Error retrying failed items:", error);
      throw error;
    }
  }

  async cleanupExpiredLocks() {
    try {
      const expiredItems = await this.prisma.taskQueueItem.updateMany({
        where: {
          status: "processing",
          lockExpiresAt: { lt: new Date() }
        },
        data: {
          status: "pending",
          processingLockId: null,
          lockAcquiredAt: null,
          lockExpiresAt: null
        }
      });

      return expiredItems.count;
    } catch (error) {
      console.error("Error cleaning up expired locks:", error);
      throw error;
    }
  }

  async getQueueStats(organizationId: string, queueName?: string) {
    try {
      const where: any = { organizationId };
      if (queueName) {
        where.queueName = queueName;
      }

      const stats = await this.prisma.taskQueueItem.groupBy({
        by: ["status"],
        where,
        _count: true
      });

      const result = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        cancelled: 0
      };

      stats.forEach(stat => {
        result[stat.status as keyof typeof result] = stat._count;
      });

      return result;
    } catch (error) {
      console.error("Error getting queue stats:", error);
      throw error;
    }
  }

  async processWorkflowTask(item: any): Promise<ProcessingResult> {
    try {
      if (item.itemType === "task_execution") {
        // Get task execution
        const taskExecution = await this.prisma.taskExecution.findUnique({
          where: { id: item.entityId },
          include: {
            workflowExecution: true,
            assignedTo: true
          }
        });

        if (!taskExecution) {
          return {
            success: false,
            error: "Task execution not found",
            retry: false
          };
        }

        // Auto-start task if ready
        if (taskExecution.status === "ready") {
          await this.prisma.taskExecution.update({
            where: { id: taskExecution.id },
            data: {
              status: "running",
              startedAt: new Date()
            }
          });

          // Create notification for assignee
          if (taskExecution.assignedToId) {
            await this.enqueue(
              "notifications",
              "email_notification",
              taskExecution.id,
              "task_assignment",
              item.organizationId,
              {
                payload: {
                  type: "task_assigned",
                  taskId: taskExecution.id,
                  assigneeId: taskExecution.assignedToId,
                  taskTitle: taskExecution.title
                }
              }
            );
          }
        }

        return { success: true };
      }

      if (item.itemType === "workflow_execution") {
        // Process workflow execution
        const execution = await this.prisma.workflowExecution.findUnique({
          where: { id: item.entityId }
        });

        if (!execution) {
          return {
            success: false,
            error: "Workflow execution not found",
            retry: false
          };
        }

        // Handle recurring workflows
        if (execution.isRecurring && execution.nextRunAt && execution.nextRunAt <= new Date()) {
          // Create new execution instance
          const newExecution = await this.prisma.workflowExecution.create({
            data: {
              name: `${execution.name} - ${new Date().toISOString()}`,
              description: execution.description,
              templateId: execution.templateId,
              organizationId: execution.organizationId,
              engagementId: execution.engagementId,
              clientId: execution.clientId,
              assignedToId: execution.assignedToId,
              configuration: execution.configuration,
              context: execution.context,
              createdBy: execution.createdBy
            }
          });

          // Enqueue for processing
          await this.enqueue(
            "workflows",
            "workflow_execution",
            newExecution.id,
            "workflow_start",
            execution.organizationId
          );
        }

        return { success: true };
      }

      return {
        success: false,
        error: "Unknown item type",
        retry: false
      };
    } catch (error) {
      console.error("Error processing workflow task:", error);
      return {
        success: false,
        error: error.message,
        retry: true
      };
    }
  }

  async assignTaskToTeamMember(
    taskExecutionId: string,
    assigneeId: string,
    organizationId: string
  ) {
    try {
      // Verify assignee is part of organization
      const user = await this.prisma.user.findFirst({
        where: {
          id: assigneeId,
          organizationId,
          isActive: true
        }
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found or not part of organization"
        });
      }

      // Update task assignment
      const task = await this.prisma.taskExecution.update({
        where: {
          id: taskExecutionId,
          organizationId
        },
        data: {
          assignedToId: assigneeId
        }
      });

      // Queue notification
      await this.enqueue(
        "notifications",
        "email_notification",
        taskExecutionId,
        "task_assignment",
        organizationId,
        {
          payload: {
            type: "task_assigned",
            taskId: taskExecutionId,
            assigneeId,
            taskTitle: task.title
          }
        }
      );

      return task;
    } catch (error) {
      console.error("Error assigning task:", error);
      throw error;
    }
  }

  async handleTaskDependencies(taskExecutionId: string) {
    try {
      const task = await this.prisma.taskExecution.findUnique({
        where: { id: taskExecutionId },
        include: {
          workflowExecution: {
            include: {
              taskExecutions: true
            }
          }
        }
      });

      if (!task) return;

      const dependencies = task.dependencies as { requiresCompletion?: string[] };
      if (!dependencies?.requiresCompletion?.length) return;

      // Check if all dependencies are completed
      const completedSteps = task.workflowExecution.taskExecutions
        .filter(t => t.status === "completed")
        .map(t => t.stepIndex.toString());

      const allDependenciesMet = dependencies.requiresCompletion.every(dep =>
        completedSteps.includes(dep)
      );

      if (allDependenciesMet && task.status === "pending") {
        // Mark task as ready
        await this.prisma.taskExecution.update({
          where: { id: taskExecutionId },
          data: { status: "ready" }
        });

        // Queue for processing
        await this.enqueue(
          "tasks",
          "task_execution",
          taskExecutionId,
          "task_ready",
          task.organizationId
        );
      }
    } catch (error) {
      console.error("Error handling task dependencies:", error);
      throw error;
    }
  }

  private async handleFailure(itemId: string, error: string, retry: boolean = true) {
    const item = await this.prisma.taskQueueItem.findUnique({
      where: { id: itemId }
    });

    if (!item) return;

    const shouldRetry = retry && item.attempts < item.maxAttempts;
    const nextRetryAt = shouldRetry
      ? new Date(Date.now() + (this.RETRY_DELAYS[Math.min(item.attempts - 1, this.RETRY_DELAYS.length - 1)] || 900000))
      : null;

    await this.prisma.taskQueueItem.update({
      where: { id: itemId },
      data: {
        status: shouldRetry ? "failed" : "failed",
        failedAt: new Date(),
        errorMessage: error,
        nextRetryAt,
        processingLockId: null,
        lockAcquiredAt: null,
        lockExpiresAt: null
      }
    });
  }
}
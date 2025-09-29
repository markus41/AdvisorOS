/**
 * AdvisorOS Multi-Agent Parallel Execution Monitoring System
 * Real-time monitoring and coordination of parallel agent executions
 */

import { EventEmitter } from 'events';
import { orchestrator, AgentTask } from '../agent-coordination-system';

export interface ExecutionMetrics {
  timestamp: Date;
  activeAgents: number;
  parallelTasks: number;
  throughput: number; // tasks per hour
  resourceUtilization: number; // 0-100%
  bottleneckDetected: boolean;
  criticalPathDelay: number; // minutes
}

export interface AgentPerformance {
  agentType: string;
  tasksCompleted: number;
  averageCompletionTime: number; // hours
  successRate: number; // 0-100%
  currentLoad: number; // number of active tasks
  efficiency: number; // actual vs estimated time ratio
}

export interface BottleneckAlert {
  id: string;
  type: 'dependency_chain' | 'resource_constraint' | 'critical_path_delay' | 'agent_overload';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedTasks: string[];
  suggestedActions: string[];
  detectedAt: Date;
  resolved: boolean;
}

export interface ParallelExecutionSnapshot {
  timestamp: Date;
  executionMetrics: ExecutionMetrics;
  agentPerformance: AgentPerformance[];
  activeBottlenecks: BottleneckAlert[];
  parallelExecutionMap: Map<string, string[]>; // agent -> task IDs
  dependencyGraph: DependencyGraph;
  projectedCompletionTime: Date;
}

export interface DependencyGraph {
  nodes: { id: string; label: string; status: string; wave: number }[];
  edges: { from: string; to: string; type: 'dependency' | 'blocker' }[];
}

export class ParallelExecutionMonitor extends EventEmitter {
  private metrics: ExecutionMetrics[] = [];
  private agentPerformanceHistory: Map<string, AgentPerformance[]> = new Map();
  private activeBottlenecks: Map<string, BottleneckAlert> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly MONITORING_INTERVAL = 10000; // 10 seconds
  private readonly METRICS_RETENTION_HOURS = 24;

  constructor() {
    super();
    this.startMonitoring();
  }

  public startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.detectBottlenecks();
      this.optimizeParallelExecution();
      this.emitUpdateEvent();
    }, this.MONITORING_INTERVAL);

    console.log('Parallel execution monitoring started');
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('Parallel execution monitoring stopped');
  }

  private collectMetrics(): void {
    const dashboardData = orchestrator.getDashboardData();
    const { projectMetrics, waves } = dashboardData;

    // Calculate active agents and parallel tasks
    const activeTasks = waves.flatMap((wave: any) =>
      wave.tasks.filter((task: AgentTask) => task.status === 'in_progress')
    );

    const activeAgentTypes = new Set(activeTasks.map((task: AgentTask) => task.agentType));
    const parallelTasks = activeTasks.length;

    // Calculate throughput (tasks completed in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCompletions = waves.flatMap((wave: any) =>
      wave.tasks.filter((task: AgentTask) =>
        task.status === 'completed' &&
        task.completedAt &&
        task.completedAt >= oneHourAgo
      )
    );

    const throughput = recentCompletions.length;

    // Calculate resource utilization (simplified)
    const maxParallelCapacity = 12; // Assume we can run 12 agents in parallel
    const resourceUtilization = Math.min((parallelTasks / maxParallelCapacity) * 100, 100);

    // Detect critical path delays
    const criticalPath = orchestrator.getCriticalPath();
    const delayedCriticalTasks = criticalPath.filter(task =>
      task.status === 'in_progress' &&
      task.startedAt &&
      task.estimatedHours &&
      (Date.now() - task.startedAt.getTime()) > (task.estimatedHours * 60 * 60 * 1000)
    );

    const criticalPathDelay = delayedCriticalTasks.reduce((total, task) => {
      if (task.startedAt && task.estimatedHours) {
        const elapsedHours = (Date.now() - task.startedAt.getTime()) / (60 * 60 * 1000);
        return total + Math.max(0, elapsedHours - task.estimatedHours) * 60; // Convert to minutes
      }
      return total;
    }, 0);

    const metrics: ExecutionMetrics = {
      timestamp: new Date(),
      activeAgents: activeAgentTypes.size,
      parallelTasks,
      throughput,
      resourceUtilization,
      bottleneckDetected: this.activeBottlenecks.size > 0,
      criticalPathDelay
    };

    this.metrics.push(metrics);

    // Cleanup old metrics
    const cutoffTime = new Date(Date.now() - this.METRICS_RETENTION_HOURS * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoffTime);

    // Update agent performance metrics
    this.updateAgentPerformance(waves);
  }

  private updateAgentPerformance(waves: any[]): void {
    const agentStats = new Map<string, {
      completed: AgentTask[];
      active: AgentTask[];
      total: AgentTask[];
    }>();

    // Collect tasks by agent type
    waves.forEach(wave => {
      wave.tasks.forEach((task: AgentTask) => {
        if (!agentStats.has(task.agentType)) {
          agentStats.set(task.agentType, { completed: [], active: [], total: [] });
        }

        const stats = agentStats.get(task.agentType)!;
        stats.total.push(task);

        if (task.status === 'completed') {
          stats.completed.push(task);
        } else if (task.status === 'in_progress') {
          stats.active.push(task);
        }
      });
    });

    // Calculate performance metrics for each agent type
    agentStats.forEach((stats, agentType) => {
      const completedTasks = stats.completed.length;
      const totalHours = stats.completed.reduce((sum, task) =>
        sum + (task.actualHours || task.estimatedHours || 0), 0
      );
      const averageCompletionTime = completedTasks > 0 ? totalHours / completedTasks : 0;

      const successRate = stats.total.length > 0 ?
        (stats.completed.length / stats.total.length) * 100 : 0;

      const currentLoad = stats.active.length;

      const efficiency = stats.completed.length > 0 ?
        stats.completed.reduce((sum, task) => {
          if (task.actualHours && task.estimatedHours) {
            return sum + (task.estimatedHours / task.actualHours);
          }
          return sum + 1; // Assume 100% efficiency if no actual hours tracked
        }, 0) / stats.completed.length : 1;

      const performance: AgentPerformance = {
        agentType,
        tasksCompleted: completedTasks,
        averageCompletionTime,
        successRate,
        currentLoad,
        efficiency
      };

      // Store performance history
      if (!this.agentPerformanceHistory.has(agentType)) {
        this.agentPerformanceHistory.set(agentType, []);
      }

      const history = this.agentPerformanceHistory.get(agentType)!;
      history.push(performance);

      // Keep only last 24 hours of performance data
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
      this.agentPerformanceHistory.set(agentType,
        history.filter(p => new Date() >= cutoffTime)
      );
    });
  }

  private detectBottlenecks(): void {
    const dashboardData = orchestrator.getDashboardData();
    const { waves, criticalPath } = dashboardData;

    // Clear resolved bottlenecks
    this.activeBottlenecks.forEach((bottleneck, id) => {
      if (this.isBottleneckResolved(bottleneck)) {
        bottleneck.resolved = true;
        this.activeBottlenecks.delete(id);
        this.emit('bottleneck-resolved', bottleneck);
      }
    });

    // Detect dependency chain bottlenecks
    this.detectDependencyChainBottlenecks(waves);

    // Detect resource constraints
    this.detectResourceConstraints();

    // Detect critical path delays
    this.detectCriticalPathDelays(criticalPath);

    // Detect agent overload
    this.detectAgentOverload();
  }

  private detectDependencyChainBottlenecks(waves: any[]): void {
    waves.forEach(wave => {
      wave.tasks.forEach((task: AgentTask) => {
        if (task.status === 'pending' && task.dependencies.length > 0) {
          const blockedDependencies = task.dependencies.filter(depId => {
            const depTask = waves.flatMap(w => w.tasks).find((t: AgentTask) => t.id === depId);
            return depTask && depTask.status !== 'completed';
          });

          if (blockedDependencies.length > 0) {
            const bottleneckId = `dep-chain-${task.id}`;
            if (!this.activeBottlenecks.has(bottleneckId)) {
              const bottleneck: BottleneckAlert = {
                id: bottleneckId,
                type: 'dependency_chain',
                severity: 'medium',
                description: `Task "${task.name}" blocked by ${blockedDependencies.length} incomplete dependencies`,
                affectedTasks: [task.id],
                suggestedActions: [
                  'Prioritize completion of blocking dependencies',
                  'Consider parallel execution where possible',
                  'Review dependency requirements'
                ],
                detectedAt: new Date(),
                resolved: false
              };

              this.activeBottlenecks.set(bottleneckId, bottleneck);
              this.emit('bottleneck-detected', bottleneck);
            }
          }
        }
      });
    });
  }

  private detectResourceConstraints(): void {
    const latestMetrics = this.metrics[this.metrics.length - 1];
    if (latestMetrics && latestMetrics.resourceUtilization > 90) {
      const bottleneckId = 'resource-constraint-general';
      if (!this.activeBottlenecks.has(bottleneckId)) {
        const bottleneck: BottleneckAlert = {
          id: bottleneckId,
          type: 'resource_constraint',
          severity: 'high',
          description: `Resource utilization at ${latestMetrics.resourceUtilization.toFixed(1)}%`,
          affectedTasks: [],
          suggestedActions: [
            'Consider scaling up parallel execution capacity',
            'Optimize task allocation across agents',
            'Review resource requirements'
          ],
          detectedAt: new Date(),
          resolved: false
        };

        this.activeBottlenecks.set(bottleneckId, bottleneck);
        this.emit('bottleneck-detected', bottleneck);
      }
    }
  }

  private detectCriticalPathDelays(criticalPath: AgentTask[]): void {
    const delayedTasks = criticalPath.filter(task => {
      if (task.status === 'in_progress' && task.startedAt && task.estimatedHours) {
        const elapsedHours = (Date.now() - task.startedAt.getTime()) / (60 * 60 * 1000);
        return elapsedHours > task.estimatedHours * 1.2; // 20% buffer
      }
      return false;
    });

    delayedTasks.forEach(task => {
      const bottleneckId = `critical-delay-${task.id}`;
      if (!this.activeBottlenecks.has(bottleneckId)) {
        const bottleneck: BottleneckAlert = {
          id: bottleneckId,
          type: 'critical_path_delay',
          severity: 'critical',
          description: `Critical path task "${task.name}" is delayed`,
          affectedTasks: [task.id],
          suggestedActions: [
            'Prioritize completion of this task',
            'Allocate additional resources',
            'Review scope and requirements',
            'Consider task decomposition'
          ],
          detectedAt: new Date(),
          resolved: false
        };

        this.activeBottlenecks.set(bottleneckId, bottleneck);
        this.emit('bottleneck-detected', bottleneck);
      }
    });
  }

  private detectAgentOverload(): void {
    this.agentPerformanceHistory.forEach((history, agentType) => {
      const latest = history[history.length - 1];
      if (latest && latest.currentLoad > 3) { // More than 3 concurrent tasks
        const bottleneckId = `agent-overload-${agentType}`;
        if (!this.activeBottlenecks.has(bottleneckId)) {
          const bottleneck: BottleneckAlert = {
            id: bottleneckId,
            type: 'agent_overload',
            severity: 'medium',
            description: `Agent ${agentType} has ${latest.currentLoad} concurrent tasks`,
            affectedTasks: [],
            suggestedActions: [
              'Redistribute tasks to other available agents',
              'Increase parallel execution capacity for this agent type',
              'Review task complexity and decomposition'
            ],
            detectedAt: new Date(),
            resolved: false
          };

          this.activeBottlenecks.set(bottleneckId, bottleneck);
          this.emit('bottleneck-detected', bottleneck);
        }
      }
    });
  }

  private isBottleneckResolved(bottleneck: BottleneckAlert): boolean {
    switch (bottleneck.type) {
      case 'dependency_chain':
        // Check if blocking dependencies are now complete
        return bottleneck.affectedTasks.every(taskId => {
          const task = orchestrator.getTaskStatus(taskId);
          return task && (task.status === 'completed' || task.status === 'in_progress');
        });

      case 'resource_constraint':
        const latestMetrics = this.metrics[this.metrics.length - 1];
        return latestMetrics && latestMetrics.resourceUtilization < 80;

      case 'critical_path_delay':
        return bottleneck.affectedTasks.every(taskId => {
          const task = orchestrator.getTaskStatus(taskId);
          return task && task.status === 'completed';
        });

      case 'agent_overload':
        const agentType = bottleneck.description.match(/Agent (\S+)/)?.[1];
        if (agentType) {
          const history = this.agentPerformanceHistory.get(agentType);
          const latest = history?.[history.length - 1];
          return latest && latest.currentLoad <= 2;
        }
        return false;

      default:
        return false;
    }
  }

  private optimizeParallelExecution(): void {
    const readyTasks = orchestrator.getReadyTasks();

    // Auto-start ready tasks if resources are available
    const latestMetrics = this.metrics[this.metrics.length - 1];
    if (latestMetrics && latestMetrics.resourceUtilization < 70 && readyTasks.length > 0) {
      // Suggest starting additional tasks
      this.emit('optimization-suggestion', {
        type: 'start_ready_tasks',
        description: `${readyTasks.length} tasks ready to start with ${(100 - latestMetrics.resourceUtilization).toFixed(1)}% capacity available`,
        tasks: readyTasks.slice(0, 3), // Suggest starting up to 3 tasks
        priority: 'medium'
      });
    }

    // Suggest rebalancing if agents are unevenly loaded
    this.suggestLoadRebalancing();
  }

  private suggestLoadRebalancing(): void {
    const agentLoads = new Map<string, number>();

    this.agentPerformanceHistory.forEach((history, agentType) => {
      const latest = history[history.length - 1];
      if (latest) {
        agentLoads.set(agentType, latest.currentLoad);
      }
    });

    const loads = Array.from(agentLoads.values());
    if (loads.length > 1) {
      const maxLoad = Math.max(...loads);
      const minLoad = Math.min(...loads);

      if (maxLoad - minLoad > 2) { // Significant imbalance
        this.emit('optimization-suggestion', {
          type: 'rebalance_load',
          description: `Uneven load distribution detected (max: ${maxLoad}, min: ${minLoad})`,
          priority: 'low'
        });
      }
    }
  }

  private emitUpdateEvent(): void {
    const snapshot = this.getCurrentSnapshot();
    this.emit('monitoring-update', snapshot);
  }

  public getCurrentSnapshot(): ParallelExecutionSnapshot {
    const dashboardData = orchestrator.getDashboardData();
    const latestMetrics = this.metrics[this.metrics.length - 1] || this.createEmptyMetrics();

    const agentPerformance = Array.from(this.agentPerformanceHistory.entries()).map(
      ([agentType, history]) => history[history.length - 1]
    ).filter(Boolean);

    const parallelExecutionMap = new Map<string, string[]>();
    dashboardData.waves.forEach((wave: any) => {
      wave.tasks.forEach((task: AgentTask) => {
        if (task.status === 'in_progress') {
          if (!parallelExecutionMap.has(task.agentType)) {
            parallelExecutionMap.set(task.agentType, []);
          }
          parallelExecutionMap.get(task.agentType)!.push(task.id);
        }
      });
    });

    return {
      timestamp: new Date(),
      executionMetrics: latestMetrics,
      agentPerformance,
      activeBottlenecks: Array.from(this.activeBottlenecks.values()),
      parallelExecutionMap,
      dependencyGraph: this.buildDependencyGraph(dashboardData.waves),
      projectedCompletionTime: dashboardData.projectMetrics.estimatedCompletion
    };
  }

  private createEmptyMetrics(): ExecutionMetrics {
    return {
      timestamp: new Date(),
      activeAgents: 0,
      parallelTasks: 0,
      throughput: 0,
      resourceUtilization: 0,
      bottleneckDetected: false,
      criticalPathDelay: 0
    };
  }

  private buildDependencyGraph(waves: any[]): DependencyGraph {
    const nodes: { id: string; label: string; status: string; wave: number }[] = [];
    const edges: { from: string; to: string; type: 'dependency' | 'blocker' }[] = [];

    waves.forEach(wave => {
      wave.tasks.forEach((task: AgentTask) => {
        nodes.push({
          id: task.id,
          label: task.name,
          status: task.status,
          wave: task.wave
        });

        task.dependencies.forEach(depId => {
          edges.push({
            from: depId,
            to: task.id,
            type: 'dependency'
          });
        });

        task.blockedBy.forEach(blockerId => {
          edges.push({
            from: blockerId,
            to: task.id,
            type: 'blocker'
          });
        });
      });
    });

    return { nodes, edges };
  }

  public getMetricsHistory(): ExecutionMetrics[] {
    return [...this.metrics];
  }

  public getAgentPerformanceHistory(agentType?: string): Map<string, AgentPerformance[]> {
    if (agentType) {
      const history = this.agentPerformanceHistory.get(agentType);
      return new Map(history ? [[agentType, history]] : []);
    }
    return new Map(this.agentPerformanceHistory);
  }

  public getActiveBottlenecks(): BottleneckAlert[] {
    return Array.from(this.activeBottlenecks.values());
  }
}

// Singleton instance
export const parallelExecutionMonitor = new ParallelExecutionMonitor();
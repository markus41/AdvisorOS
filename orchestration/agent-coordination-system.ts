/**
 * AdvisorOS Multi-Agent Parallel Execution Framework
 * Central Orchestration Agent Coordination System
 */

export interface AgentTask {
  id: string;
  agentType: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  wave: number;
  dependencies: string[];
  blockedBy: string[];
  startedAt?: Date;
  completedAt?: Date;
  estimatedHours: number;
  actualHours?: number;
  assignedAgent?: string;
  deliverables: string[];
  riskLevel: 'low' | 'medium' | 'high';
  progressPercentage: number;
  lastUpdated: Date;
  metadata?: Record<string, any>;
}

export interface WaveConfiguration {
  waveNumber: number;
  name: string;
  description: string;
  startDate?: Date;
  endDate?: Date;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  tasks: AgentTask[];
  dependencies: number[]; // Previous waves that must complete
  parallelExecution: boolean;
  criticalPath: string[];
}

export interface ProjectMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  overallProgress: number;
  estimatedCompletion: Date;
  currentRisks: Risk[];
  velocityMetrics: VelocityMetric[];
}

export interface Risk {
  id: string;
  type: 'technical' | 'business' | 'resource' | 'dependency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  mitigation: string;
  owner: string;
  status: 'open' | 'mitigating' | 'resolved';
  createdAt: Date;
}

export interface VelocityMetric {
  date: Date;
  tasksCompleted: number;
  hoursSpent: number;
  velocity: number; // tasks per day
  efficiency: number; // actual vs estimated hours
}

export class AgentOrchestrator {
  private tasks: Map<string, AgentTask> = new Map();
  private waves: Map<number, WaveConfiguration> = new Map();
  private metrics: ProjectMetrics;
  private risks: Map<string, Risk> = new Map();

  constructor() {
    this.initializeFramework();
    this.metrics = this.calculateMetrics();
  }

  private initializeFramework() {
    // Wave 0: Foundation Layer
    this.waves.set(0, {
      waveNumber: 0,
      name: "Foundation Layer",
      description: "Market validation, technical architecture, and operations setup",
      status: 'completed', // Already completed
      tasks: [
        {
          id: 'w0-market-validation',
          agentType: 'market-intelligence-analyst',
          name: 'Market Validation Campaign',
          description: 'CPA interviews, pain point analysis, beta recruitment, LOI collection',
          status: 'completed',
          priority: 'high',
          wave: 0,
          dependencies: [],
          blockedBy: [],
          completedAt: new Date(),
          estimatedHours: 16,
          actualHours: 14,
          deliverables: ['Market validation report', 'Interview scripts', 'Beta tester profiles', 'LOI templates'],
          riskLevel: 'low',
          progressPercentage: 100,
          lastUpdated: new Date()
        },
        {
          id: 'w0-tech-architecture',
          agentType: 'architecture-designer',
          name: 'Technical Architecture Audit',
          description: 'ADR creation, dev environment standardization, CI/CD assessment',
          status: 'completed',
          priority: 'high',
          wave: 0,
          dependencies: [],
          blockedBy: [],
          completedAt: new Date(),
          estimatedHours: 20,
          actualHours: 18,
          deliverables: ['ADR documents', 'Architecture audit', 'Technical debt analysis'],
          riskLevel: 'low',
          progressPercentage: 100,
          lastUpdated: new Date()
        },
        {
          id: 'w0-operations-setup',
          agentType: 'devops-azure-specialist',
          name: 'Operations Infrastructure Setup',
          description: 'Tool infrastructure, Azure optimization, compliance framework',
          status: 'completed',
          priority: 'high',
          wave: 0,
          dependencies: [],
          blockedBy: [],
          completedAt: new Date(),
          estimatedHours: 24,
          actualHours: 22,
          deliverables: ['Operational tooling', 'CI/CD pipelines', 'Compliance framework'],
          riskLevel: 'low',
          progressPercentage: 100,
          lastUpdated: new Date()
        }
      ],
      dependencies: [],
      parallelExecution: true,
      criticalPath: ['w0-tech-architecture']
    });

    // Wave 1: Core Platform Enhancement
    this.waves.set(1, {
      waveNumber: 1,
      name: "Core Platform Enhancement",
      description: "Backend strengthening, frontend modernization, API optimization",
      status: 'not_started',
      tasks: [
        {
          id: 'w1-backend-foundation',
          agentType: 'backend-api-developer',
          name: 'Backend Foundation Strengthening',
          description: 'Enhance Prisma schema, implement audit logging, advanced RBAC',
          status: 'pending',
          priority: 'high',
          wave: 1,
          dependencies: ['w0-tech-architecture'],
          blockedBy: [],
          estimatedHours: 32,
          deliverables: ['Enhanced schema', 'Audit system', 'RBAC implementation'],
          riskLevel: 'medium',
          progressPercentage: 0,
          lastUpdated: new Date()
        },
        {
          id: 'w1-frontend-shell',
          agentType: 'frontend-builder',
          name: 'Frontend Shell Modernization',
          description: 'Component library enhancement, workflow UI, real-time features',
          status: 'pending',
          priority: 'high',
          wave: 1,
          dependencies: ['w1-backend-foundation'],
          blockedBy: [],
          estimatedHours: 28,
          deliverables: ['Component library', 'Workflow UI', 'Real-time features'],
          riskLevel: 'medium',
          progressPercentage: 0,
          lastUpdated: new Date()
        },
        {
          id: 'w1-api-optimization',
          agentType: 'backend-api-developer',
          name: 'API Layer Optimization',
          description: 'tRPC enhancement, rate limiting, error handling, monitoring',
          status: 'pending',
          priority: 'high',
          wave: 1,
          dependencies: ['w1-backend-foundation'],
          blockedBy: [],
          estimatedHours: 24,
          deliverables: ['Enhanced APIs', 'Rate limiting', 'Monitoring dashboards'],
          riskLevel: 'low',
          progressPercentage: 0,
          lastUpdated: new Date()
        }
      ],
      dependencies: [0],
      parallelExecution: true,
      criticalPath: ['w1-backend-foundation', 'w1-frontend-shell']
    });

    // Wave 2: Advanced Integrations
    this.waves.set(2, {
      waveNumber: 2,
      name: "Advanced Integrations",
      description: "QuickBooks enhancement, document engine, client portal",
      status: 'not_started',
      tasks: [
        {
          id: 'w2-quickbooks-integration',
          agentType: 'integration-specialist',
          name: 'QuickBooks Integration Enhancement',
          description: 'Advanced OAuth, webhook processing, sync monitoring',
          status: 'pending',
          priority: 'high',
          wave: 2,
          dependencies: ['w1-api-optimization'],
          blockedBy: [],
          estimatedHours: 30,
          deliverables: ['Enhanced QB integration', 'Webhook system', 'Sync monitoring'],
          riskLevel: 'high',
          progressPercentage: 0,
          lastUpdated: new Date()
        },
        {
          id: 'w2-document-workflow-engine',
          agentType: 'document-intelligence-optimizer',
          name: 'Document & Workflow Engine',
          description: 'AI document processing, workflow builder, OCR pipeline',
          status: 'pending',
          priority: 'high',
          wave: 2,
          dependencies: ['w1-backend-foundation', 'w1-api-optimization'],
          blockedBy: [],
          estimatedHours: 36,
          deliverables: ['Document AI system', 'Workflow builder', 'OCR pipeline'],
          riskLevel: 'high',
          progressPercentage: 0,
          lastUpdated: new Date()
        },
        {
          id: 'w2-client-portal-collaboration',
          agentType: 'client-portal-designer',
          name: 'Client Portal & Collaboration',
          description: 'Advanced CPA dashboard, client portal, real-time messaging',
          status: 'pending',
          priority: 'high',
          wave: 2,
          dependencies: ['w1-frontend-shell', 'w2-document-workflow-engine'],
          blockedBy: [],
          estimatedHours: 32,
          deliverables: ['CPA dashboard', 'Client portal', 'Messaging system'],
          riskLevel: 'medium',
          progressPercentage: 0,
          lastUpdated: new Date()
        }
      ],
      dependencies: [1],
      parallelExecution: true,
      criticalPath: ['w2-quickbooks-integration', 'w2-document-workflow-engine']
    });

    // Wave 3: Intelligence & Scale
    this.waves.set(3, {
      waveNumber: 3,
      name: "Intelligence & Scale",
      description: "AI integration, analytics engine, advisory modules",
      status: 'not_started',
      tasks: [
        {
          id: 'w3-ai-integration',
          agentType: 'ai-features-orchestrator',
          name: 'AI Integration',
          description: 'GPT-4 integration, financial insights, anomaly detection',
          status: 'pending',
          priority: 'high',
          wave: 3,
          dependencies: ['w2-document-workflow-engine'],
          blockedBy: [],
          estimatedHours: 40,
          deliverables: ['AI document analysis', 'Financial insights', 'Anomaly detection'],
          riskLevel: 'high',
          progressPercentage: 0,
          lastUpdated: new Date()
        },
        {
          id: 'w3-analytics-engine',
          agentType: 'financial-prediction-modeler',
          name: 'Analytics Engine',
          description: 'Predictive models, automated insights, report templates',
          status: 'pending',
          priority: 'high',
          wave: 3,
          dependencies: ['w2-quickbooks-integration'],
          blockedBy: [],
          estimatedHours: 36,
          deliverables: ['Predictive analytics', 'Automated reports', 'Insight engine'],
          riskLevel: 'medium',
          progressPercentage: 0,
          lastUpdated: new Date()
        },
        {
          id: 'w3-advisory-modules',
          agentType: 'revenue-intelligence-analyst',
          name: 'Advisory Modules',
          description: 'FP&A module, CFO dashboard, strategic planning toolkit',
          status: 'pending',
          priority: 'medium',
          wave: 3,
          dependencies: ['w3-analytics-engine'],
          blockedBy: [],
          estimatedHours: 32,
          deliverables: ['FP&A module', 'CFO dashboard', 'Strategic toolkit'],
          riskLevel: 'medium',
          progressPercentage: 0,
          lastUpdated: new Date()
        },
        {
          id: 'w3-security-launch-prep',
          agentType: 'security-auditor',
          name: 'Security & Launch Preparation',
          description: 'Performance optimization, security audit, go-to-market execution',
          status: 'pending',
          priority: 'high',
          wave: 3,
          dependencies: ['w3-ai-integration', 'w3-analytics-engine', 'w3-advisory-modules'],
          blockedBy: [],
          estimatedHours: 28,
          deliverables: ['Security audit', 'Performance optimization', 'Launch readiness'],
          riskLevel: 'high',
          progressPercentage: 0,
          lastUpdated: new Date()
        }
      ],
      dependencies: [2],
      parallelExecution: true,
      criticalPath: ['w3-ai-integration', 'w3-analytics-engine', 'w3-security-launch-prep']
    });

    // Initialize all tasks
    this.waves.forEach(wave => {
      wave.tasks.forEach(task => {
        this.tasks.set(task.id, task);
      });
    });
  }

  public getProjectStatus(): ProjectMetrics {
    return this.calculateMetrics();
  }

  public getWaveStatus(waveNumber: number): WaveConfiguration | undefined {
    return this.waves.get(waveNumber);
  }

  public getTaskStatus(taskId: string): AgentTask | undefined {
    return this.tasks.get(taskId);
  }

  public updateTaskStatus(taskId: string, status: AgentTask['status'], progressPercentage?: number): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = status;
    task.lastUpdated = new Date();

    if (progressPercentage !== undefined) {
      task.progressPercentage = progressPercentage;
    }

    if (status === 'in_progress' && !task.startedAt) {
      task.startedAt = new Date();
    }

    if (status === 'completed' && !task.completedAt) {
      task.completedAt = new Date();
      task.progressPercentage = 100;
    }

    // Update wave status
    this.updateWaveStatus(task.wave);

    // Check for unblocked tasks
    this.checkAndUnblockTasks();

    // Recalculate metrics
    this.metrics = this.calculateMetrics();
  }

  private updateWaveStatus(waveNumber: number): void {
    const wave = this.waves.get(waveNumber);
    if (!wave) return;

    const allCompleted = wave.tasks.every(task => task.status === 'completed');
    const anyInProgress = wave.tasks.some(task => task.status === 'in_progress');
    const anyBlocked = wave.tasks.some(task => task.status === 'blocked');

    if (allCompleted) {
      wave.status = 'completed';
      wave.endDate = new Date();
    } else if (anyBlocked) {
      wave.status = 'blocked';
    } else if (anyInProgress) {
      wave.status = 'in_progress';
      if (!wave.startDate) {
        wave.startDate = new Date();
      }
    }
  }

  private checkAndUnblockTasks(): void {
    this.tasks.forEach(task => {
      if (task.status === 'pending' && this.areAllDependenciesComplete(task)) {
        // Task is ready to start
        task.status = 'pending'; // Keep as pending until agent picks it up
        task.blockedBy = []; // Clear any blocks
      }
    });
  }

  private areAllDependenciesComplete(task: AgentTask): boolean {
    return task.dependencies.every(depId => {
      const depTask = this.tasks.get(depId);
      return depTask?.status === 'completed';
    });
  }

  public getReadyTasks(): AgentTask[] {
    return Array.from(this.tasks.values()).filter(task =>
      task.status === 'pending' &&
      this.areAllDependenciesComplete(task)
    );
  }

  public addRisk(risk: Omit<Risk, 'id' | 'createdAt'>): string {
    const id = `risk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.risks.set(id, {
      ...risk,
      id,
      createdAt: new Date()
    });
    return id;
  }

  public updateRisk(riskId: string, updates: Partial<Risk>): void {
    const risk = this.risks.get(riskId);
    if (risk) {
      Object.assign(risk, updates);
    }
  }

  public getCriticalPath(): AgentTask[] {
    // Simple critical path calculation based on dependencies and estimated hours
    const criticalTasks: AgentTask[] = [];
    const visited = new Set<string>();

    const findCriticalPath = (taskId: string): number => {
      if (visited.has(taskId)) return 0;
      visited.add(taskId);

      const task = this.tasks.get(taskId);
      if (!task) return 0;

      let maxDependencyTime = 0;
      for (const depId of task.dependencies) {
        maxDependencyTime = Math.max(maxDependencyTime, findCriticalPath(depId));
      }

      const taskTime = task.estimatedHours || 0;
      criticalTasks.push(task);

      return maxDependencyTime + taskTime;
    };

    // Find tasks with no dependents (end tasks)
    const endTasks = Array.from(this.tasks.values()).filter(task =>
      !Array.from(this.tasks.values()).some(t => t.dependencies.includes(task.id))
    );

    endTasks.forEach(task => findCriticalPath(task.id));

    return criticalTasks.sort((a, b) => a.wave - b.wave);
  }

  private calculateMetrics(): ProjectMetrics {
    const tasks = Array.from(this.tasks.values());
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const blockedTasks = tasks.filter(t => t.status === 'blocked').length;

    const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate estimated completion based on remaining work and current velocity
    const remainingHours = tasks
      .filter(t => t.status !== 'completed')
      .reduce((sum, task) => sum + (task.estimatedHours || 0), 0);

    const estimatedCompletion = new Date();
    estimatedCompletion.setDate(estimatedCompletion.getDate() + Math.ceil(remainingHours / 8)); // 8 hours per day

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      overallProgress,
      estimatedCompletion,
      currentRisks: Array.from(this.risks.values()).filter(r => r.status === 'open'),
      velocityMetrics: this.calculateVelocityMetrics()
    };
  }

  private calculateVelocityMetrics(): VelocityMetric[] {
    // This would typically come from historical data
    // For now, return sample velocity data
    return [
      {
        date: new Date(),
        tasksCompleted: 3,
        hoursSpent: 54,
        velocity: 3,
        efficiency: 0.9
      }
    ];
  }

  public getDashboardData() {
    return {
      projectMetrics: this.metrics,
      waves: Array.from(this.waves.values()),
      readyTasks: this.getReadyTasks(),
      criticalPath: this.getCriticalPath(),
      risks: Array.from(this.risks.values()),
      dailyStandup: this.generateDailyStandupReport()
    };
  }

  private generateDailyStandupReport() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const completedYesterday = Array.from(this.tasks.values()).filter(task =>
      task.completedAt && task.completedAt >= yesterday
    );

    const inProgressToday = Array.from(this.tasks.values()).filter(task =>
      task.status === 'in_progress'
    );

    const blockers = Array.from(this.tasks.values()).filter(task =>
      task.status === 'blocked' || task.blockedBy.length > 0
    );

    return {
      completedYesterday: completedYesterday.map(t => ({
        id: t.id,
        name: t.name,
        wave: t.wave
      })),
      workingOnToday: inProgressToday.map(t => ({
        id: t.id,
        name: t.name,
        progress: t.progressPercentage,
        wave: t.wave
      })),
      blockers: blockers.map(t => ({
        id: t.id,
        name: t.name,
        blockedBy: t.blockedBy,
        wave: t.wave
      }))
    };
  }
}

// Singleton instance
export const orchestrator = new AgentOrchestrator();
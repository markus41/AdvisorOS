/**
 * Proactive Client Intervention Engine
 * Automates client outreach and intervention workflows based on health scoring and behavior analysis
 */

import { z } from 'zod';
import { ClientHealthData } from './health-scoring-engine';

// Intervention Rule Schema
export const InterventionRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  isActive: z.boolean().default(true),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  triggerConditions: z.object({
    healthScoreThreshold: z.number().optional(),
    riskLevel: z.array(z.enum(['very_low', 'low', 'medium', 'high', 'critical'])).optional(),
    churnProbabilityThreshold: z.number().optional(),
    factorScoreThresholds: z.record(z.number()).optional(),
    timeBasedTriggers: z.object({
      daysSinceLastContact: z.number().optional(),
      daysSinceLastPayment: z.number().optional(),
      daysUntilRenewal: z.number().optional(),
    }).optional(),
    behaviorTriggers: z.object({
      loginDeclinePercentage: z.number().optional(),
      documentUploadDecrease: z.number().optional(),
      responseTimeIncrease: z.number().optional(),
    }).optional(),
  }),
  actions: z.array(z.object({
    type: z.enum(['email', 'call', 'meeting', 'task', 'alert', 'escalation']),
    template: z.string(),
    delay: z.number().default(0), // Hours to delay action
    assignTo: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  })),
  escalationPath: z.array(z.object({
    level: z.number(),
    delayHours: z.number(),
    assignTo: z.string(),
    actionType: z.enum(['email', 'call', 'meeting', 'task']),
    template: z.string(),
  })).optional(),
  cooldownPeriod: z.number().default(72), // Hours before rule can trigger again
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const InterventionExecutionSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  ruleId: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled']),
  triggerReason: z.string(),
  executedActions: z.array(z.object({
    actionType: z.string(),
    executedAt: z.date(),
    status: z.enum(['success', 'failed', 'pending']),
    assignedTo: z.string().optional(),
    result: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  })),
  escalationLevel: z.number().default(0),
  nextActionDue: z.date().optional(),
  completedAt: z.date().optional(),
  outcome: z.enum(['resolved', 'escalated', 'expired', 'cancelled']).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type InterventionRule = z.infer<typeof InterventionRuleSchema>;
export type InterventionExecution = z.infer<typeof InterventionExecutionSchema>;

export interface InterventionConfig {
  autoExecute: boolean;
  escalationEnabled: boolean;
  maxConcurrentInterventions: number;
  defaultAssignee: string;
  notificationChannels: string[];
}

export class ProactiveInterventionEngine {
  private config: InterventionConfig;
  private rules: Map<string, InterventionRule> = new Map();
  private activeInterventions: Map<string, InterventionExecution[]> = new Map();

  constructor(config?: Partial<InterventionConfig>) {
    this.config = {
      autoExecute: true,
      escalationEnabled: true,
      maxConcurrentInterventions: 5,
      defaultAssignee: 'system',
      notificationChannels: ['email', 'dashboard'],
      ...config,
    };

    this.initializeDefaultRules();
  }

  /**
   * Initialize default intervention rules
   */
  private initializeDefaultRules(): void {
    // Critical Health Score Rule
    this.addRule({
      id: 'critical-health-score',
      name: 'Critical Health Score Intervention',
      description: 'Immediate intervention for clients with critical health scores',
      isActive: true,
      priority: 'critical',
      triggerConditions: {
        healthScoreThreshold: 50,
        riskLevel: ['critical'],
      },
      actions: [
        {
          type: 'alert',
          template: 'critical-health-alert',
          delay: 0,
        },
        {
          type: 'task',
          template: 'immediate-client-review',
          delay: 0,
          assignTo: 'account_manager',
        },
        {
          type: 'call',
          template: 'urgent-client-call',
          delay: 2,
          assignTo: 'senior_manager',
        },
      ],
      escalationPath: [
        {
          level: 1,
          delayHours: 24,
          assignTo: 'senior_manager',
          actionType: 'meeting',
          template: 'executive-client-meeting',
        },
        {
          level: 2,
          delayHours: 48,
          assignTo: 'partner',
          actionType: 'call',
          template: 'partner-intervention',
        },
      ],
      cooldownPeriod: 168, // 1 week
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Payment Issues Rule
    this.addRule({
      id: 'payment-issues',
      name: 'Payment Issues Intervention',
      description: 'Address payment-related concerns proactively',
      isActive: true,
      priority: 'high',
      triggerConditions: {
        factorScoreThresholds: {
          'Payment History': 60,
        },
      },
      actions: [
        {
          type: 'email',
          template: 'payment-concern-email',
          delay: 0,
          assignTo: 'billing_specialist',
        },
        {
          type: 'call',
          template: 'payment-discussion-call',
          delay: 24,
          assignTo: 'account_manager',
        },
      ],
      escalationPath: [
        {
          level: 1,
          delayHours: 72,
          assignTo: 'collections_manager',
          actionType: 'call',
          template: 'collections-call',
        },
      ],
      cooldownPeriod: 72,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Low Engagement Rule
    this.addRule({
      id: 'low-engagement',
      name: 'Low Engagement Intervention',
      description: 'Re-engage clients with declining portal usage',
      isActive: true,
      priority: 'medium',
      triggerConditions: {
        factorScoreThresholds: {
          'Engagement Level': 40,
        },
        behaviorTriggers: {
          loginDeclinePercentage: 50,
        },
      },
      actions: [
        {
          type: 'email',
          template: 'engagement-check-in',
          delay: 0,
          assignTo: 'client_success_manager',
        },
        {
          type: 'task',
          template: 'portal-training-setup',
          delay: 24,
          assignTo: 'support_specialist',
        },
      ],
      cooldownPeriod: 48,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Renewal Risk Rule
    this.addRule({
      id: 'renewal-risk',
      name: 'Renewal Risk Intervention',
      description: 'Proactive outreach for at-risk renewals',
      isActive: true,
      priority: 'high',
      triggerConditions: {
        churnProbabilityThreshold: 0.6,
        timeBasedTriggers: {
          daysUntilRenewal: 90,
        },
      },
      actions: [
        {
          type: 'task',
          template: 'renewal-risk-assessment',
          delay: 0,
          assignTo: 'account_manager',
        },
        {
          type: 'meeting',
          template: 'renewal-discussion-meeting',
          delay: 48,
          assignTo: 'senior_manager',
        },
      ],
      escalationPath: [
        {
          level: 1,
          delayHours: 168,
          assignTo: 'partner',
          actionType: 'meeting',
          template: 'executive-renewal-meeting',
        },
      ],
      cooldownPeriod: 336, // 2 weeks
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Communication Breakdown Rule
    this.addRule({
      id: 'communication-breakdown',
      name: 'Communication Breakdown Intervention',
      description: 'Address communication issues before they escalate',
      isActive: true,
      priority: 'medium',
      triggerConditions: {
        timeBasedTriggers: {
          daysSinceLastContact: 30,
        },
        behaviorTriggers: {
          responseTimeIncrease: 200,
        },
      },
      actions: [
        {
          type: 'email',
          template: 'communication-check-in',
          delay: 0,
          assignTo: 'account_manager',
        },
        {
          type: 'call',
          template: 'relationship-maintenance-call',
          delay: 24,
          assignTo: 'account_manager',
        },
      ],
      cooldownPeriod: 48,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Add or update an intervention rule
   */
  addRule(rule: Omit<InterventionRule, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): string {
    const ruleId = rule.id || this.generateRuleId();
    const now = new Date();

    const fullRule: InterventionRule = {
      ...rule,
      id: ruleId,
      createdAt: rule.id ? this.rules.get(rule.id)?.createdAt || now : now,
      updatedAt: now,
    };

    this.rules.set(ruleId, fullRule);
    return ruleId;
  }

  /**
   * Evaluate client health data against intervention rules
   */
  async evaluateClient(clientHealthData: ClientHealthData, clientData: any): Promise<InterventionExecution[]> {
    const triggeredInterventions: InterventionExecution[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.isActive) continue;

      // Check if client already has active interventions for this rule
      const activeForRule = this.getActiveInterventionsForClient(clientHealthData.clientId)
        .filter(i => i.ruleId === rule.id);

      if (activeForRule.length > 0) {
        // Check if cooldown period has passed
        const lastExecution = activeForRule[activeForRule.length - 1];
        const cooldownExpired = this.isCooldownExpired(lastExecution, rule.cooldownPeriod);
        if (!cooldownExpired) continue;
      }

      // Evaluate trigger conditions
      if (this.evaluateTriggerConditions(rule, clientHealthData, clientData)) {
        const intervention = await this.createIntervention(rule, clientHealthData, clientData);
        triggeredInterventions.push(intervention);

        // Execute intervention if auto-execute is enabled
        if (this.config.autoExecute) {
          await this.executeIntervention(intervention);
        }
      }
    }

    return triggeredInterventions;
  }

  /**
   * Evaluate trigger conditions for a rule
   */
  private evaluateTriggerConditions(
    rule: InterventionRule,
    healthData: ClientHealthData,
    clientData: any
  ): boolean {
    const conditions = rule.triggerConditions;

    // Health score threshold
    if (conditions.healthScoreThreshold && healthData.overallScore > conditions.healthScoreThreshold) {
      return false;
    }

    // Risk level
    if (conditions.riskLevel && !conditions.riskLevel.includes(healthData.riskLevel)) {
      return false;
    }

    // Churn probability threshold
    if (conditions.churnProbabilityThreshold && healthData.churnProbability < conditions.churnProbabilityThreshold) {
      return false;
    }

    // Factor score thresholds
    if (conditions.factorScoreThresholds) {
      for (const [factorName, threshold] of Object.entries(conditions.factorScoreThresholds)) {
        const factor = healthData.factors.find(f => f.factor === factorName);
        if (!factor || factor.score > threshold) {
          return false;
        }
      }
    }

    // Time-based triggers
    if (conditions.timeBasedTriggers) {
      if (!this.evaluateTimeBasedTriggers(conditions.timeBasedTriggers, clientData)) {
        return false;
      }
    }

    // Behavior triggers
    if (conditions.behaviorTriggers) {
      if (!this.evaluateBehaviorTriggers(conditions.behaviorTriggers, clientData)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate time-based trigger conditions
   */
  private evaluateTimeBasedTriggers(triggers: any, clientData: any): boolean {
    if (triggers.daysSinceLastContact) {
      const daysSince = this.getDaysSinceLastContact(clientData);
      if (daysSince < triggers.daysSinceLastContact) return false;
    }

    if (triggers.daysSinceLastPayment) {
      const daysSince = this.getDaysSinceLastPayment(clientData);
      if (daysSince < triggers.daysSinceLastPayment) return false;
    }

    if (triggers.daysUntilRenewal) {
      const daysUntil = this.getDaysUntilRenewal(clientData);
      if (daysUntil > triggers.daysUntilRenewal) return false;
    }

    return true;
  }

  /**
   * Evaluate behavior-based trigger conditions
   */
  private evaluateBehaviorTriggers(triggers: any, clientData: any): boolean {
    if (triggers.loginDeclinePercentage) {
      const decline = this.calculateLoginDecline(clientData);
      if (decline < triggers.loginDeclinePercentage) return false;
    }

    if (triggers.documentUploadDecrease) {
      const decrease = this.calculateUploadDecrease(clientData);
      if (decrease < triggers.documentUploadDecrease) return false;
    }

    if (triggers.responseTimeIncrease) {
      const increase = this.calculateResponseTimeIncrease(clientData);
      if (increase < triggers.responseTimeIncrease) return false;
    }

    return true;
  }

  /**
   * Create a new intervention execution
   */
  private async createIntervention(
    rule: InterventionRule,
    healthData: ClientHealthData,
    clientData: any
  ): Promise<InterventionExecution> {
    const interventionId = this.generateInterventionId();
    const triggerReason = this.generateTriggerReason(rule, healthData);

    const intervention: InterventionExecution = {
      id: interventionId,
      clientId: healthData.clientId,
      ruleId: rule.id,
      status: 'pending',
      triggerReason,
      executedActions: [],
      escalationLevel: 0,
      nextActionDue: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add to active interventions
    const clientInterventions = this.activeInterventions.get(healthData.clientId) || [];
    clientInterventions.push(intervention);
    this.activeInterventions.set(healthData.clientId, clientInterventions);

    return intervention;
  }

  /**
   * Execute an intervention
   */
  async executeIntervention(intervention: InterventionExecution): Promise<void> {
    const rule = this.rules.get(intervention.ruleId);
    if (!rule) throw new Error(`Rule not found: ${intervention.ruleId}`);

    intervention.status = 'in_progress';
    intervention.updatedAt = new Date();

    try {
      // Execute each action in the rule
      for (const action of rule.actions) {
        await this.executeAction(intervention, action);
      }

      // Schedule next action or mark as completed
      await this.scheduleNextAction(intervention, rule);

    } catch (error) {
      intervention.status = 'failed';
      console.error('Intervention execution failed:', error);
    }
  }

  /**
   * Execute a specific action
   */
  private async executeAction(intervention: InterventionExecution, action: any): Promise<void> {
    // Add delay if specified
    if (action.delay > 0) {
      setTimeout(() => this.performAction(intervention, action), action.delay * 60 * 60 * 1000);
      return;
    }

    await this.performAction(intervention, action);
  }

  /**
   * Perform the actual action
   */
  private async performAction(intervention: InterventionExecution, action: any): Promise<void> {
    const executedAction = {
      actionType: action.type,
      executedAt: new Date(),
      status: 'pending' as const,
      assignedTo: action.assignTo || this.config.defaultAssignee,
      metadata: action.metadata,
    };

    try {
      switch (action.type) {
        case 'email':
          await this.sendEmail(intervention, action);
          break;
        case 'call':
          await this.scheduleCall(intervention, action);
          break;
        case 'meeting':
          await this.scheduleMeeting(intervention, action);
          break;
        case 'task':
          await this.createTask(intervention, action);
          break;
        case 'alert':
          await this.createAlert(intervention, action);
          break;
        case 'escalation':
          await this.escalateIntervention(intervention);
          break;
      }

      executedAction.status = 'success';
      executedAction.result = 'Action completed successfully';

    } catch (error) {
      executedAction.status = 'failed';
      executedAction.result = `Action failed: ${error}`;
    }

    intervention.executedActions.push(executedAction);
    intervention.updatedAt = new Date();
  }

  /**
   * Schedule next action or complete intervention
   */
  private async scheduleNextAction(intervention: InterventionExecution, rule: InterventionRule): Promise<void> {
    // Check if escalation is needed
    if (this.shouldEscalate(intervention, rule)) {
      await this.escalateIntervention(intervention);
      return;
    }

    // Check if intervention is complete
    if (this.isInterventionComplete(intervention, rule)) {
      intervention.status = 'completed';
      intervention.outcome = 'resolved';
      intervention.completedAt = new Date();
      return;
    }

    // Schedule next action based on rule configuration
    const nextActionDelay = this.calculateNextActionDelay(intervention, rule);
    intervention.nextActionDue = new Date(Date.now() + nextActionDelay * 60 * 60 * 1000);
  }

  /**
   * Escalate intervention to next level
   */
  private async escalateIntervention(intervention: InterventionExecution): Promise<void> {
    const rule = this.rules.get(intervention.ruleId);
    if (!rule?.escalationPath || intervention.escalationLevel >= rule.escalationPath.length) {
      intervention.outcome = 'escalated';
      intervention.status = 'completed';
      return;
    }

    const escalationStep = rule.escalationPath[intervention.escalationLevel];
    intervention.escalationLevel++;

    // Execute escalation action
    await this.performAction(intervention, {
      type: escalationStep.actionType,
      template: escalationStep.template,
      assignTo: escalationStep.assignTo,
      delay: escalationStep.delayHours,
    });
  }

  // Action implementation methods
  private async sendEmail(intervention: InterventionExecution, action: any): Promise<void> {
    // Implementation would integrate with email service
    console.log(`Sending email for intervention ${intervention.id} using template ${action.template}`);
  }

  private async scheduleCall(intervention: InterventionExecution, action: any): Promise<void> {
    // Implementation would integrate with scheduling system
    console.log(`Scheduling call for intervention ${intervention.id} with ${action.assignTo}`);
  }

  private async scheduleMeeting(intervention: InterventionExecution, action: any): Promise<void> {
    // Implementation would integrate with calendar system
    console.log(`Scheduling meeting for intervention ${intervention.id}`);
  }

  private async createTask(intervention: InterventionExecution, action: any): Promise<void> {
    // Implementation would create task in task management system
    console.log(`Creating task for intervention ${intervention.id} assigned to ${action.assignTo}`);
  }

  private async createAlert(intervention: InterventionExecution, action: any): Promise<void> {
    // Implementation would create alert in notification system
    console.log(`Creating alert for intervention ${intervention.id}`);
  }

  // Helper methods
  private generateRuleId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateInterventionId(): string {
    return `intervention_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTriggerReason(rule: InterventionRule, healthData: ClientHealthData): string {
    return `Rule "${rule.name}" triggered - Health Score: ${healthData.overallScore}, Risk Level: ${healthData.riskLevel}`;
  }

  private getActiveInterventionsForClient(clientId: string): InterventionExecution[] {
    return this.activeInterventions.get(clientId) || [];
  }

  private isCooldownExpired(intervention: InterventionExecution, cooldownHours: number): boolean {
    const cooldownExpiry = new Date(intervention.createdAt.getTime() + cooldownHours * 60 * 60 * 1000);
    return new Date() > cooldownExpiry;
  }

  private getDaysSinceLastContact(clientData: any): number {
    if (!clientData.lastContactDate) return 999;
    return Math.floor((Date.now() - new Date(clientData.lastContactDate).getTime()) / (1000 * 60 * 60 * 24));
  }

  private getDaysSinceLastPayment(clientData: any): number {
    if (!clientData.lastPaymentDate) return 999;
    return Math.floor((Date.now() - new Date(clientData.lastPaymentDate).getTime()) / (1000 * 60 * 60 * 24));
  }

  private getDaysUntilRenewal(clientData: any): number {
    if (!clientData.renewalDate) return 999;
    return Math.floor((new Date(clientData.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  private calculateLoginDecline(clientData: any): number {
    const currentLogins = clientData.currentMonthLogins || 0;
    const previousLogins = clientData.previousMonthLogins || 1;
    return Math.max(0, ((previousLogins - currentLogins) / previousLogins) * 100);
  }

  private calculateUploadDecrease(clientData: any): number {
    const currentUploads = clientData.currentMonthUploads || 0;
    const previousUploads = clientData.previousMonthUploads || 1;
    return Math.max(0, ((previousUploads - currentUploads) / previousUploads) * 100);
  }

  private calculateResponseTimeIncrease(clientData: any): number {
    const currentResponseTime = clientData.currentResponseTime || 0;
    const previousResponseTime = clientData.previousResponseTime || 1;
    return Math.max(0, ((currentResponseTime - previousResponseTime) / previousResponseTime) * 100);
  }

  private shouldEscalate(intervention: InterventionExecution, rule: InterventionRule): boolean {
    // Escalate if no response after certain time or specific conditions met
    const hoursElapsed = (Date.now() - intervention.createdAt.getTime()) / (1000 * 60 * 60);
    return hoursElapsed > 72 && intervention.executedActions.length > 0;
  }

  private isInterventionComplete(intervention: InterventionExecution, rule: InterventionRule): boolean {
    // Check if all actions have been executed successfully
    return intervention.executedActions.length >= rule.actions.length &&
           intervention.executedActions.every(action => action.status === 'success');
  }

  private calculateNextActionDelay(intervention: InterventionExecution, rule: InterventionRule): number {
    // Calculate delay based on intervention progress and rule configuration
    return 24; // Default 24 hours
  }

  /**
   * Get intervention statistics
   */
  getInterventionStats(organizationId: string): {
    totalInterventions: number;
    activeInterventions: number;
    successfulInterventions: number;
    averageResolutionTime: number;
    interventionsByType: Record<string, number>;
  } {
    const allInterventions = Array.from(this.activeInterventions.values()).flat();

    return {
      totalInterventions: allInterventions.length,
      activeInterventions: allInterventions.filter(i => i.status === 'in_progress').length,
      successfulInterventions: allInterventions.filter(i => i.outcome === 'resolved').length,
      averageResolutionTime: this.calculateAverageResolutionTime(allInterventions),
      interventionsByType: this.groupInterventionsByType(allInterventions),
    };
  }

  private calculateAverageResolutionTime(interventions: InterventionExecution[]): number {
    const completed = interventions.filter(i => i.completedAt);
    if (completed.length === 0) return 0;

    const totalTime = completed.reduce((sum, i) => {
      return sum + (i.completedAt!.getTime() - i.createdAt.getTime());
    }, 0);

    return totalTime / completed.length / (1000 * 60 * 60); // Return in hours
  }

  private groupInterventionsByType(interventions: InterventionExecution[]): Record<string, number> {
    const groupedByRule: Record<string, number> = {};

    interventions.forEach(intervention => {
      const rule = this.rules.get(intervention.ruleId);
      if (rule) {
        groupedByRule[rule.name] = (groupedByRule[rule.name] || 0) + 1;
      }
    });

    return groupedByRule;
  }
}

// Export singleton instance
export const interventionEngine = new ProactiveInterventionEngine();
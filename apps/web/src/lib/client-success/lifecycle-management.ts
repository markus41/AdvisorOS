/**
 * Client Lifecycle Management System
 * Manages the complete client journey from prospect to renewal with stage-specific strategies
 */

import { z } from 'zod';

// Lifecycle Stage Schema
export const LifecycleStageSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  order: z.number(),
  duration: z.object({
    min: z.number(), // Minimum days in stage
    max: z.number(), // Maximum days in stage
    average: z.number(), // Average days in stage
  }),
  entryConditions: z.array(z.object({
    type: z.enum(['manual', 'automatic', 'conditional']),
    condition: z.string(),
    parameters: z.record(z.any()).optional(),
  })),
  exitConditions: z.array(z.object({
    type: z.enum(['manual', 'automatic', 'conditional']),
    condition: z.string(),
    nextStage: z.string(),
    parameters: z.record(z.any()).optional(),
  })),
  successMetrics: z.array(z.object({
    name: z.string(),
    target: z.number(),
    unit: z.string(),
    weight: z.number(),
  })),
  milestones: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    isRequired: z.boolean(),
    order: z.number(),
    estimatedDays: z.number(),
    successCriteria: z.string(),
  })),
  activities: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['task', 'communication', 'meeting', 'review', 'automation']),
    trigger: z.enum(['stage_entry', 'milestone', 'time_based', 'manual']),
    schedule: z.string().optional(), // Cron expression for time-based triggers
    assignTo: z.string(),
    template: z.string().optional(),
    isRequired: z.boolean(),
  })),
  automations: z.array(z.object({
    id: z.string(),
    name: z.string(),
    trigger: z.string(),
    conditions: z.record(z.any()),
    actions: z.array(z.object({
      type: z.string(),
      parameters: z.record(z.any()),
    })),
  })),
  riskFactors: z.array(z.object({
    name: z.string(),
    description: z.string(),
    weight: z.number(),
    threshold: z.number(),
    mitigation: z.array(z.string()),
  })),
});

export const ClientLifecycleStateSchema = z.object({
  clientId: z.string(),
  currentStage: z.string(),
  stageEntryDate: z.date(),
  daysInStage: z.number(),
  progressPercentage: z.number(),
  nextMilestone: z.string().optional(),
  completedMilestones: z.array(z.string()),
  stageHistory: z.array(z.object({
    stage: z.string(),
    entryDate: z.date(),
    exitDate: z.date().optional(),
    durationDays: z.number().optional(),
    exitReason: z.string().optional(),
    successScore: z.number().optional(),
  })),
  healthScore: z.number(),
  riskFactors: z.array(z.object({
    factor: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    detected: z.date(),
    mitigated: z.boolean(),
  })),
  predictedOutcome: z.object({
    likelihood: z.enum(['very_low', 'low', 'medium', 'high', 'very_high']),
    confidence: z.number(),
    factors: z.array(z.string()),
  }),
  interventions: z.array(z.string()), // Active intervention IDs
  lastUpdated: z.date(),
});

export const LifecycleMetricsSchema = z.object({
  organizationId: z.string(),
  period: z.object({
    start: z.date(),
    end: z.date(),
  }),
  stageMetrics: z.record(z.object({
    totalClients: z.number(),
    avgDuration: z.number(),
    conversionRate: z.number(),
    dropoffRate: z.number(),
    satisfactionScore: z.number(),
  })),
  overallMetrics: z.object({
    totalLifetimeValue: z.number(),
    avgClientLifespan: z.number(),
    churnRate: z.number(),
    retentionRate: z.number(),
    upsellRate: z.number(),
  }),
  trends: z.record(z.array(z.object({
    date: z.date(),
    value: z.number(),
  }))),
});

export type LifecycleStage = z.infer<typeof LifecycleStageSchema>;
export type ClientLifecycleState = z.infer<typeof ClientLifecycleStateSchema>;
export type LifecycleMetrics = z.infer<typeof LifecycleMetricsSchema>;

export interface LifecycleConfig {
  enableAutomations: boolean;
  enablePredictiveAnalytics: boolean;
  defaultAssignee: string;
  notificationChannels: string[];
  riskThresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export class ClientLifecycleManager {
  private config: LifecycleConfig;
  private stages: Map<string, LifecycleStage> = new Map();
  private clientStates: Map<string, ClientLifecycleState> = new Map();

  constructor(config?: Partial<LifecycleConfig>) {
    this.config = {
      enableAutomations: true,
      enablePredictiveAnalytics: true,
      defaultAssignee: 'account_manager',
      notificationChannels: ['email', 'dashboard'],
      riskThresholds: {
        low: 25,
        medium: 50,
        high: 75,
        critical: 90,
      },
      ...config,
    };

    this.initializeDefaultStages();
  }

  /**
   * Initialize default lifecycle stages for CPA firms
   */
  private initializeDefaultStages(): void {
    // Prospect Stage
    this.addStage({
      id: 'prospect',
      name: 'Prospect',
      description: 'Initial prospect identification and qualification',
      order: 1,
      duration: { min: 1, max: 30, average: 14 },
      entryConditions: [
        {
          type: 'manual',
          condition: 'prospect_identified',
        },
      ],
      exitConditions: [
        {
          type: 'conditional',
          condition: 'qualified',
          nextStage: 'lead',
          parameters: { qualificationScore: 70 },
        },
        {
          type: 'conditional',
          condition: 'disqualified',
          nextStage: 'closed_lost',
        },
      ],
      successMetrics: [
        { name: 'qualification_score', target: 70, unit: 'points', weight: 1.0 },
        { name: 'response_rate', target: 50, unit: 'percentage', weight: 0.8 },
      ],
      milestones: [
        {
          id: 'initial_contact',
          name: 'Initial Contact Made',
          description: 'First successful contact with prospect',
          isRequired: true,
          order: 1,
          estimatedDays: 3,
          successCriteria: 'Prospect responds to outreach',
        },
        {
          id: 'needs_assessment',
          name: 'Needs Assessment Completed',
          description: 'Comprehensive needs assessment conducted',
          isRequired: true,
          order: 2,
          estimatedDays: 7,
          successCriteria: 'All assessment questions answered',
        },
        {
          id: 'qualification_complete',
          name: 'Qualification Complete',
          description: 'Prospect qualification process completed',
          isRequired: true,
          order: 3,
          estimatedDays: 10,
          successCriteria: 'Qualification score calculated',
        },
      ],
      activities: [
        {
          id: 'initial_outreach',
          name: 'Initial Outreach',
          type: 'communication',
          trigger: 'stage_entry',
          assignTo: 'business_development',
          template: 'prospect_initial_outreach',
          isRequired: true,
        },
        {
          id: 'follow_up_call',
          name: 'Follow-up Call',
          type: 'communication',
          trigger: 'time_based',
          schedule: '0 9 * * 1', // Every Monday at 9 AM
          assignTo: 'business_development',
          template: 'prospect_follow_up',
          isRequired: false,
        },
      ],
      automations: [
        {
          id: 'auto_nurture',
          name: 'Automatic Nurture Campaign',
          trigger: 'stage_entry',
          conditions: { hasEmail: true },
          actions: [
            {
              type: 'email_sequence',
              parameters: { sequenceId: 'prospect_nurture' },
            },
          ],
        },
      ],
      riskFactors: [
        {
          name: 'no_response',
          description: 'No response to outreach attempts',
          weight: 0.8,
          threshold: 5,
          mitigation: ['Try different communication channels', 'Adjust messaging'],
        },
      ],
    });

    // Lead Stage
    this.addStage({
      id: 'lead',
      name: 'Qualified Lead',
      description: 'Qualified prospect moving through sales process',
      order: 2,
      duration: { min: 7, max: 60, average: 30 },
      entryConditions: [
        {
          type: 'conditional',
          condition: 'qualified_from_prospect',
          parameters: { qualificationScore: 70 },
        },
      ],
      exitConditions: [
        {
          type: 'conditional',
          condition: 'proposal_accepted',
          nextStage: 'onboarding',
        },
        {
          type: 'conditional',
          condition: 'proposal_rejected',
          nextStage: 'closed_lost',
        },
      ],
      successMetrics: [
        { name: 'proposal_acceptance_rate', target: 60, unit: 'percentage', weight: 1.0 },
        { name: 'sales_cycle_length', target: 30, unit: 'days', weight: 0.8 },
      ],
      milestones: [
        {
          id: 'discovery_call',
          name: 'Discovery Call Completed',
          description: 'Comprehensive discovery call conducted',
          isRequired: true,
          order: 1,
          estimatedDays: 5,
          successCriteria: 'All discovery questions answered',
        },
        {
          id: 'proposal_created',
          name: 'Proposal Created',
          description: 'Customized proposal created and reviewed',
          isRequired: true,
          order: 2,
          estimatedDays: 10,
          successCriteria: 'Proposal approved by management',
        },
        {
          id: 'proposal_presented',
          name: 'Proposal Presented',
          description: 'Proposal presented to decision makers',
          isRequired: true,
          order: 3,
          estimatedDays: 15,
          successCriteria: 'Proposal presentation completed',
        },
      ],
      activities: [
        {
          id: 'discovery_meeting',
          name: 'Schedule Discovery Meeting',
          type: 'meeting',
          trigger: 'stage_entry',
          assignTo: 'account_manager',
          isRequired: true,
        },
        {
          id: 'proposal_preparation',
          name: 'Prepare Proposal',
          type: 'task',
          trigger: 'milestone',
          assignTo: 'proposal_specialist',
          isRequired: true,
        },
      ],
      automations: [
        {
          id: 'proposal_reminder',
          name: 'Proposal Follow-up Reminder',
          trigger: 'time_based',
          conditions: { proposalSent: true, noResponse: true },
          actions: [
            {
              type: 'reminder',
              parameters: { assignTo: 'account_manager' },
            },
          ],
        },
      ],
      riskFactors: [
        {
          name: 'delayed_decision',
          description: 'Decision timeline extended beyond normal',
          weight: 0.7,
          threshold: 45,
          mitigation: ['Follow up with decision maker', 'Address concerns'],
        },
      ],
    });

    // Onboarding Stage
    this.addStage({
      id: 'onboarding',
      name: 'Client Onboarding',
      description: 'New client onboarding and setup process',
      order: 3,
      duration: { min: 14, max: 90, average: 45 },
      entryConditions: [
        {
          type: 'conditional',
          condition: 'contract_signed',
        },
      ],
      exitConditions: [
        {
          type: 'conditional',
          condition: 'onboarding_complete',
          nextStage: 'active',
        },
      ],
      successMetrics: [
        { name: 'onboarding_completion_rate', target: 95, unit: 'percentage', weight: 1.0 },
        { name: 'time_to_value', target: 30, unit: 'days', weight: 0.9 },
        { name: 'client_satisfaction', target: 8.5, unit: 'score', weight: 0.8 },
      ],
      milestones: [
        {
          id: 'welcome_call',
          name: 'Welcome Call Completed',
          description: 'Initial welcome and expectation setting call',
          isRequired: true,
          order: 1,
          estimatedDays: 3,
          successCriteria: 'Welcome call completed and documented',
        },
        {
          id: 'data_collection',
          name: 'Data Collection Complete',
          description: 'All required client data and documents collected',
          isRequired: true,
          order: 2,
          estimatedDays: 14,
          successCriteria: 'All onboarding documents received',
        },
        {
          id: 'system_setup',
          name: 'Systems Setup Complete',
          description: 'All systems and integrations configured',
          isRequired: true,
          order: 3,
          estimatedDays: 21,
          successCriteria: 'Systems tested and validated',
        },
        {
          id: 'first_deliverable',
          name: 'First Deliverable Completed',
          description: 'First service deliverable completed successfully',
          isRequired: true,
          order: 4,
          estimatedDays: 30,
          successCriteria: 'Client acknowledges first deliverable',
        },
      ],
      activities: [
        {
          id: 'welcome_package',
          name: 'Send Welcome Package',
          type: 'automation',
          trigger: 'stage_entry',
          assignTo: 'client_success',
          template: 'onboarding_welcome',
          isRequired: true,
        },
        {
          id: 'kickoff_meeting',
          name: 'Schedule Kickoff Meeting',
          type: 'meeting',
          trigger: 'stage_entry',
          assignTo: 'account_manager',
          isRequired: true,
        },
        {
          id: 'portal_training',
          name: 'Portal Training Session',
          type: 'meeting',
          trigger: 'milestone',
          assignTo: 'support_specialist',
          isRequired: true,
        },
      ],
      automations: [
        {
          id: 'document_reminders',
          name: 'Document Collection Reminders',
          trigger: 'time_based',
          conditions: { documentsIncomplete: true },
          actions: [
            {
              type: 'email_reminder',
              parameters: { template: 'document_reminder' },
            },
          ],
        },
      ],
      riskFactors: [
        {
          name: 'slow_response',
          description: 'Client slow to respond or provide information',
          weight: 0.8,
          threshold: 7,
          mitigation: ['Personal follow-up call', 'Escalate to account manager'],
        },
        {
          name: 'technical_issues',
          description: 'Technical difficulties with setup',
          weight: 0.6,
          threshold: 3,
          mitigation: ['Technical support escalation', 'Alternative solutions'],
        },
      ],
    });

    // Active Client Stage
    this.addStage({
      id: 'active',
      name: 'Active Client',
      description: 'Ongoing service delivery and relationship management',
      order: 4,
      duration: { min: 365, max: 9999, average: 1095 }, // 3 years average
      entryConditions: [
        {
          type: 'conditional',
          condition: 'onboarding_complete',
        },
      ],
      exitConditions: [
        {
          type: 'conditional',
          condition: 'renewal_due',
          nextStage: 'renewal',
        },
        {
          type: 'conditional',
          condition: 'churn_risk_high',
          nextStage: 'at_risk',
        },
      ],
      successMetrics: [
        { name: 'client_satisfaction', target: 8.0, unit: 'score', weight: 1.0 },
        { name: 'service_utilization', target: 80, unit: 'percentage', weight: 0.8 },
        { name: 'payment_timeliness', target: 95, unit: 'percentage', weight: 0.9 },
      ],
      milestones: [
        {
          id: 'quarterly_review',
          name: 'Quarterly Business Review',
          description: 'Quarterly review of performance and goals',
          isRequired: true,
          order: 1,
          estimatedDays: 90,
          successCriteria: 'QBR completed and documented',
        },
        {
          id: 'annual_planning',
          name: 'Annual Planning Session',
          description: 'Annual strategic planning and goal setting',
          isRequired: true,
          order: 2,
          estimatedDays: 365,
          successCriteria: 'Annual plan agreed and documented',
        },
      ],
      activities: [
        {
          id: 'monthly_checkin',
          name: 'Monthly Check-in',
          type: 'communication',
          trigger: 'time_based',
          schedule: '0 9 1 * *', // First day of month at 9 AM
          assignTo: 'account_manager',
          isRequired: false,
        },
        {
          id: 'service_review',
          name: 'Service Quality Review',
          type: 'review',
          trigger: 'time_based',
          schedule: '0 9 1 */6 *', // Every 6 months
          assignTo: 'quality_assurance',
          isRequired: true,
        },
      ],
      automations: [
        {
          id: 'satisfaction_survey',
          name: 'Quarterly Satisfaction Survey',
          trigger: 'time_based',
          conditions: {},
          actions: [
            {
              type: 'survey',
              parameters: { surveyId: 'quarterly_satisfaction' },
            },
          ],
        },
      ],
      riskFactors: [
        {
          name: 'declining_satisfaction',
          description: 'Decreasing satisfaction scores',
          weight: 0.9,
          threshold: 7.0,
          mitigation: ['Schedule immediate review', 'Address concerns'],
        },
        {
          name: 'payment_delays',
          description: 'Increasing payment delays',
          weight: 0.8,
          threshold: 2,
          mitigation: ['Payment discussion', 'Review terms'],
        },
      ],
    });

    // At Risk Stage
    this.addStage({
      id: 'at_risk',
      name: 'At Risk',
      description: 'Client showing signs of potential churn',
      order: 5,
      duration: { min: 7, max: 90, average: 30 },
      entryConditions: [
        {
          type: 'conditional',
          condition: 'high_churn_risk',
          parameters: { churnProbability: 0.7 },
        },
      ],
      exitConditions: [
        {
          type: 'conditional',
          condition: 'risk_mitigated',
          nextStage: 'active',
        },
        {
          type: 'conditional',
          condition: 'churned',
          nextStage: 'churned',
        },
      ],
      successMetrics: [
        { name: 'recovery_rate', target: 70, unit: 'percentage', weight: 1.0 },
        { name: 'time_to_recovery', target: 21, unit: 'days', weight: 0.8 },
      ],
      milestones: [
        {
          id: 'risk_assessment',
          name: 'Risk Assessment Complete',
          description: 'Comprehensive risk assessment conducted',
          isRequired: true,
          order: 1,
          estimatedDays: 3,
          successCriteria: 'Risk factors identified and documented',
        },
        {
          id: 'intervention_plan',
          name: 'Intervention Plan Created',
          description: 'Targeted intervention plan developed',
          isRequired: true,
          order: 2,
          estimatedDays: 5,
          successCriteria: 'Intervention plan approved',
        },
      ],
      activities: [
        {
          id: 'emergency_review',
          name: 'Emergency Client Review',
          type: 'meeting',
          trigger: 'stage_entry',
          assignTo: 'senior_manager',
          isRequired: true,
        },
        {
          id: 'retention_call',
          name: 'Client Retention Call',
          type: 'communication',
          trigger: 'stage_entry',
          assignTo: 'account_manager',
          isRequired: true,
        },
      ],
      automations: [
        {
          id: 'escalation_alert',
          name: 'Immediate Escalation Alert',
          trigger: 'stage_entry',
          conditions: {},
          actions: [
            {
              type: 'alert',
              parameters: { severity: 'high', assignTo: 'management' },
            },
          ],
        },
      ],
      riskFactors: [
        {
          name: 'unresponsive',
          description: 'Client unresponsive to outreach',
          weight: 0.9,
          threshold: 3,
          mitigation: ['Executive escalation', 'Alternative contact methods'],
        },
      ],
    });

    // Renewal Stage
    this.addStage({
      id: 'renewal',
      name: 'Renewal Process',
      description: 'Contract renewal and negotiation process',
      order: 6,
      duration: { min: 30, max: 120, average: 60 },
      entryConditions: [
        {
          type: 'time_based',
          condition: 'renewal_due',
          parameters: { daysBeforeExpiry: 90 },
        },
      ],
      exitConditions: [
        {
          type: 'conditional',
          condition: 'renewed',
          nextStage: 'active',
        },
        {
          type: 'conditional',
          condition: 'not_renewed',
          nextStage: 'churned',
        },
      ],
      successMetrics: [
        { name: 'renewal_rate', target: 85, unit: 'percentage', weight: 1.0 },
        { name: 'upsell_rate', target: 30, unit: 'percentage', weight: 0.8 },
      ],
      milestones: [
        {
          id: 'renewal_notification',
          name: 'Renewal Notification Sent',
          description: 'Client notified of upcoming renewal',
          isRequired: true,
          order: 1,
          estimatedDays: 7,
          successCriteria: 'Renewal notification acknowledged',
        },
        {
          id: 'renewal_meeting',
          name: 'Renewal Discussion Meeting',
          description: 'Formal renewal discussion conducted',
          isRequired: true,
          order: 2,
          estimatedDays: 21,
          successCriteria: 'Renewal meeting completed',
        },
      ],
      activities: [
        {
          id: 'renewal_prep',
          name: 'Renewal Preparation',
          type: 'task',
          trigger: 'stage_entry',
          assignTo: 'account_manager',
          isRequired: true,
        },
        {
          id: 'value_presentation',
          name: 'Value Demonstration',
          type: 'meeting',
          trigger: 'milestone',
          assignTo: 'account_manager',
          isRequired: true,
        },
      ],
      automations: [
        {
          id: 'renewal_sequence',
          name: 'Renewal Communication Sequence',
          trigger: 'stage_entry',
          conditions: {},
          actions: [
            {
              type: 'email_sequence',
              parameters: { sequenceId: 'renewal_campaign' },
            },
          ],
        },
      ],
      riskFactors: [
        {
          name: 'price_sensitivity',
          description: 'Client expressing price concerns',
          weight: 0.7,
          threshold: 1,
          mitigation: ['Value justification', 'Flexible terms'],
        },
      ],
    });
  }

  /**
   * Add or update a lifecycle stage
   */
  addStage(stage: Omit<LifecycleStage, 'id'> & { id?: string }): string {
    const stageId = stage.id || this.generateStageId();
    const fullStage: LifecycleStage = {
      ...stage,
      id: stageId,
    };

    this.stages.set(stageId, fullStage);
    return stageId;
  }

  /**
   * Initialize client lifecycle state
   */
  initializeClient(clientId: string, initialStage: string = 'prospect'): ClientLifecycleState {
    const state: ClientLifecycleState = {
      clientId,
      currentStage: initialStage,
      stageEntryDate: new Date(),
      daysInStage: 0,
      progressPercentage: 0,
      completedMilestones: [],
      stageHistory: [],
      healthScore: 75, // Default starting score
      riskFactors: [],
      predictedOutcome: {
        likelihood: 'medium',
        confidence: 0.5,
        factors: [],
      },
      interventions: [],
      lastUpdated: new Date(),
    };

    this.clientStates.set(clientId, state);
    return state;
  }

  /**
   * Update client lifecycle state
   */
  async updateClientState(clientId: string, updates: Partial<ClientLifecycleState>): Promise<ClientLifecycleState> {
    const currentState = this.clientStates.get(clientId);
    if (!currentState) {
      throw new Error(`Client state not found: ${clientId}`);
    }

    const updatedState: ClientLifecycleState = {
      ...currentState,
      ...updates,
      lastUpdated: new Date(),
    };

    // Update days in stage
    updatedState.daysInStage = Math.floor(
      (Date.now() - updatedState.stageEntryDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Update progress percentage
    updatedState.progressPercentage = this.calculateStageProgress(updatedState);

    // Check for stage transitions
    await this.checkStageTransitions(updatedState);

    this.clientStates.set(clientId, updatedState);
    return updatedState;
  }

  /**
   * Move client to next stage
   */
  async moveToStage(clientId: string, newStage: string, reason?: string): Promise<ClientLifecycleState> {
    const currentState = this.clientStates.get(clientId);
    if (!currentState) {
      throw new Error(`Client state not found: ${clientId}`);
    }

    const stage = this.stages.get(newStage);
    if (!stage) {
      throw new Error(`Stage not found: ${newStage}`);
    }

    // Add current stage to history
    const stageHistoryEntry = {
      stage: currentState.currentStage,
      entryDate: currentState.stageEntryDate,
      exitDate: new Date(),
      durationDays: currentState.daysInStage,
      exitReason: reason,
      successScore: this.calculateStageSuccessScore(currentState),
    };

    const updatedState: ClientLifecycleState = {
      ...currentState,
      currentStage: newStage,
      stageEntryDate: new Date(),
      daysInStage: 0,
      progressPercentage: 0,
      completedMilestones: [],
      stageHistory: [...currentState.stageHistory, stageHistoryEntry],
      lastUpdated: new Date(),
    };

    // Trigger stage entry automations
    await this.triggerStageAutomations(updatedState, 'stage_entry');

    this.clientStates.set(clientId, updatedState);
    return updatedState;
  }

  /**
   * Complete a milestone for a client
   */
  async completeMilestone(clientId: string, milestoneId: string): Promise<ClientLifecycleState> {
    const state = this.clientStates.get(clientId);
    if (!state) {
      throw new Error(`Client state not found: ${clientId}`);
    }

    if (!state.completedMilestones.includes(milestoneId)) {
      state.completedMilestones.push(milestoneId);
      state.progressPercentage = this.calculateStageProgress(state);
      state.lastUpdated = new Date();

      // Update next milestone
      state.nextMilestone = this.getNextMilestone(state);

      // Trigger milestone automations
      await this.triggerStageAutomations(state, 'milestone');

      this.clientStates.set(clientId, state);
    }

    return state;
  }

  /**
   * Add risk factor to client
   */
  addRiskFactor(clientId: string, factor: string, severity: 'low' | 'medium' | 'high' | 'critical'): void {
    const state = this.clientStates.get(clientId);
    if (!state) return;

    // Remove existing risk factor if present
    state.riskFactors = state.riskFactors.filter(rf => rf.factor !== factor);

    // Add new risk factor
    state.riskFactors.push({
      factor,
      severity,
      detected: new Date(),
      mitigated: false,
    });

    state.lastUpdated = new Date();
    this.clientStates.set(clientId, state);

    // Check if stage transition is needed
    this.checkStageTransitions(state);
  }

  /**
   * Calculate stage progress percentage
   */
  private calculateStageProgress(state: ClientLifecycleState): number {
    const stage = this.stages.get(state.currentStage);
    if (!stage) return 0;

    const totalMilestones = stage.milestones.length;
    const completedMilestones = state.completedMilestones.length;

    if (totalMilestones === 0) {
      // Progress based on time if no milestones
      const timeProgress = Math.min(100, (state.daysInStage / stage.duration.average) * 100);
      return Math.round(timeProgress);
    }

    return Math.round((completedMilestones / totalMilestones) * 100);
  }

  /**
   * Calculate stage success score
   */
  private calculateStageSuccessScore(state: ClientLifecycleState): number {
    const stage = this.stages.get(state.currentStage);
    if (!stage) return 0;

    let score = 0;
    let totalWeight = 0;

    // Score based on milestones completed
    const milestoneScore = (state.completedMilestones.length / stage.milestones.length) * 100;
    score += milestoneScore * 0.6;
    totalWeight += 0.6;

    // Score based on time efficiency
    const timeEfficiency = Math.min(100, (stage.duration.average / Math.max(state.daysInStage, 1)) * 100);
    score += timeEfficiency * 0.3;
    totalWeight += 0.3;

    // Score based on health
    score += state.healthScore * 0.1;
    totalWeight += 0.1;

    return Math.round(score / totalWeight);
  }

  /**
   * Get next milestone for client
   */
  private getNextMilestone(state: ClientLifecycleState): string | undefined {
    const stage = this.stages.get(state.currentStage);
    if (!stage) return undefined;

    const incompleteMilestones = stage.milestones
      .filter(m => !state.completedMilestones.includes(m.id))
      .sort((a, b) => a.order - b.order);

    return incompleteMilestones[0]?.id;
  }

  /**
   * Check for automatic stage transitions
   */
  private async checkStageTransitions(state: ClientLifecycleState): Promise<void> {
    const stage = this.stages.get(state.currentStage);
    if (!stage) return;

    for (const exitCondition of stage.exitConditions) {
      if (exitCondition.type === 'automatic' && this.evaluateExitCondition(exitCondition, state)) {
        await this.moveToStage(state.clientId, exitCondition.nextStage, exitCondition.condition);
        break;
      }
    }
  }

  /**
   * Evaluate exit condition
   */
  private evaluateExitCondition(condition: any, state: ClientLifecycleState): boolean {
    switch (condition.condition) {
      case 'all_milestones_complete':
        const stage = this.stages.get(state.currentStage);
        return stage ? state.completedMilestones.length === stage.milestones.length : false;

      case 'time_expired':
        const maxDays = condition.parameters?.maxDays || 90;
        return state.daysInStage >= maxDays;

      case 'health_score_low':
        const threshold = condition.parameters?.threshold || 50;
        return state.healthScore < threshold;

      default:
        return false;
    }
  }

  /**
   * Trigger stage automations
   */
  private async triggerStageAutomations(state: ClientLifecycleState, trigger: string): Promise<void> {
    if (!this.config.enableAutomations) return;

    const stage = this.stages.get(state.currentStage);
    if (!stage) return;

    const applicableAutomations = stage.automations.filter(automation =>
      automation.trigger === trigger
    );

    for (const automation of applicableAutomations) {
      await this.executeAutomation(automation, state);
    }
  }

  /**
   * Execute automation
   */
  private async executeAutomation(automation: any, state: ClientLifecycleState): Promise<void> {
    // Implementation would integrate with various systems
    console.log(`Executing automation ${automation.name} for client ${state.clientId}`);

    for (const action of automation.actions) {
      switch (action.type) {
        case 'email_sequence':
          await this.triggerEmailSequence(action.parameters, state);
          break;
        case 'task_creation':
          await this.createTask(action.parameters, state);
          break;
        case 'notification':
          await this.sendNotification(action.parameters, state);
          break;
      }
    }
  }

  /**
   * Generate lifecycle metrics
   */
  generateLifecycleMetrics(organizationId: string, startDate: Date, endDate: Date): LifecycleMetrics {
    const clientStates = Array.from(this.clientStates.values());

    // Calculate stage metrics
    const stageMetrics: Record<string, any> = {};

    for (const stage of this.stages.values()) {
      const stageClients = clientStates.filter(s => s.currentStage === stage.id);
      const stageHistory = clientStates.flatMap(s =>
        s.stageHistory.filter(h => h.stage === stage.id)
      );

      stageMetrics[stage.id] = {
        totalClients: stageClients.length,
        avgDuration: this.calculateAverageDuration(stageHistory),
        conversionRate: this.calculateConversionRate(stage.id, clientStates),
        dropoffRate: this.calculateDropoffRate(stage.id, clientStates),
        satisfactionScore: this.calculateStageSatisfaction(stage.id, clientStates),
      };
    }

    // Calculate overall metrics
    const overallMetrics = {
      totalLifetimeValue: this.calculateTotalLTV(clientStates),
      avgClientLifespan: this.calculateAverageLifespan(clientStates),
      churnRate: this.calculateChurnRate(clientStates),
      retentionRate: this.calculateRetentionRate(clientStates),
      upsellRate: this.calculateUpsellRate(clientStates),
    };

    // Generate trends
    const trends = this.generateTrends(clientStates, startDate, endDate);

    return {
      organizationId,
      period: { start: startDate, end: endDate },
      stageMetrics,
      overallMetrics,
      trends,
    };
  }

  // Helper methods for automation execution
  private async triggerEmailSequence(parameters: any, state: ClientLifecycleState): Promise<void> {
    console.log(`Triggering email sequence ${parameters.sequenceId} for client ${state.clientId}`);
  }

  private async createTask(parameters: any, state: ClientLifecycleState): Promise<void> {
    console.log(`Creating task for client ${state.clientId}`);
  }

  private async sendNotification(parameters: any, state: ClientLifecycleState): Promise<void> {
    console.log(`Sending notification for client ${state.clientId}`);
  }

  // Helper methods for metrics calculation
  private calculateAverageDuration(stageHistory: any[]): number {
    if (stageHistory.length === 0) return 0;
    const totalDuration = stageHistory.reduce((sum, h) => sum + (h.durationDays || 0), 0);
    return totalDuration / stageHistory.length;
  }

  private calculateConversionRate(stageId: string, clientStates: ClientLifecycleState[]): number {
    // Implementation for conversion rate calculation
    return 75; // Placeholder
  }

  private calculateDropoffRate(stageId: string, clientStates: ClientLifecycleState[]): number {
    // Implementation for dropoff rate calculation
    return 15; // Placeholder
  }

  private calculateStageSatisfaction(stageId: string, clientStates: ClientLifecycleState[]): number {
    // Implementation for satisfaction calculation
    return 8.2; // Placeholder
  }

  private calculateTotalLTV(clientStates: ClientLifecycleState[]): number {
    // Implementation for total LTV calculation
    return 1250000; // Placeholder
  }

  private calculateAverageLifespan(clientStates: ClientLifecycleState[]): number {
    // Implementation for average lifespan calculation
    return 1095; // Placeholder - 3 years
  }

  private calculateChurnRate(clientStates: ClientLifecycleState[]): number {
    // Implementation for churn rate calculation
    return 12; // Placeholder
  }

  private calculateRetentionRate(clientStates: ClientLifecycleState[]): number {
    // Implementation for retention rate calculation
    return 88; // Placeholder
  }

  private calculateUpsellRate(clientStates: ClientLifecycleState[]): number {
    // Implementation for upsell rate calculation
    return 25; // Placeholder
  }

  private generateTrends(clientStates: ClientLifecycleState[], startDate: Date, endDate: Date): Record<string, any[]> {
    // Implementation for trend generation
    return {
      conversionRate: [],
      churnRate: [],
      satisfaction: [],
    };
  }

  private generateStageId(): string {
    return `stage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get client lifecycle state
   */
  getClientState(clientId: string): ClientLifecycleState | undefined {
    return this.clientStates.get(clientId);
  }

  /**
   * Get all stages
   */
  getAllStages(): LifecycleStage[] {
    return Array.from(this.stages.values()).sort((a, b) => a.order - b.order);
  }

  /**
   * Get stage by ID
   */
  getStage(stageId: string): LifecycleStage | undefined {
    return this.stages.get(stageId);
  }
}

// Export singleton instance
export const lifecycleManager = new ClientLifecycleManager();
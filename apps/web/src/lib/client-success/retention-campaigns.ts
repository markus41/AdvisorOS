/**
 * Client Retention Campaign Automation Engine
 * Automated retention campaigns, win-back sequences, and loyalty programs for CPA firms
 */

import { z } from 'zod';
import { ClientHealthData } from './health-scoring-engine';

// Campaign Schema
export const RetentionCampaignSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['retention', 'winback', 'loyalty', 'upsell', 'renewal', 'referral']),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'archived']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  targetSegment: z.object({
    criteria: z.array(z.object({
      field: z.string(),
      operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'in', 'not_in']),
      value: z.any(),
    })),
    excludeCriteria: z.array(z.object({
      field: z.string(),
      operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'in', 'not_in']),
      value: z.any(),
    })).optional(),
  }),
  triggers: z.array(z.object({
    type: z.enum(['health_score', 'lifecycle_stage', 'behavior', 'time_based', 'manual']),
    condition: z.string(),
    parameters: z.record(z.any()),
  })),
  sequence: z.array(z.object({
    id: z.string(),
    stepNumber: z.number(),
    type: z.enum(['email', 'call', 'meeting', 'sms', 'direct_mail', 'gift', 'offer', 'task']),
    delay: z.number(), // Hours after previous step
    subject: z.string().optional(),
    content: z.string(),
    template: z.string().optional(),
    assignedTo: z.string().optional(),
    conditions: z.array(z.object({
      field: z.string(),
      operator: z.string(),
      value: z.any(),
    })).optional(),
    actions: z.array(z.object({
      type: z.string(),
      parameters: z.record(z.any()),
    })).optional(),
    exitConditions: z.array(z.object({
      condition: z.string(),
      action: z.enum(['skip', 'exit_campaign', 'move_to_step']),
      targetStep: z.number().optional(),
    })).optional(),
  })),
  offers: z.array(z.object({
    id: z.string(),
    type: z.enum(['discount', 'free_service', 'extended_terms', 'added_value', 'exclusive_access']),
    title: z.string(),
    description: z.string(),
    value: z.number(),
    valueType: z.enum(['percentage', 'fixed_amount', 'months', 'hours', 'units']),
    validUntil: z.date().optional(),
    conditions: z.array(z.string()).optional(),
    redemptionCode: z.string().optional(),
  })).optional(),
  metrics: z.object({
    targetResponseRate: z.number(),
    targetConversionRate: z.number(),
    targetROI: z.number(),
    budgetLimit: z.number().optional(),
  }),
  schedule: z.object({
    startDate: z.date(),
    endDate: z.date().optional(),
    timeZone: z.string().default('UTC'),
    sendingHours: z.object({
      start: z.number(), // 0-23
      end: z.number(), // 0-23
    }).optional(),
    daysOfWeek: z.array(z.number()).optional(), // 0-6, Sunday = 0
  }),
  personalization: z.object({
    enabled: z.boolean().default(true),
    fields: z.array(z.string()).default([]),
    dynamicContent: z.boolean().default(false),
  }),
  tracking: z.object({
    emailOpens: z.boolean().default(true),
    linkClicks: z.boolean().default(true),
    responses: z.boolean().default(true),
    conversions: z.boolean().default(true),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
});

export const CampaignExecutionSchema = z.object({
  id: z.string(),
  campaignId: z.string(),
  clientId: z.string(),
  status: z.enum(['queued', 'running', 'paused', 'completed', 'failed', 'cancelled']),
  currentStep: z.number().default(0),
  startedAt: z.date(),
  completedAt: z.date().optional(),
  pausedAt: z.date().optional(),
  nextStepDue: z.date().optional(),
  executedSteps: z.array(z.object({
    stepId: z.string(),
    stepNumber: z.number(),
    executedAt: z.date(),
    status: z.enum(['success', 'failed', 'skipped']),
    response: z.string().optional(),
    openedAt: z.date().optional(),
    clickedAt: z.date().optional(),
    repliedAt: z.date().optional(),
    convertedAt: z.date().optional(),
    errorMessage: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  })),
  responses: z.array(z.object({
    stepId: z.string(),
    responseType: z.enum(['positive', 'negative', 'neutral', 'unsubscribe', 'bounce']),
    content: z.string().optional(),
    receivedAt: z.date(),
    sentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
  })).default([]),
  conversion: z.object({
    converted: z.boolean().default(false),
    conversionType: z.string().optional(),
    conversionValue: z.number().optional(),
    convertedAt: z.date().optional(),
    offerUsed: z.string().optional(),
  }).optional(),
  personalizationData: z.record(z.any()).optional(),
  unsubscribed: z.boolean().default(false),
  unsubscribedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CampaignAnalyticsSchema = z.object({
  campaignId: z.string(),
  period: z.object({
    start: z.date(),
    end: z.date(),
  }),
  metrics: z.object({
    totalRecipients: z.number(),
    totalSent: z.number(),
    delivered: z.number(),
    opened: z.number(),
    clicked: z.number(),
    replied: z.number(),
    converted: z.number(),
    unsubscribed: z.number(),
    bounced: z.number(),
    deliveryRate: z.number(),
    openRate: z.number(),
    clickRate: z.number(),
    responseRate: z.number(),
    conversionRate: z.number(),
    unsubscribeRate: z.number(),
    bounceRate: z.number(),
    roi: z.number(),
    costPerConversion: z.number(),
  }),
  stepMetrics: z.array(z.object({
    stepNumber: z.number(),
    sent: z.number(),
    delivered: z.number(),
    opened: z.number(),
    clicked: z.number(),
    replied: z.number(),
    converted: z.number(),
    effectiveness: z.number(),
  })),
  segmentPerformance: z.record(z.object({
    recipients: z.number(),
    conversions: z.number(),
    conversionRate: z.number(),
    avgValue: z.number(),
  })),
  timeline: z.array(z.object({
    date: z.date(),
    sent: z.number(),
    opened: z.number(),
    clicked: z.number(),
    converted: z.number(),
  })),
});

export type RetentionCampaign = z.infer<typeof RetentionCampaignSchema>;
export type CampaignExecution = z.infer<typeof CampaignExecutionSchema>;
export type CampaignAnalytics = z.infer<typeof CampaignAnalyticsSchema>;

export interface RetentionConfig {
  enableAutomation: boolean;
  maxConcurrentCampaigns: number;
  defaultSendingHours: { start: number; end: number };
  unsubscribeHandling: {
    respectGlobal: boolean;
    cooldownPeriod: number; // Days
  };
  deliverySettings: {
    maxDailyEmails: number;
    throttleDelay: number; // Seconds between sends
  };
  personalizationEngine: {
    enabled: boolean;
    aiPersonalization: boolean;
  };
}

export class RetentionCampaignEngine {
  private config: RetentionConfig;
  private campaigns: Map<string, RetentionCampaign> = new Map();
  private executions: Map<string, CampaignExecution> = new Map();
  private analytics: Map<string, CampaignAnalytics> = new Map();

  constructor(config?: Partial<RetentionConfig>) {
    this.config = {
      enableAutomation: true,
      maxConcurrentCampaigns: 10,
      defaultSendingHours: { start: 9, end: 17 },
      unsubscribeHandling: {
        respectGlobal: true,
        cooldownPeriod: 30,
      },
      deliverySettings: {
        maxDailyEmails: 1000,
        throttleDelay: 5,
      },
      personalizationEngine: {
        enabled: true,
        aiPersonalization: true,
      },
      ...config,
    };

    this.initializeDefaultCampaigns();
  }

  /**
   * Initialize default retention campaigns
   */
  private initializeDefaultCampaigns(): void {
    // At-Risk Client Retention Campaign
    this.createCampaign({
      name: 'At-Risk Client Retention',
      description: 'Comprehensive campaign to retain clients showing churn signals',
      type: 'retention',
      status: 'active',
      priority: 'high',
      targetSegment: {
        criteria: [
          { field: 'healthScore', operator: 'less_than', value: 60 },
          { field: 'riskLevel', operator: 'in', value: ['high', 'critical'] },
        ],
      },
      triggers: [
        {
          type: 'health_score',
          condition: 'score_below_threshold',
          parameters: { threshold: 60, consecutive_periods: 2 },
        },
      ],
      sequence: [
        {
          id: 'step_1',
          stepNumber: 1,
          type: 'email',
          delay: 0,
          subject: 'Your Partnership Matters to Us',
          content: 'We\'ve noticed some changes in your account and want to ensure we\'re meeting your expectations...',
          template: 'retention_initial_outreach',
        },
        {
          id: 'step_2',
          stepNumber: 2,
          type: 'call',
          delay: 72,
          content: 'Personal call to discuss concerns and identify solutions',
          assignedTo: 'account_manager',
          conditions: [
            { field: 'email_opened', operator: 'equals', value: true },
          ],
        },
        {
          id: 'step_3',
          stepNumber: 3,
          type: 'offer',
          delay: 168,
          subject: 'Special Value Package Just for You',
          content: 'We value your partnership and would like to offer you an exclusive package...',
          actions: [
            {
              type: 'apply_offer',
              parameters: { offerId: 'retention_offer_1' },
            },
          ],
        },
        {
          id: 'step_4',
          stepNumber: 4,
          type: 'meeting',
          delay: 336,
          content: 'Executive review meeting to address concerns',
          assignedTo: 'senior_manager',
          conditions: [
            { field: 'offer_not_accepted', operator: 'equals', value: true },
          ],
        },
      ],
      offers: [
        {
          id: 'retention_offer_1',
          type: 'discount',
          title: '20% Discount on Next Year',
          description: 'Exclusive 20% discount on your annual service fee',
          value: 20,
          valueType: 'percentage',
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          conditions: ['must_be_current_client', 'no_payment_defaults'],
        },
      ],
      metrics: {
        targetResponseRate: 40,
        targetConversionRate: 60,
        targetROI: 300,
      },
      schedule: {
        startDate: new Date(),
        timeZone: 'UTC',
        sendingHours: { start: 9, end: 17 },
        daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
      },
      personalization: {
        enabled: true,
        fields: ['firstName', 'companyName', 'serviceType', 'accountManager'],
        dynamicContent: true,
      },
      tracking: {
        emailOpens: true,
        linkClicks: true,
        responses: true,
        conversions: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
    });

    // Win-Back Campaign
    this.createCampaign({
      name: 'Win-Back Campaign',
      description: 'Re-engage churned clients with compelling offers',
      type: 'winback',
      status: 'active',
      priority: 'medium',
      targetSegment: {
        criteria: [
          { field: 'status', operator: 'equals', value: 'churned' },
          { field: 'daysSinceChurn', operator: 'less_than', value: 180 },
        ],
        excludeCriteria: [
          { field: 'unsubscribed', operator: 'equals', value: true },
          { field: 'disputedCharges', operator: 'equals', value: true },
        ],
      },
      triggers: [
        {
          type: 'lifecycle_stage',
          condition: 'moved_to_churned',
          parameters: { delay_days: 30 },
        },
      ],
      sequence: [
        {
          id: 'winback_1',
          stepNumber: 1,
          type: 'email',
          delay: 0,
          subject: 'We Miss You - Let\'s Talk',
          content: 'We noticed you\'re no longer using our services and we\'d love to understand why...',
          template: 'winback_initial',
        },
        {
          id: 'winback_2',
          stepNumber: 2,
          type: 'offer',
          delay: 168,
          subject: 'Special Return Offer - 3 Months Free',
          content: 'We\'d like to win back your trust with this special offer...',
          actions: [
            {
              type: 'apply_offer',
              parameters: { offerId: 'winback_offer_1' },
            },
          ],
        },
        {
          id: 'winback_3',
          stepNumber: 3,
          type: 'call',
          delay: 336,
          content: 'Personal call from leadership to discuss return',
          assignedTo: 'partner',
        },
      ],
      offers: [
        {
          id: 'winback_offer_1',
          type: 'free_service',
          title: '3 Months Free Service',
          description: 'Return and get 3 months of service at no charge',
          value: 3,
          valueType: 'months',
          validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
          redemptionCode: 'COMEBACK2024',
        },
      ],
      metrics: {
        targetResponseRate: 25,
        targetConversionRate: 15,
        targetROI: 400,
      },
      schedule: {
        startDate: new Date(),
        timeZone: 'UTC',
      },
      personalization: {
        enabled: true,
        fields: ['firstName', 'companyName', 'lastServiceDate', 'preferredContact'],
      },
      tracking: {
        emailOpens: true,
        linkClicks: true,
        responses: true,
        conversions: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
    });

    // Loyalty Program Campaign
    this.createCampaign({
      name: 'Client Loyalty Program',
      description: 'Reward and retain long-term loyal clients',
      type: 'loyalty',
      status: 'active',
      priority: 'medium',
      targetSegment: {
        criteria: [
          { field: 'clientTenure', operator: 'greater_than', value: 365 },
          { field: 'healthScore', operator: 'greater_than', value: 75 },
          { field: 'totalRevenue', operator: 'greater_than', value: 10000 },
        ],
      },
      triggers: [
        {
          type: 'time_based',
          condition: 'anniversary',
          parameters: { frequency: 'annual' },
        },
      ],
      sequence: [
        {
          id: 'loyalty_1',
          stepNumber: 1,
          type: 'email',
          delay: 0,
          subject: 'Thank You for Your Continued Trust',
          content: 'Celebrating another year of partnership with exclusive benefits...',
          template: 'loyalty_appreciation',
        },
        {
          id: 'loyalty_2',
          stepNumber: 2,
          type: 'gift',
          delay: 24,
          content: 'Special anniversary gift delivery',
          actions: [
            {
              type: 'send_gift',
              parameters: { giftType: 'premium', value: 150 },
            },
          ],
        },
        {
          id: 'loyalty_3',
          stepNumber: 3,
          type: 'offer',
          delay: 168,
          subject: 'Exclusive Loyalty Benefits',
          content: 'As a valued long-term client, enjoy these exclusive benefits...',
          actions: [
            {
              type: 'activate_benefits',
              parameters: { benefitPackage: 'premium_loyalty' },
            },
          ],
        },
      ],
      offers: [
        {
          id: 'loyalty_benefits',
          type: 'exclusive_access',
          title: 'VIP Client Benefits',
          description: 'Priority support, exclusive events, and premium resources',
          value: 0,
          valueType: 'units',
        },
      ],
      metrics: {
        targetResponseRate: 70,
        targetConversionRate: 90,
        targetROI: 250,
      },
      schedule: {
        startDate: new Date(),
        timeZone: 'UTC',
      },
      personalization: {
        enabled: true,
        fields: ['firstName', 'companyName', 'anniversaryDate', 'totalValue'],
        dynamicContent: true,
      },
      tracking: {
        emailOpens: true,
        linkClicks: true,
        responses: true,
        conversions: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
    });

    // Referral Campaign
    this.createCampaign({
      name: 'Client Referral Program',
      description: 'Incentivize satisfied clients to refer new business',
      type: 'referral',
      status: 'active',
      priority: 'low',
      targetSegment: {
        criteria: [
          { field: 'healthScore', operator: 'greater_than', value: 80 },
          { field: 'npsScore', operator: 'greater_than', value: 8 },
          { field: 'lastReferral', operator: 'greater_than', value: 365 },
        ],
      },
      triggers: [
        {
          type: 'behavior',
          condition: 'high_satisfaction_survey',
          parameters: { nps_threshold: 9 },
        },
      ],
      sequence: [
        {
          id: 'referral_1',
          stepNumber: 1,
          type: 'email',
          delay: 72,
          subject: 'Share the Love - Referral Rewards',
          content: 'We\'re grateful for your trust. Know someone who could benefit from our services?',
          template: 'referral_invitation',
        },
        {
          id: 'referral_2',
          stepNumber: 2,
          type: 'email',
          delay: 336,
          subject: 'Reminder: Earn Rewards for Referrals',
          content: 'Don\'t forget about our referral program...',
          template: 'referral_reminder',
          conditions: [
            { field: 'no_referral_made', operator: 'equals', value: true },
          ],
        },
      ],
      offers: [
        {
          id: 'referral_reward',
          type: 'discount',
          title: '$500 Referral Credit',
          description: 'Receive $500 credit for each successful referral',
          value: 500,
          valueType: 'fixed_amount',
        },
      ],
      metrics: {
        targetResponseRate: 30,
        targetConversionRate: 10,
        targetROI: 500,
      },
      schedule: {
        startDate: new Date(),
        timeZone: 'UTC',
      },
      personalization: {
        enabled: true,
        fields: ['firstName', 'companyName', 'servicesSaved'],
      },
      tracking: {
        emailOpens: true,
        linkClicks: true,
        responses: true,
        conversions: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
    });
  }

  /**
   * Create new retention campaign
   */
  createCampaign(campaignData: Omit<RetentionCampaign, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): string {
    const campaignId = campaignData.id || this.generateCampaignId();
    const now = new Date();

    const campaign: RetentionCampaign = {
      ...campaignData,
      id: campaignId,
      createdAt: campaignData.id ? this.campaigns.get(campaignData.id)?.createdAt || now : now,
      updatedAt: now,
    };

    this.campaigns.set(campaignId, campaign);
    return campaignId;
  }

  /**
   * Evaluate client for campaign triggers
   */
  async evaluateClientForCampaigns(clientData: any, healthData?: ClientHealthData): Promise<string[]> {
    const triggeredCampaigns: string[] = [];

    for (const campaign of this.campaigns.values()) {
      if (campaign.status !== 'active') continue;

      // Check if client matches target segment
      if (!this.matchesTargetSegment(clientData, campaign.targetSegment)) continue;

      // Check if client is already in this campaign
      const activeExecution = this.getActiveExecutionForClient(clientData.id, campaign.id);
      if (activeExecution) continue;

      // Check triggers
      for (const trigger of campaign.triggers) {
        if (await this.evaluateTrigger(trigger, clientData, healthData)) {
          triggeredCampaigns.push(campaign.id);
          break;
        }
      }
    }

    return triggeredCampaigns;
  }

  /**
   * Start campaign for client
   */
  async startCampaignForClient(campaignId: string, clientId: string): Promise<string> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    // Check if client already has active execution
    const activeExecution = this.getActiveExecutionForClient(clientId, campaignId);
    if (activeExecution) {
      throw new Error(`Client ${clientId} already has active execution for campaign ${campaignId}`);
    }

    const executionId = this.generateExecutionId();
    const personalizationData = await this.getPersonalizationData(clientId, campaign);

    const execution: CampaignExecution = {
      id: executionId,
      campaignId,
      clientId,
      status: 'queued',
      currentStep: 0,
      startedAt: new Date(),
      nextStepDue: new Date(),
      executedSteps: [],
      responses: [],
      personalizationData,
      unsubscribed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.executions.set(executionId, execution);

    // Start execution if automation is enabled
    if (this.config.enableAutomation) {
      await this.executeNextStep(executionId);
    }

    return executionId;
  }

  /**
   * Execute next step in campaign
   */
  async executeNextStep(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    const campaign = this.campaigns.get(execution.campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${execution.campaignId}`);
    }

    if (execution.status !== 'queued' && execution.status !== 'running') {
      return;
    }

    const nextStepIndex = execution.currentStep;
    const nextStep = campaign.sequence[nextStepIndex];

    if (!nextStep) {
      // Campaign completed
      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.updatedAt = new Date();
      this.executions.set(executionId, execution);
      return;
    }

    // Check step conditions
    if (nextStep.conditions && !this.evaluateStepConditions(nextStep.conditions, execution)) {
      // Skip this step
      execution.currentStep++;
      execution.updatedAt = new Date();
      this.executions.set(executionId, execution);
      await this.executeNextStep(executionId);
      return;
    }

    // Check exit conditions
    if (nextStep.exitConditions) {
      for (const exitCondition of nextStep.exitConditions) {
        if (this.evaluateExitCondition(exitCondition, execution)) {
          await this.handleExitCondition(exitCondition, execution);
          return;
        }
      }
    }

    // Execute the step
    try {
      execution.status = 'running';
      await this.executeStep(nextStep, execution, campaign);

      // Record step execution
      execution.executedSteps.push({
        stepId: nextStep.id,
        stepNumber: nextStep.stepNumber,
        executedAt: new Date(),
        status: 'success',
        metadata: {
          type: nextStep.type,
          delay: nextStep.delay,
        },
      });

      // Move to next step
      execution.currentStep++;

      // Schedule next step
      if (execution.currentStep < campaign.sequence.length) {
        const nextStepDelay = campaign.sequence[execution.currentStep]?.delay || 0;
        execution.nextStepDue = new Date(Date.now() + nextStepDelay * 60 * 60 * 1000);
        execution.status = 'queued';
      } else {
        execution.status = 'completed';
        execution.completedAt = new Date();
      }

      execution.updatedAt = new Date();
      this.executions.set(executionId, execution);

    } catch (error) {
      // Handle step execution error
      execution.executedSteps.push({
        stepId: nextStep.id,
        stepNumber: nextStep.stepNumber,
        executedAt: new Date(),
        status: 'failed',
        errorMessage: `Step execution failed: ${error}`,
      });

      execution.status = 'failed';
      execution.updatedAt = new Date();
      this.executions.set(executionId, execution);
    }
  }

  /**
   * Execute individual campaign step
   */
  private async executeStep(step: any, execution: CampaignExecution, campaign: RetentionCampaign): Promise<void> {
    const personalizedContent = this.personalizeContent(step.content, execution.personalizationData);
    const personalizedSubject = step.subject ? this.personalizeContent(step.subject, execution.personalizationData) : undefined;

    switch (step.type) {
      case 'email':
        await this.sendEmail(execution.clientId, personalizedSubject!, personalizedContent, step.template);
        break;

      case 'sms':
        await this.sendSMS(execution.clientId, personalizedContent);
        break;

      case 'call':
        await this.scheduleCall(execution.clientId, step.assignedTo!, personalizedContent);
        break;

      case 'meeting':
        await this.scheduleMeeting(execution.clientId, step.assignedTo!, personalizedContent);
        break;

      case 'direct_mail':
        await this.sendDirectMail(execution.clientId, personalizedContent);
        break;

      case 'gift':
        await this.sendGift(execution.clientId, step.actions);
        break;

      case 'offer':
        await this.applyOffer(execution.clientId, campaign.offers, step.actions);
        break;

      case 'task':
        await this.createTask(execution.clientId, step.assignedTo!, personalizedContent);
        break;

      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  /**
   * Record campaign response
   */
  async recordResponse(
    executionId: string,
    stepId: string,
    responseType: 'positive' | 'negative' | 'neutral' | 'unsubscribe' | 'bounce',
    content?: string
  ): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    execution.responses.push({
      stepId,
      responseType,
      content,
      receivedAt: new Date(),
      sentiment: this.analyzeSentiment(content),
    });

    // Handle special response types
    if (responseType === 'unsubscribe') {
      execution.unsubscribed = true;
      execution.unsubscribedAt = new Date();
      execution.status = 'cancelled';
    }

    // Check for conversion
    if (responseType === 'positive') {
      await this.checkForConversion(execution, stepId);
    }

    execution.updatedAt = new Date();
    this.executions.set(executionId, execution);
  }

  /**
   * Generate campaign analytics
   */
  generateCampaignAnalytics(campaignId: string, startDate: Date, endDate: Date): CampaignAnalytics {
    const executions = Array.from(this.executions.values())
      .filter(e => e.campaignId === campaignId && e.createdAt >= startDate && e.createdAt <= endDate);

    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    // Calculate overall metrics
    const totalRecipients = executions.length;
    const totalSent = executions.filter(e => e.executedSteps.length > 0).length;
    const delivered = executions.filter(e => !e.executedSteps.some(s => s.status === 'failed')).length;
    const opened = executions.filter(e => e.executedSteps.some(s => s.openedAt)).length;
    const clicked = executions.filter(e => e.executedSteps.some(s => s.clickedAt)).length;
    const replied = executions.filter(e => e.responses.length > 0).length;
    const converted = executions.filter(e => e.conversion?.converted).length;
    const unsubscribed = executions.filter(e => e.unsubscribed).length;

    const metrics = {
      totalRecipients,
      totalSent,
      delivered,
      opened,
      clicked,
      replied,
      converted,
      unsubscribed,
      bounced: totalSent - delivered,
      deliveryRate: totalSent > 0 ? (delivered / totalSent) * 100 : 0,
      openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
      clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
      responseRate: delivered > 0 ? (replied / delivered) * 100 : 0,
      conversionRate: delivered > 0 ? (converted / delivered) * 100 : 0,
      unsubscribeRate: delivered > 0 ? (unsubscribed / delivered) * 100 : 0,
      bounceRate: totalSent > 0 ? ((totalSent - delivered) / totalSent) * 100 : 0,
      roi: this.calculateROI(executions, campaign),
      costPerConversion: converted > 0 ? this.calculateCostPerConversion(executions, campaign) : 0,
    };

    // Calculate step metrics
    const stepMetrics = campaign.sequence.map(step => {
      const stepExecutions = executions.filter(e =>
        e.executedSteps.some(es => es.stepId === step.id)
      );

      return {
        stepNumber: step.stepNumber,
        sent: stepExecutions.length,
        delivered: stepExecutions.filter(e => !e.executedSteps.some(s => s.stepId === step.id && s.status === 'failed')).length,
        opened: stepExecutions.filter(e => e.executedSteps.some(s => s.stepId === step.id && s.openedAt)).length,
        clicked: stepExecutions.filter(e => e.executedSteps.some(s => s.stepId === step.id && s.clickedAt)).length,
        replied: stepExecutions.filter(e => e.responses.some(r => r.stepId === step.id)).length,
        converted: stepExecutions.filter(e => e.conversion?.converted).length,
        effectiveness: stepExecutions.length > 0 ? (stepExecutions.filter(e => e.conversion?.converted).length / stepExecutions.length) * 100 : 0,
      };
    });

    // Calculate segment performance (placeholder)
    const segmentPerformance = {
      'high_value': { recipients: 25, conversions: 15, conversionRate: 60, avgValue: 5000 },
      'medium_value': { recipients: 50, conversions: 20, conversionRate: 40, avgValue: 2500 },
      'low_value': { recipients: 100, conversions: 25, conversionRate: 25, avgValue: 1000 },
    };

    // Generate timeline data
    const timeline = this.generateTimelineData(executions, startDate, endDate);

    return {
      campaignId,
      period: { start: startDate, end: endDate },
      metrics,
      stepMetrics,
      segmentPerformance,
      timeline,
    };
  }

  // Helper methods for campaign evaluation
  private matchesTargetSegment(clientData: any, segment: RetentionCampaign['targetSegment']): boolean {
    // Check inclusion criteria
    for (const criterion of segment.criteria) {
      if (!this.evaluateCriterion(clientData, criterion)) {
        return false;
      }
    }

    // Check exclusion criteria
    if (segment.excludeCriteria) {
      for (const criterion of segment.excludeCriteria) {
        if (this.evaluateCriterion(clientData, criterion)) {
          return false;
        }
      }
    }

    return true;
  }

  private evaluateCriterion(clientData: any, criterion: any): boolean {
    const fieldValue = this.getFieldValue(clientData, criterion.field);

    switch (criterion.operator) {
      case 'equals':
        return fieldValue === criterion.value;
      case 'not_equals':
        return fieldValue !== criterion.value;
      case 'greater_than':
        return fieldValue > criterion.value;
      case 'less_than':
        return fieldValue < criterion.value;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(criterion.value).toLowerCase());
      case 'in':
        return Array.isArray(criterion.value) && criterion.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(criterion.value) && !criterion.value.includes(fieldValue);
      default:
        return false;
    }
  }

  private async evaluateTrigger(trigger: any, clientData: any, healthData?: ClientHealthData): Promise<boolean> {
    switch (trigger.type) {
      case 'health_score':
        return healthData ? this.evaluateHealthScoreTrigger(trigger, healthData) : false;
      case 'lifecycle_stage':
        return this.evaluateLifecycleTrigger(trigger, clientData);
      case 'behavior':
        return this.evaluateBehaviorTrigger(trigger, clientData);
      case 'time_based':
        return this.evaluateTimeTrigger(trigger, clientData);
      case 'manual':
        return false; // Manual triggers are handled separately
      default:
        return false;
    }
  }

  private evaluateHealthScoreTrigger(trigger: any, healthData: ClientHealthData): boolean {
    switch (trigger.condition) {
      case 'score_below_threshold':
        return healthData.overallScore < trigger.parameters.threshold;
      case 'score_declined':
        // Would need historical data to implement properly
        return true;
      default:
        return false;
    }
  }

  private evaluateLifecycleTrigger(trigger: any, clientData: any): boolean {
    // Implementation would check lifecycle stage changes
    return false;
  }

  private evaluateBehaviorTrigger(trigger: any, clientData: any): boolean {
    // Implementation would check behavior patterns
    return false;
  }

  private evaluateTimeTrigger(trigger: any, clientData: any): boolean {
    // Implementation would check time-based conditions
    return false;
  }

  private evaluateStepConditions(conditions: any[], execution: CampaignExecution): boolean {
    return conditions.every(condition => {
      const value = this.getExecutionFieldValue(execution, condition.field);
      return this.evaluateCondition(value, condition.operator, condition.value);
    });
  }

  private evaluateExitCondition(exitCondition: any, execution: CampaignExecution): boolean {
    // Implementation would evaluate exit conditions
    return false;
  }

  private async handleExitCondition(exitCondition: any, execution: CampaignExecution): Promise<void> {
    switch (exitCondition.action) {
      case 'skip':
        execution.currentStep++;
        break;
      case 'exit_campaign':
        execution.status = 'completed';
        execution.completedAt = new Date();
        break;
      case 'move_to_step':
        execution.currentStep = exitCondition.targetStep;
        break;
    }
    execution.updatedAt = new Date();
    this.executions.set(execution.id, execution);
  }

  // Content personalization
  private async getPersonalizationData(clientId: string, campaign: RetentionCampaign): Promise<Record<string, any>> {
    const data: Record<string, any> = {};

    if (campaign.personalization.enabled) {
      // Fetch client data for personalization
      // Implementation would integrate with client data sources
      data.firstName = 'John';
      data.companyName = 'Example Company';
      data.accountManager = 'Sarah Smith';
      data.serviceType = 'Full Service';
    }

    return data;
  }

  private personalizeContent(content: string, personalizationData?: Record<string, any>): string {
    if (!personalizationData) return content;

    let personalizedContent = content;

    Object.entries(personalizationData).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      personalizedContent = personalizedContent.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return personalizedContent;
  }

  // Step execution methods
  private async sendEmail(clientId: string, subject: string, content: string, template?: string): Promise<void> {
    console.log(`Sending email to client ${clientId}: ${subject}`);
    // Implementation would integrate with email service
  }

  private async sendSMS(clientId: string, content: string): Promise<void> {
    console.log(`Sending SMS to client ${clientId}: ${content}`);
    // Implementation would integrate with SMS service
  }

  private async scheduleCall(clientId: string, assignedTo: string, notes: string): Promise<void> {
    console.log(`Scheduling call for client ${clientId} assigned to ${assignedTo}`);
    // Implementation would integrate with scheduling system
  }

  private async scheduleMeeting(clientId: string, assignedTo: string, agenda: string): Promise<void> {
    console.log(`Scheduling meeting for client ${clientId} assigned to ${assignedTo}`);
    // Implementation would integrate with calendar system
  }

  private async sendDirectMail(clientId: string, content: string): Promise<void> {
    console.log(`Sending direct mail to client ${clientId}`);
    // Implementation would integrate with direct mail service
  }

  private async sendGift(clientId: string, actions?: any[]): Promise<void> {
    console.log(`Sending gift to client ${clientId}`);
    // Implementation would integrate with gift service
  }

  private async applyOffer(clientId: string, offers?: any[], actions?: any[]): Promise<void> {
    console.log(`Applying offer to client ${clientId}`);
    // Implementation would apply offers to client account
  }

  private async createTask(clientId: string, assignedTo: string, description: string): Promise<void> {
    console.log(`Creating task for client ${clientId} assigned to ${assignedTo}`);
    // Implementation would create task in task management system
  }

  // Analytics helpers
  private calculateROI(executions: CampaignExecution[], campaign: RetentionCampaign): number {
    const totalRevenue = executions.reduce((sum, e) => sum + (e.conversion?.conversionValue || 0), 0);
    const estimatedCost = executions.length * 50; // Placeholder cost calculation
    return estimatedCost > 0 ? ((totalRevenue - estimatedCost) / estimatedCost) * 100 : 0;
  }

  private calculateCostPerConversion(executions: CampaignExecution[], campaign: RetentionCampaign): number {
    const conversions = executions.filter(e => e.conversion?.converted).length;
    const estimatedCost = executions.length * 50; // Placeholder cost calculation
    return conversions > 0 ? estimatedCost / conversions : 0;
  }

  private generateTimelineData(executions: CampaignExecution[], startDate: Date, endDate: Date): any[] {
    // Implementation would generate daily timeline data
    return [];
  }

  // Utility methods
  private getFieldValue(obj: any, fieldPath: string): any {
    return fieldPath.split('.').reduce((value, key) => value?.[key], obj);
  }

  private getExecutionFieldValue(execution: CampaignExecution, field: string): any {
    switch (field) {
      case 'email_opened':
        return execution.executedSteps.some(s => s.openedAt);
      case 'email_clicked':
        return execution.executedSteps.some(s => s.clickedAt);
      case 'responded':
        return execution.responses.length > 0;
      default:
        return this.getFieldValue(execution, field);
    }
  }

  private evaluateCondition(value: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'equals':
        return value === expectedValue;
      case 'not_equals':
        return value !== expectedValue;
      case 'greater_than':
        return value > expectedValue;
      case 'less_than':
        return value < expectedValue;
      default:
        return false;
    }
  }

  private analyzeSentiment(content?: string): 'positive' | 'negative' | 'neutral' | undefined {
    if (!content) return undefined;
    // Simple sentiment analysis - in production would use AI service
    const lowerContent = content.toLowerCase();
    const positiveWords = ['great', 'excellent', 'thank', 'appreciate', 'good'];
    const negativeWords = ['bad', 'terrible', 'disappointed', 'poor', 'hate'];

    const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private async checkForConversion(execution: CampaignExecution, stepId: string): Promise<void> {
    // Implementation would check if the response indicates a conversion
    // For now, assume positive responses from offers are conversions
    const step = this.campaigns.get(execution.campaignId)?.sequence.find(s => s.id === stepId);
    if (step?.type === 'offer') {
      execution.conversion = {
        converted: true,
        conversionType: 'offer_accepted',
        conversionValue: 2500, // Placeholder value
        convertedAt: new Date(),
        offerUsed: step.actions?.[0]?.parameters?.offerId,
      };
    }
  }

  private getActiveExecutionForClient(clientId: string, campaignId: string): CampaignExecution | undefined {
    return Array.from(this.executions.values()).find(e =>
      e.clientId === clientId &&
      e.campaignId === campaignId &&
      ['queued', 'running'].includes(e.status)
    );
  }

  private generateCampaignId(): string {
    return `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateExecutionId(): string {
    return `execution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get campaign by ID
   */
  getCampaign(campaignId: string): RetentionCampaign | undefined {
    return this.campaigns.get(campaignId);
  }

  /**
   * Get all campaigns
   */
  getAllCampaigns(): RetentionCampaign[] {
    return Array.from(this.campaigns.values());
  }

  /**
   * Get campaign execution
   */
  getExecution(executionId: string): CampaignExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Get client executions
   */
  getClientExecutions(clientId: string): CampaignExecution[] {
    return Array.from(this.executions.values())
      .filter(execution => execution.clientId === clientId);
  }

  /**
   * Pause campaign execution
   */
  pauseExecution(executionId: string): void {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'running') {
      execution.status = 'paused';
      execution.pausedAt = new Date();
      execution.updatedAt = new Date();
      this.executions.set(executionId, execution);
    }
  }

  /**
   * Resume campaign execution
   */
  resumeExecution(executionId: string): void {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'paused') {
      execution.status = 'queued';
      execution.pausedAt = undefined;
      execution.updatedAt = new Date();
      this.executions.set(executionId, execution);
    }
  }

  /**
   * Cancel campaign execution
   */
  cancelExecution(executionId: string): void {
    const execution = this.executions.get(executionId);
    if (execution && ['queued', 'running', 'paused'].includes(execution.status)) {
      execution.status = 'cancelled';
      execution.updatedAt = new Date();
      this.executions.set(executionId, execution);
    }
  }
}

// Export singleton instance
export const retentionCampaignEngine = new RetentionCampaignEngine();
/**
 * Client Satisfaction Monitoring and Feedback Collection System
 * Comprehensive system for collecting, analyzing, and acting on client feedback
 */

import { z } from 'zod';

// Survey Schema
export const SurveyQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(['nps', 'rating', 'multiple_choice', 'text', 'boolean', 'matrix']),
  question: z.string(),
  description: z.string().optional(),
  required: z.boolean().default(false),
  order: z.number(),
  options: z.array(z.string()).optional(), // For multiple choice questions
  scale: z.object({
    min: z.number(),
    max: z.number(),
    minLabel: z.string().optional(),
    maxLabel: z.string().optional(),
  }).optional(), // For rating questions
  conditionalLogic: z.object({
    dependsOn: z.string(), // Question ID
    condition: z.string(), // Condition expression
    value: z.any(), // Expected value
  }).optional(),
  metadata: z.record(z.any()).optional(),
});

export const SurveyTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(['onboarding', 'quarterly', 'annual', 'service_specific', 'exit', 'nps', 'custom']),
  isActive: z.boolean().default(true),
  isSystemTemplate: z.boolean().default(false),
  estimatedTime: z.number(), // Minutes to complete
  questions: z.array(SurveyQuestionSchema),
  settings: z.object({
    allowAnonymous: z.boolean().default(false),
    requireCompletion: z.boolean().default(false),
    showProgress: z.boolean().default(true),
    shuffleQuestions: z.boolean().default(false),
    customBranding: z.boolean().default(true),
  }),
  triggers: z.array(z.object({
    type: z.enum(['time_based', 'event_based', 'manual']),
    condition: z.string(),
    delay: z.number().optional(), // Hours delay
    parameters: z.record(z.any()).optional(),
  })),
  reminderSettings: z.object({
    enabled: z.boolean().default(true),
    maxReminders: z.number().default(3),
    reminderDelay: z.number().default(72), // Hours between reminders
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const SurveyResponseSchema = z.object({
  id: z.string(),
  surveyId: z.string(),
  clientId: z.string(),
  respondentEmail: z.string().optional(),
  isAnonymous: z.boolean().default(false),
  status: z.enum(['started', 'completed', 'abandoned']),
  responses: z.array(z.object({
    questionId: z.string(),
    value: z.any(),
    submittedAt: z.date(),
  })),
  overallSatisfaction: z.number().optional(), // Calculated overall score
  npsScore: z.number().optional(), // Net Promoter Score
  sentiment: z.enum(['very_negative', 'negative', 'neutral', 'positive', 'very_positive']).optional(),
  tags: z.array(z.string()).default([]),
  completedAt: z.date().optional(),
  timeToComplete: z.number().optional(), // Minutes
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const FeedbackItemSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  source: z.enum(['survey', 'email', 'call', 'meeting', 'portal', 'social_media', 'review_site']),
  type: z.enum(['complaint', 'compliment', 'suggestion', 'question', 'feature_request']),
  category: z.string(), // Service area or category
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  sentiment: z.enum(['very_negative', 'negative', 'neutral', 'positive', 'very_positive']),
  content: z.string(),
  extractedTopics: z.array(z.string()).default([]),
  assignedTo: z.string().optional(),
  status: z.enum(['new', 'acknowledged', 'in_progress', 'resolved', 'closed']),
  resolution: z.string().optional(),
  resolutionTime: z.number().optional(), // Hours to resolve
  followUpRequired: z.boolean().default(false),
  followUpDate: z.date().optional(),
  internalNotes: z.string().optional(),
  clientVisible: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  attachments: z.array(z.string()).default([]),
  relatedSurveyId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  resolvedAt: z.date().optional(),
});

export const SatisfactionMetricsSchema = z.object({
  organizationId: z.string(),
  period: z.object({
    start: z.date(),
    end: z.date(),
  }),
  overallMetrics: z.object({
    averageSatisfaction: z.number(),
    npsScore: z.number(),
    responseRate: z.number(),
    completionRate: z.number(),
    totalResponses: z.number(),
  }),
  segmentedMetrics: z.record(z.object({
    averageSatisfaction: z.number(),
    npsScore: z.number(),
    responseCount: z.number(),
    trend: z.enum(['improving', 'stable', 'declining']),
  })),
  topicAnalysis: z.record(z.object({
    mentions: z.number(),
    sentiment: z.number(),
    trend: z.enum(['improving', 'stable', 'declining']),
  })),
  actionItems: z.array(z.object({
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    category: z.string(),
    description: z.string(),
    assignedTo: z.string().optional(),
    dueDate: z.date().optional(),
  })),
  trends: z.record(z.array(z.object({
    date: z.date(),
    value: z.number(),
  }))),
});

export type SurveyQuestion = z.infer<typeof SurveyQuestionSchema>;
export type SurveyTemplate = z.infer<typeof SurveyTemplateSchema>;
export type SurveyResponse = z.infer<typeof SurveyResponseSchema>;
export type FeedbackItem = z.infer<typeof FeedbackItemSchema>;
export type SatisfactionMetrics = z.infer<typeof SatisfactionMetricsSchema>;

export interface SatisfactionConfig {
  enableAutoSurveys: boolean;
  enableSentimentAnalysis: boolean;
  defaultReminderSettings: {
    enabled: boolean;
    maxReminders: number;
    reminderDelay: number;
  };
  escalationRules: {
    lowSatisfactionThreshold: number;
    urgentResponseTime: number; // Hours
    escalationAssignee: string;
  };
  integrations: {
    emailService: boolean;
    smsService: boolean;
    webhooks: boolean;
  };
}

export class SatisfactionMonitoringSystem {
  private config: SatisfactionConfig;
  private surveyTemplates: Map<string, SurveyTemplate> = new Map();
  private surveyResponses: Map<string, SurveyResponse> = new Map();
  private feedbackItems: Map<string, FeedbackItem> = new Map();

  constructor(config?: Partial<SatisfactionConfig>) {
    this.config = {
      enableAutoSurveys: true,
      enableSentimentAnalysis: true,
      defaultReminderSettings: {
        enabled: true,
        maxReminders: 3,
        reminderDelay: 72,
      },
      escalationRules: {
        lowSatisfactionThreshold: 6,
        urgentResponseTime: 24,
        escalationAssignee: 'client_success_manager',
      },
      integrations: {
        emailService: true,
        smsService: false,
        webhooks: true,
      },
      ...config,
    };

    this.initializeDefaultSurveyTemplates();
  }

  /**
   * Initialize default survey templates
   */
  private initializeDefaultSurveyTemplates(): void {
    // NPS Survey Template
    this.addSurveyTemplate({
      id: 'nps-quarterly',
      name: 'Quarterly NPS Survey',
      description: 'Standard quarterly Net Promoter Score survey',
      category: 'nps',
      isActive: true,
      isSystemTemplate: true,
      estimatedTime: 3,
      questions: [
        {
          id: 'nps_score',
          type: 'nps',
          question: 'How likely are you to recommend our services to a friend or colleague?',
          description: 'Please rate on a scale of 0-10',
          required: true,
          order: 1,
          scale: {
            min: 0,
            max: 10,
            minLabel: 'Not at all likely',
            maxLabel: 'Extremely likely',
          },
        },
        {
          id: 'nps_reason',
          type: 'text',
          question: 'What is the primary reason for your score?',
          required: false,
          order: 2,
          conditionalLogic: {
            dependsOn: 'nps_score',
            condition: 'answered',
            value: true,
          },
        },
        {
          id: 'service_satisfaction',
          type: 'rating',
          question: 'How satisfied are you with our overall service quality?',
          required: true,
          order: 3,
          scale: {
            min: 1,
            max: 10,
            minLabel: 'Very dissatisfied',
            maxLabel: 'Very satisfied',
          },
        },
        {
          id: 'communication_rating',
          type: 'rating',
          question: 'How would you rate the quality of our communication?',
          required: true,
          order: 4,
          scale: {
            min: 1,
            max: 10,
            minLabel: 'Poor',
            maxLabel: 'Excellent',
          },
        },
        {
          id: 'improvement_suggestions',
          type: 'text',
          question: 'What could we do to improve your experience?',
          required: false,
          order: 5,
        },
      ],
      settings: {
        allowAnonymous: false,
        requireCompletion: false,
        showProgress: true,
        shuffleQuestions: false,
        customBranding: true,
      },
      triggers: [
        {
          type: 'time_based',
          condition: 'quarterly',
          delay: 0,
          parameters: { dayOfMonth: 1 },
        },
      ],
      reminderSettings: {
        enabled: true,
        maxReminders: 2,
        reminderDelay: 72,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Onboarding Satisfaction Survey
    this.addSurveyTemplate({
      id: 'onboarding-satisfaction',
      name: 'Onboarding Experience Survey',
      description: 'Survey to measure satisfaction with the onboarding process',
      category: 'onboarding',
      isActive: true,
      isSystemTemplate: true,
      estimatedTime: 5,
      questions: [
        {
          id: 'onboarding_overall',
          type: 'rating',
          question: 'Overall, how satisfied were you with your onboarding experience?',
          required: true,
          order: 1,
          scale: {
            min: 1,
            max: 10,
            minLabel: 'Very dissatisfied',
            maxLabel: 'Very satisfied',
          },
        },
        {
          id: 'onboarding_clarity',
          type: 'rating',
          question: 'How clear and easy to understand was the onboarding process?',
          required: true,
          order: 2,
          scale: {
            min: 1,
            max: 10,
            minLabel: 'Very confusing',
            maxLabel: 'Very clear',
          },
        },
        {
          id: 'onboarding_speed',
          type: 'rating',
          question: 'How would you rate the speed of the onboarding process?',
          required: true,
          order: 3,
          scale: {
            min: 1,
            max: 10,
            minLabel: 'Too slow',
            maxLabel: 'Perfect pace',
          },
        },
        {
          id: 'team_helpfulness',
          type: 'rating',
          question: 'How helpful was our team during the onboarding process?',
          required: true,
          order: 4,
          scale: {
            min: 1,
            max: 10,
            minLabel: 'Not helpful',
            maxLabel: 'Very helpful',
          },
        },
        {
          id: 'expectations_met',
          type: 'multiple_choice',
          question: 'Did the onboarding process meet your expectations?',
          required: true,
          order: 5,
          options: ['Exceeded expectations', 'Met expectations', 'Below expectations'],
        },
        {
          id: 'improvement_areas',
          type: 'text',
          question: 'What aspects of the onboarding process could be improved?',
          required: false,
          order: 6,
        },
      ],
      settings: {
        allowAnonymous: false,
        requireCompletion: true,
        showProgress: true,
        shuffleQuestions: false,
        customBranding: true,
      },
      triggers: [
        {
          type: 'event_based',
          condition: 'onboarding_completed',
          delay: 24,
        },
      ],
      reminderSettings: {
        enabled: true,
        maxReminders: 3,
        reminderDelay: 48,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Service-Specific Satisfaction Survey
    this.addSurveyTemplate({
      id: 'service-satisfaction',
      name: 'Service Delivery Satisfaction',
      description: 'Survey to measure satisfaction with specific service delivery',
      category: 'service_specific',
      isActive: true,
      isSystemTemplate: true,
      estimatedTime: 4,
      questions: [
        {
          id: 'service_quality',
          type: 'rating',
          question: 'How would you rate the quality of the service delivered?',
          required: true,
          order: 1,
          scale: {
            min: 1,
            max: 10,
            minLabel: 'Poor quality',
            maxLabel: 'Excellent quality',
          },
        },
        {
          id: 'timeliness',
          type: 'rating',
          question: 'How satisfied were you with the timeliness of delivery?',
          required: true,
          order: 2,
          scale: {
            min: 1,
            max: 10,
            minLabel: 'Very late',
            maxLabel: 'Right on time',
          },
        },
        {
          id: 'communication',
          type: 'rating',
          question: 'How would you rate communication throughout the project?',
          required: true,
          order: 3,
          scale: {
            min: 1,
            max: 10,
            minLabel: 'Poor communication',
            maxLabel: 'Excellent communication',
          },
        },
        {
          id: 'value_for_money',
          type: 'rating',
          question: 'How satisfied are you with the value for money?',
          required: true,
          order: 4,
          scale: {
            min: 1,
            max: 10,
            minLabel: 'Poor value',
            maxLabel: 'Excellent value',
          },
        },
        {
          id: 'future_services',
          type: 'boolean',
          question: 'Would you use our services again for similar needs?',
          required: true,
          order: 5,
        },
        {
          id: 'additional_feedback',
          type: 'text',
          question: 'Any additional feedback or suggestions?',
          required: false,
          order: 6,
        },
      ],
      settings: {
        allowAnonymous: false,
        requireCompletion: false,
        showProgress: true,
        shuffleQuestions: false,
        customBranding: true,
      },
      triggers: [
        {
          type: 'event_based',
          condition: 'service_delivered',
          delay: 48,
        },
      ],
      reminderSettings: {
        enabled: true,
        maxReminders: 2,
        reminderDelay: 72,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Add or update survey template
   */
  addSurveyTemplate(template: Omit<SurveyTemplate, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): string {
    const templateId = template.id || this.generateSurveyId();
    const now = new Date();

    const fullTemplate: SurveyTemplate = {
      ...template,
      id: templateId,
      createdAt: template.id ? this.surveyTemplates.get(template.id)?.createdAt || now : now,
      updatedAt: now,
    };

    this.surveyTemplates.set(templateId, fullTemplate);
    return templateId;
  }

  /**
   * Deploy survey to client
   */
  async deploySurvey(templateId: string, clientId: string, customizations?: Partial<SurveyTemplate>): Promise<string> {
    const template = this.surveyTemplates.get(templateId);
    if (!template) {
      throw new Error(`Survey template not found: ${templateId}`);
    }

    // Create survey instance with customizations
    const surveyInstance = {
      ...template,
      ...customizations,
      id: this.generateSurveyId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Send survey to client
    await this.sendSurveyInvitation(surveyInstance, clientId);

    return surveyInstance.id;
  }

  /**
   * Submit survey response
   */
  async submitSurveyResponse(surveyId: string, clientId: string, responses: any[]): Promise<SurveyResponse> {
    const responseId = this.generateResponseId();

    // Calculate scores
    const overallSatisfaction = this.calculateOverallSatisfaction(responses);
    const npsScore = this.extractNPSScore(responses);
    const sentiment = this.analyzeSentiment(responses);

    const surveyResponse: SurveyResponse = {
      id: responseId,
      surveyId,
      clientId,
      isAnonymous: false,
      status: 'completed',
      responses: responses.map(r => ({
        questionId: r.questionId,
        value: r.value,
        submittedAt: new Date(),
      })),
      overallSatisfaction,
      npsScore,
      sentiment,
      tags: this.extractTags(responses),
      completedAt: new Date(),
      timeToComplete: 5, // Would be calculated from actual time
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.surveyResponses.set(responseId, surveyResponse);

    // Process response for immediate actions
    await this.processSurveyResponse(surveyResponse);

    return surveyResponse;
  }

  /**
   * Add feedback item
   */
  async addFeedbackItem(feedback: Omit<FeedbackItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<FeedbackItem> {
    const feedbackId = this.generateFeedbackId();

    const feedbackItem: FeedbackItem = {
      ...feedback,
      id: feedbackId,
      extractedTopics: this.config.enableSentimentAnalysis ? this.extractTopics(feedback.content) : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.feedbackItems.set(feedbackId, feedbackItem);

    // Process feedback for immediate actions
    await this.processFeedbackItem(feedbackItem);

    return feedbackItem;
  }

  /**
   * Update feedback item
   */
  async updateFeedbackItem(feedbackId: string, updates: Partial<FeedbackItem>): Promise<FeedbackItem> {
    const existingFeedback = this.feedbackItems.get(feedbackId);
    if (!existingFeedback) {
      throw new Error(`Feedback item not found: ${feedbackId}`);
    }

    const updatedFeedback: FeedbackItem = {
      ...existingFeedback,
      ...updates,
      updatedAt: new Date(),
    };

    // Set resolution time if being resolved
    if (updates.status === 'resolved' && !existingFeedback.resolvedAt) {
      updatedFeedback.resolvedAt = new Date();
      updatedFeedback.resolutionTime = this.calculateResolutionTime(existingFeedback.createdAt, new Date());
    }

    this.feedbackItems.set(feedbackId, updatedFeedback);
    return updatedFeedback;
  }

  /**
   * Generate satisfaction metrics
   */
  generateSatisfactionMetrics(organizationId: string, startDate: Date, endDate: Date): SatisfactionMetrics {
    const responses = Array.from(this.surveyResponses.values())
      .filter(r => r.createdAt >= startDate && r.createdAt <= endDate);

    const feedback = Array.from(this.feedbackItems.values())
      .filter(f => f.createdAt >= startDate && f.createdAt <= endDate);

    // Calculate overall metrics
    const overallMetrics = {
      averageSatisfaction: this.calculateAverageSatisfaction(responses),
      npsScore: this.calculateNPSScore(responses),
      responseRate: this.calculateResponseRate(organizationId, startDate, endDate),
      completionRate: this.calculateCompletionRate(responses),
      totalResponses: responses.length,
    };

    // Calculate segmented metrics
    const segmentedMetrics = this.calculateSegmentedMetrics(responses);

    // Analyze topics
    const topicAnalysis = this.analyzeTopics(feedback);

    // Generate action items
    const actionItems = this.generateActionItems(responses, feedback);

    // Calculate trends
    const trends = this.calculateTrends(responses, startDate, endDate);

    return {
      organizationId,
      period: { start: startDate, end: endDate },
      overallMetrics,
      segmentedMetrics,
      topicAnalysis,
      actionItems,
      trends,
    };
  }

  /**
   * Process survey response for immediate actions
   */
  private async processSurveyResponse(response: SurveyResponse): Promise<void> {
    // Check for low satisfaction scores
    if (response.overallSatisfaction && response.overallSatisfaction < this.config.escalationRules.lowSatisfactionThreshold) {
      await this.escalateLowSatisfaction(response);
    }

    // Check for detractor NPS scores
    if (response.npsScore !== undefined && response.npsScore <= 6) {
      await this.handleDetractorResponse(response);
    }

    // Check for negative sentiment
    if (response.sentiment === 'negative' || response.sentiment === 'very_negative') {
      await this.handleNegativeFeedback(response);
    }
  }

  /**
   * Process feedback item for immediate actions
   */
  private async processFeedbackItem(feedback: FeedbackItem): Promise<void> {
    // Auto-assign based on category
    if (!feedback.assignedTo) {
      feedback.assignedTo = this.getAutoAssignee(feedback.category);
    }

    // Escalate urgent items
    if (feedback.priority === 'urgent') {
      await this.escalateUrgentFeedback(feedback);
    }

    // Handle complaints immediately
    if (feedback.type === 'complaint') {
      await this.handleComplaint(feedback);
    }
  }

  /**
   * Send survey invitation
   */
  private async sendSurveyInvitation(survey: SurveyTemplate, clientId: string): Promise<void> {
    if (!this.config.integrations.emailService) return;

    console.log(`Sending survey "${survey.name}" to client ${clientId}`);
    // Implementation would integrate with email service
  }

  /**
   * Calculate overall satisfaction from responses
   */
  private calculateOverallSatisfaction(responses: any[]): number | undefined {
    const satisfactionQuestions = responses.filter(r =>
      r.questionId.includes('satisfaction') || r.questionId.includes('rating')
    );

    if (satisfactionQuestions.length === 0) return undefined;

    const total = satisfactionQuestions.reduce((sum, r) => sum + (r.value || 0), 0);
    return Math.round((total / satisfactionQuestions.length) * 10) / 10;
  }

  /**
   * Extract NPS score from responses
   */
  private extractNPSScore(responses: any[]): number | undefined {
    const npsResponse = responses.find(r => r.questionId === 'nps_score');
    return npsResponse?.value;
  }

  /**
   * Analyze sentiment from text responses
   */
  private analyzeSentiment(responses: any[]): SurveyResponse['sentiment'] {
    if (!this.config.enableSentimentAnalysis) return 'neutral';

    const textResponses = responses.filter(r => typeof r.value === 'string');
    if (textResponses.length === 0) return 'neutral';

    // Simple sentiment analysis - in production would use AI service
    const text = textResponses.map(r => r.value).join(' ').toLowerCase();

    const positiveWords = ['excellent', 'great', 'good', 'satisfied', 'happy', 'love'];
    const negativeWords = ['poor', 'bad', 'terrible', 'disappointed', 'frustrated', 'hate'];

    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;

    if (positiveCount > negativeCount + 1) return 'positive';
    if (negativeCount > positiveCount + 1) return 'negative';
    return 'neutral';
  }

  /**
   * Extract tags from responses
   */
  private extractTags(responses: any[]): string[] {
    const tags: string[] = [];

    // Extract tags based on response patterns
    responses.forEach(response => {
      if (response.questionId === 'nps_score' && response.value <= 6) {
        tags.push('detractor');
      } else if (response.questionId === 'nps_score' && response.value >= 9) {
        tags.push('promoter');
      }

      if (typeof response.value === 'string' && response.value.toLowerCase().includes('price')) {
        tags.push('pricing_concern');
      }
    });

    return tags;
  }

  /**
   * Extract topics from text content
   */
  private extractTopics(content: string): string[] {
    if (!this.config.enableSentimentAnalysis) return [];

    // Simple topic extraction - in production would use AI service
    const topics: string[] = [];
    const text = content.toLowerCase();

    const topicKeywords = {
      'communication': ['communication', 'contact', 'response', 'call', 'email'],
      'pricing': ['price', 'cost', 'expensive', 'fee', 'billing'],
      'service_quality': ['quality', 'service', 'work', 'delivery'],
      'timeliness': ['time', 'deadline', 'late', 'quick', 'fast', 'slow'],
      'staff': ['team', 'staff', 'person', 'representative'],
      'portal': ['portal', 'website', 'platform', 'system'],
      'process': ['process', 'procedure', 'workflow', 'steps'],
    };

    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        topics.push(topic);
      }
    });

    return topics;
  }

  // Escalation and handling methods
  private async escalateLowSatisfaction(response: SurveyResponse): Promise<void> {
    console.log(`Escalating low satisfaction score for client ${response.clientId}`);
    // Implementation would create tasks, alerts, etc.
  }

  private async handleDetractorResponse(response: SurveyResponse): Promise<void> {
    console.log(`Handling detractor response for client ${response.clientId}`);
    // Implementation would trigger specific workflows
  }

  private async handleNegativeFeedback(response: SurveyResponse): Promise<void> {
    console.log(`Handling negative feedback for client ${response.clientId}`);
    // Implementation would create immediate follow-up tasks
  }

  private async escalateUrgentFeedback(feedback: FeedbackItem): Promise<void> {
    console.log(`Escalating urgent feedback: ${feedback.id}`);
    // Implementation would alert management
  }

  private async handleComplaint(feedback: FeedbackItem): Promise<void> {
    console.log(`Handling complaint: ${feedback.id}`);
    // Implementation would trigger complaint resolution workflow
  }

  private getAutoAssignee(category: string): string {
    const assignmentRules: Record<string, string> = {
      'billing': 'billing_specialist',
      'technical': 'technical_support',
      'service': 'account_manager',
      'communication': 'client_success_manager',
    };

    return assignmentRules[category] || this.config.escalationRules.escalationAssignee;
  }

  // Metrics calculation methods
  private calculateAverageSatisfaction(responses: SurveyResponse[]): number {
    const satisfactionScores = responses
      .map(r => r.overallSatisfaction)
      .filter(score => score !== undefined) as number[];

    if (satisfactionScores.length === 0) return 0;

    return satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length;
  }

  private calculateNPSScore(responses: SurveyResponse[]): number {
    const npsScores = responses
      .map(r => r.npsScore)
      .filter(score => score !== undefined) as number[];

    if (npsScores.length === 0) return 0;

    const promoters = npsScores.filter(score => score >= 9).length;
    const detractors = npsScores.filter(score => score <= 6).length;

    return Math.round(((promoters - detractors) / npsScores.length) * 100);
  }

  private calculateResponseRate(organizationId: string, startDate: Date, endDate: Date): number {
    // Implementation would calculate based on surveys sent vs responses received
    return 75; // Placeholder
  }

  private calculateCompletionRate(responses: SurveyResponse[]): number {
    if (responses.length === 0) return 0;
    const completed = responses.filter(r => r.status === 'completed').length;
    return Math.round((completed / responses.length) * 100);
  }

  private calculateSegmentedMetrics(responses: SurveyResponse[]): Record<string, any> {
    // Implementation would segment by client characteristics
    return {
      'enterprise': {
        averageSatisfaction: 8.5,
        npsScore: 45,
        responseCount: 25,
        trend: 'improving',
      },
      'small_business': {
        averageSatisfaction: 7.8,
        npsScore: 32,
        responseCount: 150,
        trend: 'stable',
      },
    };
  }

  private analyzeTopics(feedback: FeedbackItem[]): Record<string, any> {
    const topicAnalysis: Record<string, any> = {};

    feedback.forEach(item => {
      item.extractedTopics.forEach(topic => {
        if (!topicAnalysis[topic]) {
          topicAnalysis[topic] = {
            mentions: 0,
            sentiment: 0,
            trend: 'stable',
          };
        }
        topicAnalysis[topic].mentions++;
        topicAnalysis[topic].sentiment += this.getSentimentScore(item.sentiment);
      });
    });

    // Normalize sentiment scores
    Object.keys(topicAnalysis).forEach(topic => {
      const analysis = topicAnalysis[topic];
      analysis.sentiment = analysis.sentiment / analysis.mentions;
    });

    return topicAnalysis;
  }

  private generateActionItems(responses: SurveyResponse[], feedback: FeedbackItem[]): any[] {
    const actionItems: any[] = [];

    // Low satisfaction action items
    const lowSatisfactionCount = responses.filter(r =>
      r.overallSatisfaction && r.overallSatisfaction < 7
    ).length;

    if (lowSatisfactionCount > 0) {
      actionItems.push({
        priority: 'high',
        category: 'satisfaction',
        description: `Address ${lowSatisfactionCount} low satisfaction responses`,
        assignedTo: 'client_success_manager',
        dueDate: new Date(Date.now() + 72 * 60 * 60 * 1000), // 3 days
      });
    }

    // Unresolved feedback action items
    const unresolvedFeedback = feedback.filter(f => f.status !== 'resolved' && f.status !== 'closed');
    if (unresolvedFeedback.length > 0) {
      actionItems.push({
        priority: 'medium',
        category: 'feedback',
        description: `Follow up on ${unresolvedFeedback.length} unresolved feedback items`,
        assignedTo: 'support_manager',
        dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // 2 days
      });
    }

    return actionItems;
  }

  private calculateTrends(responses: SurveyResponse[], startDate: Date, endDate: Date): Record<string, any[]> {
    // Implementation would calculate time-based trends
    return {
      satisfaction: [],
      nps: [],
      responseRate: [],
    };
  }

  private getSentimentScore(sentiment: FeedbackItem['sentiment']): number {
    const scores = {
      'very_negative': -2,
      'negative': -1,
      'neutral': 0,
      'positive': 1,
      'very_positive': 2,
    };
    return scores[sentiment];
  }

  private calculateResolutionTime(createdAt: Date, resolvedAt: Date): number {
    return Math.round((resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60)); // Hours
  }

  // Helper methods
  private generateSurveyId(): string {
    return `survey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateResponseId(): string {
    return `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFeedbackId(): string {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get survey template
   */
  getSurveyTemplate(templateId: string): SurveyTemplate | undefined {
    return this.surveyTemplates.get(templateId);
  }

  /**
   * Get all survey templates
   */
  getAllSurveyTemplates(): SurveyTemplate[] {
    return Array.from(this.surveyTemplates.values());
  }

  /**
   * Get survey response
   */
  getSurveyResponse(responseId: string): SurveyResponse | undefined {
    return this.surveyResponses.get(responseId);
  }

  /**
   * Get feedback item
   */
  getFeedbackItem(feedbackId: string): FeedbackItem | undefined {
    return this.feedbackItems.get(feedbackId);
  }

  /**
   * Get client responses
   */
  getClientResponses(clientId: string): SurveyResponse[] {
    return Array.from(this.surveyResponses.values())
      .filter(response => response.clientId === clientId);
  }

  /**
   * Get client feedback
   */
  getClientFeedback(clientId: string): FeedbackItem[] {
    return Array.from(this.feedbackItems.values())
      .filter(feedback => feedback.clientId === clientId);
  }
}

// Export singleton instance
export const satisfactionMonitor = new SatisfactionMonitoringSystem();
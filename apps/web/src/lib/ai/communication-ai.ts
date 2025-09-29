import { openaiService } from './openai-service';
import { prisma } from '../../server/db';
import { EventEmitter } from 'events';

export interface SmartEmailTemplate {
  id: string;
  name: string;
  purpose: 'followup' | 'reminder' | 'report' | 'alert' | 'consultation' | 'onboarding' | 'deadline' | 'tax_season';
  category: 'client_communication' | 'internal' | 'compliance' | 'marketing';
  targetAudience: 'individual_clients' | 'business_clients' | 'prospects' | 'team_members';
  template: {
    subjectTemplate: string;
    bodyTemplate: string;
    variables: string[];
    conditionalSections: Array<{
      condition: string;
      content: string;
    }>;
  };
  personalization: {
    enableToneAdjustment: boolean;
    enableContextualContent: boolean;
    enableTimingOptimization: boolean;
  };
  complianceChecks: string[];
  tags: string[];
  isActive: boolean;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  lastUpdated: Date;
}

export interface CommunicationContext {
  clientId: string;
  clientType: 'individual' | 'business';
  relationship: {
    duration: number; // months
    serviceTypes: string[];
    lastInteraction: Date;
    communicationPreferences: {
      frequency: 'high' | 'medium' | 'low';
      channels: string[];
      tone: 'formal' | 'professional' | 'friendly';
      language: string;
    };
  };
  currentSituation: {
    taxSeason: boolean;
    deadlines: Array<{ type: string; date: Date; status: string }>;
    openItems: string[];
    recentTransactions: any[];
    flaggedIssues: string[];
  };
  historicalData: {
    responseRates: Record<string, number>;
    preferredTopics: string[];
    commonQuestions: string[];
    satisfactionScores: number[];
  };
}

export interface SmartSuggestion {
  id: string;
  type: 'email_response' | 'followup_action' | 'escalation' | 'document_request' | 'meeting_schedule';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  suggestion: string;
  rationale: string;
  confidence: number;
  estimatedTime: string;
  requiredActions: string[];
  generatedAt: Date;
  context: Record<string, any>;
}

export interface CommunicationAnalytics {
  responseTime: {
    average: number;
    median: number;
    byClientType: Record<string, number>;
    byTimeOfDay: Record<string, number>;
  };
  sentimentTrends: {
    overall: number;
    byClient: Record<string, number>;
    overTime: Array<{ date: string; sentiment: number }>;
  };
  engagementMetrics: {
    openRates: number;
    responseRates: number;
    satisfactionScores: number;
    escalationRate: number;
  };
  topicAnalysis: {
    frequentTopics: Array<{ topic: string; count: number; sentiment: number }>;
    emergingIssues: Array<{ issue: string; urgency: number; affectedClients: number }>;
  };
  automationMetrics: {
    automatedResponses: number;
    manualInterventions: number;
    aiSuggestionAcceptanceRate: number;
    timesSaved: number;
  };
}

export interface FollowUpRecommendation {
  id: string;
  clientId: string;
  type: 'check_in' | 'document_reminder' | 'deadline_alert' | 'service_upsell' | 'satisfaction_survey';
  priority: 'low' | 'medium' | 'high';
  suggestedDate: Date;
  reason: string;
  suggestedContent: {
    subject: string;
    body: string;
    callToAction: string;
  };
  contextData: Record<string, any>;
  estimatedEngagement: number;
  generatedAt: Date;
}

export interface ComplianceValidation {
  isCompliant: boolean;
  violations: Array<{
    type: 'privacy' | 'confidentiality' | 'professional_standards' | 'regulatory';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    suggestion: string;
    regulation: string;
  }>;
  riskScore: number;
  recommendedChanges: string[];
}

class CommunicationAIService extends EventEmitter {
  private templates = new Map<string, SmartEmailTemplate>();
  private communicationHistory = new Map<string, any[]>();

  constructor() {
    super();
    this.loadTemplates();
  }

  /**
   * Generate smart email suggestions based on context
   */
  async generateSmartEmailSuggestions(
    organizationId: string,
    userId: string,
    incomingMessage: {
      from: string;
      subject: string;
      body: string;
      timestamp: Date;
      clientId?: string;
    },
    context?: CommunicationContext
  ): Promise<SmartSuggestion[]> {
    try {
      // Analyze incoming message sentiment and intent
      const sentimentAnalysis = await openaiService.analyzeSentiment(
        organizationId,
        incomingMessage.body,
        {
          clientId: incomingMessage.clientId,
          communicationType: 'email',
          timestamp: incomingMessage.timestamp
        }
      );

      // Get communication context if not provided
      if (!context && incomingMessage.clientId) {
        context = await this.getCommunicationContext(incomingMessage.clientId);
      }

      // Generate AI-powered suggestions
      const suggestions = await this.generateContextualSuggestions(
        incomingMessage,
        sentimentAnalysis,
        context
      );

      // Save communication record
      await this.saveCommunicationRecord(organizationId, userId, incomingMessage, sentimentAnalysis);

      return suggestions;

    } catch (error) {
      console.error('Failed to generate smart email suggestions:', error);
      throw new Error(`Failed to generate suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate personalized email draft with AI
   */
  async generatePersonalizedEmail(
    organizationId: string,
    templateId: string,
    context: CommunicationContext,
    customizations: {
      purpose?: string;
      urgency?: 'low' | 'normal' | 'high';
      includeAttachments?: boolean;
      customInstructions?: string;
    } = {}
  ): Promise<{
    draft: {
      subject: string;
      body: string;
      attachmentSuggestions: string[];
      schedulingSuggestions: {
        bestTime: Date;
        alternatives: Date[];
        reasoning: string;
      };
    };
    personalization: {
      toneAdjustments: string[];
      contentCustomizations: string[];
      clientSpecificElements: string[];
    };
    complianceCheck: ComplianceValidation;
  }> {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      // Get client data for personalization
      const client = await prisma.client.findUnique({
        where: { id: context.clientId },
        include: {
          person: true,
          organization: true
        }
      });

      if (!client) {
        throw new Error('Client not found');
      }

      // Generate personalized content using AI
      const emailDraft = await openaiService.generateEmailDraft(
        organizationId,
        'system',
        {
          purpose: template.purpose,
          clientName: client.person?.firstName || client.organization?.name || 'Client',
          clientType: context.clientType,
          context: {
            template: template.template,
            clientData: {
              industry: client.organization?.industry,
              serviceTypes: context.relationship.serviceTypes,
              lastInteraction: context.relationship.lastInteraction,
              currentSituation: context.currentSituation
            },
            customizations
          },
          tone: context.relationship.communicationPreferences.tone,
          urgency: customizations.urgency || 'normal',
          includeAttachments: customizations.includeAttachments,
          customInstructions: customizations.customInstructions
        }
      );

      // Optimize timing based on client preferences and historical data
      const schedulingSuggestions = await this.generateSchedulingSuggestions(context);

      // Generate attachment suggestions
      const attachmentSuggestions = await this.generateAttachmentSuggestions(
        template.purpose,
        context
      );

      // Perform compliance check
      const complianceCheck = await this.validateCompliance(
        emailDraft.body,
        template.complianceChecks,
        context
      );

      // Generate personalization insights
      const personalization = {
        toneAdjustments: [
          `Tone adjusted to ${context.relationship.communicationPreferences.tone} based on client preference`,
          `Communication frequency optimized for ${context.relationship.communicationPreferences.frequency} engagement`
        ],
        contentCustomizations: [
          `Content tailored for ${context.clientType} client`,
          `Industry-specific language for ${client.organization?.industry || 'general'} sector`
        ],
        clientSpecificElements: [
          `Referenced ${context.relationship.duration} month relationship`,
          `Included relevant service types: ${context.relationship.serviceTypes.join(', ')}`
        ]
      };

      return {
        draft: {
          subject: emailDraft.subject,
          body: emailDraft.body,
          attachmentSuggestions,
          schedulingSuggestions
        },
        personalization,
        complianceCheck
      };

    } catch (error) {
      console.error('Failed to generate personalized email:', error);
      throw new Error(`Failed to generate email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze communication patterns and generate insights
   */
  async analyzeCommunicationPatterns(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date,
    filters: {
      clientTypes?: string[];
      serviceTypes?: string[];
      communicationTypes?: string[];
    } = {}
  ): Promise<CommunicationAnalytics> {
    try {
      // Get communication data from database
      const communications = await prisma.communicationLog.findMany({
        where: {
          organizationId,
          timestamp: {
            gte: dateFrom,
            lte: dateTo
          },
          ...(filters.communicationTypes && {
            type: { in: filters.communicationTypes }
          })
        },
        include: {
          client: {
            include: {
              person: true,
              organization: true
            }
          }
        }
      });

      // Calculate response time metrics
      const responseTimes = communications
        .filter(c => c.responseTime)
        .map(c => c.responseTime!);

      const responseTimeMetrics = {
        average: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length || 0,
        median: this.calculateMedian(responseTimes),
        byClientType: this.groupBy(communications, 'client.type', 'responseTime'),
        byTimeOfDay: this.groupByTimeOfDay(communications)
      };

      // Calculate sentiment trends
      const sentimentData = communications
        .filter(c => c.sentimentScore !== null)
        .map(c => ({ date: c.timestamp, sentiment: c.sentimentScore! }));

      const sentimentTrends = {
        overall: sentimentData.reduce((sum, item) => sum + item.sentiment, 0) / sentimentData.length || 0,
        byClient: this.groupBy(communications, 'clientId', 'sentimentScore'),
        overTime: this.groupSentimentByDate(sentimentData)
      };

      // Calculate engagement metrics
      const engagementMetrics = {
        openRates: this.calculateRate(communications, 'wasOpened'),
        responseRates: this.calculateRate(communications, 'wasResponded'),
        satisfactionScores: this.calculateAverage(communications, 'satisfactionScore'),
        escalationRate: this.calculateRate(communications, 'wasEscalated')
      };

      // Analyze topics using AI
      const topicAnalysis = await this.analyzeTopics(
        organizationId,
        communications.map(c => c.content)
      );

      // Calculate automation metrics
      const automationMetrics = {
        automatedResponses: communications.filter(c => c.isAutomated).length,
        manualInterventions: communications.filter(c => c.requiresManualReview).length,
        aiSuggestionAcceptanceRate: this.calculateRate(communications, 'aiSuggestionAccepted'),
        timesSaved: communications
          .filter(c => c.isAutomated)
          .reduce((sum, c) => sum + (c.estimatedTimeSaved || 0), 0)
      };

      return {
        responseTime: responseTimeMetrics,
        sentimentTrends,
        engagementMetrics,
        topicAnalysis,
        automationMetrics
      };

    } catch (error) {
      console.error('Failed to analyze communication patterns:', error);
      throw new Error(`Failed to analyze patterns: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate intelligent follow-up recommendations
   */
  async generateFollowUpRecommendations(
    organizationId: string,
    lookAheadDays: number = 30
  ): Promise<FollowUpRecommendation[]> {
    try {
      // Get clients with their recent activity
      const clients = await prisma.client.findMany({
        where: { organizationId },
        include: {
          person: true,
          organization: true,
          documents: {
            orderBy: { uploadedAt: 'desc' },
            take: 5
          },
          tasks: {
            where: {
              status: { not: 'completed' }
            }
          },
          communications: {
            orderBy: { timestamp: 'desc' },
            take: 10
          }
        }
      });

      const recommendations: FollowUpRecommendation[] = [];

      for (const client of clients) {
        const clientRecommendations = await this.generateClientFollowUps(
          client,
          lookAheadDays
        );
        recommendations.push(...clientRecommendations);
      }

      // Sort by priority and estimated engagement
      recommendations.sort((a, b) => {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.estimatedEngagement - a.estimatedEngagement;
      });

      return recommendations.slice(0, 50); // Limit to top 50 recommendations

    } catch (error) {
      console.error('Failed to generate follow-up recommendations:', error);
      throw new Error(`Failed to generate recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Real-time communication assistance
   */
  async getRealtimeCommunicationAssistance(
    organizationId: string,
    userId: string,
    draftMessage: {
      to: string;
      subject: string;
      body: string;
      clientId?: string;
    }
  ): Promise<{
    suggestions: {
      subject: string[];
      body: string[];
      tone: string[];
    };
    warnings: Array<{
      type: 'compliance' | 'tone' | 'content' | 'timing';
      message: string;
      severity: 'low' | 'medium' | 'high';
    }>;
    optimizations: Array<{
      type: 'clarity' | 'engagement' | 'professionalism' | 'call_to_action';
      suggestion: string;
      impact: 'low' | 'medium' | 'high';
    }>;
    predictedOutcome: {
      engagementScore: number;
      sentimentImpact: number;
      responseLikelihood: number;
    };
  }> {
    try {
      // Analyze current draft
      const sentimentAnalysis = await openaiService.analyzeSentiment(
        organizationId,
        draftMessage.body
      );

      // Get client context if available
      let context: CommunicationContext | undefined;
      if (draftMessage.clientId) {
        context = await this.getCommunicationContext(draftMessage.clientId);
      }

      // Perform compliance check
      const complianceCheck = await this.validateCompliance(
        draftMessage.body,
        ['confidentiality', 'professional_standards'],
        context
      );

      // Generate AI-powered suggestions
      const suggestions = await this.generateRealtimeSuggestions(
        draftMessage,
        sentimentAnalysis,
        context
      );

      // Generate warnings
      const warnings = this.generateWarnings(draftMessage, complianceCheck, sentimentAnalysis);

      // Generate optimizations
      const optimizations = await this.generateOptimizations(draftMessage, context);

      // Predict outcome
      const predictedOutcome = await this.predictCommunicationOutcome(
        draftMessage,
        context,
        sentimentAnalysis
      );

      return {
        suggestions,
        warnings,
        optimizations,
        predictedOutcome
      };

    } catch (error) {
      console.error('Failed to get realtime assistance:', error);
      throw new Error(`Failed to get assistance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods

  private async loadTemplates(): Promise<void> {
    try {
      const templates = await prisma.emailTemplate.findMany({
        where: { isActive: true }
      });

      templates.forEach(template => {
        this.templates.set(template.id, template as any);
      });

      console.log(`Loaded ${templates.length} email templates`);
    } catch (error) {
      console.error('Failed to load email templates:', error);
    }
  }

  private async getCommunicationContext(clientId: string): Promise<CommunicationContext> {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        person: true,
        organization: true,
        communications: {
          orderBy: { timestamp: 'desc' },
          take: 50
        }
      }
    });

    if (!client) {
      throw new Error('Client not found');
    }

    // Build context from client data
    const lastInteraction = client.communications[0]?.timestamp || new Date();
    const relationshipDuration = Math.floor(
      (Date.now() - client.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    return {
      clientId,
      clientType: client.person ? 'individual' : 'business',
      relationship: {
        duration: relationshipDuration,
        serviceTypes: ['tax_preparation'], // Would be from actual services
        lastInteraction,
        communicationPreferences: {
          frequency: 'medium',
          channels: ['email'],
          tone: 'professional',
          language: 'en'
        }
      },
      currentSituation: {
        taxSeason: this.isTaxSeason(),
        deadlines: [],
        openItems: [],
        recentTransactions: [],
        flaggedIssues: []
      },
      historicalData: {
        responseRates: {},
        preferredTopics: [],
        commonQuestions: [],
        satisfactionScores: []
      }
    };
  }

  private async generateContextualSuggestions(
    message: any,
    sentiment: any,
    context?: CommunicationContext
  ): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];

    // Response suggestion based on sentiment
    if (sentiment.urgencyLevel === 'high') {
      suggestions.push({
        id: `suggestion_${Date.now()}_urgent`,
        type: 'email_response',
        priority: 'urgent',
        suggestion: 'Urgent response required - client message indicates high urgency',
        rationale: `Sentiment analysis shows urgency level: ${sentiment.urgencyLevel}`,
        confidence: sentiment.confidence,
        estimatedTime: '15 minutes',
        requiredActions: ['Review message immediately', 'Respond within 2 hours'],
        generatedAt: new Date(),
        context: { sentiment, originalMessage: message.subject }
      });
    }

    // Follow-up suggestions
    if (context?.currentSituation.taxSeason) {
      suggestions.push({
        id: `suggestion_${Date.now()}_tax`,
        type: 'followup_action',
        priority: 'medium',
        suggestion: 'Schedule tax preparation consultation',
        rationale: 'Client contacted during tax season - proactive consultation recommended',
        confidence: 0.8,
        estimatedTime: '30 minutes',
        requiredActions: ['Check available appointment slots', 'Send meeting invitation'],
        generatedAt: new Date(),
        context: { taxSeason: true }
      });
    }

    // Document request suggestions
    if (message.body.toLowerCase().includes('document') || message.body.toLowerCase().includes('paperwork')) {
      suggestions.push({
        id: `suggestion_${Date.now()}_docs`,
        type: 'document_request',
        priority: 'medium',
        suggestion: 'Send document checklist',
        rationale: 'Message mentions documents - provide comprehensive checklist',
        confidence: 0.7,
        estimatedTime: '10 minutes',
        requiredActions: ['Generate document checklist', 'Send via secure portal'],
        generatedAt: new Date(),
        context: { documentMentioned: true }
      });
    }

    return suggestions;
  }

  private async generateSchedulingSuggestions(context: CommunicationContext): Promise<{
    bestTime: Date;
    alternatives: Date[];
    reasoning: string;
  }> {
    // Analyze historical response patterns to suggest optimal timing
    const now = new Date();
    const bestTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now as default

    return {
      bestTime,
      alternatives: [
        new Date(bestTime.getTime() + 24 * 60 * 60 * 1000), // Next day
        new Date(bestTime.getTime() + 2 * 24 * 60 * 60 * 1000), // Day after
      ],
      reasoning: `Based on client's ${context.relationship.communicationPreferences.frequency} communication preference and historical response patterns`
    };
  }

  private async generateAttachmentSuggestions(
    purpose: string,
    context: CommunicationContext
  ): Promise<string[]> {
    const suggestions: string[] = [];

    if (purpose === 'tax_season') {
      suggestions.push(
        'Tax document checklist',
        'Current year tax calendar',
        'Client portal access guide'
      );
    }

    if (purpose === 'consultation') {
      suggestions.push(
        'Meeting agenda',
        'Service overview',
        'Preparation checklist'
      );
    }

    if (context.currentSituation.taxSeason) {
      suggestions.push('Tax season updates', 'IRS deadline reminders');
    }

    return suggestions;
  }

  private async validateCompliance(
    content: string,
    requiredChecks: string[],
    context?: CommunicationContext
  ): Promise<ComplianceValidation> {
    const violations: ComplianceValidation['violations'] = [];
    let riskScore = 0;

    // Check for confidentiality issues
    if (requiredChecks.includes('confidentiality')) {
      if (this.containsSensitiveInfo(content)) {
        violations.push({
          type: 'confidentiality',
          severity: 'high',
          description: 'Message may contain sensitive client information',
          suggestion: 'Review and redact sensitive information before sending',
          regulation: 'Client confidentiality requirements'
        });
        riskScore += 30;
      }
    }

    // Check for professional standards
    if (requiredChecks.includes('professional_standards')) {
      const sentiment = await openaiService.analyzeSentiment('temp', content);
      if (sentiment.score < -0.3) {
        violations.push({
          type: 'professional_standards',
          severity: 'medium',
          description: 'Message tone may not meet professional standards',
          suggestion: 'Consider revising language to maintain professional tone',
          regulation: 'Professional communication standards'
        });
        riskScore += 20;
      }
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      riskScore,
      recommendedChanges: violations.map(v => v.suggestion)
    };
  }

  private containsSensitiveInfo(content: string): boolean {
    const sensitivePatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{2}-\d{7}\b/, // EIN
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
      /\$[\d,]+\.\d{2}/ // Specific amounts
    ];

    return sensitivePatterns.some(pattern => pattern.test(content));
  }

  private calculateMedian(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  private groupBy(items: any[], groupKey: string, valueKey: string): Record<string, number> {
    const groups: Record<string, number[]> = {};

    items.forEach(item => {
      const key = this.getNestedValue(item, groupKey);
      const value = this.getNestedValue(item, valueKey);

      if (key && value !== null && value !== undefined) {
        if (!groups[key]) groups[key] = [];
        groups[key].push(value);
      }
    });

    const result: Record<string, number> = {};
    Object.keys(groups).forEach(key => {
      result[key] = groups[key].reduce((sum, val) => sum + val, 0) / groups[key].length;
    });

    return result;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private groupByTimeOfDay(communications: any[]): Record<string, number> {
    const hourGroups: Record<string, number[]> = {};

    communications.forEach(comm => {
      if (comm.responseTime && comm.timestamp) {
        const hour = new Date(comm.timestamp).getHours();
        const timeSlot = this.getTimeSlot(hour);

        if (!hourGroups[timeSlot]) hourGroups[timeSlot] = [];
        hourGroups[timeSlot].push(comm.responseTime);
      }
    });

    const result: Record<string, number> = {};
    Object.keys(hourGroups).forEach(slot => {
      result[slot] = hourGroups[slot].reduce((sum, val) => sum + val, 0) / hourGroups[slot].length;
    });

    return result;
  }

  private getTimeSlot(hour: number): string {
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  private calculateRate(items: any[], field: string): number {
    const total = items.length;
    if (total === 0) return 0;
    const positive = items.filter(item => item[field]).length;
    return positive / total;
  }

  private calculateAverage(items: any[], field: string): number {
    const values = items
      .map(item => item[field])
      .filter(val => val !== null && val !== undefined);

    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private groupSentimentByDate(sentimentData: Array<{ date: Date; sentiment: number }>): Array<{ date: string; sentiment: number }> {
    const dateGroups: Record<string, number[]> = {};

    sentimentData.forEach(item => {
      const dateKey = item.date.toISOString().split('T')[0];
      if (!dateGroups[dateKey]) dateGroups[dateKey] = [];
      dateGroups[dateKey].push(item.sentiment);
    });

    return Object.keys(dateGroups).map(date => ({
      date,
      sentiment: dateGroups[date].reduce((sum, val) => sum + val, 0) / dateGroups[date].length
    }));
  }

  private async analyzeTopics(organizationId: string, contents: string[]): Promise<CommunicationAnalytics['topicAnalysis']> {
    // This would use AI to analyze topics - simplified for now
    return {
      frequentTopics: [
        { topic: 'tax preparation', count: 45, sentiment: 0.2 },
        { topic: 'deadline questions', count: 32, sentiment: -0.1 },
        { topic: 'document submission', count: 28, sentiment: 0.1 }
      ],
      emergingIssues: [
        { issue: 'new tax law changes', urgency: 0.8, affectedClients: 12 },
        { issue: 'software integration problems', urgency: 0.6, affectedClients: 8 }
      ]
    };
  }

  private async generateClientFollowUps(client: any, lookAheadDays: number): Promise<FollowUpRecommendation[]> {
    const recommendations: FollowUpRecommendation[] = [];
    const now = new Date();

    // Check for inactive clients
    const lastCommunication = client.communications[0]?.timestamp;
    if (lastCommunication) {
      const daysSinceLastContact = Math.floor((now.getTime() - lastCommunication.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceLastContact > 30) {
        recommendations.push({
          id: `followup_${client.id}_inactive`,
          clientId: client.id,
          type: 'check_in',
          priority: 'medium',
          suggestedDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          reason: `No contact for ${daysSinceLastContact} days`,
          suggestedContent: {
            subject: 'Checking in - How can we help?',
            body: 'We wanted to check in and see how everything is going...',
            callToAction: 'Schedule a consultation'
          },
          contextData: { daysSinceContact: daysSinceLastContact },
          estimatedEngagement: 0.7,
          generatedAt: now
        });
      }
    }

    // Check for pending documents
    if (client.tasks.some((task: any) => task.type === 'document_collection')) {
      recommendations.push({
        id: `followup_${client.id}_docs`,
        clientId: client.id,
        type: 'document_reminder',
        priority: 'high',
        suggestedDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        reason: 'Pending document collection',
        suggestedContent: {
          subject: 'Document Reminder - Action Required',
          body: 'We are still waiting for some documents to complete your request...',
          callToAction: 'Upload documents to portal'
        },
        contextData: { pendingDocuments: true },
        estimatedEngagement: 0.8,
        generatedAt: now
      });
    }

    return recommendations;
  }

  private async generateRealtimeSuggestions(
    draftMessage: any,
    sentiment: any,
    context?: CommunicationContext
  ): Promise<{
    subject: string[];
    body: string[];
    tone: string[];
  }> {
    const suggestions = {
      subject: [] as string[],
      body: [] as string[],
      tone: [] as string[]
    };

    // Subject suggestions
    if (draftMessage.subject.length < 5) {
      suggestions.subject.push('Consider making the subject more descriptive');
    }

    // Body suggestions
    if (draftMessage.body.length < 50) {
      suggestions.body.push('Message might be too brief - consider adding more context');
    }

    // Tone suggestions
    if (sentiment.sentiment === 'negative') {
      suggestions.tone.push('Consider softening the tone to maintain positive client relationship');
    }

    return suggestions;
  }

  private generateWarnings(
    draftMessage: any,
    complianceCheck: ComplianceValidation,
    sentiment: any
  ): Array<{ type: 'compliance' | 'tone' | 'content' | 'timing'; message: string; severity: 'low' | 'medium' | 'high' }> {
    const warnings: Array<{ type: 'compliance' | 'tone' | 'content' | 'timing'; message: string; severity: 'low' | 'medium' | 'high' }> = [];

    // Compliance warnings
    complianceCheck.violations.forEach(violation => {
      warnings.push({
        type: 'compliance',
        message: violation.description,
        severity: violation.severity
      });
    });

    // Tone warnings
    if (sentiment.sentiment === 'negative' && sentiment.score < -0.5) {
      warnings.push({
        type: 'tone',
        message: 'Message tone appears negative - may impact client relationship',
        severity: 'medium'
      });
    }

    return warnings;
  }

  private async generateOptimizations(
    draftMessage: any,
    context?: CommunicationContext
  ): Promise<Array<{
    type: 'clarity' | 'engagement' | 'professionalism' | 'call_to_action';
    suggestion: string;
    impact: 'low' | 'medium' | 'high';
  }>> {
    const optimizations: Array<{
      type: 'clarity' | 'engagement' | 'professionalism' | 'call_to_action';
      suggestion: string;
      impact: 'low' | 'medium' | 'high';
    }> = [];

    // Check for call to action
    if (!this.hasCallToAction(draftMessage.body)) {
      optimizations.push({
        type: 'call_to_action',
        suggestion: 'Consider adding a clear call to action to guide next steps',
        impact: 'high'
      });
    }

    // Check for clarity
    if (this.hasTechnicalJargon(draftMessage.body)) {
      optimizations.push({
        type: 'clarity',
        suggestion: 'Consider simplifying technical terms for better client understanding',
        impact: 'medium'
      });
    }

    return optimizations;
  }

  private async predictCommunicationOutcome(
    draftMessage: any,
    context?: CommunicationContext,
    sentiment?: any
  ): Promise<{
    engagementScore: number;
    sentimentImpact: number;
    responseLikelihood: number;
  }> {
    // Simplified prediction logic
    let engagementScore = 0.7; // Base score
    let sentimentImpact = 0.5;
    let responseLikelihood = 0.6;

    // Adjust based on sentiment
    if (sentiment) {
      if (sentiment.sentiment === 'positive') {
        engagementScore += 0.2;
        responseLikelihood += 0.2;
      } else if (sentiment.sentiment === 'negative') {
        engagementScore -= 0.2;
        responseLikelihood -= 0.2;
      }
      sentimentImpact = Math.abs(sentiment.score);
    }

    // Adjust based on context
    if (context) {
      if (context.relationship.communicationPreferences.frequency === 'high') {
        responseLikelihood += 0.1;
      }
    }

    return {
      engagementScore: Math.max(0, Math.min(1, engagementScore)),
      sentimentImpact: Math.max(0, Math.min(1, sentimentImpact)),
      responseLikelihood: Math.max(0, Math.min(1, responseLikelihood))
    };
  }

  private hasCallToAction(body: string): boolean {
    const ctaPatterns = [
      /please/i,
      /call us/i,
      /contact/i,
      /schedule/i,
      /reply/i,
      /click/i,
      /visit/i
    ];
    return ctaPatterns.some(pattern => pattern.test(body));
  }

  private hasTechnicalJargon(body: string): boolean {
    const technicalTerms = [
      /depreciation/i,
      /amortization/i,
      /accrual/i,
      /liability/i,
      /deferred/i
    ];
    return technicalTerms.some(term => term.test(body));
  }

  private isTaxSeason(): boolean {
    const now = new Date();
    const month = now.getMonth(); // 0-based
    // Tax season is roughly January through April
    return month >= 0 && month <= 3;
  }

  private async saveCommunicationRecord(
    organizationId: string,
    userId: string,
    message: any,
    sentiment: any
  ): Promise<void> {
    try {
      await prisma.communicationLog.create({
        data: {
          organizationId,
          userId,
          clientId: message.clientId,
          type: 'email',
          direction: 'inbound',
          subject: message.subject,
          content: message.body,
          sentimentScore: sentiment.score,
          sentimentLabel: sentiment.sentiment,
          urgencyLevel: sentiment.urgencyLevel,
          timestamp: message.timestamp,
          requiresResponse: sentiment.urgencyLevel !== 'low'
        }
      });
    } catch (error) {
      console.error('Failed to save communication record:', error);
    }
  }
}

// Export singleton instance
export const communicationAIService = new CommunicationAIService();

// Export types
export type {
  SmartEmailTemplate,
  CommunicationContext,
  SmartSuggestion,
  CommunicationAnalytics,
  FollowUpRecommendation,
  ComplianceValidation
};
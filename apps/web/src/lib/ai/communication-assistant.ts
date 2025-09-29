import { openaiClient, AIResponse } from './openai-client';
import { communicationPrompts, formatPrompt } from './prompts';
// import { TextAnalyticsClient, AzureKeyCredential } from '@azure/cognitiveservices-textanalytics';

export interface EmailContext {
  recipientType: 'client' | 'colleague' | 'vendor' | 'authority' | 'other';
  purpose: 'inquiry' | 'update' | 'reminder' | 'apology' | 'proposal' | 'followup' | 'deadline' | 'meeting' | 'other';
  subject?: string;
  keyPoints: string[];
  tone: 'formal' | 'professional' | 'friendly' | 'urgent' | 'apologetic';
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  attachments?: string[];
  deadline?: Date;
  previousContext?: string;
  clientIndustry?: string;
  relationshipLevel?: 'new' | 'established' | 'longterm';
}

export interface EmailDraft {
  subject: string;
  body: string;
  suggestions: Array<{
    type: 'tone' | 'content' | 'structure' | 'compliance';
    suggestion: string;
    reasoning: string;
  }>;
  confidence: number;
  estimatedReadTime: number;
  compliance: {
    professionalStandards: boolean;
    clientConfidentiality: boolean;
    warningsFlags: string[];
  };
}

export interface MeetingData {
  meetingType: 'client_consultation' | 'team_meeting' | 'board_meeting' | 'training' | 'presentation' | 'other';
  participants: Array<{
    name: string;
    role: string;
    organization?: string;
  }>;
  agenda: string[];
  duration: number; // in minutes
  date: Date;
  discussionNotes: string;
  decisions?: Array<{
    decision: string;
    rationale: string;
    responsible?: string;
  }>;
  actionItems?: Array<{
    task: string;
    assignee: string;
    deadline: Date;
    priority: 'low' | 'medium' | 'high';
  }>;
}

export interface MeetingSummary {
  summary: string;
  keyDiscussionPoints: string[];
  decisionseMade: Array<{
    decision: string;
    rationale: string;
    responsible: string;
    deadline?: Date;
  }>;
  actionItems: Array<{
    task: string;
    assignee: string;
    deadline: Date;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in_progress' | 'completed';
  }>;
  followUpRequired: Array<{
    action: string;
    responsible: string;
    deadline: Date;
  }>;
  nextSteps: string[];
  attendanceRecord: Array<{
    name: string;
    role: string;
    present: boolean;
  }>;
}

export interface SentimentAnalysis {
  overall: 'positive' | 'neutral' | 'negative';
  confidence: number;
  emotions: Array<{
    emotion: string;
    intensity: number;
  }>;
  keyPhrases: string[];
  concerns?: string[];
  satisfaction?: number;
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  category: string;
  purpose: string;
  template: string;
  variables: string[];
  tone: string;
  usageCount: number;
  lastModified: Date;
}

class CommunicationAssistantService {
  // private textAnalyticsClient: TextAnalyticsClient | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const endpoint = process.env.AZURE_TEXT_ANALYTICS_ENDPOINT;
    const apiKey = process.env.AZURE_TEXT_ANALYTICS_KEY;

    if (endpoint && apiKey) {
      try {
        // this.textAnalyticsClient = new TextAnalyticsClient(
        //   endpoint,
        //   new AzureKeyCredential(apiKey)
        // );
        this.isInitialized = true;
      } catch (error) {
        console.error('Failed to initialize Text Analytics client:', error);
      }
    }
  }

  public isReady(): boolean {
    return openaiClient.isReady(); // Text Analytics is optional
  }

  /**
   * Draft a professional email based on context
   */
  public async draftEmail(
    context: EmailContext,
    organizationId?: string
  ): Promise<EmailDraft> {
    if (!this.isReady()) {
      throw new Error('Communication Assistant service is not ready');
    }

    const prompt = formatPrompt(communicationPrompts.emailDrafting, {
      recipientType: context.recipientType,
      emailPurpose: context.purpose,
      emailContext: context.previousContext || 'No previous context',
      keyPoints: context.keyPoints.join(', '),
      desiredTone: context.tone,
      urgency: context.urgency || 'medium',
    });

    try {
      const response = await openaiClient.createStructuredCompletion<{
        subject: string;
        body: string;
        suggestions: Array<{
          type: string;
          suggestion: string;
          reasoning: string;
        }>;
      }>(
        prompt.user,
        {
          subject: 'string',
          body: 'string',
          suggestions: 'array of objects with type, suggestion, reasoning'
        },
        {
          systemMessage: prompt.system,
          organizationId,
          temperature: 0.3,
        }
      );

      // Analyze compliance and professional standards
      const compliance = await this.checkEmailCompliance(response.data.body);

      // Calculate confidence and read time
      const confidence = this.calculateEmailConfidence(context, response.data);
      const estimatedReadTime = Math.ceil(response.data.body.split(' ').length / 200); // Words per minute

      return {
        subject: response.data.subject,
        body: response.data.body,
        suggestions: response.data.suggestions,
        confidence,
        estimatedReadTime,
        compliance,
      };
    } catch (error) {
      console.error('Email drafting failed:', error);
      throw new Error(`Failed to draft email: ${error}`);
    }
  }

  /**
   * Generate meeting summary from notes
   */
  public async generateMeetingSummary(
    meetingData: MeetingData,
    organizationId?: string
  ): Promise<MeetingSummary> {
    if (!this.isReady()) {
      throw new Error('Communication Assistant service is not ready');
    }

    const prompt = formatPrompt(communicationPrompts.meetingSummary, {
      meetingType: meetingData.meetingType,
      participants: meetingData.participants.map(p => `${p.name} (${p.role})`).join(', '),
      agenda: meetingData.agenda.join(', '),
      discussionNotes: meetingData.discussionNotes,
      decisions: JSON.stringify(meetingData.decisions || []),
    });

    try {
      const response = await openaiClient.createStructuredCompletion<MeetingSummary>(
        prompt.user,
        {
          summary: 'string',
          keyDiscussionPoints: 'array of strings',
          decisionseMade: 'array of objects with decision, rationale, responsible, deadline',
          actionItems: 'array of objects with task, assignee, deadline, priority, status',
          followUpRequired: 'array of objects with action, responsible, deadline',
          nextSteps: 'array of strings',
          attendanceRecord: 'array of objects with name, role, present'
        },
        {
          systemMessage: prompt.system,
          organizationId,
          temperature: 0.2,
        }
      );

      // Ensure all attendees are in attendance record
      const attendanceRecord = meetingData.participants.map(participant => ({
        name: participant.name,
        role: participant.role,
        present: true, // Assume present unless noted otherwise
      }));

      return {
        ...response.data,
        attendanceRecord,
      };
    } catch (error) {
      console.error('Meeting summary generation failed:', error);
      throw new Error(`Failed to generate meeting summary: ${error}`);
    }
  }

  /**
   * Analyze sentiment of client communications
   */
  public async analyzeSentiment(
    text: string,
    organizationId?: string
  ): Promise<SentimentAnalysis> {
    const results: SentimentAnalysis = {
      overall: 'neutral',
      confidence: 0.5,
      emotions: [],
      keyPhrases: [],
    };

    // Try Azure Text Analytics first (disabled for now)
    if (false && this.textAnalyticsClient) {
      try {
        const sentimentResult = await this.textAnalyticsClient.analyzeSentiment([text]);
        const keyPhrasesResult = await this.textAnalyticsClient.extractKeyPhrases([text]);

        const sentiment = sentimentResult[0];
        const keyPhrases = keyPhrasesResult[0];

        if (sentiment && !sentiment.error) {
          results.overall = sentiment.sentiment as 'positive' | 'neutral' | 'negative';
          results.confidence = Math.max(
            sentiment.confidenceScores.positive,
            sentiment.confidenceScores.neutral,
            sentiment.confidenceScores.negative
          );
        }

        if (keyPhrases && !keyPhrases.error) {
          results.keyPhrases = keyPhrases.keyPhrases;
        }
      } catch (error) {
        console.warn('Azure Text Analytics failed, falling back to OpenAI:', error);
      }
    }

    // Enhance with OpenAI analysis
    try {
      const response = await openaiClient.createStructuredCompletion<{
        sentiment: 'positive' | 'neutral' | 'negative';
        confidence: number;
        emotions: Array<{ emotion: string; intensity: number }>;
        concerns: string[];
        satisfaction: number;
      }>(
        `Analyze the sentiment and emotional tone of this client communication: "${text}"`,
        {
          sentiment: 'string',
          confidence: 'number',
          emotions: 'array of objects with emotion, intensity',
          concerns: 'array of strings',
          satisfaction: 'number from 0 to 1'
        },
        {
          systemMessage: 'You are an expert at analyzing client communication sentiment and identifying emotional cues, concerns, and satisfaction levels.',
          organizationId,
          temperature: 0.1,
        }
      );

      // Combine results
      results.emotions = response.data.emotions;
      results.concerns = response.data.concerns;
      results.satisfaction = response.data.satisfaction;

      // Use OpenAI results if Azure failed
      if (results.confidence < 0.7) {
        results.overall = response.data.sentiment;
        results.confidence = response.data.confidence;
      }
    } catch (error) {
      console.error('Sentiment analysis failed:', error);
    }

    return results;
  }

  /**
   * Generate response suggestions for client communications
   */
  public async generateResponseSuggestions(
    originalMessage: string,
    context: {
      clientProfile?: any;
      previousConversation?: string;
      urgency?: 'low' | 'medium' | 'high';
      purpose?: string;
    },
    organizationId?: string
  ): Promise<Array<{
    response: string;
    tone: string;
    rationale: string;
    confidence: number;
  }>> {
    if (!this.isReady()) {
      throw new Error('Communication Assistant service is not ready');
    }

    // First analyze the sentiment of the original message
    const sentiment = await this.analyzeSentiment(originalMessage, organizationId);

    const prompt = formatPrompt(communicationPrompts.clientCommunication, {
      clientProfile: JSON.stringify(context.clientProfile || {}),
      communicationType: 'response',
      subjectMatter: context.purpose || 'general inquiry',
      clientConcern: sentiment.concerns?.join(', ') || 'none identified',
      technicalDetails: 'not applicable',
      desiredOutcome: 'maintain positive relationship and address concerns',
    });

    try {
      const response = await openaiClient.createStructuredCompletion<Array<{
        response: string;
        tone: string;
        rationale: string;
        confidence: number;
      }>>(
        `Original message: "${originalMessage}"\n\nSentiment analysis: ${JSON.stringify(sentiment)}\n\n${prompt.user}`,
        {
          type: 'array',
          items: {
            response: 'string',
            tone: 'string',
            rationale: 'string',
            confidence: 'number'
          }
        },
        {
          systemMessage: prompt.system + '\n\nProvide 2-3 different response options with varying tones (professional, empathetic, solution-focused).',
          organizationId,
          temperature: 0.4,
        }
      );

      return response.data || [];
    } catch (error) {
      console.error('Response suggestion generation failed:', error);
      return [];
    }
  }

  /**
   * Extract action items from text
   */
  public async extractActionItems(
    text: string,
    organizationId?: string
  ): Promise<Array<{
    task: string;
    assignee?: string;
    deadline?: Date;
    priority: 'low' | 'medium' | 'high';
    context: string;
  }>> {
    if (!this.isReady()) {
      throw new Error('Communication Assistant service is not ready');
    }

    try {
      const response = await openaiClient.createStructuredCompletion<Array<{
        task: string;
        assignee?: string;
        deadline?: string;
        priority: 'low' | 'medium' | 'high';
        context: string;
      }>>(
        `Extract action items from this text: "${text}"`,
        {
          type: 'array',
          items: {
            task: 'string',
            assignee: 'string (optional)',
            deadline: 'string (optional)',
            priority: 'string',
            context: 'string'
          }
        },
        {
          systemMessage: 'You are an expert at identifying action items, tasks, and commitments in business communications. Extract clear, actionable items with responsible parties and deadlines when mentioned.',
          organizationId,
          temperature: 0.1,
        }
      );

      return response.data.map(item => ({
        ...item,
        deadline: item.deadline ? new Date(item.deadline) : undefined,
      })) || [];
    } catch (error) {
      console.error('Action item extraction failed:', error);
      return [];
    }
  }

  /**
   * Create communication templates
   */
  public async createTemplate(
    name: string,
    category: string,
    purpose: string,
    sampleContent: string,
    organizationId?: string
  ): Promise<CommunicationTemplate> {
    if (!this.isReady()) {
      throw new Error('Communication Assistant service is not ready');
    }

    try {
      const response = await openaiClient.createCompletion(
        `Create a reusable email template based on this sample content. Include variable placeholders for customization: "${sampleContent}"`,
        {
          systemMessage: 'You are an expert at creating professional email templates. Create a template with variable placeholders like {clientName}, {date}, {amount}, etc.',
          organizationId,
          temperature: 0.2,
        }
      );

      // Extract variables from template
      const template = response.data;
      const variables = Array.from(template.matchAll(/\{(\w+)\}/g)).map(match => match[1]);

      return {
        id: `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        category,
        purpose,
        template,
        variables,
        tone: 'professional',
        usageCount: 0,
        lastModified: new Date(),
      };
    } catch (error) {
      console.error('Template creation failed:', error);
      throw new Error(`Failed to create template: ${error}`);
    }
  }

  /**
   * Check email compliance and professional standards
   */
  private async checkEmailCompliance(emailBody: string): Promise<{
    professionalStandards: boolean;
    clientConfidentiality: boolean;
    warningsFlags: string[];
  }> {
    const warnings: string[] = [];
    let professionalStandards = true;
    let clientConfidentiality = true;

    // Check for common compliance issues
    const lowercaseBody = emailBody.toLowerCase();

    // Professional standards checks
    if (lowercaseBody.includes('guarantee') || lowercaseBody.includes('guaranteed')) {
      warnings.push('Avoid absolute guarantees in professional communications');
      professionalStandards = false;
    }

    if (lowercaseBody.includes('cheap') || lowercaseBody.includes('quick fix')) {
      warnings.push('Use professional language instead of colloquial terms');
      professionalStandards = false;
    }

    // Confidentiality checks
    if (lowercaseBody.includes('ssn') || lowercaseBody.includes('social security')) {
      warnings.push('Avoid including sensitive information in email');
      clientConfidentiality = false;
    }

    // Check for urgent/emotional language
    const urgentWords = ['urgent', 'asap', 'immediately', 'crisis', 'emergency'];
    if (urgentWords.some(word => lowercaseBody.includes(word))) {
      warnings.push('Consider if urgent language is appropriate for the situation');
    }

    return {
      professionalStandards,
      clientConfidentiality,
      warningsFlags: warnings,
    };
  }

  /**
   * Calculate email confidence score
   */
  private calculateEmailConfidence(context: EmailContext, draft: any): number {
    let confidence = 0.8; // Base confidence

    // Adjust based on context completeness
    if (context.keyPoints.length > 0) confidence += 0.1;
    if (context.previousContext) confidence += 0.05;
    if (context.recipientType !== 'other') confidence += 0.05;

    // Adjust based on draft quality
    if (draft.subject && draft.subject.length > 5) confidence += 0.05;
    if (draft.body && draft.body.length > 50) confidence += 0.05;

    return Math.min(0.95, confidence);
  }

  /**
   * Get communication analytics
   */
  public async getCommunicationAnalytics(
    organizationId: string,
    period: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<{
    totalEmails: number;
    avgResponseTime: number;
    sentimentBreakdown: Record<string, number>;
    topConcerns: string[];
    satisfactionTrend: number[];
    templateUsage: Record<string, number>;
  }> {
    // This would query the database for communication analytics
    return {
      totalEmails: 0,
      avgResponseTime: 0,
      sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
      topConcerns: [],
      satisfactionTrend: [],
      templateUsage: {},
    };
  }
}

export const communicationAssistantService = new CommunicationAssistantService();
export default communicationAssistantService;
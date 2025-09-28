import { openaiClient } from '@/lib/ai/openai-client';
import { db } from '@cpa-platform/database';

export interface EmailDraft {
  subject: string;
  body: string;
  tone: 'professional' | 'friendly' | 'formal' | 'casual' | 'urgent';
  estimatedReadTime: number;
  keyPoints: string[];
  attachmentSuggestions: string[];
  followUpActions: string[];
  metadata: {
    template: string;
    generatedAt: Date;
    wordCount: number;
    sentiment: string;
  };
}

export interface MeetingSummary {
  title: string;
  date: Date;
  attendees: string[];
  keyDiscussions: string[];
  actionItems: Array<{
    task: string;
    assignee: string;
    dueDate?: Date;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in_progress' | 'completed';
  }>;
  decisions: string[];
  nextSteps: string[];
  followUpMeeting?: Date;
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
}

export interface ReportSummary {
  executiveSummary: string;
  keyFindings: string[];
  recommendations: string[];
  riskFactors: string[];
  opportunities: string[];
  nextActions: string[];
  targetAudience: string;
  readingLevel: 'executive' | 'technical' | 'general';
  estimatedReadTime: number;
}

export interface ClientQuestion {
  question: string;
  category: 'tax' | 'financial' | 'business' | 'compliance' | 'general';
  complexity: 'simple' | 'moderate' | 'complex' | 'expert';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  suggestedResponse: string;
  additionalResources: string[];
  followUpQuestions: string[];
  confidence: number;
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  category: 'email' | 'letter' | 'report' | 'proposal' | 'notice';
  purpose: string;
  template: string;
  variables: string[];
  tone: string;
  isCustom: boolean;
  usage_count: number;
}

class AICommunicationService {
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.isInitialized = openaiClient.isReady();
  }

  public isReady(): boolean {
    return this.isInitialized && openaiClient.isReady();
  }

  /**
   * Draft professional client emails
   */
  public async draftClientEmail(
    context: {
      clientName: string;
      purpose: string;
      keyPoints: string[];
      tone?: 'professional' | 'friendly' | 'formal' | 'casual' | 'urgent';
      templateId?: string;
      attachments?: string[];
      deadline?: Date;
    },
    organizationId: string
  ): Promise<EmailDraft> {
    if (!this.isReady()) {
      throw new Error('AI Communication service is not ready');
    }

    try {
      const tone = context.tone || 'professional';
      const prompt = this.buildEmailDraftPrompt(context, tone);

      const response = await openaiClient.createStructuredCompletion(
        prompt,
        {
          subject: 'string - clear and specific email subject',
          body: 'string - well-structured email body',
          keyPoints: 'array of strings - main points covered',
          attachmentSuggestions: 'array of strings - suggested attachments',
          followUpActions: 'array of strings - next steps for client',
        },
        {
          organizationId,
          temperature: 0.7,
          maxTokens: 1000,
        }
      );

      const emailDraft: EmailDraft = {
        ...response.data,
        tone,
        estimatedReadTime: this.calculateReadTime(response.data.body),
        metadata: {
          template: context.templateId || 'custom',
          generatedAt: new Date(),
          wordCount: this.countWords(response.data.body),
          sentiment: await this.analyzeSentiment(response.data.body, organizationId),
        },
      };

      // Store draft for future reference and improvement
      await this.storeCommunicationDraft({
        type: 'email',
        organizationId,
        content: emailDraft,
        context,
      });

      return emailDraft;

    } catch (error) {
      console.error('Email drafting failed:', error);
      throw new Error(`Email drafting failed: ${error}`);
    }
  }

  /**
   * Summarize meeting notes and extract action items
   */
  public async summarizeMeeting(
    meetingData: {
      title?: string;
      date: Date;
      attendees: string[];
      transcript?: string;
      notes?: string;
      agenda?: string[];
    },
    organizationId: string
  ): Promise<MeetingSummary> {
    if (!this.isReady()) {
      throw new Error('AI Communication service is not ready');
    }

    try {
      const prompt = this.buildMeetingSummaryPrompt(meetingData);

      const response = await openaiClient.createStructuredCompletion(
        prompt,
        {
          title: 'string - meeting title or topic',
          keyDiscussions: 'array of strings - main discussion points',
          actionItems: 'array of objects with task, assignee, dueDate, priority',
          decisions: 'array of strings - decisions made',
          nextSteps: 'array of strings - next steps identified',
          sentiment: 'string - overall meeting sentiment (positive/neutral/negative)',
        },
        {
          organizationId,
          temperature: 0.5,
          maxTokens: 1200,
        }
      );

      const summary: MeetingSummary = {
        title: response.data.title || meetingData.title || 'Client Meeting',
        date: meetingData.date,
        attendees: meetingData.attendees,
        keyDiscussions: response.data.keyDiscussions || [],
        actionItems: (response.data.actionItems || []).map((item: any) => ({
          task: item.task || '',
          assignee: item.assignee || '',
          dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
          priority: item.priority || 'medium',
          status: 'pending',
        })),
        decisions: response.data.decisions || [],
        nextSteps: response.data.nextSteps || [],
        sentiment: response.data.sentiment || 'neutral',
        confidence: 0.8,
      };

      // Store meeting summary
      await this.storeMeetingSummary(summary, organizationId);

      return summary;

    } catch (error) {
      console.error('Meeting summarization failed:', error);
      throw new Error(`Meeting summarization failed: ${error}`);
    }
  }

  /**
   * Extract action items from various text sources
   */
  public async extractActionItems(
    text: string,
    organizationId: string,
    context?: {
      source: 'meeting' | 'email' | 'document' | 'note';
      participants?: string[];
      deadline?: Date;
    }
  ): Promise<MeetingSummary['actionItems']> {
    if (!this.isReady()) {
      throw new Error('AI Communication service is not ready');
    }

    try {
      const prompt = this.buildActionItemExtractionPrompt(text, context);

      const response = await openaiClient.createStructuredCompletion(
        prompt,
        {
          actionItems: 'array of objects with task, assignee, dueDate, priority, description',
        },
        {
          organizationId,
          temperature: 0.3,
          maxTokens: 800,
        }
      );

      return (response.data.actionItems || []).map((item: any) => ({
        task: item.task || '',
        assignee: item.assignee || '',
        dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
        priority: item.priority || 'medium',
        status: 'pending',
      }));

    } catch (error) {
      console.error('Action item extraction failed:', error);
      throw new Error(`Action item extraction failed: ${error}`);
    }
  }

  /**
   * Generate executive summaries for reports
   */
  public async generateReportSummary(
    reportData: {
      title: string;
      content: string;
      type: 'financial' | 'tax' | 'audit' | 'advisory' | 'compliance';
      audience: 'client' | 'management' | 'board' | 'regulatory';
      length?: 'brief' | 'standard' | 'detailed';
    },
    organizationId: string
  ): Promise<ReportSummary> {
    if (!this.isReady()) {
      throw new Error('AI Communication service is not ready');
    }

    try {
      const prompt = this.buildReportSummaryPrompt(reportData);

      const response = await openaiClient.createStructuredCompletion(
        prompt,
        {
          executiveSummary: 'string - comprehensive executive summary',
          keyFindings: 'array of strings - most important findings',
          recommendations: 'array of strings - actionable recommendations',
          riskFactors: 'array of strings - identified risks',
          opportunities: 'array of strings - identified opportunities',
          nextActions: 'array of strings - immediate next steps',
        },
        {
          organizationId,
          temperature: 0.6,
          maxTokens: 1500,
        }
      );

      const summary: ReportSummary = {
        ...response.data,
        targetAudience: reportData.audience,
        readingLevel: this.determineReadingLevel(reportData.audience),
        estimatedReadTime: this.calculateReadTime(response.data.executiveSummary),
      };

      return summary;

    } catch (error) {
      console.error('Report summarization failed:', error);
      throw new Error(`Report summarization failed: ${error}`);
    }
  }

  /**
   * Answer client questions with intelligent responses
   */
  public async answerClientQuestion(
    question: {
      text: string;
      clientId?: string;
      context?: string;
      urgency?: 'low' | 'medium' | 'high' | 'critical';
    },
    organizationId: string
  ): Promise<ClientQuestion> {
    if (!this.isReady()) {
      throw new Error('AI Communication service is not ready');
    }

    try {
      const prompt = this.buildQuestionAnswerPrompt(question);

      const response = await openaiClient.createStructuredCompletion(
        prompt,
        {
          category: 'string - question category (tax/financial/business/compliance/general)',
          complexity: 'string - complexity level (simple/moderate/complex/expert)',
          suggestedResponse: 'string - professional response to the question',
          additionalResources: 'array of strings - helpful resources or references',
          followUpQuestions: 'array of strings - potential follow-up questions',
          confidence: 'number - confidence in the response (0-1)',
        },
        {
          organizationId,
          temperature: 0.4,
          maxTokens: 1000,
        }
      );

      const answer: ClientQuestion = {
        question: question.text,
        category: response.data.category || 'general',
        complexity: response.data.complexity || 'moderate',
        urgency: question.urgency || 'medium',
        suggestedResponse: response.data.suggestedResponse || '',
        additionalResources: response.data.additionalResources || [],
        followUpQuestions: response.data.followUpQuestions || [],
        confidence: Math.min(Math.max(response.data.confidence || 0.7, 0), 1),
      };

      // Store question and response for learning
      await this.storeQuestionAnswer(answer, question.clientId, organizationId);

      return answer;

    } catch (error) {
      console.error('Question answering failed:', error);
      throw new Error(`Question answering failed: ${error}`);
    }
  }

  /**
   * Generate communication templates
   */
  public async generateTemplate(
    templateSpec: {
      name: string;
      category: 'email' | 'letter' | 'report' | 'proposal' | 'notice';
      purpose: string;
      tone: string;
      variables: string[];
      sampleContext?: Record<string, any>;
    },
    organizationId: string
  ): Promise<CommunicationTemplate> {
    if (!this.isReady()) {
      throw new Error('AI Communication service is not ready');
    }

    try {
      const prompt = this.buildTemplateGenerationPrompt(templateSpec);

      const response = await openaiClient.createStructuredCompletion(
        prompt,
        {
          template: 'string - template content with variable placeholders',
          refinedVariables: 'array of strings - optimized variable list',
        },
        {
          organizationId,
          temperature: 0.5,
          maxTokens: 1200,
        }
      );

      const template: CommunicationTemplate = {
        id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: templateSpec.name,
        category: templateSpec.category,
        purpose: templateSpec.purpose,
        template: response.data.template || '',
        variables: response.data.refinedVariables || templateSpec.variables,
        tone: templateSpec.tone,
        isCustom: true,
        usage_count: 0,
      };

      // Store template
      await this.storeTemplate(template, organizationId);

      return template;

    } catch (error) {
      console.error('Template generation failed:', error);
      throw new Error(`Template generation failed: ${error}`);
    }
  }

  /**
   * Analyze communication effectiveness
   */
  public async analyzeCommunicationEffectiveness(
    communications: Array<{
      type: 'email' | 'letter' | 'meeting' | 'call';
      content: string;
      sent_date: Date;
      response_received: boolean;
      response_time?: number; // hours
      client_satisfaction?: number; // 1-5 scale
    }>,
    organizationId: string
  ): Promise<{
    overallScore: number;
    strengths: string[];
    improvements: string[];
    recommendations: string[];
    trends: {
      responseRate: number;
      averageResponseTime: number;
      satisfactionTrend: string;
    };
  }> {
    try {
      const prompt = this.buildEffectivenessAnalysisPrompt(communications);

      const response = await openaiClient.createStructuredCompletion(
        prompt,
        {
          overallScore: 'number - overall effectiveness score (0-100)',
          strengths: 'array of strings - communication strengths',
          improvements: 'array of strings - areas for improvement',
          recommendations: 'array of strings - specific recommendations',
        },
        {
          organizationId,
          temperature: 0.3,
          maxTokens: 800,
        }
      );

      // Calculate trends
      const responseRate = communications.filter(c => c.response_received).length / communications.length;
      const avgResponseTime = communications
        .filter(c => c.response_time)
        .reduce((sum, c) => sum + (c.response_time || 0), 0) /
        communications.filter(c => c.response_time).length || 0;

      const satisfactionScores = communications
        .filter(c => c.client_satisfaction)
        .map(c => c.client_satisfaction || 0);

      const avgSatisfaction = satisfactionScores.length > 0
        ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length
        : 0;

      return {
        overallScore: Math.min(Math.max(response.data.overallScore || 70, 0), 100),
        strengths: response.data.strengths || [],
        improvements: response.data.improvements || [],
        recommendations: response.data.recommendations || [],
        trends: {
          responseRate: Math.round(responseRate * 100) / 100,
          averageResponseTime: Math.round(avgResponseTime * 10) / 10,
          satisfactionTrend: avgSatisfaction >= 4 ? 'positive' : avgSatisfaction >= 3 ? 'neutral' : 'negative',
        },
      };

    } catch (error) {
      console.error('Communication effectiveness analysis failed:', error);
      throw new Error(`Communication effectiveness analysis failed: ${error}`);
    }
  }

  /**
   * Private helper methods
   */
  private buildEmailDraftPrompt(context: any, tone: string): string {
    return `
Draft a professional ${tone} email for a CPA firm with the following context:

Client Name: ${context.clientName}
Purpose: ${context.purpose}
Key Points to Cover:
${context.keyPoints.map((point: string) => `- ${point}`).join('\n')}

${context.deadline ? `Deadline: ${context.deadline.toLocaleDateString()}` : ''}
${context.attachments?.length ? `Attachments to reference: ${context.attachments.join(', ')}` : ''}

Requirements:
- Professional but ${tone} tone
- Clear and concise
- Action-oriented where appropriate
- Include relevant next steps
- Suggest appropriate attachments if needed

Generate a complete email with subject line and well-structured body.
`;
  }

  private buildMeetingSummaryPrompt(meetingData: any): string {
    return `
Summarize the following meeting information and extract actionable items:

Meeting Title: ${meetingData.title || 'Client Meeting'}
Date: ${meetingData.date.toLocaleDateString()}
Attendees: ${meetingData.attendees.join(', ')}

${meetingData.agenda ? `Agenda:\n${meetingData.agenda.map((item: string) => `- ${item}`).join('\n')}\n` : ''}

${meetingData.transcript ? `Transcript:\n${meetingData.transcript}\n` : ''}

${meetingData.notes ? `Notes:\n${meetingData.notes}\n` : ''}

Extract:
1. Key discussion points
2. Specific action items with assignees and deadlines
3. Decisions made
4. Next steps
5. Overall meeting sentiment

Format action items with clear tasks, responsible parties, and realistic deadlines.
`;
  }

  private buildActionItemExtractionPrompt(text: string, context?: any): string {
    return `
Extract action items from the following text:

Text:
${text}

${context?.source ? `Source: ${context.source}` : ''}
${context?.participants ? `Participants: ${context.participants.join(', ')}` : ''}
${context?.deadline ? `Overall Deadline: ${context.deadline.toLocaleDateString()}` : ''}

Look for:
- Tasks that need to be completed
- Responsible parties (assignees)
- Deadlines or timeframes
- Priority levels
- Dependencies

Format each action item with:
- Clear, actionable task description
- Assignee (person responsible)
- Due date (if mentioned or inferable)
- Priority level (low/medium/high)
`;
  }

  private buildReportSummaryPrompt(reportData: any): string {
    return `
Create an executive summary for the following ${reportData.type} report:

Title: ${reportData.title}
Target Audience: ${reportData.audience}
Length Preference: ${reportData.length || 'standard'}

Report Content:
${reportData.content}

Generate:
1. Executive Summary - concise overview suitable for ${reportData.audience}
2. Key Findings - most important discoveries or results
3. Recommendations - specific, actionable recommendations
4. Risk Factors - potential risks or concerns identified
5. Opportunities - positive opportunities identified
6. Next Actions - immediate steps to take

Tailor the language and complexity to the ${reportData.audience} audience.
Focus on business impact and actionable insights.
`;
  }

  private buildQuestionAnswerPrompt(question: any): string {
    return `
As a professional CPA, analyze and respond to this client question:

Question: ${question.text}

${question.context ? `Context: ${question.context}` : ''}
${question.urgency ? `Urgency: ${question.urgency}` : ''}

Provide:
1. Question categorization (tax/financial/business/compliance/general)
2. Complexity assessment (simple/moderate/complex/expert)
3. Professional response that is:
   - Accurate and helpful
   - Appropriately detailed for the complexity
   - Professional yet accessible
   - Includes relevant disclaimers if needed
4. Additional resources or references
5. Potential follow-up questions the client might have
6. Confidence level in the response

Ensure the response maintains professional standards and includes appropriate caveats for complex tax or financial advice.
`;
  }

  private buildTemplateGenerationPrompt(templateSpec: any): string {
    return `
Create a professional ${templateSpec.category} template for a CPA firm:

Template Name: ${templateSpec.name}
Purpose: ${templateSpec.purpose}
Tone: ${templateSpec.tone}
Variables: ${templateSpec.variables.join(', ')}

${templateSpec.sampleContext ? `Sample Context:\n${JSON.stringify(templateSpec.sampleContext, null, 2)}` : ''}

Requirements:
- Professional ${templateSpec.tone} tone
- Include variable placeholders like {{variableName}}
- Well-structured and formatted
- Appropriate for CPA firm communications
- Flexible enough for multiple use cases
- Include standard legal disclaimers if appropriate

Optimize the variable list to ensure all necessary personalization points are covered.
`;
  }

  private buildEffectivenessAnalysisPrompt(communications: any[]): string {
    return `
Analyze the effectiveness of these communications:

${communications.map((comm, index) => `
Communication ${index + 1}:
- Type: ${comm.type}
- Date: ${comm.sent_date.toLocaleDateString()}
- Response Received: ${comm.response_received ? 'Yes' : 'No'}
- Response Time: ${comm.response_time ? `${comm.response_time} hours` : 'N/A'}
- Client Satisfaction: ${comm.client_satisfaction ? `${comm.client_satisfaction}/5` : 'N/A'}
- Content Preview: ${comm.content.substring(0, 200)}...
`).join('\n')}

Analyze:
1. Overall communication effectiveness (0-100 score)
2. Strengths in communication style and approach
3. Areas for improvement
4. Specific recommendations for better engagement
5. Patterns in response rates and satisfaction

Consider factors like:
- Clarity and professionalism
- Response rates and timing
- Client satisfaction trends
- Communication frequency and timing
- Content quality and relevance
`;
  }

  private calculateReadTime(text: string): number {
    const wordsPerMinute = 200;
    const wordCount = this.countWords(text);
    return Math.ceil(wordCount / wordsPerMinute);
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  private async analyzeSentiment(text: string, organizationId: string): Promise<string> {
    try {
      const prompt = `Analyze the sentiment of this text. Respond with only one word: positive, negative, or neutral.\n\nText: ${text.substring(0, 500)}`;

      const response = await openaiClient.createChatCompletion(
        [{ role: 'user', content: prompt }],
        {
          organizationId,
          temperature: 0.1,
          maxTokens: 10,
        }
      );

      const sentiment = response.content.toLowerCase().trim();
      return ['positive', 'negative', 'neutral'].includes(sentiment) ? sentiment : 'neutral';
    } catch (error) {
      console.warn('Sentiment analysis failed:', error);
      return 'neutral';
    }
  }

  private determineReadingLevel(audience: string): ReportSummary['readingLevel'] {
    switch (audience) {
      case 'board':
      case 'management':
        return 'executive';
      case 'client':
        return 'general';
      case 'regulatory':
        return 'technical';
      default:
        return 'general';
    }
  }

  private async storeCommunicationDraft(draft: any): Promise<void> {
    try {
      await db.communicationDraft.create({
        data: {
          id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          organizationId: draft.organizationId,
          type: draft.type,
          content: draft.content,
          context: draft.context,
          createdAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to store communication draft:', error);
    }
  }

  private async storeMeetingSummary(summary: MeetingSummary, organizationId: string): Promise<void> {
    try {
      await db.meetingSummary.create({
        data: {
          id: `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          organizationId,
          title: summary.title,
          meetingDate: summary.date,
          attendees: summary.attendees,
          keyDiscussions: summary.keyDiscussions,
          actionItems: summary.actionItems,
          decisions: summary.decisions,
          nextSteps: summary.nextSteps,
          sentiment: summary.sentiment,
          confidence: summary.confidence,
          createdAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to store meeting summary:', error);
    }
  }

  private async storeQuestionAnswer(answer: ClientQuestion, clientId: string | undefined, organizationId: string): Promise<void> {
    try {
      await db.clientQuestionAnswer.create({
        data: {
          id: `qa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          organizationId,
          clientId: clientId || null,
          question: answer.question,
          category: answer.category,
          complexity: answer.complexity,
          urgency: answer.urgency,
          suggestedResponse: answer.suggestedResponse,
          additionalResources: answer.additionalResources,
          followUpQuestions: answer.followUpQuestions,
          confidence: answer.confidence,
          createdAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to store question answer:', error);
    }
  }

  private async storeTemplate(template: CommunicationTemplate, organizationId: string): Promise<void> {
    try {
      await db.communicationTemplate.create({
        data: {
          id: template.id,
          organizationId,
          name: template.name,
          category: template.category,
          purpose: template.purpose,
          template: template.template,
          variables: template.variables,
          tone: template.tone,
          isCustom: template.isCustom,
          usageCount: template.usage_count,
          createdAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to store template:', error);
    }
  }
}

export const aiCommunicationService = new AICommunicationService();
export default aiCommunicationService;
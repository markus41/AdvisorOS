import OpenAI from 'openai';
import { prisma } from '../../server/db';
import { EventEmitter } from 'events';

export interface AIUsageTracking {
  id: string;
  organizationId: string;
  userId: string;
  service: 'openai' | 'azure-cognitive' | 'form-recognizer';
  operation: string;
  tokensUsed: number;
  cost: number;
  timestamp: Date;
  requestId: string;
  metadata: Record<string, any>;
}

export interface FinancialInsight {
  id: string;
  type: 'anomaly' | 'trend' | 'recommendation' | 'risk_assessment' | 'compliance';
  title: string;
  description: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  dataSource: string;
  timeframe: string;
  impact: {
    financial: number;
    compliance: string;
    operational: string;
  };
  recommendations: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high';
    estimatedImpact: string;
    timeframe: string;
  }>;
  generatedAt: Date;
  lastUpdated: Date;
}

export interface EmailDraftOptions {
  purpose: 'followup' | 'reminder' | 'report' | 'alert' | 'consultation';
  clientName: string;
  clientType: 'individual' | 'business';
  context: Record<string, any>;
  tone: 'professional' | 'friendly' | 'urgent' | 'formal';
  urgency: 'low' | 'normal' | 'high';
  includeAttachments?: boolean;
  customInstructions?: string;
}

export interface EmailDraft {
  subject: string;
  body: string;
  tone: string;
  estimatedReadTime: number;
  keyPoints: string[];
  suggestedActions: string[];
  followUpDate?: Date;
  confidence: number;
}

export interface TaxOptimizationSuggestion {
  id: string;
  category: 'deduction' | 'credit' | 'strategy' | 'timing' | 'entity_structure';
  title: string;
  description: string;
  potentialSavings: number;
  confidence: number;
  complexity: 'simple' | 'moderate' | 'complex';
  requirements: string[];
  deadline?: Date;
  riskLevel: 'low' | 'medium' | 'high';
  applicableFor: string[];
  documentation: string[];
}

export interface ComplianceAlert {
  id: string;
  type: 'deadline' | 'requirement' | 'change' | 'penalty_risk';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  dueDate?: Date;
  affectedClients: string[];
  requiredActions: string[];
  references: string[];
  estimatedWorkload: string;
}

class OpenAIService extends EventEmitter {
  private client: OpenAI;
  private usageTracking: AIUsageTracking[] = [];

  constructor() {
    super();

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not found in environment variables');
    }

    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate financial insights from QuickBooks data
   */
  async generateFinancialInsights(
    organizationId: string,
    financialData: {
      transactions: any[];
      balanceSheet?: any;
      profitLoss?: any;
      cashFlow?: any;
      period: string;
    },
    options: {
      includeRecommendations?: boolean;
      focusAreas?: string[];
      riskAssessment?: boolean;
    } = {}
  ): Promise<FinancialInsight[]> {
    try {
      const startTime = Date.now();

      // Prepare data summary for AI analysis
      const dataSummary = this.prepareFinancialDataSummary(financialData);

      const prompt = this.buildFinancialInsightsPrompt(dataSummary, options);

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert CPA and financial analyst. Analyze the provided financial data and generate actionable insights, trends, and recommendations. Focus on practical advice for business owners and individuals. Always include confidence scores and risk assessments.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const insights = JSON.parse(response);

      // Track usage
      await this.trackUsage({
        organizationId,
        service: 'openai',
        operation: 'financial_insights',
        tokensUsed: completion.usage?.total_tokens || 0,
        cost: this.calculateCost(completion.usage?.total_tokens || 0, 'gpt-4'),
        requestId: completion.id,
        metadata: { period: financialData.period, insightCount: insights.insights?.length || 0 }
      });

      // Process and structure insights
      const structuredInsights: FinancialInsight[] = insights.insights.map((insight: any, index: number) => ({
        id: `insight_${Date.now()}_${index}`,
        type: insight.type || 'trend',
        title: insight.title,
        description: insight.description,
        confidence: insight.confidence || 0.8,
        severity: insight.severity || 'medium',
        category: insight.category || 'general',
        dataSource: 'quickbooks',
        timeframe: financialData.period,
        impact: {
          financial: insight.impact?.financial || 0,
          compliance: insight.impact?.compliance || 'none',
          operational: insight.impact?.operational || 'none'
        },
        recommendations: insight.recommendations || [],
        generatedAt: new Date(),
        lastUpdated: new Date()
      }));

      // Save insights to database
      await this.saveFinancialInsights(organizationId, structuredInsights);

      this.emit('insights_generated', {
        organizationId,
        insightCount: structuredInsights.length,
        processingTime: Date.now() - startTime
      });

      return structuredInsights;

    } catch (error) {
      console.error('Financial insights generation failed:', error);
      throw new Error(`Failed to generate financial insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate AI-powered email drafts
   */
  async generateEmailDraft(
    organizationId: string,
    userId: string,
    options: EmailDraftOptions
  ): Promise<EmailDraft> {
    try {
      const prompt = this.buildEmailDraftPrompt(options);

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a professional CPA assistant that helps draft client communications. Generate professional, clear, and appropriate emails based on the context provided. Always maintain a professional tone while being personable when appropriate.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const draft = JSON.parse(response);

      // Track usage
      await this.trackUsage({
        organizationId,
        service: 'openai',
        operation: 'email_draft',
        tokensUsed: completion.usage?.total_tokens || 0,
        cost: this.calculateCost(completion.usage?.total_tokens || 0, 'gpt-4'),
        requestId: completion.id,
        metadata: { purpose: options.purpose, clientType: options.clientType }
      });

      const emailDraft: EmailDraft = {
        subject: draft.subject,
        body: draft.body,
        tone: draft.tone || options.tone,
        estimatedReadTime: Math.ceil(draft.body.split(' ').length / 200),
        keyPoints: draft.keyPoints || [],
        suggestedActions: draft.suggestedActions || [],
        followUpDate: draft.followUpDate ? new Date(draft.followUpDate) : undefined,
        confidence: draft.confidence || 0.8
      };

      return emailDraft;

    } catch (error) {
      console.error('Email draft generation failed:', error);
      throw new Error(`Failed to generate email draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform sentiment analysis on client communications
   */
  async analyzeSentiment(
    organizationId: string,
    text: string,
    context?: {
      clientId?: string;
      communicationType?: 'email' | 'chat' | 'call_notes';
      timestamp?: Date;
    }
  ): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    score: number;
    confidence: number;
    emotions: Array<{ emotion: string; intensity: number }>;
    keyPhrases: string[];
    urgencyLevel: 'low' | 'medium' | 'high';
    suggestedResponse: string;
  }> {
    try {
      const prompt = `Analyze the sentiment and emotional tone of the following client communication. Provide detailed analysis including sentiment classification, confidence score, detected emotions, key phrases, and urgency level.

Communication text: "${text}"

Provide response in JSON format with sentiment, score, confidence, emotions array, keyPhrases array, urgencyLevel, and suggestedResponse.`;

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in communication analysis and sentiment detection for professional CPA-client relationships.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const analysis = JSON.parse(response);

      // Track usage
      await this.trackUsage({
        organizationId,
        service: 'openai',
        operation: 'sentiment_analysis',
        tokensUsed: completion.usage?.total_tokens || 0,
        cost: this.calculateCost(completion.usage?.total_tokens || 0, 'gpt-4'),
        requestId: completion.id,
        metadata: { textLength: text.length, ...context }
      });

      return {
        sentiment: analysis.sentiment,
        score: analysis.score,
        confidence: analysis.confidence,
        emotions: analysis.emotions || [],
        keyPhrases: analysis.keyPhrases || [],
        urgencyLevel: analysis.urgencyLevel || 'low',
        suggestedResponse: analysis.suggestedResponse || ''
      };

    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      throw new Error(`Failed to analyze sentiment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate tax optimization suggestions
   */
  async generateTaxOptimizationSuggestions(
    organizationId: string,
    clientData: {
      entityType: 'individual' | 'sole_proprietorship' | 'partnership' | 'c_corp' | 's_corp' | 'llc';
      income: number;
      expenses: any[];
      deductions: any[];
      filingStatus?: string;
      state?: string;
      industry?: string;
    },
    taxYear: number
  ): Promise<TaxOptimizationSuggestion[]> {
    try {
      const prompt = this.buildTaxOptimizationPrompt(clientData, taxYear);

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert tax strategist and CPA. Provide practical, legal tax optimization strategies based on current tax law. Always include confidence levels and risk assessments.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2500,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const suggestions = JSON.parse(response);

      // Track usage
      await this.trackUsage({
        organizationId,
        service: 'openai',
        operation: 'tax_optimization',
        tokensUsed: completion.usage?.total_tokens || 0,
        cost: this.calculateCost(completion.usage?.total_tokens || 0, 'gpt-4'),
        requestId: completion.id,
        metadata: { entityType: clientData.entityType, taxYear, suggestionCount: suggestions.suggestions?.length || 0 }
      });

      const structuredSuggestions: TaxOptimizationSuggestion[] = suggestions.suggestions.map((suggestion: any, index: number) => ({
        id: `tax_opt_${Date.now()}_${index}`,
        category: suggestion.category,
        title: suggestion.title,
        description: suggestion.description,
        potentialSavings: suggestion.potentialSavings || 0,
        confidence: suggestion.confidence || 0.8,
        complexity: suggestion.complexity || 'moderate',
        requirements: suggestion.requirements || [],
        deadline: suggestion.deadline ? new Date(suggestion.deadline) : undefined,
        riskLevel: suggestion.riskLevel || 'low',
        applicableFor: suggestion.applicableFor || [clientData.entityType],
        documentation: suggestion.documentation || []
      }));

      return structuredSuggestions;

    } catch (error) {
      console.error('Tax optimization generation failed:', error);
      throw new Error(`Failed to generate tax optimization suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate compliance alerts and deadline reminders
   */
  async generateComplianceAlerts(
    organizationId: string,
    clients: Array<{
      id: string;
      entityType: string;
      state: string;
      industry?: string;
      lastFiling?: Date;
    }>,
    lookAheadDays: number = 90
  ): Promise<ComplianceAlert[]> {
    try {
      const prompt = this.buildComplianceAlertsPrompt(clients, lookAheadDays);

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a compliance expert familiar with tax deadlines, regulatory requirements, and filing obligations across all states and entity types.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const alerts = JSON.parse(response);

      // Track usage
      await this.trackUsage({
        organizationId,
        service: 'openai',
        operation: 'compliance_alerts',
        tokensUsed: completion.usage?.total_tokens || 0,
        cost: this.calculateCost(completion.usage?.total_tokens || 0, 'gpt-4'),
        requestId: completion.id,
        metadata: { clientCount: clients.length, lookAheadDays, alertCount: alerts.alerts?.length || 0 }
      });

      const structuredAlerts: ComplianceAlert[] = alerts.alerts.map((alert: any, index: number) => ({
        id: `compliance_${Date.now()}_${index}`,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        dueDate: alert.dueDate ? new Date(alert.dueDate) : undefined,
        affectedClients: alert.affectedClients || [],
        requiredActions: alert.requiredActions || [],
        references: alert.references || [],
        estimatedWorkload: alert.estimatedWorkload || 'Unknown'
      }));

      return structuredAlerts;

    } catch (error) {
      console.error('Compliance alerts generation failed:', error);
      throw new Error(`Failed to generate compliance alerts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect anomalies in financial transactions
   */
  async detectTransactionAnomalies(
    organizationId: string,
    transactions: Array<{
      id: string;
      date: Date;
      amount: number;
      description: string;
      category: string;
      account: string;
      payee?: string;
    }>,
    baseline: {
      averageAmount: number;
      commonCategories: string[];
      typicalPayees: string[];
      seasonalPatterns?: any;
    }
  ): Promise<Array<{
    transactionId: string;
    anomalyType: 'amount' | 'frequency' | 'category' | 'payee' | 'timing';
    severity: 'low' | 'medium' | 'high';
    description: string;
    confidence: number;
    suggestedAction: string;
  }>> {
    try {
      const prompt = this.buildAnomalyDetectionPrompt(transactions, baseline);

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a financial forensics expert specializing in anomaly detection and fraud prevention. Analyze transactions for unusual patterns while minimizing false positives.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const anomalies = JSON.parse(response);

      // Track usage
      await this.trackUsage({
        organizationId,
        service: 'openai',
        operation: 'anomaly_detection',
        tokensUsed: completion.usage?.total_tokens || 0,
        cost: this.calculateCost(completion.usage?.total_tokens || 0, 'gpt-4'),
        requestId: completion.id,
        metadata: { transactionCount: transactions.length, anomalyCount: anomalies.anomalies?.length || 0 }
      });

      return anomalies.anomalies || [];

    } catch (error) {
      console.error('Anomaly detection failed:', error);
      throw new Error(`Failed to detect anomalies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get AI usage statistics
   */
  async getUsageStatistics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<{
    totalTokens: number;
    totalCost: number;
    operationBreakdown: Record<string, { tokens: number; cost: number; count: number }>;
    dailyUsage: Array<{ date: string; tokens: number; cost: number }>;
    topUsers: Array<{ userId: string; tokens: number; cost: number }>;
  }> {
    try {
      const usage = await prisma.aiUsageLog.findMany({
        where: {
          organizationId,
          timestamp: {
            gte: dateFrom,
            lte: dateTo
          }
        }
      });

      const stats = {
        totalTokens: usage.reduce((sum, log) => sum + log.tokensUsed, 0),
        totalCost: usage.reduce((sum, log) => sum + log.cost, 0),
        operationBreakdown: {} as Record<string, { tokens: number; cost: number; count: number }>,
        dailyUsage: [] as Array<{ date: string; tokens: number; cost: number }>,
        topUsers: [] as Array<{ userId: string; tokens: number; cost: number }>
      };

      // Operation breakdown
      usage.forEach(log => {
        if (!stats.operationBreakdown[log.operation]) {
          stats.operationBreakdown[log.operation] = { tokens: 0, cost: 0, count: 0 };
        }
        stats.operationBreakdown[log.operation].tokens += log.tokensUsed;
        stats.operationBreakdown[log.operation].cost += log.cost;
        stats.operationBreakdown[log.operation].count += 1;
      });

      // Daily usage (simplified for example)
      const dailyMap = new Map<string, { tokens: number; cost: number }>();
      usage.forEach(log => {
        const date = log.timestamp.toISOString().split('T')[0];
        if (!dailyMap.has(date)) {
          dailyMap.set(date, { tokens: 0, cost: 0 });
        }
        const daily = dailyMap.get(date)!;
        daily.tokens += log.tokensUsed;
        daily.cost += log.cost;
      });

      stats.dailyUsage = Array.from(dailyMap.entries()).map(([date, data]) => ({
        date,
        ...data
      }));

      // Top users (simplified for example)
      const userMap = new Map<string, { tokens: number; cost: number }>();
      usage.forEach(log => {
        if (!userMap.has(log.userId)) {
          userMap.set(log.userId, { tokens: 0, cost: 0 });
        }
        const user = userMap.get(log.userId)!;
        user.tokens += log.tokensUsed;
        user.cost += log.cost;
      });

      stats.topUsers = Array.from(userMap.entries())
        .map(([userId, data]) => ({ userId, ...data }))
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 10);

      return stats;

    } catch (error) {
      console.error('Failed to get usage statistics:', error);
      throw new Error(`Failed to get usage statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods

  private prepareFinancialDataSummary(data: any): string {
    const summary = {
      period: data.period,
      transactionCount: data.transactions?.length || 0,
      totalRevenue: data.profitLoss?.totalRevenue || 0,
      totalExpenses: data.profitLoss?.totalExpenses || 0,
      netIncome: data.profitLoss?.netIncome || 0,
      totalAssets: data.balanceSheet?.totalAssets || 0,
      totalLiabilities: data.balanceSheet?.totalLiabilities || 0,
      cashFlow: data.cashFlow?.netCashFlow || 0,
      topExpenseCategories: this.getTopCategories(data.transactions, 'expense'),
      topRevenueStreams: this.getTopCategories(data.transactions, 'income')
    };

    return JSON.stringify(summary, null, 2);
  }

  private getTopCategories(transactions: any[], type: 'expense' | 'income'): any[] {
    if (!transactions) return [];

    const filtered = transactions.filter(t =>
      type === 'expense' ? t.amount < 0 : t.amount > 0
    );

    const categoryTotals = filtered.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([category, amount]) => ({ category, amount }));
  }

  private buildFinancialInsightsPrompt(dataSummary: string, options: any): string {
    return `Analyze the following financial data and generate actionable insights:

${dataSummary}

Please provide insights in the following categories:
- Trends and patterns
- Anomalies or unusual activities
- Financial health indicators
- Recommendations for improvement
- Risk assessments
${options.includeRecommendations ? '- Specific action items with priorities' : ''}
${options.focusAreas?.length ? `- Focus specifically on: ${options.focusAreas.join(', ')}` : ''}

Format the response as JSON with an "insights" array containing objects with:
- type: "trend" | "anomaly" | "recommendation" | "risk_assessment"
- title: brief descriptive title
- description: detailed explanation
- confidence: 0.0 to 1.0
- severity: "low" | "medium" | "high" | "critical"
- category: relevant category
- impact: { financial: number, compliance: string, operational: string }
- recommendations: array of action items with priority and timeframe`;
  }

  private buildEmailDraftPrompt(options: EmailDraftOptions): string {
    return `Generate a professional email draft with the following specifications:

Purpose: ${options.purpose}
Client: ${options.clientName} (${options.clientType})
Tone: ${options.tone}
Urgency: ${options.urgency}
Context: ${JSON.stringify(options.context)}
${options.customInstructions ? `Additional instructions: ${options.customInstructions}` : ''}

Provide response as JSON with:
- subject: email subject line
- body: complete email body
- tone: confirmed tone used
- keyPoints: array of main points covered
- suggestedActions: array of next steps
- followUpDate: suggested follow-up date if applicable
- confidence: 0.0 to 1.0 confidence in appropriateness`;
  }

  private buildTaxOptimizationPrompt(clientData: any, taxYear: number): string {
    return `Generate tax optimization strategies for the following client profile:

Entity Type: ${clientData.entityType}
Income: $${clientData.income}
Filing Status: ${clientData.filingStatus || 'N/A'}
State: ${clientData.state || 'N/A'}
Industry: ${clientData.industry || 'N/A'}
Tax Year: ${taxYear}

Current Expenses: ${JSON.stringify(clientData.expenses.slice(0, 10))}
Current Deductions: ${JSON.stringify(clientData.deductions.slice(0, 10))}

Provide response as JSON with "suggestions" array containing:
- category: "deduction" | "credit" | "strategy" | "timing" | "entity_structure"
- title: strategy name
- description: detailed explanation
- potentialSavings: estimated dollar amount
- confidence: 0.0 to 1.0
- complexity: "simple" | "moderate" | "complex"
- requirements: array of requirements
- deadline: applicable deadline if any
- riskLevel: "low" | "medium" | "high"
- applicableFor: applicable entity types
- documentation: required documentation`;
  }

  private buildComplianceAlertsPrompt(clients: any[], lookAheadDays: number): string {
    return `Generate compliance alerts for the following clients looking ahead ${lookAheadDays} days:

${JSON.stringify(clients, null, 2)}

Current Date: ${new Date().toISOString()}

Provide response as JSON with "alerts" array containing:
- type: "deadline" | "requirement" | "change" | "penalty_risk"
- severity: "info" | "warning" | "critical"
- title: alert title
- description: detailed description
- dueDate: applicable due date
- affectedClients: array of client IDs
- requiredActions: array of required actions
- references: relevant regulations or publications
- estimatedWorkload: estimated time requirement`;
  }

  private buildAnomalyDetectionPrompt(transactions: any[], baseline: any): string {
    return `Analyze the following transactions for anomalies based on the baseline patterns:

Baseline:
- Average Amount: $${baseline.averageAmount}
- Common Categories: ${baseline.commonCategories.join(', ')}
- Typical Payees: ${baseline.typicalPayees.join(', ')}

Recent Transactions:
${JSON.stringify(transactions.slice(0, 50), null, 2)}

Provide response as JSON with "anomalies" array containing:
- transactionId: ID of anomalous transaction
- anomalyType: "amount" | "frequency" | "category" | "payee" | "timing"
- severity: "low" | "medium" | "high"
- description: explanation of anomaly
- confidence: 0.0 to 1.0
- suggestedAction: recommended next step`;
  }

  private calculateCost(tokens: number, model: string): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-3.5-turbo': { input: 0.001, output: 0.002 }
    };

    // Simplified cost calculation (assumes 50/50 input/output split)
    const modelPricing = pricing[model] || pricing['gpt-3.5-turbo'];
    return (tokens * 0.5 * modelPricing.input / 1000) + (tokens * 0.5 * modelPricing.output / 1000);
  }

  private async trackUsage(usage: Omit<AIUsageTracking, 'id' | 'timestamp'> & { organizationId: string }): Promise<void> {
    try {
      await prisma.aiUsageLog.create({
        data: {
          organizationId: usage.organizationId,
          userId: usage.metadata?.userId || 'system',
          service: usage.service,
          operation: usage.operation,
          tokensUsed: usage.tokensUsed,
          cost: usage.cost,
          requestId: usage.requestId,
          metadata: usage.metadata,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to track AI usage:', error);
    }
  }

  private async saveFinancialInsights(organizationId: string, insights: FinancialInsight[]): Promise<void> {
    try {
      for (const insight of insights) {
        await prisma.financialInsight.create({
          data: {
            organizationId,
            type: insight.type,
            title: insight.title,
            description: insight.description,
            confidence: insight.confidence,
            severity: insight.severity,
            category: insight.category,
            dataSource: insight.dataSource,
            timeframe: insight.timeframe,
            impact: insight.impact,
            recommendations: insight.recommendations,
            generatedAt: insight.generatedAt,
            lastUpdated: insight.lastUpdated
          }
        });
      }
    } catch (error) {
      console.error('Failed to save financial insights:', error);
    }
  }

  /**
   * Content moderation and safety check
   */
  async moderateContent(text: string): Promise<{
    isSafe: boolean;
    categories: string[];
    flagged: boolean;
    reason?: string;
  }> {
    try {
      const moderation = await this.client.moderations.create({
        input: text
      });

      const result = moderation.results[0];

      return {
        isSafe: !result.flagged,
        categories: Object.keys(result.categories).filter(key => result.categories[key]),
        flagged: result.flagged,
        reason: result.flagged ? 'Content violates usage policies' : undefined
      };

    } catch (error) {
      console.error('Content moderation failed:', error);
      return {
        isSafe: false,
        categories: ['error'],
        flagged: true,
        reason: 'Moderation check failed'
      };
    }
  }

  /**
   * Check service health and availability
   */
  async checkHealth(): Promise<{
    isHealthy: boolean;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      await this.client.models.list();

      return {
        isHealthy: true,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        isHealthy: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const openaiService = new OpenAIService();

// Export types
export type {
  AIUsageTracking,
  FinancialInsight,
  EmailDraftOptions,
  EmailDraft,
  TaxOptimizationSuggestion,
  ComplianceAlert
};
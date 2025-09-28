import { OpenAI } from 'openai';
import { AzureOpenAI } from 'openai';
import { encoding_for_model } from 'tiktoken';

export interface AIConfig {
  apiKey: string;
  endpoint: string;
  apiVersion: string;
  gpt4DeploymentName: string;
  gpt35DeploymentName: string;
  maxTokensPerRequest: number;
  costLimitPerOrgMonthly: number;
  confidenceThreshold: number;
  enabled: boolean;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface AIResponse<T = any> {
  data: T;
  usage: TokenUsage;
  model: string;
  confidence?: number;
  requestId: string;
}

class OpenAIClient {
  private client: AzureOpenAI | null = null;
  private config: AIConfig;
  private isInitialized = false;

  constructor() {
    this.config = {
      apiKey: process.env.AZURE_OPENAI_API_KEY || '',
      endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
      gpt4DeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4',
      gpt35DeploymentName: process.env.AZURE_OPENAI_GPT35_DEPLOYMENT_NAME || 'gpt-35-turbo',
      maxTokensPerRequest: parseInt(process.env.AI_MAX_TOKENS_PER_REQUEST || '4000'),
      costLimitPerOrgMonthly: parseInt(process.env.AI_COST_LIMIT_PER_ORG_MONTHLY || '1000'),
      confidenceThreshold: parseFloat(process.env.AI_CONFIDENCE_THRESHOLD || '0.7'),
      enabled: process.env.AI_FEATURES_ENABLED === 'true',
    };

    if (this.config.enabled && this.config.apiKey && this.config.endpoint) {
      this.initialize();
    }
  }

  private initialize(): void {
    try {
      this.client = new AzureOpenAI({
        apiKey: this.config.apiKey,
        endpoint: this.config.endpoint,
        apiVersion: this.config.apiVersion,
      });
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Azure OpenAI client:', error);
      this.isInitialized = false;
    }
  }

  public isReady(): boolean {
    return this.isInitialized && this.client !== null && this.config.enabled;
  }

  public getConfig(): AIConfig {
    return { ...this.config };
  }

  /**
   * Calculate token count for text using tiktoken
   */
  public countTokens(text: string, model: string = 'gpt-4'): number {
    try {
      const encoding = encoding_for_model(model as any);
      const tokens = encoding.encode(text);
      encoding.free();
      return tokens.length;
    } catch (error) {
      // Fallback estimation: roughly 1 token per 4 characters
      return Math.ceil(text.length / 4);
    }
  }

  /**
   * Estimate cost based on token usage and model
   */
  public estimateCost(usage: { promptTokens: number; completionTokens: number }, model: string): number {
    // Azure OpenAI pricing (as of 2024)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4': { input: 0.03, output: 0.06 }, // per 1K tokens
      'gpt-4-32k': { input: 0.06, output: 0.12 },
      'gpt-35-turbo': { input: 0.0015, output: 0.002 },
      'gpt-35-turbo-16k': { input: 0.003, output: 0.004 },
    };

    const modelPricing = pricing[model] || pricing['gpt-35-turbo'];
    const inputCost = (usage.promptTokens / 1000) * modelPricing.input;
    const outputCost = (usage.completionTokens / 1000) * modelPricing.output;

    return inputCost + outputCost;
  }

  /**
   * Generate completion with Azure OpenAI
   */
  public async createCompletion(
    prompt: string,
    options: {
      model?: 'gpt-4' | 'gpt-35-turbo';
      maxTokens?: number;
      temperature?: number;
      systemMessage?: string;
      organizationId?: string;
    } = {}
  ): Promise<AIResponse<string>> {
    if (!this.isReady()) {
      throw new Error('Azure OpenAI client is not initialized or disabled');
    }

    const {
      model = 'gpt-35-turbo',
      maxTokens = 1000,
      temperature = 0.7,
      systemMessage,
      organizationId,
    } = options;

    // Check token limits
    const promptTokens = this.countTokens(prompt + (systemMessage || ''), model);
    if (promptTokens > this.config.maxTokensPerRequest * 0.8) {
      throw new Error(`Prompt too long: ${promptTokens} tokens exceeds limit`);
    }

    // Check monthly cost limit for organization
    if (organizationId) {
      await this.checkCostLimit(organizationId);
    }

    const deploymentName = model === 'gpt-4'
      ? this.config.gpt4DeploymentName
      : this.config.gpt35DeploymentName;

    const messages: any[] = [];
    if (systemMessage) {
      messages.push({ role: 'system', content: systemMessage });
    }
    messages.push({ role: 'user', content: prompt });

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const response = await this.client!.chat.completions.create({
        model: deploymentName,
        messages,
        max_tokens: maxTokens,
        temperature,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      const tokenUsage: TokenUsage = {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        estimatedCost: this.estimateCost(
          { promptTokens: usage.prompt_tokens, completionTokens: usage.completion_tokens },
          model
        ),
      };

      // Log usage if organization ID provided
      if (organizationId) {
        await this.logTokenUsage(organizationId, tokenUsage, model, requestId);
      }

      const content = response.choices[0]?.message?.content || '';

      return {
        data: content,
        usage: tokenUsage,
        model: deploymentName,
        requestId,
      };
    } catch (error: any) {
      console.error('Azure OpenAI API error:', error);

      if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (error.status === 401) {
        throw new Error('Invalid API key or authentication failed.');
      }
      if (error.status === 403) {
        throw new Error('Access forbidden. Check your Azure OpenAI permissions.');
      }

      throw new Error(`AI service error: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Generate structured completion with JSON response
   */
  public async createStructuredCompletion<T>(
    prompt: string,
    schema: any,
    options: {
      model?: 'gpt-4' | 'gpt-35-turbo';
      maxTokens?: number;
      temperature?: number;
      systemMessage?: string;
      organizationId?: string;
    } = {}
  ): Promise<AIResponse<T>> {
    const systemMessage = `${options.systemMessage || ''}\n\nRespond with valid JSON only. No additional text or formatting. Follow this schema: ${JSON.stringify(schema)}`;

    const response = await this.createCompletion(prompt, {
      ...options,
      systemMessage,
    });

    try {
      const parsedData = JSON.parse(response.data) as T;
      return {
        ...response,
        data: parsedData,
      };
    } catch (error) {
      throw new Error(`Failed to parse AI response as JSON: ${error}`);
    }
  }

  /**
   * Generate embeddings for text
   */
  public async createEmbedding(
    text: string,
    options: {
      model?: string;
      organizationId?: string;
    } = {}
  ): Promise<AIResponse<number[]>> {
    if (!this.isReady()) {
      throw new Error('Azure OpenAI client is not initialized or disabled');
    }

    const { model = 'text-embedding-ada-002', organizationId } = options;
    const requestId = `emb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const response = await this.client!.embeddings.create({
        model,
        input: text,
      });

      const usage: TokenUsage = {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: 0,
        totalTokens: response.usage?.total_tokens || 0,
        estimatedCost: this.estimateCost(
          { promptTokens: response.usage?.prompt_tokens || 0, completionTokens: 0 },
          model
        ),
      };

      if (organizationId) {
        await this.logTokenUsage(organizationId, usage, model, requestId);
      }

      return {
        data: response.data[0]?.embedding || [],
        usage,
        model,
        requestId,
      };
    } catch (error: any) {
      console.error('Azure OpenAI embeddings error:', error);
      throw new Error(`Embeddings service error: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Check if organization has exceeded monthly cost limit
   */
  private async checkCostLimit(organizationId: string): Promise<void> {
    // Implementation would check database for current month usage
    // This is a placeholder - implement based on your database schema
    try {
      const { prisma: db } = await import('../../server/db');

      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      // This would be implemented based on your usage tracking table
      // const monthlyUsage = await db.aiUsage.aggregate({
      //   where: {
      //     organizationId,
      //     createdAt: { gte: currentMonth }
      //   },
      //   _sum: { estimatedCost: true }
      // });

      // const totalCost = monthlyUsage._sum.estimatedCost || 0;
      // if (totalCost >= this.config.costLimitPerOrgMonthly) {
      //   throw new Error(`Monthly AI cost limit of $${this.config.costLimitPerOrgMonthly} exceeded for organization`);
      // }
    } catch (error) {
      console.warn('Could not check cost limit:', error);
      // Continue execution if cost checking fails
    }
  }

  /**
   * Log token usage for tracking and billing
   */
  private async logTokenUsage(
    organizationId: string,
    usage: TokenUsage,
    model: string,
    requestId: string
  ): Promise<void> {
    try {
      const { prisma: db } = await import('../../server/db');

      // This would be implemented based on your database schema
      // await db.aiUsage.create({
      //   data: {
      //     organizationId,
      //     requestId,
      //     model,
      //     promptTokens: usage.promptTokens,
      //     completionTokens: usage.completionTokens,
      //     totalTokens: usage.totalTokens,
      //     estimatedCost: usage.estimatedCost,
      //     createdAt: new Date(),
      //   }
      // });
    } catch (error) {
      console.error('Failed to log token usage:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Get usage statistics for an organization
   */
  public async getUsageStats(organizationId: string, period: 'day' | 'month' | 'year' = 'month'): Promise<{
    totalTokens: number;
    totalCost: number;
    requests: number;
    averageCostPerRequest: number;
    topModels: Array<{ model: string; usage: number; cost: number }>;
  }> {
    try {
      const { prisma: db } = await import('../../server/db');

      const startDate = new Date();
      switch (period) {
        case 'day':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'month':
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'year':
          startDate.setMonth(0, 1);
          startDate.setHours(0, 0, 0, 0);
          break;
      }

      // This would be implemented based on your database schema
      return {
        totalTokens: 0,
        totalCost: 0,
        requests: 0,
        averageCostPerRequest: 0,
        topModels: [],
      };
    } catch (error) {
      console.error('Failed to get usage stats:', error);
      throw new Error('Could not retrieve usage statistics');
    }
  }

  /**
   * Test connection to Azure OpenAI
   */
  public async testConnection(): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      await this.createCompletion('Test connection', {
        maxTokens: 5,
        temperature: 0,
      });
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const openaiClient = new OpenAIClient();
export default openaiClient;

// Type exports
export type { AIConfig, TokenUsage, AIResponse };
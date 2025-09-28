/**
 * Token Management and Cost Tracking Service
 * Manages OpenAI API token usage, cost tracking, and optimization
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface CostCalculation {
  promptCost: number;
  completionCost: number;
  totalCost: number;
  model: string;
}

export interface UsageRecord {
  id: string;
  userId: string;
  clientId?: string;
  feature: string;
  model: string;
  tokenUsage: TokenUsage;
  cost: CostCalculation;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface UsageLimits {
  dailyTokenLimit: number;
  monthlyTokenLimit: number;
  dailyCostLimit: number;
  monthlyCostLimit: number;
  perRequestLimit: number;
}

export interface UsageStats {
  dailyUsage: {
    tokens: number;
    cost: number;
    requests: number;
  };
  monthlyUsage: {
    tokens: number;
    cost: number;
    requests: number;
  };
  topFeatures: Array<{
    feature: string;
    tokens: number;
    cost: number;
    percentage: number;
  }>;
  trends: Array<{
    date: string;
    tokens: number;
    cost: number;
  }>;
}

// Current OpenAI pricing (as of 2024)
const MODEL_PRICING = {
  'gpt-4-turbo': {
    prompt: 0.01, // per 1K tokens
    completion: 0.03 // per 1K tokens
  },
  'gpt-4': {
    prompt: 0.03,
    completion: 0.06
  },
  'gpt-3.5-turbo': {
    prompt: 0.0015,
    completion: 0.002
  },
  'text-embedding-ada-002': {
    prompt: 0.0001,
    completion: 0
  }
} as const;

export class TokenManagementService {
  /**
   * Calculate cost based on token usage and model
   */
  static calculateCost(tokenUsage: TokenUsage, model: string): CostCalculation {
    const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING];

    if (!pricing) {
      throw new Error(`Pricing not found for model: ${model}`);
    }

    const promptCost = (tokenUsage.promptTokens / 1000) * pricing.prompt;
    const completionCost = (tokenUsage.completionTokens / 1000) * pricing.completion;
    const totalCost = promptCost + completionCost;

    return {
      promptCost,
      completionCost,
      totalCost,
      model
    };
  }

  /**
   * Record token usage and cost
   */
  static async recordUsage(
    userId: string,
    feature: string,
    model: string,
    tokenUsage: TokenUsage,
    metadata: Record<string, any> = {},
    clientId?: string
  ): Promise<UsageRecord> {
    const cost = this.calculateCost(tokenUsage, model);

    const record = await prisma.tokenUsage.create({
      data: {
        userId,
        clientId,
        feature,
        model,
        promptTokens: tokenUsage.promptTokens,
        completionTokens: tokenUsage.completionTokens,
        totalTokens: tokenUsage.totalTokens,
        promptCost: cost.promptCost,
        completionCost: cost.completionCost,
        totalCost: cost.totalCost,
        metadata,
        timestamp: new Date()
      }
    });

    return {
      id: record.id,
      userId: record.userId,
      clientId: record.clientId || undefined,
      feature: record.feature,
      model: record.model,
      tokenUsage: {
        promptTokens: record.promptTokens,
        completionTokens: record.completionTokens,
        totalTokens: record.totalTokens
      },
      cost: {
        promptCost: record.promptCost,
        completionCost: record.completionCost,
        totalCost: record.totalCost,
        model: record.model
      },
      timestamp: record.timestamp,
      metadata: record.metadata as Record<string, any>
    };
  }

  /**
   * Check if user is within usage limits
   */
  static async checkUsageLimits(userId: string, limits: UsageLimits): Promise<{
    withinLimits: boolean;
    dailyRemaining: { tokens: number; cost: number };
    monthlyRemaining: { tokens: number; cost: number };
    warnings: string[];
  }> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get daily usage
    const dailyUsage = await prisma.tokenUsage.aggregate({
      where: {
        userId,
        timestamp: { gte: startOfDay }
      },
      _sum: {
        totalTokens: true,
        totalCost: true
      }
    });

    // Get monthly usage
    const monthlyUsage = await prisma.tokenUsage.aggregate({
      where: {
        userId,
        timestamp: { gte: startOfMonth }
      },
      _sum: {
        totalTokens: true,
        totalCost: true
      }
    });

    const dailyTokens = dailyUsage._sum.totalTokens || 0;
    const dailyCost = dailyUsage._sum.totalCost || 0;
    const monthlyTokens = monthlyUsage._sum.totalTokens || 0;
    const monthlyCost = monthlyUsage._sum.totalCost || 0;

    const warnings: string[] = [];
    let withinLimits = true;

    // Check daily limits
    if (dailyTokens >= limits.dailyTokenLimit) {
      withinLimits = false;
      warnings.push('Daily token limit exceeded');
    }
    if (dailyCost >= limits.dailyCostLimit) {
      withinLimits = false;
      warnings.push('Daily cost limit exceeded');
    }

    // Check monthly limits
    if (monthlyTokens >= limits.monthlyTokenLimit) {
      withinLimits = false;
      warnings.push('Monthly token limit exceeded');
    }
    if (monthlyCost >= limits.monthlyCostLimit) {
      withinLimits = false;
      warnings.push('Monthly cost limit exceeded');
    }

    // Add warning thresholds (80% of limits)
    if (dailyTokens >= limits.dailyTokenLimit * 0.8) {
      warnings.push('Approaching daily token limit');
    }
    if (monthlyTokens >= limits.monthlyTokenLimit * 0.8) {
      warnings.push('Approaching monthly token limit');
    }

    return {
      withinLimits,
      dailyRemaining: {
        tokens: Math.max(0, limits.dailyTokenLimit - dailyTokens),
        cost: Math.max(0, limits.dailyCostLimit - dailyCost)
      },
      monthlyRemaining: {
        tokens: Math.max(0, limits.monthlyTokenLimit - monthlyTokens),
        cost: Math.max(0, limits.monthlyCostLimit - monthlyCost)
      },
      warnings
    };
  }

  /**
   * Get usage statistics for a user
   */
  static async getUsageStats(userId: string, days = 30): Promise<UsageStats> {
    const now = new Date();
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Daily usage
    const dailyUsage = await prisma.tokenUsage.aggregate({
      where: {
        userId,
        timestamp: { gte: startOfDay }
      },
      _sum: {
        totalTokens: true,
        totalCost: true
      },
      _count: true
    });

    // Monthly usage
    const monthlyUsage = await prisma.tokenUsage.aggregate({
      where: {
        userId,
        timestamp: { gte: startOfMonth }
      },
      _sum: {
        totalTokens: true,
        totalCost: true
      },
      _count: true
    });

    // Top features
    const featureUsage = await prisma.tokenUsage.groupBy({
      by: ['feature'],
      where: {
        userId,
        timestamp: { gte: startOfMonth }
      },
      _sum: {
        totalTokens: true,
        totalCost: true
      },
      orderBy: {
        _sum: {
          totalCost: 'desc'
        }
      },
      take: 10
    });

    const totalMonthlyTokens = monthlyUsage._sum.totalTokens || 0;
    const topFeatures = featureUsage.map(feature => ({
      feature: feature.feature,
      tokens: feature._sum.totalTokens || 0,
      cost: feature._sum.totalCost || 0,
      percentage: totalMonthlyTokens > 0 ? ((feature._sum.totalTokens || 0) / totalMonthlyTokens) * 100 : 0
    }));

    // Trends (daily breakdown)
    const trends = await prisma.tokenUsage.groupBy({
      by: ['timestamp'],
      where: {
        userId,
        timestamp: { gte: startDate }
      },
      _sum: {
        totalTokens: true,
        totalCost: true
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    const trendData = trends.map(trend => ({
      date: trend.timestamp.toISOString().split('T')[0],
      tokens: trend._sum.totalTokens || 0,
      cost: trend._sum.totalCost || 0
    }));

    return {
      dailyUsage: {
        tokens: dailyUsage._sum.totalTokens || 0,
        cost: dailyUsage._sum.totalCost || 0,
        requests: dailyUsage._count
      },
      monthlyUsage: {
        tokens: monthlyUsage._sum.totalTokens || 0,
        cost: monthlyUsage._sum.totalCost || 0,
        requests: monthlyUsage._count
      },
      topFeatures,
      trends: trendData
    };
  }

  /**
   * Estimate cost for a prompt before sending to OpenAI
   */
  static estimateCost(promptText: string, model: string, estimatedCompletionTokens = 500): CostCalculation {
    // Rough estimation: 1 token ≈ 4 characters for English text
    const promptTokens = Math.ceil(promptText.length / 4);

    const tokenUsage: TokenUsage = {
      promptTokens,
      completionTokens: estimatedCompletionTokens,
      totalTokens: promptTokens + estimatedCompletionTokens
    };

    return this.calculateCost(tokenUsage, model);
  }

  /**
   * Get cost-optimized model recommendation
   */
  static getOptimizedModel(promptComplexity: 'simple' | 'moderate' | 'complex', budget?: number): {
    model: string;
    reasoning: string;
    estimatedCost: number;
  } {
    const recommendations = {
      simple: {
        model: 'gpt-3.5-turbo',
        reasoning: 'Simple tasks can be handled efficiently by GPT-3.5-turbo at lower cost'
      },
      moderate: {
        model: 'gpt-4-turbo',
        reasoning: 'Moderate complexity benefits from GPT-4-turbo\'s enhanced capabilities'
      },
      complex: {
        model: 'gpt-4-turbo',
        reasoning: 'Complex analysis requires GPT-4-turbo\'s advanced reasoning capabilities'
      }
    };

    const recommendation = recommendations[promptComplexity];
    const estimatedTokens = { promptTokens: 1000, completionTokens: 500, totalTokens: 1500 };
    const estimatedCost = this.calculateCost(estimatedTokens, recommendation.model).totalCost;

    // Check budget constraints
    if (budget && estimatedCost > budget && recommendation.model !== 'gpt-3.5-turbo') {
      return {
        model: 'gpt-3.5-turbo',
        reasoning: `Budget constraint requires using GPT-3.5-turbo (estimated cost: $${estimatedCost.toFixed(4)} exceeds budget)`,
        estimatedCost: this.calculateCost(estimatedTokens, 'gpt-3.5-turbo').totalCost
      };
    }

    return {
      ...recommendation,
      estimatedCost
    };
  }

  /**
   * Generate usage report
   */
  static async generateUsageReport(userId: string, startDate: Date, endDate: Date): Promise<{
    summary: {
      totalCost: number;
      totalTokens: number;
      totalRequests: number;
      averageCostPerRequest: number;
    };
    breakdown: {
      byFeature: Array<{ feature: string; cost: number; tokens: number; requests: number }>;
      byModel: Array<{ model: string; cost: number; tokens: number; requests: number }>;
      byDay: Array<{ date: string; cost: number; tokens: number; requests: number }>;
    };
    insights: string[];
  }> {
    const usage = await prisma.tokenUsage.findMany({
      where: {
        userId,
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Summary calculations
    const totalCost = usage.reduce((sum, record) => sum + record.totalCost, 0);
    const totalTokens = usage.reduce((sum, record) => sum + record.totalTokens, 0);
    const totalRequests = usage.length;
    const averageCostPerRequest = totalRequests > 0 ? totalCost / totalRequests : 0;

    // Breakdown by feature
    const featureMap = new Map<string, { cost: number; tokens: number; requests: number }>();
    const modelMap = new Map<string, { cost: number; tokens: number; requests: number }>();
    const dayMap = new Map<string, { cost: number; tokens: number; requests: number }>();

    usage.forEach(record => {
      // By feature
      const feature = featureMap.get(record.feature) || { cost: 0, tokens: 0, requests: 0 };
      feature.cost += record.totalCost;
      feature.tokens += record.totalTokens;
      feature.requests += 1;
      featureMap.set(record.feature, feature);

      // By model
      const model = modelMap.get(record.model) || { cost: 0, tokens: 0, requests: 0 };
      model.cost += record.totalCost;
      model.tokens += record.totalTokens;
      model.requests += 1;
      modelMap.set(record.model, model);

      // By day
      const day = record.timestamp.toISOString().split('T')[0];
      const dayData = dayMap.get(day) || { cost: 0, tokens: 0, requests: 0 };
      dayData.cost += record.totalCost;
      dayData.tokens += record.totalTokens;
      dayData.requests += 1;
      dayMap.set(day, dayData);
    });

    // Generate insights
    const insights: string[] = [];

    const costliestFeature = Array.from(featureMap.entries()).sort((a, b) => b[1].cost - a[1].cost)[0];
    if (costliestFeature) {
      insights.push(`Most expensive feature: ${costliestFeature[0]} ($${costliestFeature[1].cost.toFixed(2)})`);
    }

    const mostUsedModel = Array.from(modelMap.entries()).sort((a, b) => b[1].requests - a[1].requests)[0];
    if (mostUsedModel) {
      insights.push(`Most used model: ${mostUsedModel[0]} (${mostUsedModel[1].requests} requests)`);
    }

    if (totalCost > 10) {
      insights.push('Consider implementing more aggressive token optimization to reduce costs');
    }

    if (Array.from(modelMap.keys()).includes('gpt-4') && totalCost > 5) {
      insights.push('Review if all GPT-4 usage is necessary - some tasks might be suitable for GPT-3.5-turbo');
    }

    return {
      summary: {
        totalCost,
        totalTokens,
        totalRequests,
        averageCostPerRequest
      },
      breakdown: {
        byFeature: Array.from(featureMap.entries()).map(([feature, data]) => ({
          feature,
          ...data
        })),
        byModel: Array.from(modelMap.entries()).map(([model, data]) => ({
          model,
          ...data
        })),
        byDay: Array.from(dayMap.entries()).map(([date, data]) => ({
          date,
          ...data
        }))
      },
      insights
    };
  }

  /**
   * Optimize prompt to reduce token usage
   */
  static optimizePrompt(prompt: string, targetReduction = 0.2): {
    optimizedPrompt: string;
    originalTokens: number;
    optimizedTokens: number;
    reduction: number;
  } {
    const originalTokens = Math.ceil(prompt.length / 4);
    const targetTokens = Math.floor(originalTokens * (1 - targetReduction));

    let optimized = prompt;

    // Remove redundant phrases
    optimized = optimized.replace(/\b(please|kindly|if you would|would you mind)\b/gi, '');

    // Simplify verbose constructions
    optimized = optimized.replace(/in order to/g, 'to');
    optimized = optimized.replace(/due to the fact that/g, 'because');
    optimized = optimized.replace(/for the purpose of/g, 'for');

    // Remove excessive whitespace
    optimized = optimized.replace(/\s+/g, ' ').trim();

    // If still too long, truncate intelligently
    if (Math.ceil(optimized.length / 4) > targetTokens) {
      const targetLength = targetTokens * 4;
      const sentences = optimized.split(/[.!?]+/);

      optimized = '';
      for (const sentence of sentences) {
        if ((optimized + sentence).length <= targetLength) {
          optimized += sentence + '.';
        } else {
          break;
        }
      }
    }

    const optimizedTokens = Math.ceil(optimized.length / 4);
    const reduction = (originalTokens - optimizedTokens) / originalTokens;

    return {
      optimizedPrompt: optimized,
      originalTokens,
      optimizedTokens,
      reduction
    };
  }
}

export default TokenManagementService;
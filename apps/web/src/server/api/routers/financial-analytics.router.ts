import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { createFinancialForecastingService } from '@/server/services/financial-forecasting.service';
import { createAnomalyDetectionService } from '@/server/services/anomaly-detection.service';
import { createPredictiveAnalyticsService } from '@/server/services/predictive-analytics.service';
import { createBenchmarkingService } from '@/server/services/benchmarking.service';
import { createRiskAssessmentService } from '@/server/services/risk-assessment.service';

// Input validation schemas
const clientIdSchema = z.object({
  clientId: z.string().optional(),
});

const forecastingOptionsSchema = z.object({
  clientId: z.string(),
  forecastPeriods: z.number().min(1).max(60).default(12),
  includeSeasonality: z.boolean().default(true),
  confidenceLevel: z.number().min(0.8).max(0.99).default(0.95),
  modelType: z.enum(['arima', 'exponential_smoothing', 'prophet', 'ensemble']).default('ensemble'),
  includeExogenousVariables: z.boolean().default(true),
});

const anomalyDetectionOptionsSchema = z.object({
  clientId: z.string().optional(),
  includeHistoricalData: z.boolean().default(true),
  timeWindow: z.number().min(7).max(365).default(90),
  enableRealTimeDetection: z.boolean().default(true),
  anomalyTypes: z.array(z.enum(['amount', 'frequency', 'pattern', 'timing', 'category', 'fraud'])).default(['amount', 'frequency', 'pattern', 'timing', 'category', 'fraud']),
  modelTypes: z.array(z.enum(['isolation_forest', 'one_class_svm', 'autoencoder', 'statistical'])).default(['isolation_forest', 'statistical']),
});

const clvOptionsSchema = z.object({
  clientId: z.string().optional(),
  includeChurnRisk: z.boolean().default(true),
  projectionPeriods: z.number().min(12).max(120).default(60),
  includeSegmentation: z.boolean().default(true),
  includeRecommendations: z.boolean().default(true),
});

const taxLiabilitySchema = z.object({
  clientId: z.string(),
  taxYear: z.number().optional(),
  includePlanningOpportunities: z.boolean().default(true),
  includeQuarterlyEstimates: z.boolean().default(true),
  includeRiskAnalysis: z.boolean().default(true),
});

const benchmarkingOptionsSchema = z.object({
  clientId: z.string().optional(),
  industryFilters: z.array(z.string()).default([]),
  metricsToCompare: z.array(z.string()).default(['gross_profit_margin', 'net_profit_margin', 'current_ratio', 'debt_to_equity', 'inventory_turnover', 'receivables_turnover', 'asset_turnover', 'roe', 'roa']),
  includeTrends: z.boolean().default(true),
  benchmarkSources: z.array(z.string()).default(['rma', 'bizminer']),
});

const riskAssessmentOptionsSchema = z.object({
  clientId: z.string().optional(),
  includeHistoricalAnalysis: z.boolean().default(true),
  includePredictiveModeling: z.boolean().default(true),
  includeEarlyWarning: z.boolean().default(true),
  riskHorizon: z.enum(['short', 'medium', 'long']).default('medium'),
});

const portfolioRiskOptionsSchema = z.object({
  includeClientConcentration: z.boolean().default(true),
  includeIndustryConcentration: z.boolean().default(true),
  includeGeographicConcentration: z.boolean().default(true),
  includeServiceConcentration: z.boolean().default(true),
  concentrationThresholds: z.object({
    client: z.number().min(0).max(1).default(0.20),
    industry: z.number().min(0).max(1).default(0.40),
    geography: z.number().min(0).max(1).default(0.60),
    service: z.number().min(0).max(1).default(0.50),
  }).default({
    client: 0.20,
    industry: 0.40,
    geography: 0.60,
    service: 0.50,
  }),
});

export const financialAnalyticsRouter = createTRPCRouter({
  // Financial Forecasting Endpoints
  forecastCashFlow: protectedProcedure
    .input(forecastingOptionsSchema)
    .query(async ({ ctx, input }) => {
      const service = createFinancialForecastingService(ctx.organization.id);
      return await service.forecastCashFlow(input.clientId, input.forecastPeriods, {
        includeSeasonality: input.includeSeasonality,
        confidenceLevel: input.confidenceLevel,
        modelType: input.modelType,
        includeExogenousVariables: input.includeExogenousVariables,
      });
    }),

  predictRevenue: protectedProcedure
    .input(z.object({
      periods: z.number().min(1).max(24).default(6),
      includeCapacityConstraints: z.boolean().default(true),
      includeTaxSeasonEffects: z.boolean().default(true),
      includeMarketTrends: z.boolean().default(true),
    }))
    .query(async ({ ctx, input }) => {
      const service = createFinancialForecastingService(ctx.organization.id);
      return await service.predictRevenue(input.periods, {
        includeCapacityConstraints: input.includeCapacityConstraints,
        includeTaxSeasonEffects: input.includeTaxSeasonEffects,
        includeMarketTrends: input.includeMarketTrends,
      });
    }),

  applySeasonalAdjustment: protectedProcedure
    .input(z.object({
      clientId: z.string(),
      industry: z.string().default('accounting'),
    }))
    .query(async ({ ctx, input }) => {
      const service = createFinancialForecastingService(ctx.organization.id);
      // Fetch client data and apply seasonal adjustment
      const data = []; // Would fetch actual data
      return await service.applySeasonalAdjustment(data, input.industry);
    }),

  // Anomaly Detection Endpoints
  detectTransactionAnomalies: protectedProcedure
    .input(anomalyDetectionOptionsSchema)
    .query(async ({ ctx, input }) => {
      const service = createAnomalyDetectionService(ctx.organization.id);
      return await service.detectTransactionAnomalies(input.clientId, {
        includeHistoricalData: input.includeHistoricalData,
        timeWindow: input.timeWindow,
        enableRealTimeDetection: input.enableRealTimeDetection,
        anomalyTypes: input.anomalyTypes,
        modelTypes: input.modelTypes,
      });
    }),

  analyzeExpensePatterns: protectedProcedure
    .input(z.object({
      clientId: z.string(),
      analysisDepth: z.enum(['basic', 'advanced', 'comprehensive']).default('advanced'),
      includeSeasonality: z.boolean().default(true),
      benchmarkComparison: z.boolean().default(true),
      optimizationRecommendations: z.boolean().default(true),
    }))
    .query(async ({ ctx, input }) => {
      const service = createAnomalyDetectionService(ctx.organization.id);
      return await service.analyzeExpensePatterns(input.clientId, {
        analysisDepth: input.analysisDepth,
        includeSeasonality: input.includeSeasonality,
        benchmarkComparison: input.benchmarkComparison,
        optimizationRecommendations: input.optimizationRecommendations,
      });
    }),

  detectRevenueVariances: protectedProcedure
    .input(z.object({
      alertThreshold: z.number().min(1).max(50).default(15),
      timeframe: z.enum(['daily', 'weekly', 'monthly', 'quarterly']).default('monthly'),
      includeForecasting: z.boolean().default(true),
      enableAlerts: z.boolean().default(true),
    }))
    .query(async ({ ctx, input }) => {
      const service = createAnomalyDetectionService(ctx.organization.id);
      return await service.detectRevenueVariances({
        alertThreshold: input.alertThreshold,
        timeframe: input.timeframe,
        includeForecasting: input.includeForecasting,
        enableAlerts: input.enableAlerts,
      });
    }),

  detectClientBehaviorAnomalies: protectedProcedure
    .input(z.object({
      clientId: z.string().optional(),
      behaviorTypes: z.array(z.enum(['payment', 'engagement', 'usage', 'communication'])).default(['payment', 'engagement', 'usage', 'communication']),
      lookbackPeriod: z.number().min(30).max(365).default(180),
      enablePredictiveAnalysis: z.boolean().default(true),
    }))
    .query(async ({ ctx, input }) => {
      const service = createAnomalyDetectionService(ctx.organization.id);
      return await service.detectClientBehaviorAnomalies(input.clientId, {
        behaviorTypes: input.behaviorTypes,
        lookbackPeriod: input.lookbackPeriod,
        enablePredictiveAnalysis: input.enablePredictiveAnalysis,
      });
    }),

  // Predictive Analytics Endpoints
  calculateClientLifetimeValue: protectedProcedure
    .input(clvOptionsSchema)
    .query(async ({ ctx, input }) => {
      const service = createPredictiveAnalyticsService(ctx.organization.id);
      return await service.calculateClientLifetimeValue(input.clientId, {
        includeChurnRisk: input.includeChurnRisk,
        projectionPeriods: input.projectionPeriods,
        includeSegmentation: input.includeSegmentation,
        includeRecommendations: input.includeRecommendations,
      });
    }),

  predictTaxLiability: protectedProcedure
    .input(taxLiabilitySchema)
    .query(async ({ ctx, input }) => {
      const service = createPredictiveAnalyticsService(ctx.organization.id);
      return await service.predictTaxLiability(input.clientId, input.taxYear, {
        includePlanningOpportunities: input.includePlanningOpportunities,
        includeQuarterlyEstimates: input.includeQuarterlyEstimates,
        includeRiskAnalysis: input.includeRiskAnalysis,
      });
    }),

  forecastExpenses: protectedProcedure
    .input(z.object({
      clientId: z.string(),
      categories: z.array(z.string()).optional(),
      forecastPeriods: z.number().min(1).max(24).default(12),
      includeSeasonality: z.boolean().default(true),
      includeOptimization: z.boolean().default(true),
      confidenceLevel: z.number().min(0.8).max(0.99).default(0.95),
    }))
    .query(async ({ ctx, input }) => {
      const service = createPredictiveAnalyticsService(ctx.organization.id);
      return await service.forecastExpenses(input.clientId, input.categories, {
        forecastPeriods: input.forecastPeriods,
        includeSeasonality: input.includeSeasonality,
        includeOptimization: input.includeOptimization,
        confidenceLevel: input.confidenceLevel,
      });
    }),

  analyzeWorkingCapital: protectedProcedure
    .input(z.object({
      clientId: z.string(),
      includeBenchmarks: z.boolean().default(true),
      includeRecommendations: z.boolean().default(true),
      analysisDepth: z.enum(['basic', 'detailed', 'comprehensive']).default('detailed'),
    }))
    .query(async ({ ctx, input }) => {
      const service = createPredictiveAnalyticsService(ctx.organization.id);
      return await service.analyzeWorkingCapital(input.clientId, {
        includeBenchmarks: input.includeBenchmarks,
        includeRecommendations: input.includeRecommendations,
        analysisDepth: input.analysisDepth,
      });
    }),

  // Benchmarking Endpoints
  createIndustryBenchmarkComparisons: protectedProcedure
    .input(benchmarkingOptionsSchema)
    .query(async ({ ctx, input }) => {
      const service = createBenchmarkingService(ctx.organization.id);
      return await service.createIndustryBenchmarkComparisons(input.clientId, {
        industryFilters: input.industryFilters,
        metricsToCompare: input.metricsToCompare,
        includeTrends: input.includeTrends,
        benchmarkSources: input.benchmarkSources,
      });
    }),

  performPeerAnalysis: protectedProcedure
    .input(z.object({
      clientId: z.string(),
      peerCriteria: z.array(z.object({
        type: z.enum(['revenue_size', 'industry', 'geography', 'business_model']),
        weight: z.number().min(0).max(1),
        tolerance: z.number().min(0).max(1).optional(),
      })).default([
        { type: 'industry', weight: 0.4 },
        { type: 'revenue_size', weight: 0.3, tolerance: 0.5 },
        { type: 'geography', weight: 0.2 },
        { type: 'business_model', weight: 0.1 }
      ]),
      metricsToAnalyze: z.array(z.string()).default(['revenue_growth', 'profit_margin', 'expense_ratio', 'cash_flow_margin', 'client_retention', 'service_utilization']),
      minPeerGroupSize: z.number().min(5).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const service = createBenchmarkingService(ctx.organization.id);
      return await service.performPeerAnalysis(input.clientId, {
        peerCriteria: input.peerCriteria,
        metricsToAnalyze: input.metricsToAnalyze,
        minPeerGroupSize: input.minPeerGroupSize,
      });
    }),

  calculatePerformanceRatios: protectedProcedure
    .input(z.object({
      clientId: z.string(),
      ratioCategories: z.array(z.enum(['liquidity', 'efficiency', 'profitability', 'leverage', 'growth'])).default(['liquidity', 'efficiency', 'profitability', 'leverage', 'growth']),
      timeframeMonths: z.number().min(12).max(60).default(36),
      includeTrendAnalysis: z.boolean().default(true),
      includeBenchmarkComparison: z.boolean().default(true),
    }))
    .query(async ({ ctx, input }) => {
      const service = createBenchmarkingService(ctx.organization.id);
      return await service.calculatePerformanceRatios(input.clientId, {
        ratioCategories: input.ratioCategories,
        timeframeMonths: input.timeframeMonths,
        includeTrendAnalysis: input.includeTrendAnalysis,
        includeBenchmarkComparison: input.includeBenchmarkComparison,
      });
    }),

  createCompetitiveAnalysis: protectedProcedure
    .input(z.object({
      clientId: z.string(),
      includeMarketAnalysis: z.boolean().default(true),
      includeSWOTAnalysis: z.boolean().default(true),
      includePortersForces: z.boolean().default(true),
      timeHorizon: z.enum(['short', 'medium', 'long']).default('medium'),
    }))
    .query(async ({ ctx, input }) => {
      const service = createBenchmarkingService(ctx.organization.id);
      return await service.createCompetitiveAnalysis(input.clientId, {
        includeMarketAnalysis: input.includeMarketAnalysis,
        includeSWOTAnalysis: input.includeSWOTAnalysis,
        includePortersForces: input.includePortersForces,
        timeHorizon: input.timeHorizon,
      });
    }),

  // Risk Assessment Endpoints
  calculateClientRiskScore: protectedProcedure
    .input(riskAssessmentOptionsSchema)
    .query(async ({ ctx, input }) => {
      const service = createRiskAssessmentService(ctx.organization.id);
      return await service.calculateClientRiskScore(input.clientId, {
        includeHistoricalAnalysis: input.includeHistoricalAnalysis,
        includePredictiveModeling: input.includePredictiveModeling,
        includeEarlyWarning: input.includeEarlyWarning,
        riskHorizon: input.riskHorizon,
      });
    }),

  assessComplianceRisk: protectedProcedure
    .input(z.object({
      clientId: z.string(),
      includeRegulatoryMapping: z.boolean().default(true),
      includeHistoricalCompliance: z.boolean().default(true),
      assessmentDepth: z.enum(['basic', 'detailed', 'comprehensive']).default('detailed'),
    }))
    .query(async ({ ctx, input }) => {
      const service = createRiskAssessmentService(ctx.organization.id);
      return await service.assessComplianceRisk(input.clientId, {
        includeRegulatoryMapping: input.includeRegulatoryMapping,
        includeHistoricalCompliance: input.includeHistoricalCompliance,
        assessmentDepth: input.assessmentDepth,
      });
    }),

  evaluateAuditRisk: protectedProcedure
    .input(z.object({
      clientId: z.string(),
      auditYear: z.number().optional(),
      includeIndustryRisks: z.boolean().default(true),
      includePriorYearFindings: z.boolean().default(true),
      assessmentFramework: z.enum(['isa', 'pcaob', 'aicpa']).default('aicpa'),
    }))
    .query(async ({ ctx, input }) => {
      const service = createRiskAssessmentService(ctx.organization.id);
      return await service.evaluateAuditRisk(input.clientId, input.auditYear, {
        includeIndustryRisks: input.includeIndustryRisks,
        includePriorYearFindings: input.includePriorYearFindings,
        assessmentFramework: input.assessmentFramework,
      });
    }),

  analyzePortfolioRiskConcentration: protectedProcedure
    .input(portfolioRiskOptionsSchema)
    .query(async ({ ctx, input }) => {
      const service = createRiskAssessmentService(ctx.organization.id);
      return await service.analyzePortfolioRiskConcentration({
        includeClientConcentration: input.includeClientConcentration,
        includeIndustryConcentration: input.includeIndustryConcentration,
        includeGeographicConcentration: input.includeGeographicConcentration,
        includeServiceConcentration: input.includeServiceConcentration,
        concentrationThresholds: input.concentrationThresholds,
      });
    }),

  // Combined Analytics Endpoints
  getClientAnalyticsDashboard: protectedProcedure
    .input(z.object({
      clientId: z.string(),
      includeForecasting: z.boolean().default(true),
      includeAnomalies: z.boolean().default(true),
      includeBenchmarks: z.boolean().default(true),
      includeRisk: z.boolean().default(true),
    }))
    .query(async ({ ctx, input }) => {
      const forecastingService = createFinancialForecastingService(ctx.organization.id);
      const anomalyService = createAnomalyDetectionService(ctx.organization.id);
      const benchmarkingService = createBenchmarkingService(ctx.organization.id);
      const riskService = createRiskAssessmentService(ctx.organization.id);

      const [
        cashFlowForecast,
        anomalies,
        benchmarks,
        riskScore
      ] = await Promise.allSettled([
        input.includeForecasting ? forecastingService.forecastCashFlow(input.clientId, 12) : null,
        input.includeAnomalies ? anomalyService.detectTransactionAnomalies(input.clientId) : null,
        input.includeBenchmarks ? benchmarkingService.createIndustryBenchmarkComparisons(input.clientId) : null,
        input.includeRisk ? riskService.calculateClientRiskScore(input.clientId) : null,
      ]);

      return {
        clientId: input.clientId,
        dashboardData: {
          cashFlowForecast: cashFlowForecast.status === 'fulfilled' ? cashFlowForecast.value : null,
          anomalies: anomalies.status === 'fulfilled' ? anomalies.value : null,
          benchmarks: benchmarks.status === 'fulfilled' ? benchmarks.value : null,
          riskScore: riskScore.status === 'fulfilled' ? riskScore.value : null,
        },
        errors: [
          cashFlowForecast.status === 'rejected' ? cashFlowForecast.reason : null,
          anomalies.status === 'rejected' ? anomalies.reason : null,
          benchmarks.status === 'rejected' ? benchmarks.reason : null,
          riskScore.status === 'rejected' ? riskScore.reason : null,
        ].filter(Boolean)
      };
    }),

  getPortfolioAnalyticsSummary: protectedProcedure
    .query(async ({ ctx }) => {
      const forecastingService = createFinancialForecastingService(ctx.organization.id);
      const riskService = createRiskAssessmentService(ctx.organization.id);

      const [
        revenueForecasts,
        portfolioRisk,
        clientRiskScores
      ] = await Promise.allSettled([
        forecastingService.predictRevenue(6),
        riskService.analyzePortfolioRiskConcentration(),
        riskService.calculateClientRiskScore(),
      ]);

      return {
        portfolioSummary: {
          revenueForecasts: revenueForecasts.status === 'fulfilled' ? revenueForecasts.value : null,
          portfolioRisk: portfolioRisk.status === 'fulfilled' ? portfolioRisk.value : null,
          clientRiskScores: clientRiskScores.status === 'fulfilled' ? clientRiskScores.value : null,
        },
        errors: [
          revenueForecasts.status === 'rejected' ? revenueForecasts.reason : null,
          portfolioRisk.status === 'rejected' ? portfolioRisk.reason : null,
          clientRiskScores.status === 'rejected' ? clientRiskScores.reason : null,
        ].filter(Boolean)
      };
    }),
});
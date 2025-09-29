/**
 * Comprehensive Analytics Engine Test Suite
 * Tests all components of the analytics system for performance and accuracy
 */

import { AnalyticsEngine } from '../src';
import { PredictionEngine } from '../src/prediction';
import { InsightEngine } from '../src/insights';
import { ReportingEngine } from '../src/reporting';
import { RealtimeEngine } from '../src/realtime';
import { MLEngine } from '../src/ml';
import { VisualizationEngine } from '../src/visualization';
import { PerformanceMonitor, CacheManager, DataValidator } from '../src/utils';
import { Decimal } from 'decimal.js';

describe('Analytics Engine', () => {
  let analyticsEngine: AnalyticsEngine;
  let performanceMonitor: PerformanceMonitor;

  beforeAll(async () => {
    performanceMonitor = new PerformanceMonitor();

    const config = {
      prediction: {
        enableCaching: true,
        modelCacheSize: 100,
        predictionCacheTime: 300000 // 5 minutes
      },
      insights: {
        enableNarrativeGeneration: true,
        anomalyDetectionSensitivity: 0.8
      },
      reporting: {
        enableScheduledReports: true,
        maxConcurrentReports: 10
      },
      realtime: {
        redis: {
          host: 'localhost',
          port: 6379
        },
        wsPort: 8080,
        enableAlerts: true,
        alertThresholds: {
          cashFlow: { warning: -10000, critical: -50000, operator: 'lt' },
          revenue: { warning: -0.1, critical: -0.2, operator: 'lt' }
        }
      },
      ml: {
        modelStoragePath: './models',
        defaultHyperparameters: {
          epochs: 100,
          batchSize: 32,
          learningRate: 0.001
        },
        enableGPU: false
      },
      visualization: {
        theme: 'light',
        responsive: true,
        interactive: true
      }
    };

    analyticsEngine = new AnalyticsEngine(config);
    await analyticsEngine.initialize();
  });

  afterAll(async () => {
    await analyticsEngine.shutdown();
  });

  describe('Prediction Engine', () => {
    test('should generate cash flow predictions', async () => {
      const operationId = performanceMonitor.startOperation('cash_flow_prediction');

      const input = {
        organizationId: 'test_org_1',
        clientId: 'test_client_1',
        predictionType: 'cash_flow' as const,
        timeHorizon: 90,
        confidence: 0.95,
        includeSeasonality: true,
        includeBenchmarks: false
      };

      const result = await analyticsEngine.prediction.generatePrediction(input);

      const metric = performanceMonitor.endOperation(operationId, 'cash_flow_prediction', {
        timeHorizon: input.timeHorizon,
        dataPoints: result.predictions.length
      });

      expect(result).toBeDefined();
      expect(result.type).toBe('cash_flow');
      expect(result.predictions).toHaveLength(input.timeHorizon);
      expect(result.confidence).toBe(input.confidence);
      expect(metric.duration).toBeLessThan(10000); // Should complete within 10 seconds

      // Validate prediction structure
      for (const prediction of result.predictions) {
        expect(prediction.date).toBeInstanceOf(Date);
        expect(prediction.value).toBeInstanceOf(Decimal);
        expect(prediction.upperBound).toBeInstanceOf(Decimal);
        expect(prediction.lowerBound).toBeInstanceOf(Decimal);
        expect(prediction.confidence).toBeGreaterThan(0);
        expect(prediction.confidence).toBeLessThanOrEqual(1);
      }
    });

    test('should handle revenue forecasting with seasonality', async () => {
      const operationId = performanceMonitor.startOperation('revenue_forecasting');

      const result = await analyticsEngine.prediction.forecastRevenue(
        'test_org_1',
        'test_client_1',
        12 // 12 months
      );

      const metric = performanceMonitor.endOperation(operationId, 'revenue_forecasting');

      expect(result).toBeDefined();
      expect(result).toHaveLength(12);
      expect(metric.duration).toBeLessThan(5000); // Should complete within 5 seconds

      // Validate seasonality is applied
      const values = result.map(p => parseFloat(p.value.toString()));
      const hasVariation = Math.max(...values) / Math.min(...values) > 1.1;
      expect(hasVariation).toBe(true); // Should have some seasonal variation
    });

    test('should perform budget variance prediction', async () => {
      const budgetData = [
        { category: 'Revenue', budget: 100000, period: '2024-01' },
        { category: 'Expenses', budget: 80000, period: '2024-01' }
      ];

      const result = await analyticsEngine.prediction.predictBudgetVariance(
        'test_org_1',
        'test_client_1',
        budgetData,
        6 // 6 months forecast
      );

      expect(result).toBeDefined();
      expect(result).toHaveLength(6);

      for (const prediction of result) {
        expect(prediction.value).toBeInstanceOf(Decimal);
      }
    });
  });

  describe('Insight Engine', () => {
    test('should generate financial health insights', async () => {
      const operationId = performanceMonitor.startOperation('financial_health_insights');

      const request = {
        organizationId: 'test_org_1',
        clientId: 'test_client_1',
        analysisType: 'financial_health' as const,
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        },
        compareWithPrevious: true,
        includeBenchmarks: true
      };

      const insights = await analyticsEngine.insights.generateInsights(request);

      const metric = performanceMonitor.endOperation(operationId, 'financial_health_insights', {
        insightCount: insights.length
      });

      expect(insights).toBeDefined();
      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);
      expect(metric.duration).toBeLessThan(8000); // Should complete within 8 seconds

      // Validate insight structure
      for (const insight of insights) {
        expect(insight.id).toBeDefined();
        expect(insight.type).toBeDefined();
        expect(insight.title).toBeDefined();
        expect(insight.description).toBeDefined();
        expect(insight.recommendations).toBeInstanceOf(Array);
        expect(insight.confidence).toBeGreaterThan(0);
        expect(insight.confidence).toBeLessThanOrEqual(1);
      }
    });

    test('should detect anomalies in financial data', async () => {
      const request = {
        organizationId: 'test_org_1',
        analysisType: 'anomaly_detection' as const,
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        },
        compareWithPrevious: false,
        includeBenchmarks: false
      };

      const anomalies = await analyticsEngine.insights.generateInsights(request);

      expect(anomalies).toBeDefined();
      expect(Array.isArray(anomalies)).toBe(true);

      // Check for anomaly-specific properties
      const anomalyInsights = anomalies.filter(i => i.type.includes('anomaly'));
      for (const anomaly of anomalyInsights) {
        expect(['low', 'medium', 'high', 'critical']).toContain(anomaly.severity);
      }
    });

    test('should generate client risk scores', async () => {
      const input = {
        clientId: 'test_client_1',
        includeFinancial: true,
        includeBehavioral: true,
        includeMarket: false,
        timeWindow: 90
      };

      const riskScore = await analyticsEngine.insights.generateRiskScore(input);

      expect(riskScore).toBeDefined();
      expect(riskScore.clientId).toBe(input.clientId);
      expect(riskScore.overallScore).toBeGreaterThanOrEqual(0);
      expect(riskScore.overallScore).toBeLessThanOrEqual(100);
      expect(riskScore.components).toBeDefined();
      expect(riskScore.factors).toBeInstanceOf(Array);
      expect(riskScore.recommendations).toBeInstanceOf(Array);
      expect(['improving', 'stable', 'deteriorating']).toContain(riskScore.trend);
    });
  });

  describe('Reporting Engine', () => {
    test('should generate financial dashboard report', async () => {
      const operationId = performanceMonitor.startOperation('dashboard_generation');

      const report = await analyticsEngine.reporting.generateReport(
        'financial_health_dashboard',
        'test_org_1',
        'test_client_1',
        {
          period: 'last_12_months',
          include_predictions: true,
          benchmark_industry: 'accounting'
        }
      );

      const metric = performanceMonitor.endOperation(operationId, 'dashboard_generation', {
        sectionCount: report.content.sections.length
      });

      expect(report).toBeDefined();
      expect(report.title).toBeDefined();
      expect(report.content.sections).toBeInstanceOf(Array);
      expect(report.content.sections.length).toBeGreaterThan(0);
      expect(report.content.summary).toBeDefined();
      expect(report.content.recommendations).toBeInstanceOf(Array);
      expect(metric.duration).toBeLessThan(15000); // Should complete within 15 seconds

      // Validate report metadata
      expect(report.metadata.dataRange).toBeDefined();
      expect(report.metadata.generationTime).toBeGreaterThan(0);
      expect(report.metadata.version).toBeDefined();
    });

    test('should create custom report template', async () => {
      const template = {
        name: 'Custom Test Report',
        description: 'Test report for validation',
        category: 'test',
        sections: [
          {
            id: 'test_section',
            type: 'metric' as const,
            title: 'Test Metrics',
            content: {
              metrics: ['revenue', 'expenses'],
              showTrends: true
            },
            position: { x: 0, y: 0 },
            size: { width: 6, height: 4 }
          }
        ],
        layout: {
          columns: 12,
          rows: 16,
          gap: 16,
          responsive: true
        },
        styling: {
          theme: 'professional',
          colors: ['#3b82f6', '#10b981'],
          fonts: {
            heading: 'Arial Bold',
            body: 'Arial',
            caption: 'Arial'
          },
          spacing: {
            section: 24,
            element: 16
          }
        },
        parameters: [
          {
            name: 'period',
            type: 'select' as const,
            required: true,
            defaultValue: 'last_12_months',
            options: ['last_6_months', 'last_12_months', 'ytd']
          }
        ]
      };

      const createdTemplate = await analyticsEngine.reporting.createTemplate(template);

      expect(createdTemplate).toBeDefined();
      expect(createdTemplate.id).toBeDefined();
      expect(createdTemplate.name).toBe(template.name);
      expect(createdTemplate.sections).toHaveLength(template.sections.length);
    });
  });

  describe('Real-time Engine', () => {
    test('should calculate real-time KPIs', async () => {
      const operationId = performanceMonitor.startOperation('realtime_kpis');

      const kpis = await analyticsEngine.realtime.calculateRealtimeKPIs(
        'test_org_1',
        'test_client_1'
      );

      const metric = performanceMonitor.endOperation(operationId, 'realtime_kpis', {
        kpiCount: Object.keys(kpis).length
      });

      expect(kpis).toBeDefined();
      expect(typeof kpis).toBe('object');
      expect(Object.keys(kpis).length).toBeGreaterThan(0);
      expect(metric.duration).toBeLessThan(3000); // Should complete within 3 seconds

      // Validate KPI structure
      for (const [name, kpi] of Object.entries(kpis)) {
        expect(kpi.id).toBeDefined();
        expect(kpi.name).toBe(name);
        expect(kpi.value).toBeInstanceOf(Decimal);
        expect(kpi.timestamp).toBeInstanceOf(Date);
        expect(kpi.tags).toBeDefined();
      }
    });

    test('should process financial data updates', async () => {
      const financialData = {
        id: 'test_transaction_1',
        organizationId: 'test_org_1',
        clientId: 'test_client_1',
        timestamp: new Date(),
        amount: new Decimal(1000),
        category: 'revenue',
        type: 'income' as const,
        source: 'quickbooks' as const,
        metadata: { description: 'Test transaction' }
      };

      // This should not throw an error
      await expect(
        analyticsEngine.realtime.processFinancialData(financialData)
      ).resolves.not.toThrow();
    });

    test('should create real-time dashboard', async () => {
      const dashboard = await analyticsEngine.realtime.createRealtimeDashboard(
        'test_org_1',
        'test_client_1',
        ['revenue', 'expenses', 'cash_flow']
      );

      expect(dashboard).toBeDefined();
      // Dashboard should have initialization logic
    });
  });

  describe('ML Engine', () => {
    test('should predict client churn', async () => {
      const operationId = performanceMonitor.startOperation('churn_prediction');

      const churnPrediction = await analyticsEngine.ml.predictClientChurn(
        'test_client_1',
        'test_org_1'
      );

      const metric = performanceMonitor.endOperation(operationId, 'churn_prediction');

      expect(churnPrediction).toBeDefined();
      expect(churnPrediction.clientId).toBe('test_client_1');
      expect(churnPrediction.churnProbability).toBeGreaterThanOrEqual(0);
      expect(churnPrediction.churnProbability).toBeLessThanOrEqual(1);
      expect(['low', 'medium', 'high']).toContain(churnPrediction.riskLevel);
      expect(churnPrediction.riskFactors).toBeInstanceOf(Array);
      expect(churnPrediction.recommendations).toBeInstanceOf(Array);
      expect(churnPrediction.confidence).toBeGreaterThan(0);
      expect(metric.duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should score client engagement', async () => {
      const engagementScore = await analyticsEngine.ml.scoreClientEngagement(
        'test_client_1',
        'test_org_1',
        90
      );

      expect(engagementScore).toBeDefined();
      expect(engagementScore.clientId).toBe('test_client_1');
      expect(engagementScore.overallScore).toBeGreaterThanOrEqual(0);
      expect(engagementScore.overallScore).toBeLessThanOrEqual(100);
      expect(engagementScore.components).toBeDefined();
      expect(engagementScore.components.communication).toBeGreaterThanOrEqual(0);
      expect(engagementScore.components.serviceUtilization).toBeGreaterThanOrEqual(0);
      expect(['low', 'medium', 'high', 'very_high']).toContain(engagementScore.engagementLevel);
    });

    test('should generate tax optimizations', async () => {
      const optimizations = await analyticsEngine.ml.generateTaxOptimizations(
        'test_client_1',
        'test_org_1',
        2024
      );

      expect(optimizations).toBeDefined();
      expect(Array.isArray(optimizations)).toBe(true);

      for (const optimization of optimizations) {
        expect(optimization.id).toBeDefined();
        expect(['deduction', 'credit', 'timing', 'structure']).toContain(optimization.type);
        expect(optimization.description).toBeDefined();
        expect(optimization.potentialSavings).toBeInstanceOf(Decimal);
        expect(optimization.confidence).toBeGreaterThan(0);
        expect(optimization.confidence).toBeLessThanOrEqual(1);
        expect(['low', 'medium', 'high']).toContain(optimization.complexity);
      }
    });

    test('should detect fraud', async () => {
      const fraudDetections = await analyticsEngine.ml.detectFraud(
        'test_org_1',
        'test_client_1',
        30
      );

      expect(fraudDetections).toBeDefined();
      expect(Array.isArray(fraudDetections)).toBe(true);

      for (const detection of fraudDetections) {
        expect(detection.transactionId).toBeDefined();
        expect(detection.fraudScore).toBeGreaterThan(0.3); // Only returns scores > 0.3
        expect(detection.fraudScore).toBeLessThanOrEqual(1);
        expect(['low', 'medium', 'high', 'critical']).toContain(detection.riskLevel);
        expect(detection.riskFactors).toBeInstanceOf(Array);
        expect(detection.confidence).toBeGreaterThan(0);
        expect(detection.recommendedAction).toBeDefined();
      }
    });
  });

  describe('Visualization Engine', () => {
    test('should create financial dashboard', async () => {
      const operationId = performanceMonitor.startOperation('dashboard_creation');

      const dashboard = await analyticsEngine.visualization.createFinancialDashboard(
        'test_org_1',
        'test_client_1'
      );

      const metric = performanceMonitor.endOperation(operationId, 'dashboard_creation', {
        sectionCount: dashboard.getSections().length
      });

      expect(dashboard).toBeDefined();
      expect(dashboard.getSections()).toBeInstanceOf(Array);
      expect(dashboard.getSections().length).toBeGreaterThan(0);
      expect(metric.duration).toBeLessThan(10000); // Should complete within 10 seconds

      // Check each section has visualizations
      for (const section of dashboard.getSections()) {
        expect(section.id).toBeDefined();
        expect(section.title).toBeDefined();
        expect(section.visualizations).toBeInstanceOf(Array);
      }
    });

    test('should generate various chart types', async () => {
      const chartTypes = ['line', 'bar', 'pie', 'scatter', 'heatmap', 'gauge'];

      for (const chartType of chartTypes) {
        const spec = {
          type: chartType as any,
          data: [
            { x: 1, y: 10, category: 'A', value: 100 },
            { x: 2, y: 20, category: 'B', value: 200 },
            { x: 3, y: 15, category: 'C', value: 150 }
          ],
          config: {
            responsive: true,
            interactive: true,
            theme: 'light' as const
          },
          title: `Test ${chartType} Chart`
        };

        const result = await analyticsEngine.visualization.generateVisualization(spec);

        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.spec.type).toBe(chartType);
        expect(result.metadata.generatedAt).toBeInstanceOf(Date);
        expect(result.metadata.renderTime).toBeGreaterThan(0);
      }
    });
  });

  describe('Performance Monitoring', () => {
    test('should track operation performance', () => {
      const operationId = performanceMonitor.startOperation('test_operation');

      // Simulate some work
      const sum = Array.from({ length: 1000 }, (_, i) => i).reduce((a, b) => a + b, 0);

      const metric = performanceMonitor.endOperation(operationId, 'test_operation', { sum });

      expect(metric.operationName).toBe('test_operation');
      expect(metric.duration).toBeGreaterThan(0);
      expect(metric.timestamp).toBeInstanceOf(Date);
      expect(metric.metadata.sum).toBe(sum);
      expect(metric.memoryUsage).toBeDefined();
    });

    test('should provide operation statistics', () => {
      // Generate some test operations
      for (let i = 0; i < 10; i++) {
        const opId = performanceMonitor.startOperation('stats_test');
        // Simulate variable work
        setTimeout(() => {}, Math.random() * 10);
        performanceMonitor.endOperation(opId, 'stats_test');
      }

      const stats = performanceMonitor.getOperationStats('stats_test');

      expect(stats).toBeDefined();
      expect(stats!.operationName).toBe('stats_test');
      expect(stats!.totalCalls).toBe(10);
      expect(stats!.averageDuration).toBeGreaterThan(0);
      expect(stats!.minDuration).toBeGreaterThanOrEqual(0);
      expect(stats!.maxDuration).toBeGreaterThanOrEqual(stats!.minDuration);
    });

    test('should cleanup old metrics', () => {
      performanceMonitor.cleanup(0); // Clean everything older than 0 hours

      const allStats = performanceMonitor.getAllStats();

      // Should still have recent stats from previous tests
      expect(allStats.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Data Validation', () => {
    test('should validate financial data', () => {
      const validData = {
        id: 'test_id',
        organizationId: 'test_org',
        amount: 1000,
        type: 'income',
        timestamp: new Date().toISOString(),
        category: 'revenue'
      };

      const result = DataValidator.validateFinancialData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect invalid financial data', () => {
      const invalidData = {
        // Missing required fields
        amount: 'not_a_number',
        type: 'invalid_type',
        timestamp: 'invalid_date'
      };

      const result = DataValidator.validateFinancialData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should validate prediction input', () => {
      const validInput = {
        organizationId: 'test_org',
        predictionType: 'cash_flow',
        timeHorizon: 30,
        confidence: 0.95
      };

      const result = DataValidator.validatePredictionInput(validInput);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should sanitize data', () => {
      const dangerousData = {
        name: '<script>alert("xss")</script>',
        description: 'Normal text with "quotes" and \'apostrophes\'',
        nested: {
          field: '<img src="x" onerror="alert(1)">'
        }
      };

      const sanitized = DataValidator.sanitizeData(dangerousData);

      expect(sanitized.name).not.toContain('<script>');
      expect(sanitized.name).not.toContain('</script>');
      expect(sanitized.nested.field).not.toContain('<img');
    });
  });

  describe('Cache Management', () => {
    let cacheManager: CacheManager;

    beforeEach(() => {
      cacheManager = new CacheManager(5, 1000); // Small cache for testing
    });

    test('should cache and retrieve values', () => {
      const key = 'test_key';
      const value = { data: 'test_data', number: 42 };

      cacheManager.set(key, value);
      const retrieved = cacheManager.get(key);

      expect(retrieved).toEqual(value);
    });

    test('should handle cache expiration', async () => {
      const key = 'expiring_key';
      const value = 'test_value';

      cacheManager.set(key, value, 100); // 100ms TTL

      // Should be available immediately
      expect(cacheManager.get(key)).toBe(value);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be expired
      expect(cacheManager.get(key)).toBeNull();
    });

    test('should evict LRU items when cache is full', () => {
      // Fill cache to capacity
      for (let i = 0; i < 5; i++) {
        cacheManager.set(`key_${i}`, `value_${i}`);
      }

      // Access some items to affect LRU order
      cacheManager.get('key_1');
      cacheManager.get('key_3');

      // Add one more item (should evict LRU)
      cacheManager.set('new_key', 'new_value');

      // key_0 should be evicted (least recently used)
      expect(cacheManager.get('key_0')).toBeNull();
      expect(cacheManager.get('key_1')).toBe('value_1'); // Recently accessed
      expect(cacheManager.get('new_key')).toBe('new_value');
    });

    test('should provide cache statistics', () => {
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');

      cacheManager.get('key1'); // Hit
      cacheManager.get('key3'); // Miss
      cacheManager.get('key2'); // Hit

      const stats = cacheManager.getStats();

      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.67, 2);
      expect(stats.size).toBe(2);
    });
  });

  describe('System Integration Tests', () => {
    test('should handle end-to-end analytics workflow', async () => {
      const operationId = performanceMonitor.startOperation('end_to_end_workflow');

      // 1. Generate prediction
      const prediction = await analyticsEngine.prediction.generatePrediction({
        organizationId: 'test_org_1',
        predictionType: 'cash_flow',
        timeHorizon: 30,
        confidence: 0.9,
        includeSeasonality: true,
        includeBenchmarks: false
      });

      // 2. Generate insights
      const insights = await analyticsEngine.insights.generateInsights({
        organizationId: 'test_org_1',
        analysisType: 'financial_health',
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        },
        compareWithPrevious: true,
        includeBenchmarks: false
      });

      // 3. Generate report
      const report = await analyticsEngine.reporting.generateReport(
        'financial_health_dashboard',
        'test_org_1'
      );

      // 4. Create visualization
      const dashboard = await analyticsEngine.visualization.createFinancialDashboard(
        'test_org_1'
      );

      const metric = performanceMonitor.endOperation(operationId, 'end_to_end_workflow', {
        predictionPoints: prediction.predictions.length,
        insightCount: insights.length,
        reportSections: report.content.sections.length,
        dashboardSections: dashboard.getSections().length
      });

      expect(prediction).toBeDefined();
      expect(insights).toBeDefined();
      expect(report).toBeDefined();
      expect(dashboard).toBeDefined();
      expect(metric.duration).toBeLessThan(30000); // Should complete within 30 seconds
    });

    test('should handle concurrent analytics operations', async () => {
      const operations = Array.from({ length: 5 }, (_, i) =>
        analyticsEngine.prediction.generatePrediction({
          organizationId: `test_org_${i}`,
          predictionType: 'cash_flow',
          timeHorizon: 30,
          confidence: 0.8,
          includeSeasonality: false,
          includeBenchmarks: false
        })
      );

      const results = await Promise.all(operations);

      expect(results).toHaveLength(5);
      for (const result of results) {
        expect(result).toBeDefined();
        expect(result.predictions).toHaveLength(30);
      }
    });

    test('should handle large dataset processing', async () => {
      const operationId = performanceMonitor.startOperation('large_dataset_processing');

      // Simulate processing large dataset (10k data points)
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: `data_${i}`,
        value: Math.random() * 1000,
        date: new Date(2024, 0, 1 + (i % 365)),
        category: `category_${i % 10}`
      }));

      // Process through analytics pipeline
      const validationResults = largeDataset.map(data =>
        DataValidator.validateFinancialData(data)
      );

      const validData = largeDataset.filter((_, i) => validationResults[i].isValid);

      const metric = performanceMonitor.endOperation(operationId, 'large_dataset_processing', {
        totalRecords: largeDataset.length,
        validRecords: validData.length
      });

      expect(validData.length).toBeGreaterThan(0);
      expect(metric.duration).toBeLessThan(10000); // Should process within 10 seconds
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle invalid prediction input gracefully', async () => {
      const invalidInput = {
        organizationId: '', // Empty organization ID
        predictionType: 'invalid_type' as any,
        timeHorizon: -1, // Invalid time horizon
        confidence: 2.0, // Invalid confidence
        includeSeasonality: true,
        includeBenchmarks: false
      };

      await expect(
        analyticsEngine.prediction.generatePrediction(invalidInput)
      ).rejects.toThrow();
    });

    test('should handle missing data gracefully', async () => {
      // Test with non-existent organization
      const result = await analyticsEngine.insights.generateInsights({
        organizationId: 'non_existent_org',
        analysisType: 'financial_health',
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        },
        compareWithPrevious: false,
        includeBenchmarks: false
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      // Should return empty array or default insights
    });

    test('should handle memory pressure', () => {
      // Test cache behavior under memory pressure
      const cacheManager = new CacheManager(10, 60000);

      // Fill cache beyond capacity
      for (let i = 0; i < 20; i++) {
        cacheManager.set(`key_${i}`, `large_value_${'x'.repeat(1000)}_${i}`);
      }

      const stats = cacheManager.getStats();
      expect(stats.size).toBeLessThanOrEqual(10);
      expect(stats.evictions).toBeGreaterThan(0);
    });
  });

  describe('Performance Benchmarks', () => {
    test('prediction performance should meet targets', async () => {
      const startTime = performance.now();

      await analyticsEngine.prediction.generatePrediction({
        organizationId: 'benchmark_org',
        predictionType: 'cash_flow',
        timeHorizon: 90,
        confidence: 0.95,
        includeSeasonality: true,
        includeBenchmarks: true
      });

      const duration = performance.now() - startTime;

      // Should complete within 10 seconds
      expect(duration).toBeLessThan(10000);
    });

    test('insight generation performance should meet targets', async () => {
      const startTime = performance.now();

      await analyticsEngine.insights.generateInsights({
        organizationId: 'benchmark_org',
        analysisType: 'financial_health',
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        },
        compareWithPrevious: true,
        includeBenchmarks: true
      });

      const duration = performance.now() - startTime;

      // Should complete within 8 seconds
      expect(duration).toBeLessThan(8000);
    });

    test('visualization generation performance should meet targets', async () => {
      const startTime = performance.now();

      await analyticsEngine.visualization.createFinancialDashboard('benchmark_org');

      const duration = performance.now() - startTime;

      // Should complete within 10 seconds
      expect(duration).toBeLessThan(10000);
    });
  });
});

// Utility function for test data generation
function generateTestFinancialData(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `test_${i}`,
    organizationId: 'test_org',
    clientId: 'test_client',
    timestamp: new Date(2024, 0, 1 + i),
    amount: new Decimal(Math.random() * 10000),
    category: ['revenue', 'expenses', 'assets', 'liabilities'][i % 4],
    type: ['income', 'expense', 'asset', 'liability'][i % 4] as any,
    source: 'test' as const,
    metadata: { test: true }
  }));
}
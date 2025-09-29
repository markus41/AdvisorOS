/**
 * AdvisorOS Analytics Engine
 * Comprehensive predictive modeling and business intelligence system
 */

export * from './prediction';
export * from './insights';
export * from './reporting';
export * from './realtime';
export * from './ml';
export * from './visualization';
export * from './types';
export * from './utils';

import { PredictionEngine } from './prediction';
import { InsightEngine } from './insights';
import { ReportingEngine } from './reporting';
import { RealtimeEngine } from './realtime';
import { MLEngine } from './ml';
import { VisualizationEngine } from './visualization';

/**
 * Main Analytics Engine orchestrating all components
 */
export class AnalyticsEngine {
  private predictionEngine: PredictionEngine;
  private insightEngine: InsightEngine;
  private reportingEngine: ReportingEngine;
  private realtimeEngine: RealtimeEngine;
  private mlEngine: MLEngine;
  private visualizationEngine: VisualizationEngine;

  constructor(config: AnalyticsConfig) {
    this.predictionEngine = new PredictionEngine(config.prediction);
    this.insightEngine = new InsightEngine(config.insights);
    this.reportingEngine = new ReportingEngine(config.reporting);
    this.realtimeEngine = new RealtimeEngine(config.realtime);
    this.mlEngine = new MLEngine(config.ml);
    this.visualizationEngine = new VisualizationEngine(config.visualization);
  }

  async initialize(): Promise<void> {
    await Promise.all([
      this.predictionEngine.initialize(),
      this.insightEngine.initialize(),
      this.reportingEngine.initialize(),
      this.realtimeEngine.initialize(),
      this.mlEngine.initialize(),
      this.visualizationEngine.initialize()
    ]);
  }

  // Prediction Services
  get prediction() {
    return this.predictionEngine;
  }

  // Insight Generation
  get insights() {
    return this.insightEngine;
  }

  // Report Generation
  get reporting() {
    return this.reportingEngine;
  }

  // Real-time Analytics
  get realtime() {
    return this.realtimeEngine;
  }

  // Machine Learning
  get ml() {
    return this.mlEngine;
  }

  // Data Visualization
  get visualization() {
    return this.visualizationEngine;
  }

  async shutdown(): Promise<void> {
    await Promise.all([
      this.predictionEngine.shutdown(),
      this.insightEngine.shutdown(),
      this.reportingEngine.shutdown(),
      this.realtimeEngine.shutdown(),
      this.mlEngine.shutdown(),
      this.visualizationEngine.shutdown()
    ]);
  }
}

export interface AnalyticsConfig {
  prediction: any;
  insights: any;
  reporting: any;
  realtime: any;
  ml: any;
  visualization: any;
}
/**
 * Core types for AdvisorOS Analytics Engine
 */

import { Decimal } from 'decimal.js';

// Financial Data Types
export interface FinancialData {
  id: string;
  organizationId: string;
  clientId?: string;
  timestamp: Date;
  amount: Decimal;
  category: string;
  type: 'income' | 'expense' | 'asset' | 'liability' | 'equity';
  source: 'quickbooks' | 'manual' | 'imported';
  metadata: Record<string, any>;
}

export interface CashFlowData {
  date: Date;
  inflow: Decimal;
  outflow: Decimal;
  netFlow: Decimal;
  balance: Decimal;
  category?: string;
  source: string;
}

export interface SeasonalityData {
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  factor: number;
  confidence: number;
  startDate: Date;
  endDate: Date;
}

// Prediction Types
export interface PredictionInput {
  organizationId: string;
  clientId?: string;
  predictionType: 'cash_flow' | 'revenue' | 'expenses' | 'budget_variance' | 'client_risk';
  timeHorizon: number; // days
  confidence: number; // 0-1
  includeSeasonality: boolean;
  includeBenchmarks: boolean;
  scenarios?: ScenarioInput[];
}

export interface PredictionResult {
  id: string;
  type: string;
  predictions: PredictionPoint[];
  confidence: number;
  accuracy?: number;
  scenarios?: ScenarioResult[];
  seasonalFactors?: SeasonalityData[];
  benchmarkComparison?: BenchmarkComparison;
  metadata: {
    modelVersion: string;
    trainedAt: Date;
    dataRange: DateRange;
    features: string[];
  };
}

export interface PredictionPoint {
  date: Date;
  value: Decimal;
  upperBound: Decimal;
  lowerBound: Decimal;
  confidence: number;
}

export interface ScenarioInput {
  name: string;
  parameters: Record<string, number>;
  probability: number;
}

export interface ScenarioResult {
  name: string;
  predictions: PredictionPoint[];
  probability: number;
}

// Insight Types
export interface InsightRequest {
  organizationId: string;
  clientId?: string;
  analysisType: 'financial_health' | 'variance_analysis' | 'trend_analysis' | 'anomaly_detection';
  period: DateRange;
  compareWithPrevious: boolean;
  includeBenchmarks: boolean;
}

export interface GeneratedInsight {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  narrative: string;
  recommendations: string[];
  metrics: InsightMetric[];
  visualizations: VisualizationSpec[];
  confidence: number;
  createdAt: Date;
}

export interface InsightMetric {
  name: string;
  value: Decimal;
  change?: Decimal;
  changePercent?: number;
  trend: 'up' | 'down' | 'stable';
  benchmark?: Decimal;
  unit: string;
}

// Anomaly Detection Types
export interface AnomalyDetectionConfig {
  sensitivity: number; // 0-1
  methods: ('statistical' | 'ml' | 'rule_based')[];
  thresholds: Record<string, number>;
  exclusions: string[];
}

export interface DetectedAnomaly {
  id: string;
  type: 'transaction' | 'pattern' | 'benchmark_deviation';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedData: FinancialData[];
  detectionMethod: string;
  confidence: number;
  suggestedActions: string[];
  timestamp: Date;
}

// Risk Scoring Types
export interface RiskScoringInput {
  clientId: string;
  includeFinancial: boolean;
  includeBehavioral: boolean;
  includeMarket: boolean;
  timeWindow: number; // days
}

export interface RiskScore {
  clientId: string;
  overallScore: number; // 0-100
  components: {
    financial: number;
    behavioral: number;
    market: number;
  };
  factors: RiskFactor[];
  trend: 'improving' | 'stable' | 'deteriorating';
  recommendations: string[];
  lastUpdated: Date;
}

export interface RiskFactor {
  category: string;
  factor: string;
  impact: number; // -100 to 100
  confidence: number;
  description: string;
}

// Benchmarking Types
export interface BenchmarkData {
  industry: string;
  size: 'small' | 'medium' | 'large';
  region: string;
  metrics: Record<string, Decimal>;
  percentiles: Record<string, Record<number, Decimal>>;
  lastUpdated: Date;
}

export interface BenchmarkComparison {
  metric: string;
  clientValue: Decimal;
  industryAverage: Decimal;
  percentile: number;
  ranking: 'poor' | 'below_average' | 'average' | 'above_average' | 'excellent';
}

// Reporting Types
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  sections: ReportSection[];
  layout: LayoutConfig;
  styling: StylingConfig;
  parameters: ReportParameter[];
  schedule?: ScheduleConfig;
}

export interface ReportSection {
  id: string;
  type: 'text' | 'chart' | 'table' | 'metric' | 'insight';
  title: string;
  content: any;
  position: Position;
  size: Size;
  filters?: FilterConfig[];
}

export interface GeneratedReport {
  id: string;
  templateId: string;
  organizationId: string;
  clientId?: string;
  title: string;
  content: ReportContent;
  metadata: ReportMetadata;
  generatedAt: Date;
  status: 'generating' | 'completed' | 'failed';
}

export interface ReportContent {
  sections: RenderedSection[];
  summary: string;
  recommendations: string[];
  appendices?: any[];
}

export interface RenderedSection {
  id: string;
  title: string;
  content: any;
  visualizations: VisualizationResult[];
}

// Visualization Types
export interface VisualizationSpec {
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap' | 'gauge' | 'table' | 'metric_cards' | 'waterfall' | 'treemap' | 'scorecard' | 'radar' | 'funnel';
  data: any[];
  config: VisualizationConfig;
  title: string;
  description?: string;
}

export interface VisualizationConfig {
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  colors?: string[];
  theme?: 'light' | 'dark' | 'custom';
  responsive: boolean;
  interactive: boolean;
  annotations?: Annotation[];
  layout?: any;
  thresholds?: Record<string, number>;
  showPoints?: boolean;
  area?: boolean;
  valueField?: string;
  groupBy?: string;
  colorScale?: string[];
  axes?: Record<string, any>;
  positiveColor?: string;
}

export interface VisualizationResult {
  id: string;
  spec: VisualizationSpec;
  renderedData: any;
  metadata: {
    generatedAt: Date;
    dataPoints: number;
    renderTime: number;
  };
}

// Real-time Types
export interface RealtimeMetric {
  id: string;
  name: string;
  value: Decimal;
  timestamp: Date;
  tags: Record<string, string>;
  threshold?: ThresholdConfig;
}

export interface ThresholdConfig {
  warning: number;
  critical: number;
  operator: 'gt' | 'lt' | 'eq' | 'ne';
}

export interface RealtimeAlert {
  id: string;
  type: 'threshold' | 'anomaly' | 'prediction';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  affectedMetrics: string[];
  triggeredAt: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
}

// Machine Learning Types
export interface MLModelConfig {
  algorithm: 'linear_regression' | 'random_forest' | 'neural_network' | 'arima' | 'lstm';
  hyperparameters: Record<string, any>;
  features: string[];
  target: string;
  validationSplit: number;
  crossValidation: boolean;
}

export interface MLModel {
  id: string;
  name: string;
  type: string;
  config: MLModelConfig;
  performance: ModelPerformance;
  trainedAt: Date;
  version: string;
  status: 'training' | 'trained' | 'deployed' | 'deprecated';
}

export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  mse?: number;
  mae?: number;
  r2?: number;
  validationMetrics: Record<string, number>;
}

// Utility Types
export interface DateRange {
  start: Date;
  end: Date;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface LayoutConfig {
  columns: number;
  rows: number;
  gap: number;
  responsive: boolean;
}

export interface StylingConfig {
  theme: string;
  colors: string[];
  fonts: Record<string, string>;
  spacing: Record<string, number>;
}

export interface ReportParameter {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'select';
  required: boolean;
  defaultValue?: any;
  options?: any[];
}

export interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  timezone: string;
  enabled: boolean;
}

export interface FilterConfig {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in';
  value: any;
}

export interface ReportMetadata {
  dataRange: DateRange;
  generationTime: number;
  dataPoints: number;
  version: string;
  parameters: Record<string, any>;
}

export interface AxisConfig {
  label: string;
  type: 'linear' | 'logarithmic' | 'time' | 'category';
  min?: number;
  max?: number;
  format?: string;
}

export interface Annotation {
  type: 'line' | 'area' | 'point' | 'text';
  value: any;
  text?: string;
  color?: string;
  style?: Record<string, any>;
}

// Error Types
export interface AnalyticsError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

// Analytics Events
export interface AnalyticsEvent {
  type: string;
  organizationId: string;
  clientId?: string;
  data: Record<string, any>;
  timestamp: Date;
  source: string;
}
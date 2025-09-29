import { WorkflowExecution, WorkflowTemplate } from './workflow-engine';

// Comprehensive workflow performance metrics and KPI system
export interface WorkflowKPIConfig {
  kpiCategories: KPICategory[];
  benchmarks: WorkflowBenchmark[];
  alertThresholds: AlertThreshold[];
  reportingFrequency: ReportingFrequency;
  stakeholders: StakeholderGroup[];
}

export interface KPICategory {
  id: string;
  name: string;
  description: string;
  metrics: WorkflowMetric[];
  weight: number; // percentage of overall performance score
  targetAudience: string[];
}

export interface WorkflowMetric {
  id: string;
  name: string;
  description: string;
  type: 'efficiency' | 'quality' | 'cost' | 'client_satisfaction' | 'compliance' | 'resource_utilization';
  calculation: MetricCalculation;
  unit: string;
  target: number;
  benchmark: number;
  trend: 'higher_better' | 'lower_better' | 'target_optimal';
  frequency: 'real_time' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
  stakeholders: string[];
}

export interface MetricCalculation {
  formula: string;
  parameters: string[];
  aggregation: 'sum' | 'average' | 'median' | 'min' | 'max' | 'count' | 'percentage';
  timeWindow: 'current' | 'rolling_30' | 'rolling_90' | 'mtd' | 'qtd' | 'ytd';
  filters: Record<string, any>;
}

export interface WorkflowBenchmark {
  metricId: string;
  benchmarkType: 'industry' | 'firm_historical' | 'best_practice' | 'peer_comparison';
  value: number;
  source: string;
  lastUpdated: Date;
  confidence: number; // 0-100%
}

export interface AlertThreshold {
  metricId: string;
  thresholdType: 'critical' | 'warning' | 'info';
  condition: 'above' | 'below' | 'equals' | 'trend_up' | 'trend_down';
  value: number;
  actions: AlertAction[];
}

export interface AlertAction {
  type: 'email' | 'sms' | 'dashboard_highlight' | 'auto_escalation' | 'process_intervention';
  recipients: string[];
  template: string;
  frequency: 'immediate' | 'daily_digest' | 'weekly_summary';
}

export interface ReportingFrequency {
  dashboard: 'real_time' | 'hourly' | 'daily';
  management: 'daily' | 'weekly' | 'monthly';
  executive: 'monthly' | 'quarterly';
  client: 'monthly' | 'quarterly' | 'annual';
}

export interface StakeholderGroup {
  role: string;
  metrics: string[];
  reportFormat: 'dashboard' | 'email' | 'pdf' | 'api';
  frequency: string;
  alertLevel: 'critical' | 'warning' | 'all';
}

// Real-time workflow performance data
export interface WorkflowPerformanceData {
  workflowId: string;
  executionId: string;
  timestamp: Date;
  metrics: Record<string, number>;
  status: 'on_track' | 'at_risk' | 'delayed' | 'blocked' | 'completed';
  efficiency: EfficiencyMetrics;
  quality: QualityMetrics;
  costs: CostMetrics;
  resources: ResourceMetrics;
  client: ClientMetrics;
}

export interface EfficiencyMetrics {
  actualDuration: number; // hours
  estimatedDuration: number; // hours
  efficiency: number; // percentage
  bottlenecks: BottleneckInfo[];
  automationLevel: number; // percentage
  throughput: number; // workflows per day
  cycleTime: number; // hours
  leadTime: number; // hours
}

export interface QualityMetrics {
  qualityScore: number; // 1-10
  errorRate: number; // percentage
  reworkRate: number; // percentage
  reviewPasses: number;
  complianceScore: number; // percentage
  clientSatisfaction: number; // 1-10
  defectDensity: number; // defects per workflow
}

export interface CostMetrics {
  laborCost: number; // dollars
  technologyCost: number; // dollars
  overheadCost: number; // dollars
  totalCost: number; // dollars
  costPerHour: number; // dollars
  budgetVariance: number; // percentage
  roi: number; // percentage
}

export interface ResourceMetrics {
  staffUtilization: number; // percentage
  skillMatch: number; // percentage
  workloadBalance: number; // 1-10 scale
  capacityUtilization: number; // percentage
  crossTrainingLevel: number; // percentage
  burnoutRisk: number; // 1-10 scale
}

export interface ClientMetrics {
  responseTime: number; // hours
  communicationQuality: number; // 1-10
  satisfactionScore: number; // 1-10
  retentionLikelihood: number; // percentage
  referralPotential: number; // 1-10
  valuePerceived: number; // 1-10
}

export interface BottleneckInfo {
  stepId: string;
  stepName: string;
  delayHours: number;
  cause: string;
  impact: 'low' | 'medium' | 'high';
  resolution: string;
}

// Comprehensive KPI definitions for CPA workflows
export const cpaWorkflowKPIs: WorkflowKPIConfig = {
  kpiCategories: [
    {
      id: 'efficiency',
      name: 'Operational Efficiency',
      description: 'Measures how efficiently workflows are executed',
      weight: 30,
      targetAudience: ['operations_manager', 'team_leads', 'partners'],
      metrics: [
        {
          id: 'workflow_cycle_time',
          name: 'Average Workflow Cycle Time',
          description: 'Time from workflow initiation to completion',
          type: 'efficiency',
          calculation: {
            formula: 'AVG(completion_time - start_time)',
            parameters: ['start_time', 'completion_time'],
            aggregation: 'average',
            timeWindow: 'rolling_30',
            filters: { status: 'completed' }
          },
          unit: 'hours',
          target: 24,
          benchmark: 32,
          trend: 'lower_better',
          frequency: 'daily',
          stakeholders: ['operations_manager', 'team_leads']
        },
        {
          id: 'throughput_rate',
          name: 'Daily Workflow Throughput',
          description: 'Number of workflows completed per day',
          type: 'efficiency',
          calculation: {
            formula: 'COUNT(workflows) / days',
            parameters: ['workflow_count', 'time_period'],
            aggregation: 'average',
            timeWindow: 'rolling_30',
            filters: { status: 'completed' }
          },
          unit: 'workflows/day',
          target: 15,
          benchmark: 12,
          trend: 'higher_better',
          frequency: 'daily',
          stakeholders: ['operations_manager', 'partners']
        },
        {
          id: 'automation_efficiency',
          name: 'Automation Utilization Rate',
          description: 'Percentage of workflow steps completed through automation',
          type: 'efficiency',
          calculation: {
            formula: '(automated_steps / total_steps) * 100',
            parameters: ['automated_steps', 'total_steps'],
            aggregation: 'percentage',
            timeWindow: 'rolling_30',
            filters: {}
          },
          unit: '%',
          target: 70,
          benchmark: 55,
          trend: 'higher_better',
          frequency: 'weekly',
          stakeholders: ['operations_manager', 'it_director']
        },
        {
          id: 'resource_utilization',
          name: 'Staff Utilization Rate',
          description: 'Percentage of available staff time utilized on workflows',
          type: 'resource_utilization',
          calculation: {
            formula: '(billable_hours / available_hours) * 100',
            parameters: ['billable_hours', 'available_hours'],
            aggregation: 'percentage',
            timeWindow: 'rolling_30',
            filters: {}
          },
          unit: '%',
          target: 85,
          benchmark: 75,
          trend: 'target_optimal',
          frequency: 'daily',
          stakeholders: ['operations_manager', 'hr_manager']
        }
      ]
    },
    {
      id: 'quality',
      name: 'Quality Assurance',
      description: 'Measures quality of work output and processes',
      weight: 25,
      targetAudience: ['quality_manager', 'partners', 'senior_staff'],
      metrics: [
        {
          id: 'first_pass_yield',
          name: 'First Pass Yield Rate',
          description: 'Percentage of workflows completed without rework',
          type: 'quality',
          calculation: {
            formula: '(completed_without_rework / total_completed) * 100',
            parameters: ['completed_without_rework', 'total_completed'],
            aggregation: 'percentage',
            timeWindow: 'rolling_30',
            filters: { status: 'completed' }
          },
          unit: '%',
          target: 90,
          benchmark: 82,
          trend: 'higher_better',
          frequency: 'daily',
          stakeholders: ['quality_manager', 'team_leads']
        },
        {
          id: 'error_rate',
          name: 'Workflow Error Rate',
          description: 'Number of errors per completed workflow',
          type: 'quality',
          calculation: {
            formula: 'total_errors / completed_workflows',
            parameters: ['total_errors', 'completed_workflows'],
            aggregation: 'average',
            timeWindow: 'rolling_30',
            filters: {}
          },
          unit: 'errors/workflow',
          target: 0.5,
          benchmark: 1.2,
          trend: 'lower_better',
          frequency: 'daily',
          stakeholders: ['quality_manager', 'partners']
        },
        {
          id: 'compliance_score',
          name: 'Regulatory Compliance Score',
          description: 'Overall compliance with regulatory requirements',
          type: 'compliance',
          calculation: {
            formula: '(compliant_checks / total_checks) * 100',
            parameters: ['compliant_checks', 'total_checks'],
            aggregation: 'percentage',
            timeWindow: 'rolling_30',
            filters: {}
          },
          unit: '%',
          target: 100,
          benchmark: 98,
          trend: 'higher_better',
          frequency: 'daily',
          stakeholders: ['compliance_officer', 'partners']
        },
        {
          id: 'review_efficiency',
          name: 'Review Process Efficiency',
          description: 'Average time spent in review vs. initial preparation',
          type: 'quality',
          calculation: {
            formula: 'review_time / preparation_time',
            parameters: ['review_time', 'preparation_time'],
            aggregation: 'average',
            timeWindow: 'rolling_30',
            filters: {}
          },
          unit: 'ratio',
          target: 0.3,
          benchmark: 0.5,
          trend: 'lower_better',
          frequency: 'weekly',
          stakeholders: ['quality_manager', 'senior_staff']
        }
      ]
    },
    {
      id: 'client_satisfaction',
      name: 'Client Experience',
      description: 'Measures client satisfaction and experience quality',
      weight: 20,
      targetAudience: ['client_services', 'partners', 'business_development'],
      metrics: [
        {
          id: 'client_satisfaction_score',
          name: 'Client Satisfaction Score',
          description: 'Average client satisfaction rating',
          type: 'client_satisfaction',
          calculation: {
            formula: 'AVG(satisfaction_rating)',
            parameters: ['satisfaction_rating'],
            aggregation: 'average',
            timeWindow: 'rolling_90',
            filters: {}
          },
          unit: 'score (1-10)',
          target: 9.0,
          benchmark: 8.2,
          trend: 'higher_better',
          frequency: 'monthly',
          stakeholders: ['client_services', 'partners']
        },
        {
          id: 'response_time',
          name: 'Client Response Time',
          description: 'Average time to respond to client inquiries',
          type: 'client_satisfaction',
          calculation: {
            formula: 'AVG(response_time - inquiry_time)',
            parameters: ['response_time', 'inquiry_time'],
            aggregation: 'average',
            timeWindow: 'rolling_30',
            filters: {}
          },
          unit: 'hours',
          target: 4,
          benchmark: 8,
          trend: 'lower_better',
          frequency: 'daily',
          stakeholders: ['client_services', 'team_leads']
        },
        {
          id: 'deadline_adherence',
          name: 'Deadline Adherence Rate',
          description: 'Percentage of workflows completed by promised deadline',
          type: 'client_satisfaction',
          calculation: {
            formula: '(on_time_completions / total_completions) * 100',
            parameters: ['on_time_completions', 'total_completions'],
            aggregation: 'percentage',
            timeWindow: 'rolling_30',
            filters: {}
          },
          unit: '%',
          target: 98,
          benchmark: 92,
          trend: 'higher_better',
          frequency: 'daily',
          stakeholders: ['client_services', 'operations_manager']
        },
        {
          id: 'client_retention_rate',
          name: 'Client Retention Rate',
          description: 'Percentage of clients retained year-over-year',
          type: 'client_satisfaction',
          calculation: {
            formula: '(retained_clients / total_clients) * 100',
            parameters: ['retained_clients', 'total_clients'],
            aggregation: 'percentage',
            timeWindow: 'ytd',
            filters: {}
          },
          unit: '%',
          target: 95,
          benchmark: 88,
          trend: 'higher_better',
          frequency: 'monthly',
          stakeholders: ['business_development', 'partners']
        }
      ]
    },
    {
      id: 'cost_efficiency',
      name: 'Cost Management',
      description: 'Measures cost efficiency and financial performance',
      weight: 15,
      targetAudience: ['finance_manager', 'partners', 'operations_manager'],
      metrics: [
        {
          id: 'cost_per_workflow',
          name: 'Average Cost per Workflow',
          description: 'Total cost divided by number of completed workflows',
          type: 'cost',
          calculation: {
            formula: 'total_costs / completed_workflows',
            parameters: ['total_costs', 'completed_workflows'],
            aggregation: 'average',
            timeWindow: 'rolling_30',
            filters: {}
          },
          unit: 'dollars',
          target: 450,
          benchmark: 620,
          trend: 'lower_better',
          frequency: 'monthly',
          stakeholders: ['finance_manager', 'partners']
        },
        {
          id: 'labor_cost_ratio',
          name: 'Labor Cost Efficiency',
          description: 'Labor costs as percentage of total workflow costs',
          type: 'cost',
          calculation: {
            formula: '(labor_costs / total_costs) * 100',
            parameters: ['labor_costs', 'total_costs'],
            aggregation: 'percentage',
            timeWindow: 'rolling_30',
            filters: {}
          },
          unit: '%',
          target: 65,
          benchmark: 75,
          trend: 'lower_better',
          frequency: 'monthly',
          stakeholders: ['finance_manager', 'hr_manager']
        },
        {
          id: 'automation_roi',
          name: 'Automation Return on Investment',
          description: 'Financial return from automation investments',
          type: 'cost',
          calculation: {
            formula: '((savings - investment) / investment) * 100',
            parameters: ['automation_savings', 'automation_investment'],
            aggregation: 'percentage',
            timeWindow: 'ytd',
            filters: {}
          },
          unit: '%',
          target: 200,
          benchmark: 150,
          trend: 'higher_better',
          frequency: 'quarterly',
          stakeholders: ['finance_manager', 'it_director', 'partners']
        }
      ]
    },
    {
      id: 'capacity_planning',
      name: 'Capacity & Planning',
      description: 'Measures resource planning and capacity management',
      weight: 10,
      targetAudience: ['operations_manager', 'hr_manager', 'partners'],
      metrics: [
        {
          id: 'capacity_utilization',
          name: 'Overall Capacity Utilization',
          description: 'Percentage of total firm capacity being utilized',
          type: 'resource_utilization',
          calculation: {
            formula: '(utilized_capacity / total_capacity) * 100',
            parameters: ['utilized_capacity', 'total_capacity'],
            aggregation: 'percentage',
            timeWindow: 'rolling_30',
            filters: {}
          },
          unit: '%',
          target: 85,
          benchmark: 78,
          trend: 'target_optimal',
          frequency: 'daily',
          stakeholders: ['operations_manager', 'hr_manager']
        },
        {
          id: 'workflow_backlog',
          name: 'Workflow Backlog Size',
          description: 'Number of workflows awaiting processing',
          type: 'efficiency',
          calculation: {
            formula: 'COUNT(pending_workflows)',
            parameters: ['pending_workflows'],
            aggregation: 'count',
            timeWindow: 'current',
            filters: { status: 'pending' }
          },
          unit: 'workflows',
          target: 20,
          benchmark: 35,
          trend: 'lower_better',
          frequency: 'daily',
          stakeholders: ['operations_manager', 'team_leads']
        },
        {
          id: 'skill_coverage',
          name: 'Skill Coverage Ratio',
          description: 'Percentage of required skills covered by current staff',
          type: 'resource_utilization',
          calculation: {
            formula: '(available_skills / required_skills) * 100',
            parameters: ['available_skills', 'required_skills'],
            aggregation: 'percentage',
            timeWindow: 'current',
            filters: {}
          },
          unit: '%',
          target: 95,
          benchmark: 85,
          trend: 'higher_better',
          frequency: 'monthly',
          stakeholders: ['hr_manager', 'operations_manager']
        }
      ]
    }
  ],
  benchmarks: [
    { metricId: 'workflow_cycle_time', benchmarkType: 'industry', value: 32, source: 'CPA Industry Report 2024', lastUpdated: new Date(), confidence: 85 },
    { metricId: 'throughput_rate', benchmarkType: 'best_practice', value: 18, source: 'Best Practice Study', lastUpdated: new Date(), confidence: 90 },
    { metricId: 'first_pass_yield', benchmarkType: 'industry', value: 82, source: 'Quality Benchmarks', lastUpdated: new Date(), confidence: 88 },
    { metricId: 'client_satisfaction_score', benchmarkType: 'industry', value: 8.2, source: 'Client Satisfaction Survey', lastUpdated: new Date(), confidence: 92 }
  ],
  alertThresholds: [
    {
      metricId: 'workflow_cycle_time',
      thresholdType: 'critical',
      condition: 'above',
      value: 48,
      actions: [
        {
          type: 'email',
          recipients: ['operations_manager', 'partners'],
          template: 'critical_delay_alert',
          frequency: 'immediate'
        }
      ]
    },
    {
      metricId: 'error_rate',
      thresholdType: 'warning',
      condition: 'above',
      value: 1.0,
      actions: [
        {
          type: 'dashboard_highlight',
          recipients: ['quality_manager'],
          template: 'quality_warning',
          frequency: 'immediate'
        }
      ]
    },
    {
      metricId: 'client_satisfaction_score',
      thresholdType: 'warning',
      condition: 'below',
      value: 8.0,
      actions: [
        {
          type: 'email',
          recipients: ['client_services', 'partners'],
          template: 'satisfaction_concern',
          frequency: 'daily_digest'
        }
      ]
    }
  ],
  reportingFrequency: {
    dashboard: 'real_time',
    management: 'daily',
    executive: 'weekly',
    client: 'monthly'
  },
  stakeholders: [
    {
      role: 'operations_manager',
      metrics: ['workflow_cycle_time', 'throughput_rate', 'resource_utilization', 'capacity_utilization'],
      reportFormat: 'dashboard',
      frequency: 'real_time',
      alertLevel: 'warning'
    },
    {
      role: 'partners',
      metrics: ['client_satisfaction_score', 'cost_per_workflow', 'compliance_score', 'automation_roi'],
      reportFormat: 'pdf',
      frequency: 'weekly',
      alertLevel: 'critical'
    },
    {
      role: 'quality_manager',
      metrics: ['first_pass_yield', 'error_rate', 'review_efficiency', 'compliance_score'],
      reportFormat: 'dashboard',
      frequency: 'daily',
      alertLevel: 'warning'
    }
  ]
};

// Workflow analytics dashboard
export class WorkflowAnalyticsDashboard {

  static calculateMetricValue(
    metric: WorkflowMetric,
    data: WorkflowPerformanceData[]
  ): { value: number; trend: 'up' | 'down' | 'stable'; variance: number } {

    if (data.length === 0) {
      return { value: 0, trend: 'stable', variance: 0 };
    }

    let value = 0;

    switch (metric.id) {
      case 'workflow_cycle_time':
        value = data.reduce((sum, d) => sum + d.efficiency.actualDuration, 0) / data.length;
        break;
      case 'throughput_rate':
        const completedPerDay = data.filter(d => d.status === 'completed').length / 30;
        value = completedPerDay;
        break;
      case 'first_pass_yield':
        const firstPass = data.filter(d => d.quality.reviewPasses === 1).length;
        value = (firstPass / data.length) * 100;
        break;
      case 'error_rate':
        value = data.reduce((sum, d) => sum + d.quality.errorRate, 0) / data.length;
        break;
      case 'client_satisfaction_score':
        value = data.reduce((sum, d) => sum + d.client.satisfactionScore, 0) / data.length;
        break;
      case 'cost_per_workflow':
        value = data.reduce((sum, d) => sum + d.costs.totalCost, 0) / data.length;
        break;
      default:
        value = 0;
    }

    // Calculate trend (simplified - would use more sophisticated analysis in production)
    const recentData = data.slice(-7); // Last 7 data points
    const olderData = data.slice(-14, -7); // Previous 7 data points

    if (recentData.length === 0 || olderData.length === 0) {
      return { value, trend: 'stable', variance: 0 };
    }

    const recentAvg = recentData.reduce((sum, d) => sum + (d.metrics[metric.id] || 0), 0) / recentData.length;
    const olderAvg = olderData.reduce((sum, d) => sum + (d.metrics[metric.id] || 0), 0) / olderData.length;

    const variance = ((recentAvg - olderAvg) / olderAvg) * 100;
    const trend = Math.abs(variance) < 5 ? 'stable' : (variance > 0 ? 'up' : 'down');

    return {
      value: Math.round(value * 100) / 100,
      trend,
      variance: Math.round(variance * 10) / 10
    };
  }

  static generatePerformanceInsights(
    kpiData: Record<string, any>,
    benchmarks: WorkflowBenchmark[]
  ): {
    category: string;
    insight: string;
    impact: 'positive' | 'negative' | 'neutral';
    priority: 'high' | 'medium' | 'low';
    recommendation: string;
  }[] {

    const insights = [];

    // Efficiency insights
    if (kpiData.workflow_cycle_time > 32) {
      insights.push({
        category: 'Efficiency',
        insight: 'Workflow cycle time is 25% above industry benchmark',
        impact: 'negative' as const,
        priority: 'high' as const,
        recommendation: 'Implement automation for document collection and review processes'
      });
    }

    if (kpiData.automation_efficiency > 80) {
      insights.push({
        category: 'Efficiency',
        insight: 'Automation utilization exceeds target by 15%',
        impact: 'positive' as const,
        priority: 'medium' as const,
        recommendation: 'Share automation best practices across all teams'
      });
    }

    // Quality insights
    if (kpiData.first_pass_yield < 85) {
      insights.push({
        category: 'Quality',
        insight: 'First pass yield indicates quality process gaps',
        impact: 'negative' as const,
        priority: 'high' as const,
        recommendation: 'Enhance quality checkpoints and staff training programs'
      });
    }

    if (kpiData.compliance_score === 100) {
      insights.push({
        category: 'Quality',
        insight: 'Perfect compliance score maintained for 30 days',
        impact: 'positive' as const,
        priority: 'low' as const,
        recommendation: 'Document and standardize current compliance processes'
      });
    }

    // Client satisfaction insights
    if (kpiData.client_satisfaction_score > 9.0) {
      insights.push({
        category: 'Client Experience',
        insight: 'Client satisfaction exceeds target, trending upward',
        impact: 'positive' as const,
        priority: 'medium' as const,
        recommendation: 'Leverage high satisfaction for referral program expansion'
      });
    }

    if (kpiData.response_time > 8) {
      insights.push({
        category: 'Client Experience',
        insight: 'Client response time is double the target',
        impact: 'negative' as const,
        priority: 'high' as const,
        recommendation: 'Implement automated acknowledgment and triage system'
      });
    }

    // Cost insights
    if (kpiData.cost_per_workflow < 450) {
      insights.push({
        category: 'Cost Management',
        insight: 'Cost per workflow is 15% below target',
        impact: 'positive' as const,
        priority: 'medium' as const,
        recommendation: 'Analyze cost reduction methods for scaling to other services'
      });
    }

    return insights.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
  }

  static identifyOptimizationOpportunities(
    performanceData: WorkflowPerformanceData[]
  ): {
    area: string;
    opportunity: string;
    potentialImpact: string;
    implementationEffort: 'low' | 'medium' | 'high';
    estimatedTimeframe: string;
  }[] {

    const opportunities = [];

    // Analyze bottlenecks
    const commonBottlenecks = new Map();
    performanceData.forEach(data => {
      data.efficiency.bottlenecks.forEach(bottleneck => {
        const existing = commonBottlenecks.get(bottleneck.stepId) || { count: 0, totalDelay: 0 };
        existing.count++;
        existing.totalDelay += bottleneck.delayHours;
        existing.stepName = bottleneck.stepName;
        commonBottlenecks.set(bottleneck.stepId, existing);
      });
    });

    commonBottlenecks.forEach((data, stepId) => {
      if (data.count > performanceData.length * 0.3) { // Appears in >30% of workflows
        opportunities.push({
          area: 'Process Optimization',
          opportunity: `Automate ${data.stepName} step - frequent bottleneck detected`,
          potentialImpact: `Reduce cycle time by ${Math.round(data.totalDelay / data.count)} hours per workflow`,
          implementationEffort: 'medium' as const,
          estimatedTimeframe: '6-8 weeks'
        });
      }
    });

    // Resource optimization
    const avgResourceUtilization = performanceData.reduce((sum, d) =>
      sum + d.resources.staffUtilization, 0) / performanceData.length;

    if (avgResourceUtilization < 75) {
      opportunities.push({
        area: 'Resource Management',
        opportunity: 'Optimize staff allocation and workload distribution',
        potentialImpact: 'Increase utilization by 15-20% without additional hiring',
        implementationEffort: 'low' as const,
        estimatedTimeframe: '2-3 weeks'
      });
    }

    // Quality improvement
    const avgErrorRate = performanceData.reduce((sum, d) =>
      sum + d.quality.errorRate, 0) / performanceData.length;

    if (avgErrorRate > 1.0) {
      opportunities.push({
        area: 'Quality Enhancement',
        opportunity: 'Implement AI-powered quality pre-screening',
        potentialImpact: 'Reduce error rate by 60-70% and rework by 50%',
        implementationEffort: 'high' as const,
        estimatedTimeframe: '12-16 weeks'
      });
    }

    // Client experience optimization
    const avgResponseTime = performanceData.reduce((sum, d) =>
      sum + d.client.responseTime, 0) / performanceData.length;

    if (avgResponseTime > 6) {
      opportunities.push({
        area: 'Client Experience',
        opportunity: 'Deploy chatbot for instant client inquiry handling',
        potentialImpact: 'Reduce response time by 75% and improve satisfaction by 1-2 points',
        implementationEffort: 'medium' as const,
        estimatedTimeframe: '4-6 weeks'
      });
    }

    // Cost optimization
    const avgLaborCostRatio = performanceData.reduce((sum, d) =>
      sum + (d.costs.laborCost / d.costs.totalCost), 0) / performanceData.length;

    if (avgLaborCostRatio > 0.8) {
      opportunities.push({
        area: 'Cost Optimization',
        opportunity: 'Increase automation to reduce labor dependency',
        potentialImpact: 'Reduce labor costs by 25-30% while maintaining quality',
        implementationEffort: 'high' as const,
        estimatedTimeframe: '8-12 weeks'
      });
    }

    return opportunities.sort((a, b) => {
      const effortWeight = { low: 3, medium: 2, high: 1 };
      return effortWeight[b.implementationEffort] - effortWeight[a.implementationEffort];
    });
  }

  static generateExecutiveSummary(
    kpiData: Record<string, any>,
    insights: any[],
    opportunities: any[]
  ): {
    overallPerformance: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement';
    keyHighlights: string[];
    criticalIssues: string[];
    recommendedActions: string[];
    investmentPriorities: string[];
  } {

    // Calculate overall performance score
    const performanceScore = this.calculateOverallScore(kpiData);

    let overallPerformance: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement';
    if (performanceScore >= 90) overallPerformance = 'excellent';
    else if (performanceScore >= 80) overallPerformance = 'good';
    else if (performanceScore >= 70) overallPerformance = 'satisfactory';
    else overallPerformance = 'needs_improvement';

    const keyHighlights = insights
      .filter(i => i.impact === 'positive')
      .slice(0, 3)
      .map(i => i.insight);

    const criticalIssues = insights
      .filter(i => i.impact === 'negative' && i.priority === 'high')
      .map(i => i.insight);

    const recommendedActions = insights
      .filter(i => i.priority === 'high')
      .slice(0, 3)
      .map(i => i.recommendation);

    const investmentPriorities = opportunities
      .filter(o => o.implementationEffort !== 'high')
      .slice(0, 3)
      .map(o => o.opportunity);

    return {
      overallPerformance,
      keyHighlights,
      criticalIssues,
      recommendedActions,
      investmentPriorities
    };
  }

  private static calculateOverallScore(kpiData: Record<string, any>): number {
    // Simplified scoring logic
    const weights = {
      efficiency: 0.3,
      quality: 0.25,
      client_satisfaction: 0.2,
      cost: 0.15,
      capacity: 0.1
    };

    const scores = {
      efficiency: this.calculateCategoryScore(kpiData, ['workflow_cycle_time', 'throughput_rate', 'automation_efficiency']),
      quality: this.calculateCategoryScore(kpiData, ['first_pass_yield', 'error_rate', 'compliance_score']),
      client_satisfaction: this.calculateCategoryScore(kpiData, ['client_satisfaction_score', 'response_time', 'deadline_adherence']),
      cost: this.calculateCategoryScore(kpiData, ['cost_per_workflow', 'labor_cost_ratio', 'automation_roi']),
      capacity: this.calculateCategoryScore(kpiData, ['capacity_utilization', 'skill_coverage'])
    };

    return Object.entries(weights).reduce((total, [category, weight]) => {
      return total + (scores[category as keyof typeof scores] * weight);
    }, 0);
  }

  private static calculateCategoryScore(kpiData: Record<string, any>, metrics: string[]): number {
    const targets = {
      workflow_cycle_time: 24,
      throughput_rate: 15,
      automation_efficiency: 70,
      first_pass_yield: 90,
      error_rate: 0.5,
      compliance_score: 100,
      client_satisfaction_score: 9.0,
      response_time: 4,
      deadline_adherence: 98,
      cost_per_workflow: 450,
      labor_cost_ratio: 65,
      automation_roi: 200,
      capacity_utilization: 85,
      skill_coverage: 95
    };

    const scores = metrics.map(metric => {
      const actual = kpiData[metric] || 0;
      const target = targets[metric as keyof typeof targets] || 100;

      // For "lower better" metrics, invert the calculation
      const lowerBetterMetrics = ['workflow_cycle_time', 'error_rate', 'response_time', 'cost_per_workflow', 'labor_cost_ratio'];

      if (lowerBetterMetrics.includes(metric)) {
        return Math.min(100, (target / actual) * 100);
      } else {
        return Math.min(100, (actual / target) * 100);
      }
    });

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }
}

// Export everything
export {
  WorkflowKPIConfig,
  KPICategory,
  WorkflowMetric,
  MetricCalculation,
  WorkflowBenchmark,
  AlertThreshold,
  AlertAction,
  ReportingFrequency,
  StakeholderGroup,
  WorkflowPerformanceData,
  EfficiencyMetrics,
  QualityMetrics,
  CostMetrics,
  ResourceMetrics,
  ClientMetrics,
  BottleneckInfo,
  WorkflowAnalyticsDashboard
};
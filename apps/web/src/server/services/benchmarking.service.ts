import { prisma } from '@/server/db';
import { createQuickBooksApiClient } from '@/lib/integrations/quickbooks/client';

// Benchmarking interfaces
interface IndustryBenchmark {
  industryCode: string;
  industryName: string;
  metric: string;
  percentile25: number;
  percentile50: number;
  percentile75: number;
  percentile90: number;
  sampleSize: number;
  lastUpdated: Date;
  source: string;
}

interface ClientBenchmarkComparison {
  clientId: string;
  clientName: string;
  industryCode: string;
  metrics: Array<{
    metric: string;
    clientValue: number;
    industryMedian: number;
    industryP75: number;
    industryP90: number;
    percentileRank: number;
    variance: number;
    performance: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
    recommendation: string;
  }>;
  overallScore: number;
  competitivePosition: 'leader' | 'above_average' | 'average' | 'below_average' | 'laggard';
}

interface PeerAnalysis {
  clientId: string;
  peerGroup: {
    criteria: string;
    size: number;
    description: string;
  };
  comparisons: Array<{
    metric: string;
    clientValue: number;
    peerMedian: number;
    peerAverage: number;
    peerRange: { min: number; max: number };
    clientRank: number;
    percentileRank: number;
    zScore: number;
  }>;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
}

interface PerformanceRatio {
  ratio: string;
  value: number;
  trend: 'improving' | 'stable' | 'declining';
  trendStrength: number;
  industryComparison: number;
  peerComparison: number;
  interpretation: string;
  actionableInsights: string[];
}

interface CompetitiveAnalysis {
  clientId: string;
  marketPosition: {
    size: 'small' | 'medium' | 'large';
    growth: 'high' | 'medium' | 'low';
    profitability: 'high' | 'medium' | 'low';
    efficiency: 'high' | 'medium' | 'low';
  };
  competitiveAdvantages: string[];
  competitiveDisadvantages: string[];
  marketOpportunities: Array<{
    opportunity: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'high' | 'medium' | 'low';
    timeframe: string;
  }>;
  threats: Array<{
    threat: string;
    probability: 'high' | 'medium' | 'low';
    impact: 'high' | 'medium' | 'low';
    mitigation: string;
  }>;
}

export class BenchmarkingService {
  private organizationId: string;
  private quickBooksClient: ReturnType<typeof createQuickBooksApiClient>;

  // External data sources for industry benchmarks
  private industryDataSources = {
    rma: 'Risk Management Association',
    bizminer: 'BizMiner',
    ibisworld: 'IBISWorld',
    dun_bradstreet: 'Dun & Bradstreet',
    census: 'U.S. Census Bureau'
  };

  constructor(organizationId: string) {
    this.organizationId = organizationId;
    this.quickBooksClient = createQuickBooksApiClient(organizationId);
  }

  /**
   * Create comprehensive industry benchmark comparisons
   */
  async createIndustryBenchmarkComparisons(
    clientId?: string,
    options: {
      industryFilters?: string[];
      metricsToCompare?: string[];
      includeTrends?: boolean;
      benchmarkSources?: string[];
    } = {}
  ): Promise<ClientBenchmarkComparison[]> {
    const {
      industryFilters = [],
      metricsToCompare = [
        'gross_profit_margin',
        'net_profit_margin',
        'current_ratio',
        'debt_to_equity',
        'inventory_turnover',
        'receivables_turnover',
        'asset_turnover',
        'roe',
        'roa'
      ],
      includeTrends = true,
      benchmarkSources = ['rma', 'bizminer']
    } = options;

    try {
      // Fetch client data
      const clients = await this.fetchClientsForBenchmarking(clientId, industryFilters);
      const comparisons: ClientBenchmarkComparison[] = [];

      for (const client of clients) {
        // Get industry classification
        const industryCode = await this.determineIndustryCode(client);

        // Fetch industry benchmarks
        const benchmarks = await this.fetchIndustryBenchmarks(
          industryCode,
          metricsToCompare,
          benchmarkSources
        );

        // Calculate client metrics
        const clientMetrics = await this.calculateClientMetrics(client, metricsToCompare);

        // Perform comparisons
        const metricComparisons = await this.performBenchmarkComparisons(
          clientMetrics,
          benchmarks,
          includeTrends
        );

        // Calculate overall performance score
        const overallScore = this.calculateOverallBenchmarkScore(metricComparisons);

        // Determine competitive position
        const competitivePosition = this.determineCompetitivePosition(overallScore);

        comparisons.push({
          clientId: client.id,
          clientName: client.name,
          industryCode,
          metrics: metricComparisons,
          overallScore,
          competitivePosition
        });
      }

      // Store benchmark results for historical tracking
      await this.storeBenchmarkResults(comparisons);

      return comparisons;

    } catch (error) {
      console.error('Error creating industry benchmark comparisons:', error);
      throw new Error(`Industry benchmarking failed: ${error.message}`);
    }
  }

  /**
   * Implement peer analysis for client portfolios
   */
  async performPeerAnalysis(
    clientId: string,
    options: {
      peerCriteria?: Array<{
        type: 'revenue_size' | 'industry' | 'geography' | 'business_model';
        weight: number;
        tolerance?: number;
      }>;
      metricsToAnalyze?: string[];
      minPeerGroupSize?: number;
    } = {}
  ): Promise<PeerAnalysis> {
    const {
      peerCriteria = [
        { type: 'industry', weight: 0.4 },
        { type: 'revenue_size', weight: 0.3, tolerance: 0.5 },
        { type: 'geography', weight: 0.2 },
        { type: 'business_model', weight: 0.1 }
      ],
      metricsToAnalyze = [
        'revenue_growth',
        'profit_margin',
        'expense_ratio',
        'cash_flow_margin',
        'client_retention',
        'service_utilization'
      ],
      minPeerGroupSize = 10
    } = options;

    try {
      // Fetch target client data
      const targetClient = await this.fetchClientData(clientId);

      // Identify peer group based on criteria
      const peerGroup = await this.identifyPeerGroup(
        targetClient,
        peerCriteria,
        minPeerGroupSize
      );

      // Calculate metrics for target client and peers
      const [clientMetrics, peerMetrics] = await Promise.all([
        this.calculateClientMetrics(targetClient, metricsToAnalyze),
        this.calculatePeerGroupMetrics(peerGroup.clients, metricsToAnalyze)
      ]);

      // Perform peer comparisons
      const comparisons = await this.performPeerComparisons(
        clientMetrics,
        peerMetrics,
        metricsToAnalyze
      );

      // Analyze strengths, weaknesses, and opportunities
      const analysis = await this.analyzePeerPerformance(comparisons);

      return {
        clientId,
        peerGroup: {
          criteria: peerCriteria.map(c => `${c.type}(${c.weight})`).join(', '),
          size: peerGroup.size,
          description: peerGroup.description
        },
        comparisons,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        opportunities: analysis.opportunities
      };

    } catch (error) {
      console.error('Error performing peer analysis:', error);
      throw new Error(`Peer analysis failed: ${error.message}`);
    }
  }

  /**
   * Calculate and track performance ratios
   */
  async calculatePerformanceRatios(
    clientId: string,
    options: {
      ratioCategories?: string[];
      timeframeMonths?: number;
      includeTrendAnalysis?: boolean;
      includeBenchmarkComparison?: boolean;
    } = {}
  ): Promise<{
    liquidity: PerformanceRatio[];
    efficiency: PerformanceRatio[];
    profitability: PerformanceRatio[];
    leverage: PerformanceRatio[];
    growth: PerformanceRatio[];
    custom: PerformanceRatio[];
  }> {
    const {
      ratioCategories = ['liquidity', 'efficiency', 'profitability', 'leverage', 'growth'],
      timeframeMonths = 36,
      includeTrendAnalysis = true,
      includeBenchmarkComparison = true
    } = options;

    try {
      // Fetch financial data for calculation period
      const financialData = await this.fetchFinancialDataForRatios(clientId, timeframeMonths);

      const ratioResults: any = {
        liquidity: [],
        efficiency: [],
        profitability: [],
        leverage: [],
        growth: [],
        custom: []
      };

      for (const category of ratioCategories) {
        const ratios = await this.calculateRatioCategory(
          category,
          financialData,
          includeTrendAnalysis,
          includeBenchmarkComparison
        );
        ratioResults[category] = ratios;
      }

      return ratioResults;

    } catch (error) {
      console.error('Error calculating performance ratios:', error);
      throw new Error(`Performance ratio calculation failed: ${error.message}`);
    }
  }

  /**
   * Create competitive analysis framework
   */
  async createCompetitiveAnalysis(
    clientId: string,
    options: {
      includeMarketAnalysis?: boolean;
      includeSWOTAnalysis?: boolean;
      includePortersForces?: boolean;
      timeHorizon?: 'short' | 'medium' | 'long';
    } = {}
  ): Promise<CompetitiveAnalysis> {
    const {
      includeMarketAnalysis = true,
      includeSWOTAnalysis = true,
      includePortersForces = true,
      timeHorizon = 'medium'
    } = options;

    try {
      // Fetch comprehensive client data
      const clientData = await this.fetchCompetitiveAnalysisData(clientId);

      // Analyze market position
      const marketPosition = await this.analyzeMarketPosition(clientData);

      // Identify competitive advantages and disadvantages
      const [advantages, disadvantages] = await Promise.all([
        this.identifyCompetitiveAdvantages(clientData),
        this.identifyCompetitiveDisadvantages(clientData)
      ]);

      // Identify market opportunities
      const opportunities = await this.identifyMarketOpportunities(
        clientData,
        timeHorizon
      );

      // Identify threats
      const threats = await this.identifyMarketThreats(clientData, timeHorizon);

      return {
        clientId,
        marketPosition,
        competitiveAdvantages: advantages,
        competitiveDisadvantages: disadvantages,
        marketOpportunities: opportunities,
        threats
      };

    } catch (error) {
      console.error('Error creating competitive analysis:', error);
      throw new Error(`Competitive analysis failed: ${error.message}`);
    }
  }

  // Private helper methods

  private async fetchClientsForBenchmarking(
    clientId?: string,
    industryFilters?: string[]
  ): Promise<any[]> {
    const whereClause: any = {
      organizationId: this.organizationId
    };

    if (clientId) {
      whereClause.id = clientId;
    }

    if (industryFilters && industryFilters.length > 0) {
      whereClause.industryCode = {
        in: industryFilters
      };
    }

    return await prisma.client.findMany({
      where: whereClause,
      include: {
        financialStatements: {
          orderBy: { date: 'desc' }
        },
        invoices: true,
        expenses: true
      }
    });
  }

  private async determineIndustryCode(client: any): Promise<string> {
    // Determine NAICS industry code based on client data
    if (client.industryCode) return client.industryCode;

    // Use AI/ML to classify based on business description, expenses, etc.
    return await this.classifyIndustry(client);
  }

  private async fetchIndustryBenchmarks(
    industryCode: string,
    metrics: string[],
    sources: string[]
  ): Promise<Map<string, IndustryBenchmark>> {
    const benchmarks = new Map<string, IndustryBenchmark>();

    // Fetch from multiple sources and combine
    for (const source of sources) {
      const sourceBenchmarks = await this.fetchFromDataSource(source, industryCode, metrics);
      for (const [metric, benchmark] of sourceBenchmarks) {
        benchmarks.set(metric, benchmark);
      }
    }

    return benchmarks;
  }

  private async calculateClientMetrics(client: any, metrics: string[]): Promise<Map<string, number>> {
    const clientMetrics = new Map<string, number>();

    for (const metric of metrics) {
      const value = await this.calculateSpecificMetric(client, metric);
      clientMetrics.set(metric, value);
    }

    return clientMetrics;
  }

  private async performBenchmarkComparisons(
    clientMetrics: Map<string, number>,
    benchmarks: Map<string, IndustryBenchmark>,
    includeTrends: boolean
  ): Promise<any[]> {
    const comparisons = [];

    for (const [metric, clientValue] of clientMetrics) {
      const benchmark = benchmarks.get(metric);
      if (!benchmark) continue;

      const percentileRank = this.calculatePercentileRank(clientValue, benchmark);
      const variance = ((clientValue - benchmark.percentile50) / benchmark.percentile50) * 100;
      const performance = this.determinePerformanceLevel(percentileRank);

      comparisons.push({
        metric,
        clientValue,
        industryMedian: benchmark.percentile50,
        industryP75: benchmark.percentile75,
        industryP90: benchmark.percentile90,
        percentileRank,
        variance,
        performance,
        recommendation: await this.generateMetricRecommendation(metric, performance, variance)
      });
    }

    return comparisons;
  }

  private calculateOverallBenchmarkScore(comparisons: any[]): number {
    if (comparisons.length === 0) return 50;

    const weightedScore = comparisons.reduce((sum, comp) => {
      const weight = this.getMetricWeight(comp.metric);
      return sum + (comp.percentileRank * weight);
    }, 0);

    const totalWeight = comparisons.reduce((sum, comp) => {
      return sum + this.getMetricWeight(comp.metric);
    }, 0);

    return totalWeight > 0 ? weightedScore / totalWeight : 50;
  }

  private determineCompetitivePosition(score: number): 'leader' | 'above_average' | 'average' | 'below_average' | 'laggard' {
    if (score >= 90) return 'leader';
    if (score >= 75) return 'above_average';
    if (score >= 50) return 'average';
    if (score >= 25) return 'below_average';
    return 'laggard';
  }

  private async identifyPeerGroup(
    targetClient: any,
    criteria: any[],
    minSize: number
  ): Promise<{ clients: any[]; size: number; description: string }> {
    let potentialPeers = await this.fetchAllClients();

    // Apply criteria filters
    for (const criterion of criteria) {
      potentialPeers = this.filterByCriterion(potentialPeers, targetClient, criterion);
    }

    // Ensure minimum peer group size
    if (potentialPeers.length < minSize) {
      // Relax criteria to get minimum size
      potentialPeers = await this.relaxCriteriaForMinimumSize(
        targetClient,
        criteria,
        minSize
      );
    }

    return {
      clients: potentialPeers,
      size: potentialPeers.length,
      description: this.generatePeerGroupDescription(criteria)
    };
  }

  private async calculatePeerGroupMetrics(
    peers: any[],
    metrics: string[]
  ): Promise<Map<string, { median: number; average: number; range: { min: number; max: number } }>> {
    const peerMetrics = new Map();

    for (const metric of metrics) {
      const values = await Promise.all(
        peers.map(peer => this.calculateSpecificMetric(peer, metric))
      );

      const sortedValues = values.sort((a, b) => a - b);
      const median = this.calculateMedian(sortedValues);
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      const range = { min: Math.min(...values), max: Math.max(...values) };

      peerMetrics.set(metric, { median, average, range });
    }

    return peerMetrics;
  }

  private async performPeerComparisons(
    clientMetrics: Map<string, number>,
    peerMetrics: Map<string, any>,
    metrics: string[]
  ): Promise<any[]> {
    const comparisons = [];

    for (const metric of metrics) {
      const clientValue = clientMetrics.get(metric) || 0;
      const peerData = peerMetrics.get(metric);

      if (!peerData) continue;

      // Calculate percentile rank and z-score
      const percentileRank = this.calculatePeerPercentileRank(clientValue, peerData);
      const zScore = this.calculateZScore(clientValue, peerData.average, peerData);

      comparisons.push({
        metric,
        clientValue,
        peerMedian: peerData.median,
        peerAverage: peerData.average,
        peerRange: peerData.range,
        clientRank: this.calculateRank(clientValue, peerData),
        percentileRank,
        zScore
      });
    }

    return comparisons;
  }

  private async analyzePeerPerformance(comparisons: any[]): Promise<{
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
  }> {
    const strengths = [];
    const weaknesses = [];
    const opportunities = [];

    for (const comparison of comparisons) {
      if (comparison.percentileRank >= 75) {
        strengths.push(`Strong performance in ${comparison.metric} (${comparison.percentileRank}th percentile)`);
      } else if (comparison.percentileRank <= 25) {
        weaknesses.push(`Below peer average in ${comparison.metric} (${comparison.percentileRank}th percentile)`);
        opportunities.push(`Improve ${comparison.metric} to match peer median`);
      }
    }

    return { strengths, weaknesses, opportunities };
  }

  private async calculateRatioCategory(
    category: string,
    financialData: any,
    includeTrends: boolean,
    includeBenchmarks: boolean
  ): Promise<PerformanceRatio[]> {
    const ratios = [];
    const categoryRatios = this.getRatiosForCategory(category);

    for (const ratioConfig of categoryRatios) {
      const value = await this.calculateRatio(ratioConfig, financialData);
      let trend: any = 'stable';
      let trendStrength = 0;

      if (includeTrends) {
        const trendAnalysis = await this.analyzeTrend(ratioConfig, financialData);
        trend = trendAnalysis.direction;
        trendStrength = trendAnalysis.strength;
      }

      let industryComparison = 0;
      let peerComparison = 0;

      if (includeBenchmarks) {
        industryComparison = await this.getIndustryComparison(ratioConfig.name, value);
        peerComparison = await this.getPeerComparison(ratioConfig.name, value);
      }

      ratios.push({
        ratio: ratioConfig.name,
        value,
        trend,
        trendStrength,
        industryComparison,
        peerComparison,
        interpretation: this.interpretRatio(ratioConfig, value, trend),
        actionableInsights: await this.generateRatioInsights(ratioConfig, value, trend)
      });
    }

    return ratios;
  }

  // Placeholder implementations for complex operations
  private async classifyIndustry(client: any): Promise<string> {
    // AI-based industry classification
    return '541211'; // Default NAICS code for CPA firms
  }

  private async fetchFromDataSource(
    source: string,
    industryCode: string,
    metrics: string[]
  ): Promise<Map<string, IndustryBenchmark>> {
    // Fetch from external data source
    return new Map();
  }

  private async calculateSpecificMetric(client: any, metric: string): Promise<number> {
    // Calculate specific financial metric
    const calculations = {
      'gross_profit_margin': () => 0.35,
      'net_profit_margin': () => 0.15,
      'current_ratio': () => 2.0,
      'debt_to_equity': () => 0.3,
      'roe': () => 0.18,
      'roa': () => 0.12
    };

    return calculations[metric as keyof typeof calculations]?.() || 0;
  }

  private calculatePercentileRank(value: number, benchmark: IndustryBenchmark): number {
    if (value <= benchmark.percentile25) return 25;
    if (value <= benchmark.percentile50) return 50;
    if (value <= benchmark.percentile75) return 75;
    if (value <= benchmark.percentile90) return 90;
    return 95;
  }

  private determinePerformanceLevel(percentileRank: number): 'excellent' | 'good' | 'average' | 'below_average' | 'poor' {
    if (percentileRank >= 90) return 'excellent';
    if (percentileRank >= 75) return 'good';
    if (percentileRank >= 50) return 'average';
    if (percentileRank >= 25) return 'below_average';
    return 'poor';
  }

  private getMetricWeight(metric: string): number {
    const weights = {
      'gross_profit_margin': 0.2,
      'net_profit_margin': 0.25,
      'current_ratio': 0.15,
      'debt_to_equity': 0.15,
      'roe': 0.25
    };
    return weights[metric as keyof typeof weights] || 0.1;
  }

  private async generateMetricRecommendation(
    metric: string,
    performance: string,
    variance: number
  ): Promise<string> {
    // Generate specific recommendations based on metric performance
    return `Focus on improving ${metric} performance`;
  }

  private async storeBenchmarkResults(comparisons: ClientBenchmarkComparison[]): Promise<void> {
    // Store benchmark results in database
  }

  // Additional placeholder implementations
  private async fetchClientData(clientId: string): Promise<any> {
    return {};
  }

  private async fetchAllClients(): Promise<any[]> {
    return [];
  }

  private filterByCriterion(peers: any[], target: any, criterion: any): any[] {
    return peers;
  }

  private async relaxCriteriaForMinimumSize(target: any, criteria: any[], minSize: number): Promise<any[]> {
    return [];
  }

  private generatePeerGroupDescription(criteria: any[]): string {
    return 'Similar businesses based on industry and size';
  }

  private calculateMedian(values: number[]): number {
    const mid = Math.floor(values.length / 2);
    return values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
  }

  private calculatePeerPercentileRank(value: number, peerData: any): number {
    return 50; // Simplified
  }

  private calculateZScore(value: number, mean: number, data: any): number {
    return 0; // Simplified
  }

  private calculateRank(value: number, peerData: any): number {
    return 1; // Simplified
  }

  private async fetchFinancialDataForRatios(clientId: string, months: number): Promise<any> {
    return {};
  }

  private getRatiosForCategory(category: string): any[] {
    return [{ name: 'current_ratio', category }];
  }

  private async calculateRatio(config: any, data: any): Promise<number> {
    return 2.0; // Simplified
  }

  private async analyzeTrend(config: any, data: any): Promise<{ direction: string; strength: number }> {
    return { direction: 'stable', strength: 0.1 };
  }

  private async getIndustryComparison(ratio: string, value: number): Promise<number> {
    return 0; // Simplified
  }

  private async getPeerComparison(ratio: string, value: number): Promise<number> {
    return 0; // Simplified
  }

  private interpretRatio(config: any, value: number, trend: string): string {
    return 'Ratio is within acceptable range';
  }

  private async generateRatioInsights(config: any, value: number, trend: string): Promise<string[]> {
    return ['Continue monitoring ratio trends'];
  }

  private async fetchCompetitiveAnalysisData(clientId: string): Promise<any> {
    return {};
  }

  private async analyzeMarketPosition(data: any): Promise<any> {
    return {
      size: 'medium' as const,
      growth: 'medium' as const,
      profitability: 'medium' as const,
      efficiency: 'medium' as const
    };
  }

  private async identifyCompetitiveAdvantages(data: any): Promise<string[]> {
    return ['Strong client relationships', 'Specialized expertise'];
  }

  private async identifyCompetitiveDisadvantages(data: any): Promise<string[]> {
    return ['Limited technology adoption', 'Smaller scale'];
  }

  private async identifyMarketOpportunities(data: any, horizon: string): Promise<any[]> {
    return [{
      opportunity: 'Digital transformation services',
      impact: 'high' as const,
      effort: 'medium' as const,
      timeframe: '6-12 months'
    }];
  }

  private async identifyMarketThreats(data: any, horizon: string): Promise<any[]> {
    return [{
      threat: 'Automation of basic services',
      probability: 'medium' as const,
      impact: 'high' as const,
      mitigation: 'Focus on high-value advisory services'
    }];
  }
}

export function createBenchmarkingService(organizationId: string): BenchmarkingService {
  return new BenchmarkingService(organizationId);
}
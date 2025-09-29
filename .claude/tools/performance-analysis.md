# Performance Analysis Tool Set

Comprehensive performance analysis and optimization tools for the AdvisorOS multi-tenant CPA platform.

## Tool Categories

### 1. Database Performance Tools
- **Query Performance Analyzer**: Identifies slow queries and optimization opportunities
- **Index Usage Monitor**: Tracks index effectiveness and suggests improvements
- **Connection Pool Optimizer**: Monitors and optimizes database connection usage
- **Multi-Tenant Query Profiler**: Analyzes query performance across organizations

### 2. API Performance Tools
- **Response Time Monitor**: Tracks API endpoint performance metrics
- **Throughput Analyzer**: Measures concurrent request handling capacity
- **Cache Hit Rate Monitor**: Analyzes caching effectiveness across endpoints
- **Rate Limiting Performance Tracker**: Monitors rate limiting impact on user experience

### 3. Frontend Performance Tools
- **Bundle Size Analyzer**: Tracks JavaScript bundle sizes and optimization opportunities
- **Component Render Profiler**: Identifies slow-rendering React components
- **Network Resource Monitor**: Analyzes network request efficiency
- **Core Web Vitals Tracker**: Monitors user experience performance metrics

### 4. Infrastructure Performance Tools
- **Memory Usage Profiler**: Tracks memory consumption patterns and leaks
- **CPU Utilization Monitor**: Analyzes processing efficiency across features
- **Background Job Performance Tracker**: Monitors queue processing times
- **Scalability Stress Tester**: Tests system behavior under load

## Quick Performance Analysis Commands

```bash
# Run comprehensive performance analysis
npm run perf:analyze:full

# Analyze specific performance area
npm run perf:analyze:database     # Database performance
npm run perf:analyze:api          # API response times
npm run perf:analyze:frontend     # Frontend performance
npm run perf:analyze:memory       # Memory usage patterns

# Generate performance reports
npm run perf:report:dashboard
npm run perf:report:optimization
npm run perf:report:scalability
```

## Database Performance Tools

### Query Performance Analyzer
```typescript
// tools/performance/query-analyzer.ts
export interface QueryPerformanceMetrics {
  queryId: string
  organizationId?: string
  executionTime: number
  rowsScanned: number
  indexesUsed: string[]
  optimizationSuggestions: string[]
}

export async function analyzeQueryPerformance(
  timeWindow: string = '24h'
): Promise<QueryAnalysisReport> {
  const slowQueries = await getSlowQueries(timeWindow)
  const analysisResults: QueryPerformanceMetrics[] = []
  
  for (const query of slowQueries) {
    const metrics = await analyzeQuery(query)
    const suggestions = await generateOptimizationSuggestions(metrics)
    
    analysisResults.push({
      ...metrics,
      optimizationSuggestions: suggestions
    })
  }
  
  return {
    timeWindow,
    totalQueriesAnalyzed: slowQueries.length,
    averageExecutionTime: calculateAverage(analysisResults, 'executionTime'),
    slowestQueries: analysisResults.slice(0, 10),
    optimizationPriority: prioritizeOptimizations(analysisResults),
    indexRecommendations: generateIndexRecommendations(analysisResults)
  }
}
```

### Multi-Tenant Performance Monitor
```typescript
// tools/performance/multi-tenant-monitor.ts
export async function monitorMultiTenantPerformance(): Promise<TenantPerformanceReport> {
  const organizations = await getActiveOrganizations()
  const performanceMetrics: TenantMetrics[] = []
  
  for (const org of organizations) {
    const metrics = await gatherOrgMetrics(org.id)
    performanceMetrics.push({
      organizationId: org.id,
      organizationName: org.name,
      userCount: metrics.activeUsers,
      requestsPerMinute: metrics.requestRate,
      averageResponseTime: metrics.avgResponseTime,
      errorRate: metrics.errorRate,
      dataVolume: metrics.recordCount,
      performanceScore: calculatePerformanceScore(metrics)
    })
  }
  
  return {
    totalOrganizations: organizations.length,
    averagePerformanceScore: calculateOverallScore(performanceMetrics),
    performanceDistribution: analyzePerformanceDistribution(performanceMetrics),
    outliers: identifyPerformanceOutliers(performanceMetrics),
    recommendations: generateTenantOptimizations(performanceMetrics)
  }
}
```

### Index Optimization Analyzer
```typescript
// tools/performance/index-analyzer.ts
export async function analyzeIndexUsage(): Promise<IndexAnalysisReport> {
  const indexUsageStats = await getIndexUsageStatistics()
  const unusedIndexes = await findUnusedIndexes()
  const missingIndexes = await identifyMissingIndexes()
  
  return {
    totalIndexes: indexUsageStats.length,
    highUsageIndexes: indexUsageStats.filter(idx => idx.usageFrequency > 1000),
    lowUsageIndexes: indexUsageStats.filter(idx => idx.usageFrequency < 10),
    unusedIndexes: unusedIndexes.map(idx => ({
      table: idx.tableName,
      indexName: idx.indexName,
      sizeKB: idx.sizeKB,
      removalImpact: 'NONE'
    })),
    recommendedIndexes: missingIndexes.map(suggestion => ({
      table: suggestion.tableName,
      columns: suggestion.recommendedColumns,
      estimatedImprovement: suggestion.performanceGain,
      queryPatterns: suggestion.affectedQueries
    }))
  }
}
```

## API Performance Tools

### Response Time Monitor
```typescript
// tools/performance/api-monitor.ts
export class ApiPerformanceMonitor {
  private metrics: Map<string, EndpointMetrics> = new Map()
  
  recordRequest(
    endpoint: string,
    organizationId: string,
    responseTime: number,
    success: boolean
  ): void {
    const key = `${endpoint}:${organizationId}`
    const existing = this.metrics.get(key) || {
      endpoint,
      organizationId,
      requestCount: 0,
      totalResponseTime: 0,
      successCount: 0,
      errorCount: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0
    }
    
    existing.requestCount++
    existing.totalResponseTime += responseTime
    
    if (success) {
      existing.successCount++
    } else {
      existing.errorCount++
    }
    
    this.metrics.set(key, existing)
    this.updatePercentiles(key, responseTime)
  }
  
  generateReport(timeWindow: string): ApiPerformanceReport {
    const endpointMetrics = Array.from(this.metrics.values())
    
    return {
      timeWindow,
      totalRequests: endpointMetrics.reduce((sum, m) => sum + m.requestCount, 0),
      averageResponseTime: this.calculateOverallAverage(endpointMetrics),
      slowestEndpoints: this.identifySlowestEndpoints(endpointMetrics, 10),
      errorRateByEndpoint: this.calculateErrorRates(endpointMetrics),
      organizationPerformanceComparison: this.compareOrganizationPerformance(endpointMetrics),
      optimizationRecommendations: this.generateApiOptimizations(endpointMetrics)
    }
  }
}
```

### Cache Performance Analyzer
```typescript
// tools/performance/cache-analyzer.ts
export async function analyzeCachePerformance(): Promise<CacheAnalysisReport> {
  const cacheMetrics = await getCacheStatistics()
  const hitRates = await calculateHitRates()
  const evictionPatterns = await analyzeEvictionPatterns()
  
  return {
    overallHitRate: hitRates.overall,
    hitRatesByKey: hitRates.byKeyPattern,
    organizationHitRates: hitRates.byOrganization,
    memoryUsage: {
      total: cacheMetrics.totalMemory,
      used: cacheMetrics.usedMemory,
      fragmentation: cacheMetrics.fragmentation
    },
    keyDistribution: analyzeKeyDistribution(cacheMetrics),
    evictionAnalysis: {
      evictionRate: evictionPatterns.rate,
      mostEvictedKeys: evictionPatterns.topEvicted,
      evictionReasons: evictionPatterns.reasons
    },
    optimizationSuggestions: [
      ...generateTTLOptimizations(hitRates),
      ...generateKeyOptimizations(cacheMetrics),
      ...generateMemoryOptimizations(cacheMetrics)
    ]
  }
}
```

## Frontend Performance Tools

### Bundle Analysis Tool
```typescript
// tools/performance/bundle-analyzer.ts
export async function analyzeBundlePerformance(): Promise<BundleAnalysisReport> {
  const bundleStats = await getBundleStatistics()
  const chunkAnalysis = await analyzeChunks()
  const dependencyAnalysis = await analyzeDependencies()
  
  return {
    totalBundleSize: bundleStats.totalSize,
    gzippedSize: bundleStats.gzippedSize,
    chunkSizes: chunkAnalysis.map(chunk => ({
      name: chunk.name,
      size: chunk.size,
      loadPriority: chunk.priority,
      optimizationPotential: chunk.optimizationScore
    })),
    largeDependencies: dependencyAnalysis
      .filter(dep => dep.size > 100000) // > 100KB
      .sort((a, b) => b.size - a.size),
    duplicateDependencies: findDuplicateDependencies(dependencyAnalysis),
    optimizationRecommendations: [
      ...generateChunkOptimizations(chunkAnalysis),
      ...generateDependencyOptimizations(dependencyAnalysis),
      ...generateLoadingOptimizations(bundleStats)
    ]
  }
}
```

### Component Render Profiler
```typescript
// tools/performance/component-profiler.ts
export class ComponentRenderProfiler {
  private renderTimes: Map<string, RenderMetrics> = new Map()
  
  profileComponent(
    componentName: string,
    renderTime: number,
    updateTrigger: string
  ): void {
    const existing = this.renderTimes.get(componentName) || {
      componentName,
      totalRenders: 0,
      totalRenderTime: 0,
      slowestRender: 0,
      updateTriggers: new Map()
    }
    
    existing.totalRenders++
    existing.totalRenderTime += renderTime
    existing.slowestRender = Math.max(existing.slowestRender, renderTime)
    
    const triggerCount = existing.updateTriggers.get(updateTrigger) || 0
    existing.updateTriggers.set(updateTrigger, triggerCount + 1)
    
    this.renderTimes.set(componentName, existing)
  }
  
  generateReport(): ComponentPerformanceReport {
    const components = Array.from(this.renderTimes.values())
    
    return {
      totalComponents: components.length,
      slowestComponents: components
        .sort((a, b) => (b.totalRenderTime / b.totalRenders) - (a.totalRenderTime / a.totalRenders))
        .slice(0, 10),
      frequentlyUpdatingComponents: components
        .sort((a, b) => b.totalRenders - a.totalRenders)
        .slice(0, 10),
      optimizationSuggestions: this.generateComponentOptimizations(components)
    }
  }
}
```

## Infrastructure Performance Tools

### Memory Usage Profiler
```typescript
// tools/performance/memory-profiler.ts
export class MemoryProfiler {
  private snapshots: MemorySnapshot[] = []
  
  takeSnapshot(label: string): MemorySnapshot {
    const usage = process.memoryUsage()
    const snapshot: MemorySnapshot = {
      timestamp: new Date(),
      label,
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
      heapUtilization: usage.heapUsed / usage.heapTotal
    }
    
    this.snapshots.push(snapshot)
    return snapshot
  }
  
  detectMemoryLeaks(): MemoryLeakAnalysis {
    const recentSnapshots = this.snapshots.slice(-20) // Last 20 snapshots
    const trend = this.calculateMemoryTrend(recentSnapshots)
    
    return {
      hasMemoryLeak: trend.isIncreasing && trend.rate > 0.05, // 5% growth rate
      growthRate: trend.rate,
      suspiciousPatterns: this.identifySuspiciousPatterns(recentSnapshots),
      recommendations: this.generateMemoryOptimizations(trend)
    }
  }
  
  generateReport(): MemoryAnalysisReport {
    return {
      snapshotCount: this.snapshots.length,
      currentUsage: this.snapshots[this.snapshots.length - 1],
      peakUsage: this.findPeakUsage(),
      memoryTrend: this.calculateMemoryTrend(this.snapshots),
      leakAnalysis: this.detectMemoryLeaks(),
      gcAnalysis: this.analyzeGarbageCollection()
    }
  }
}
```

### Scalability Stress Tester
```typescript
// tools/performance/stress-tester.ts
export async function runScalabilityTest(
  testConfig: StressTestConfig
): Promise<StressTestReport> {
  const testResults: TestResult[] = []
  
  // Ramp up load gradually
  for (let concurrency = testConfig.minConcurrency; 
       concurrency <= testConfig.maxConcurrency; 
       concurrency += testConfig.rampStep) {
    
    const result = await runConcurrencyTest({
      concurrentUsers: concurrency,
      duration: testConfig.testDuration,
      endpoints: testConfig.endpoints,
      organizations: testConfig.testOrganizations
    })
    
    testResults.push({
      concurrency,
      ...result
    })
    
    // Break if we hit performance limits
    if (result.errorRate > testConfig.maxErrorRate || 
        result.averageResponseTime > testConfig.maxResponseTime) {
      break
    }
  }
  
  return {
    testConfig,
    results: testResults,
    scalabilityLimits: identifyScalabilityLimits(testResults),
    bottlenecks: identifyBottlenecks(testResults),
    recommendations: generateScalabilityRecommendations(testResults)
  }
}
```

## Performance Monitoring Dashboard

### Real-Time Performance Metrics
```typescript
// tools/performance/dashboard-generator.ts
export async function generatePerformanceDashboard(): Promise<PerformanceDashboard> {
  const [
    dbMetrics,
    apiMetrics,
    frontendMetrics,
    infraMetrics
  ] = await Promise.all([
    gatherDatabaseMetrics(),
    gatherApiMetrics(),
    gatherFrontendMetrics(),
    gatherInfrastructureMetrics()
  ])
  
  return {
    timestamp: new Date(),
    overallHealthScore: calculateOverallHealth(dbMetrics, apiMetrics, frontendMetrics, infraMetrics),
    database: {
      averageQueryTime: dbMetrics.avgQueryTime,
      slowQueryCount: dbMetrics.slowQueries.length,
      connectionPoolUtilization: dbMetrics.poolUtilization,
      indexEfficiency: dbMetrics.indexScore
    },
    api: {
      averageResponseTime: apiMetrics.avgResponseTime,
      requestsPerSecond: apiMetrics.requestRate,
      errorRate: apiMetrics.errorRate,
      cacheHitRate: apiMetrics.cacheHitRate
    },
    frontend: {
      bundleSize: frontendMetrics.bundleSize,
      coreWebVitals: frontendMetrics.webVitals,
      componentRenderTime: frontendMetrics.avgRenderTime
    },
    infrastructure: {
      memoryUtilization: infraMetrics.memoryUsage,
      cpuUtilization: infraMetrics.cpuUsage,
      backgroundJobLatency: infraMetrics.jobLatency
    },
    alerts: generatePerformanceAlerts(dbMetrics, apiMetrics, frontendMetrics, infraMetrics)
  }
}
```

## Usage Guidelines

### Daily Performance Monitoring
```bash
# Morning performance health check
npm run perf:health-check

# Monitor critical performance metrics
npm run perf:monitor:critical

# Check for performance regressions
npm run perf:regression:check
```

### Performance Optimization Workflow
```bash
# Identify performance bottlenecks
npm run perf:analyze:bottlenecks

# Generate optimization recommendations
npm run perf:optimize:recommendations

# Test optimization impact
npm run perf:test:optimization <optimization-id>

# Deploy performance improvements
npm run perf:deploy:optimizations
```

### Multi-Tenant Performance Analysis
```bash
# Compare performance across organizations
npm run perf:compare:organizations

# Identify resource-intensive tenants
npm run perf:analyze:resource-usage

# Optimize multi-tenant query patterns
npm run perf:optimize:multi-tenant
```

## Integration with AI Development Tools

These performance tools integrate with the AI development ecosystem:

- **performance-optimizer.md** prompt uses these tools for analysis
- **cpa-developer.md** prompt applies performance best practices
- **testing-qa-specialist.md** prompt creates performance tests
- **development-assistant.md** prompt ensures performance considerations

The tools provide automated metrics and analysis while the AI prompts provide expert optimization guidance.
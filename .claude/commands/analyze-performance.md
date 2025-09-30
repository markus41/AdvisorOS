# Analyze Performance Command

Performs comprehensive performance analysis on a specified file or component, identifying bottlenecks, optimization opportunities, and providing actionable recommendations.

## Usage

```bash
/analyze-performance <file_path>
```

## What This Command Does

1. **Code Analysis**: Examines the specified file for performance anti-patterns
2. **Database Query Review**: Identifies N+1 queries, missing indexes, inefficient joins
3. **React Component Analysis**: Detects unnecessary re-renders, large bundles, missing memoization
4. **API Endpoint Review**: Analyzes response times, payload sizes, caching opportunities
5. **Memory Profiling**: Identifies memory leaks and excessive memory usage
6. **Bundle Impact**: Calculates impact on bundle size for frontend code

## Performance Metrics Analyzed

- **API Response Times**: Target < 2 seconds
- **Database Query Times**: Target < 500ms
- **Frontend Load Times**: Target < 3 seconds
- **Memory Usage**: Monitor for leaks and excessive consumption
- **Bundle Size**: Keep under reasonable limits
- **Rendering Performance**: Identify expensive React renders

## Example Output

```
🔍 Performance Analysis: apps/web/src/components/Dashboard.tsx

📊 Findings:

1. ❌ CRITICAL: Unnecessary re-renders detected
   - Component re-renders on every parent update
   - Recommendation: Wrap with React.memo() and use useCallback for handlers
   - Impact: 30% performance improvement expected

2. ⚠️  WARNING: Large component bundle
   - Current size: 45KB (gzipped)
   - Recommendation: Code-split expensive chart library
   - Impact: 15KB bundle size reduction

3. ℹ️  INFO: Optimization opportunity
   - useMemo not used for expensive calculations
   - Line 45: const sortedData = data.sort()
   - Recommendation: Wrap in useMemo with [data] dependency

💡 Actionable Recommendations:
   1. Implement React.memo on Dashboard component
   2. Use dynamic imports for Tremor charts
   3. Add useMemo for data transformations
   4. Consider virtualization for large lists

📈 Expected Performance Gains:
   - Initial Load: -40% (1.2s → 0.7s)
   - Re-render Time: -60% (150ms → 60ms)
   - Bundle Size: -25% (45KB → 34KB)
```

## Integration with Agents

This command automatically engages the **performance-optimization-specialist** agent with full context about:
- Current performance metrics
- Multi-tenant query patterns
- React component optimization strategies
- Database indexing recommendations
- Caching strategies

## Arguments

- `$ARGUMENTS`: File path to analyze (required)
  - Can be a single file or directory
  - Supports glob patterns: `src/**/*.tsx`
  - Examples:
    - `/analyze-performance apps/web/src/components/Dashboard.tsx`
    - `/analyze-performance apps/web/src/server/api/routers/client.ts`
    - `/analyze-performance "apps/web/src/pages/**/*.tsx"`

## Related Commands

- `/security-scan` - Security vulnerability analysis
- `/refactor-suggest` - Code refactoring recommendations
- `/generate-tests` - Generate performance tests

---

**Automatic Analysis**: Uses the performance-optimization-specialist agent to analyze $ARGUMENTS and provide comprehensive performance insights with specific, actionable recommendations for the AdvisorOS multi-tenant CPA platform.
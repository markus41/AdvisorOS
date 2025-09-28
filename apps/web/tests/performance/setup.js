// Performance test setup
const { performance } = require('perf_hooks')

global.performance = performance

// Performance test helpers
global.measurePerformance = async (name, fn) => {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  const duration = end - start

  console.log(`${name}: ${duration.toFixed(2)}ms`)

  return {
    result,
    duration,
    start,
    end
  }
}

global.createPerformanceReport = (measurements) => {
  const report = {
    totalTime: measurements.reduce((sum, m) => sum + m.duration, 0),
    averageTime: measurements.reduce((sum, m) => sum + m.duration, 0) / measurements.length,
    slowestOperation: measurements.reduce((slowest, current) =>
      current.duration > slowest.duration ? current : slowest
    ),
    fastestOperation: measurements.reduce((fastest, current) =>
      current.duration < fastest.duration ? current : fastest
    ),
    measurements
  }

  return report
}

// Memory usage monitoring
global.getMemoryUsage = () => {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage()
  }

  if (typeof performance !== 'undefined' && performance.memory) {
    return performance.memory
  }

  return null
}

// Mock high-resolution timer for browsers
if (typeof performance === 'undefined') {
  global.performance = {
    now: () => Date.now()
  }
}

// Performance thresholds
global.PERFORMANCE_THRESHOLDS = {
  DATABASE_QUERY: 100, // ms
  API_RESPONSE: 500, // ms
  PAGE_LOAD: 2000, // ms
  FILE_UPLOAD: 5000, // ms
  LARGE_DATASET: 1000, // ms
}
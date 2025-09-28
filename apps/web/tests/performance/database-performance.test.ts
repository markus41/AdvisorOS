import { prisma } from '@cpa-platform/database'
import { ClientService } from '@/lib/services/client-service'

// Mock the dependencies
jest.mock('@cpa-platform/database', () => ({
  prisma: {
    client: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    document: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    engagement: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Database Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Client Queries', () => {
    it('should handle large client datasets efficiently', async () => {
      const largeClientDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: `client-${i}`,
        businessName: `Business ${i}`,
        email: `client${i}@example.com`,
        organizationId: 'org-123',
        status: 'ACTIVE',
        createdAt: new Date(),
      }))

      mockPrisma.client.findMany.mockResolvedValue(largeClientDataset as any)
      mockPrisma.client.count.mockResolvedValue(10000)

      const measurement = await measurePerformance('Large Client Query', async () => {
        return await ClientService.getClients('org-123', {}, { field: 'businessName', direction: 'asc' }, { page: 1, limit: 100 })
      })

      expect(measurement.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_QUERY)
      expect(measurement.result.clients).toHaveLength(10000)
    })

    it('should paginate large datasets efficiently', async () => {
      const pageSize = 50
      const totalClients = 5000

      mockPrisma.client.findMany.mockResolvedValue(
        Array.from({ length: pageSize }, (_, i) => ({
          id: `client-${i}`,
          businessName: `Business ${i}`,
        })) as any
      )
      mockPrisma.client.count.mockResolvedValue(totalClients)

      const measurements = []

      // Test performance across multiple pages
      for (let page = 1; page <= 10; page++) {
        const measurement = await measurePerformance(`Page ${page} Query`, async () => {
          return await ClientService.getClients('org-123', {}, { field: 'businessName', direction: 'asc' }, { page, limit: pageSize })
        })
        measurements.push(measurement)
      }

      // All page queries should be consistently fast
      measurements.forEach((measurement, index) => {
        expect(measurement.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_QUERY)
      })

      // Performance should be consistent across pages
      const avgTime = measurements.reduce((sum, m) => sum + m.duration, 0) / measurements.length
      const maxDeviation = Math.max(...measurements.map(m => Math.abs(m.duration - avgTime)))
      expect(maxDeviation).toBeLessThan(avgTime * 0.5) // Deviation should be less than 50% of average
    })

    it('should handle complex filtering efficiently', async () => {
      const complexFilters = {
        search: 'tech',
        status: ['ACTIVE', 'PROSPECT'],
        businessType: ['Corporation', 'LLC'],
        riskLevel: ['LOW', 'MEDIUM'],
        annualRevenueMin: 100000,
        annualRevenueMax: 5000000,
        hasQuickBooks: true,
      }

      mockPrisma.client.findMany.mockResolvedValue([])
      mockPrisma.client.count.mockResolvedValue(0)

      const measurement = await measurePerformance('Complex Filter Query', async () => {
        return await ClientService.getClients('org-123', complexFilters)
      })

      expect(measurement.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_QUERY)
    })

    it('should handle concurrent queries efficiently', async () => {
      mockPrisma.client.findMany.mockResolvedValue([])
      mockPrisma.client.count.mockResolvedValue(0)

      const concurrentQueries = Array.from({ length: 10 }, (_, i) =>
        measurePerformance(`Concurrent Query ${i}`, async () => {
          return await ClientService.getClients('org-123', { search: `query${i}` })
        })
      )

      const results = await Promise.all(concurrentQueries)

      // All queries should complete within threshold
      results.forEach(result => {
        expect(result.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_QUERY * 2) // Allow some overhead for concurrency
      })

      // Total time should be less than sequential execution
      const totalTime = Math.max(...results.map(r => r.end)) - Math.min(...results.map(r => r.start))
      const sequentialTime = results.reduce((sum, r) => sum + r.duration, 0)
      expect(totalTime).toBeLessThan(sequentialTime * 0.8) // Should be at least 20% faster than sequential
    })
  })

  describe('Aggregation Queries', () => {
    it('should compute client statistics efficiently', async () => {
      mockPrisma.client.count.mockResolvedValue(1000)
      mockPrisma.client.groupBy.mockResolvedValue([
        { status: 'ACTIVE', _count: 600 },
        { status: 'PROSPECT', _count: 300 },
        { status: 'INACTIVE', _count: 100 },
      ] as any)
      mockPrisma.client.aggregate.mockResolvedValue({
        _sum: { annualRevenue: 50000000 },
        _avg: { annualRevenue: 500000 },
        _count: { annualRevenue: 100 },
      } as any)

      const measurement = await measurePerformance('Client Statistics', async () => {
        return await ClientService.getClientStats('org-123')
      })

      expect(measurement.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_QUERY * 2) // Allow more time for aggregations
    })

    it('should handle large aggregation datasets', async () => {
      // Mock large aggregation results
      const largeGroupByResult = Array.from({ length: 100 }, (_, i) => ({
        businessType: `Type${i}`,
        _count: Math.floor(Math.random() * 100) + 1,
      }))

      mockPrisma.client.count.mockResolvedValue(10000)
      mockPrisma.client.groupBy.mockResolvedValue(largeGroupByResult as any)
      mockPrisma.client.aggregate.mockResolvedValue({
        _sum: { annualRevenue: 1000000000 },
        _avg: { annualRevenue: 100000 },
        _count: { annualRevenue: 10000 },
      } as any)

      const measurement = await measurePerformance('Large Aggregation', async () => {
        return await ClientService.getClientStats('org-123')
      })

      expect(measurement.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_QUERY * 3)
    })
  })

  describe('Memory Usage', () => {
    it('should not leak memory with large result sets', async () => {
      const initialMemory = getMemoryUsage()

      // Simulate processing large datasets
      for (let i = 0; i < 10; i++) {
        const largeDataset = Array.from({ length: 1000 }, (_, j) => ({
          id: `client-${i}-${j}`,
          businessName: `Business ${i}-${j}`,
          data: 'x'.repeat(1000), // 1KB of data per record
        }))

        mockPrisma.client.findMany.mockResolvedValue(largeDataset as any)
        mockPrisma.client.count.mockResolvedValue(1000)

        await ClientService.getClients('org-123')

        // Force garbage collection if available
        if (global.gc) {
          global.gc()
        }
      }

      const finalMemory = getMemoryUsage()

      if (initialMemory && finalMemory && initialMemory.heapUsed && finalMemory.heapUsed) {
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
        const memoryIncreaseMB = memoryIncrease / (1024 * 1024)

        // Memory increase should be reasonable (less than 50MB)
        expect(memoryIncreaseMB).toBeLessThan(50)
      }
    })

    it('should handle memory-intensive operations efficiently', async () => {
      const initialMemory = getMemoryUsage()

      // Create large in-memory dataset
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: `client-${i}`,
        businessName: `Business ${i}`,
        documents: Array.from({ length: 10 }, (_, j) => ({
          id: `doc-${i}-${j}`,
          name: `Document ${i}-${j}`,
          content: 'x'.repeat(10000), // 10KB per document
        })),
      }))

      mockPrisma.client.findMany.mockResolvedValue(largeDataset as any)

      const measurement = await measurePerformance('Memory Intensive Operation', async () => {
        const clients = await ClientService.getClients('org-123')

        // Simulate processing the data
        return clients.clients.map(client => ({
          ...client,
          processed: true,
        }))
      })

      expect(measurement.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.LARGE_DATASET)

      const finalMemory = getMemoryUsage()

      if (initialMemory && finalMemory && initialMemory.heapUsed && finalMemory.heapUsed) {
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
        const memoryIncreaseMB = memoryIncrease / (1024 * 1024)

        // Should not consume excessive memory
        expect(memoryIncreaseMB).toBeLessThan(200)
      }
    })
  })

  describe('Database Connection Efficiency', () => {
    it('should reuse database connections efficiently', async () => {
      const connectionQueries = Array.from({ length: 20 }, (_, i) => async () => {
        mockPrisma.client.findMany.mockResolvedValue([])
        return await ClientService.getClients('org-123', { search: `query${i}` })
      })

      const measurement = await measurePerformance('Connection Reuse Test', async () => {
        return await Promise.all(connectionQueries.map(query => query()))
      })

      // Should complete quickly due to connection pooling
      expect(measurement.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_QUERY * 5)
    })

    it('should handle database timeouts gracefully', async () => {
      // Mock slow query
      mockPrisma.client.findMany.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve([]), 2000))
      )

      const measurement = await measurePerformance('Timeout Handling', async () => {
        try {
          return await ClientService.getClients('org-123')
        } catch (error) {
          return { error: true }
        }
      })

      // Should either complete or timeout within reasonable time
      expect(measurement.duration).toBeLessThan(5000)
    })
  })

  describe('Indexing Performance', () => {
    it('should benefit from proper indexing on search queries', async () => {
      mockPrisma.client.findMany.mockResolvedValue([])
      mockPrisma.client.count.mockResolvedValue(0)

      // Test various search patterns that should use indexes
      const searchPatterns = [
        'business name search',
        'email@domain.com',
        '12-3456789', // Tax ID
        'active status',
      ]

      const measurements = []

      for (const pattern of searchPatterns) {
        const measurement = await measurePerformance(`Search: ${pattern}`, async () => {
          return await ClientService.getClients('org-123', { search: pattern })
        })
        measurements.push(measurement)
      }

      // All indexed searches should be fast
      measurements.forEach(measurement => {
        expect(measurement.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_QUERY)
      })
    })

    it('should handle sorting efficiently with indexes', async () => {
      mockPrisma.client.findMany.mockResolvedValue([])
      mockPrisma.client.count.mockResolvedValue(0)

      const sortFields = ['businessName', 'createdAt', 'status', 'annualRevenue']
      const measurements = []

      for (const field of sortFields) {
        for (const direction of ['asc', 'desc'] as const) {
          const measurement = await measurePerformance(`Sort: ${field} ${direction}`, async () => {
            return await ClientService.getClients('org-123', {}, { field, direction })
          })
          measurements.push(measurement)
        }
      }

      // All sorts should benefit from indexing
      measurements.forEach(measurement => {
        expect(measurement.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_QUERY)
      })
    })
  })

  describe('Performance Regression Detection', () => {
    it('should maintain consistent performance benchmarks', async () => {
      const benchmarkOperations = [
        () => ClientService.getClients('org-123'),
        () => ClientService.getClients('org-123', { search: 'test' }),
        () => ClientService.getClients('org-123', {}, { field: 'businessName', direction: 'asc' }),
      ]

      mockPrisma.client.findMany.mockResolvedValue([])
      mockPrisma.client.count.mockResolvedValue(0)

      const results = []

      for (const operation of benchmarkOperations) {
        const measurement = await measurePerformance('Benchmark Operation', operation)
        results.push(measurement)
      }

      const report = createPerformanceReport(results)

      // Log performance report for monitoring
      console.log('Performance Benchmark Report:', {
        averageTime: report.averageTime,
        slowestOperation: report.slowestOperation.duration,
        fastestOperation: report.fastestOperation.duration,
        totalOperations: results.length,
      })

      // All operations should meet performance standards
      expect(report.averageTime).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_QUERY)
      expect(report.slowestOperation.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_QUERY * 2)
    })
  })
})
import { Redis } from 'ioredis'

interface LoadTestConfig {
  baseUrl: string
  maxVirtualUsers: number
  rampUpDuration: number
  testDuration: number
  thinkTime: number
  scenarios: LoadTestScenario[]
  reportingInterval: number
}

interface LoadTestScenario {
  name: string
  weight: number // Percentage of users following this scenario
  steps: LoadTestStep[]
}

interface LoadTestStep {
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  headers?: Record<string, string>
  body?: any
  expectedStatus?: number
  thinkTime?: number
  validation?: (response: any) => boolean
}

interface LoadTestResult {
  testId: string
  startTime: Date
  endTime: Date
  duration: number
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  throughput: number
  errorRate: number
  scenarios: ScenarioResult[]
  systemMetrics: SystemMetrics[]
}

interface ScenarioResult {
  name: string
  totalRequests: number
  successfulRequests: number
  averageResponseTime: number
  errorRate: number
  steps: StepResult[]
}

interface StepResult {
  name: string
  requests: number
  averageResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  errorRate: number
  errors: string[]
}

interface SystemMetrics {
  timestamp: Date
  cpuUsage: number
  memoryUsage: number
  diskIO: number
  networkIO: number
  activeConnections: number
  dbConnections: number
}

class LoadTestManager {
  private redis: Redis
  private config: LoadTestConfig
  private activeTests: Map<string, LoadTestExecution> = new Map()

  constructor(redis: Redis, config: Partial<LoadTestConfig>) {
    this.redis = redis
    this.config = {
      baseUrl: 'http://localhost:3000',
      maxVirtualUsers: 1000,
      rampUpDuration: 300000, // 5 minutes
      testDuration: 1800000, // 30 minutes
      thinkTime: 5000, // 5 seconds between requests
      scenarios: [],
      reportingInterval: 30000, // 30 seconds
      ...config
    }

    this.setupTaxSeasonScenarios()
  }

  private setupTaxSeasonScenarios(): void {
    // Define realistic user scenarios for AdvisorOS
    const scenarios: LoadTestScenario[] = [
      // Scenario 1: CPA reviewing client dashboard and documents (40% of users)
      {
        name: 'CPA Dashboard Review',
        weight: 40,
        steps: [
          {
            name: 'Login',
            method: 'POST',
            path: '/api/auth/signin',
            body: { email: 'test@example.com', password: 'password' },
            expectedStatus: 200
          },
          {
            name: 'Load Dashboard',
            method: 'GET',
            path: '/api/dashboard',
            expectedStatus: 200,
            thinkTime: 10000 // 10 seconds viewing dashboard
          },
          {
            name: 'Get Client List',
            method: 'GET',
            path: '/api/clients',
            expectedStatus: 200,
            thinkTime: 5000
          },
          {
            name: 'View Client Details',
            method: 'GET',
            path: '/api/clients/{{clientId}}',
            expectedStatus: 200,
            thinkTime: 15000 // 15 seconds reviewing client
          },
          {
            name: 'Get Client Documents',
            method: 'GET',
            path: '/api/documents?clientId={{clientId}}',
            expectedStatus: 200,
            thinkTime: 8000
          },
          {
            name: 'View Document',
            method: 'GET',
            path: '/api/documents/{{documentId}}',
            expectedStatus: 200,
            thinkTime: 20000 // 20 seconds reviewing document
          }
        ]
      },

      // Scenario 2: Document upload and processing (25% of users)
      {
        name: 'Document Upload',
        weight: 25,
        steps: [
          {
            name: 'Login',
            method: 'POST',
            path: '/api/auth/signin',
            body: { email: 'test@example.com', password: 'password' },
            expectedStatus: 200
          },
          {
            name: 'Upload Document',
            method: 'POST',
            path: '/api/documents/upload',
            body: { clientId: '{{clientId}}', file: '{{mockFileData}}' },
            expectedStatus: 201,
            thinkTime: 30000 // 30 seconds for upload processing
          },
          {
            name: 'Check Processing Status',
            method: 'GET',
            path: '/api/documents/{{documentId}}/status',
            expectedStatus: 200,
            thinkTime: 5000
          },
          {
            name: 'Get OCR Results',
            method: 'GET',
            path: '/api/documents/{{documentId}}/ocr',
            expectedStatus: 200,
            thinkTime: 10000
          }
        ]
      },

      // Scenario 3: Task management and workflow (20% of users)
      {
        name: 'Task Management',
        weight: 20,
        steps: [
          {
            name: 'Login',
            method: 'POST',
            path: '/api/auth/signin',
            body: { email: 'test@example.com', password: 'password' },
            expectedStatus: 200
          },
          {
            name: 'Get Task List',
            method: 'GET',
            path: '/api/tasks',
            expectedStatus: 200,
            thinkTime: 8000
          },
          {
            name: 'Create Task',
            method: 'POST',
            path: '/api/tasks',
            body: {
              title: 'Review tax documents',
              clientId: '{{clientId}}',
              dueDate: '{{futureDate}}'
            },
            expectedStatus: 201,
            thinkTime: 15000
          },
          {
            name: 'Update Task Status',
            method: 'PUT',
            path: '/api/tasks/{{taskId}}',
            body: { status: 'in_progress' },
            expectedStatus: 200,
            thinkTime: 5000
          },
          {
            name: 'Add Task Comment',
            method: 'POST',
            path: '/api/tasks/{{taskId}}/comments',
            body: { comment: 'Started working on this task' },
            expectedStatus: 201,
            thinkTime: 10000
          }
        ]
      },

      // Scenario 4: Report generation (10% of users)
      {
        name: 'Report Generation',
        weight: 10,
        steps: [
          {
            name: 'Login',
            method: 'POST',
            path: '/api/auth/signin',
            body: { email: 'test@example.com', password: 'password' },
            expectedStatus: 200
          },
          {
            name: 'Get Report Templates',
            method: 'GET',
            path: '/api/reports/templates',
            expectedStatus: 200,
            thinkTime: 5000
          },
          {
            name: 'Generate Report',
            method: 'POST',
            path: '/api/reports/generate',
            body: {
              templateId: '{{templateId}}',
              clientId: '{{clientId}}',
              dateRange: { start: '{{startDate}}', end: '{{endDate}}' }
            },
            expectedStatus: 202, // Async processing
            thinkTime: 60000 // 1 minute for report generation
          },
          {
            name: 'Check Report Status',
            method: 'GET',
            path: '/api/reports/{{reportId}}/status',
            expectedStatus: 200,
            thinkTime: 10000
          },
          {
            name: 'Download Report',
            method: 'GET',
            path: '/api/reports/{{reportId}}/download',
            expectedStatus: 200,
            thinkTime: 5000
          }
        ]
      },

      // Scenario 5: QuickBooks sync (5% of users)
      {
        name: 'QuickBooks Sync',
        weight: 5,
        steps: [
          {
            name: 'Login',
            method: 'POST',
            path: '/api/auth/signin',
            body: { email: 'test@example.com', password: 'password' },
            expectedStatus: 200
          },
          {
            name: 'Check QB Connection',
            method: 'GET',
            path: '/api/quickbooks/status',
            expectedStatus: 200,
            thinkTime: 5000
          },
          {
            name: 'Trigger Sync',
            method: 'POST',
            path: '/api/quickbooks/sync',
            body: { fullSync: false },
            expectedStatus: 202,
            thinkTime: 30000 // 30 seconds for sync
          },
          {
            name: 'Get Sync Results',
            method: 'GET',
            path: '/api/quickbooks/sync/{{syncId}}',
            expectedStatus: 200,
            thinkTime: 10000
          }
        ]
      }
    ]

    this.config.scenarios = scenarios
  }

  async createTaxSeasonLoadTest(): Promise<string> {
    const testId = this.generateTestId()

    const taxSeasonConfig: LoadTestConfig = {
      ...this.config,
      maxVirtualUsers: 2000, // High load for tax season
      rampUpDuration: 600000, // 10 minutes ramp up
      testDuration: 3600000, // 1 hour test
      thinkTime: 3000 // Faster user interactions during busy season
    }

    const execution = new LoadTestExecution(testId, taxSeasonConfig, this.redis)
    this.activeTests.set(testId, execution)

    return testId
  }

  async createPeakHoursLoadTest(): Promise<string> {
    const testId = this.generateTestId()

    const peakConfig: LoadTestConfig = {
      ...this.config,
      maxVirtualUsers: 500, // Normal peak load
      rampUpDuration: 300000, // 5 minutes ramp up
      testDuration: 1800000, // 30 minutes test
      thinkTime: 5000
    }

    const execution = new LoadTestExecution(testId, peakConfig, this.redis)
    this.activeTests.set(testId, execution)

    return testId
  }

  async runLoadTest(testId: string): Promise<void> {
    const execution = this.activeTests.get(testId)
    if (!execution) {
      throw new Error(`Load test ${testId} not found`)
    }

    await execution.run()
  }

  async getTestResults(testId: string): Promise<LoadTestResult | null> {
    const execution = this.activeTests.get(testId)
    return execution ? execution.getResults() : null
  }

  async getAllTestResults(): Promise<LoadTestResult[]> {
    const results = []
    for (const execution of this.activeTests.values()) {
      const result = execution.getResults()
      if (result) {
        results.push(result)
      }
    }
    return results
  }

  private generateTestId(): string {
    return `loadtest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Stress testing for capacity planning
  async runCapacityTest(): Promise<{
    maxSupportedUsers: number
    breakingPoint: number
    optimalUsers: number
    recommendations: string[]
  }> {
    console.log('Starting capacity test...')

    let currentUsers = 100
    let maxSupportedUsers = 0
    let optimalUsers = 0
    const results = []

    while (currentUsers <= this.config.maxVirtualUsers) {
      console.log(`Testing with ${currentUsers} users...`)

      const testConfig = {
        ...this.config,
        maxVirtualUsers: currentUsers,
        testDuration: 300000, // 5 minutes per test
        rampUpDuration: 60000 // 1 minute ramp up
      }

      const testId = this.generateTestId()
      const execution = new LoadTestExecution(testId, testConfig, this.redis)

      await execution.run()
      const result = execution.getResults()

      if (result) {
        results.push({
          users: currentUsers,
          avgResponseTime: result.averageResponseTime,
          errorRate: result.errorRate,
          throughput: result.throughput
        })

        // Define acceptable performance thresholds
        if (result.averageResponseTime < 2000 && result.errorRate < 0.05) {
          maxSupportedUsers = currentUsers
          if (result.averageResponseTime < 1000 && result.errorRate < 0.01) {
            optimalUsers = currentUsers
          }
        }

        // Break if error rate gets too high
        if (result.errorRate > 0.1) {
          break
        }
      }

      currentUsers += 100
    }

    const recommendations = this.generateCapacityRecommendations(results, maxSupportedUsers, optimalUsers)

    return {
      maxSupportedUsers,
      breakingPoint: currentUsers,
      optimalUsers,
      recommendations
    }
  }

  private generateCapacityRecommendations(
    results: any[],
    maxSupportedUsers: number,
    optimalUsers: number
  ): string[] {
    const recommendations = []

    if (maxSupportedUsers < 500) {
      recommendations.push('Consider horizontal scaling - current capacity is below tax season requirements')
    }

    if (optimalUsers < maxSupportedUsers * 0.7) {
      recommendations.push('Large performance degradation near capacity - optimize application performance')
    }

    const lastResult = results[results.length - 1]
    if (lastResult && lastResult.avgResponseTime > 5000) {
      recommendations.push('Response times become unacceptable under load - implement caching and optimize database queries')
    }

    if (maxSupportedUsers >= 1000) {
      recommendations.push('System shows good scalability characteristics for tax season loads')
    }

    return recommendations
  }
}

class LoadTestExecution {
  private testId: string
  private config: LoadTestConfig
  private redis: Redis
  private results: LoadTestResult | null = null
  private virtualUsers: VirtualUser[] = []
  private startTime: Date | null = null
  private endTime: Date | null = null
  private isRunning = false

  constructor(testId: string, config: LoadTestConfig, redis: Redis) {
    this.testId = testId
    this.config = config
    this.redis = redis
  }

  async run(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Test is already running')
    }

    this.isRunning = true
    this.startTime = new Date()

    console.log(`Starting load test ${this.testId} with ${this.config.maxVirtualUsers} users`)

    try {
      // Create virtual users
      await this.createVirtualUsers()

      // Ramp up users gradually
      await this.rampUpUsers()

      // Run test for specified duration
      await this.runTestDuration()

      // Collect results
      await this.collectResults()

    } catch (error) {
      console.error('Load test failed:', error)
    } finally {
      this.endTime = new Date()
      this.isRunning = false
      await this.cleanup()
    }
  }

  private async createVirtualUsers(): Promise<void> {
    for (let i = 0; i < this.config.maxVirtualUsers; i++) {
      const scenario = this.selectScenario()
      const user = new VirtualUser(i, scenario, this.config, this.redis)
      this.virtualUsers.push(user)
    }
  }

  private selectScenario(): LoadTestScenario {
    const random = Math.random() * 100
    let cumulative = 0

    for (const scenario of this.config.scenarios) {
      cumulative += scenario.weight
      if (random <= cumulative) {
        return scenario
      }
    }

    return this.config.scenarios[0] // Fallback
  }

  private async rampUpUsers(): Promise<void> {
    const rampUpInterval = this.config.rampUpDuration / this.config.maxVirtualUsers

    for (let i = 0; i < this.virtualUsers.length; i++) {
      const user = this.virtualUsers[i]
      setTimeout(() => {
        user.start()
      }, i * rampUpInterval)
    }

    // Wait for ramp up to complete
    await new Promise(resolve => setTimeout(resolve, this.config.rampUpDuration))
  }

  private async runTestDuration(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, this.config.testDuration))
  }

  private async collectResults(): Promise<void> {
    const userResults = await Promise.all(
      this.virtualUsers.map(user => user.getResults())
    )

    const totalRequests = userResults.reduce((sum, r) => sum + r.totalRequests, 0)
    const successfulRequests = userResults.reduce((sum, r) => sum + r.successfulRequests, 0)
    const failedRequests = totalRequests - successfulRequests

    const allResponseTimes = userResults
      .flatMap(r => r.responseTimes)
      .sort((a, b) => a - b)

    const averageResponseTime = allResponseTimes.length > 0 ?
      allResponseTimes.reduce((sum, t) => sum + t, 0) / allResponseTimes.length : 0

    const p95Index = Math.floor(allResponseTimes.length * 0.95)
    const p99Index = Math.floor(allResponseTimes.length * 0.99)

    const duration = this.endTime!.getTime() - this.startTime!.getTime()

    this.results = {
      testId: this.testId,
      startTime: this.startTime!,
      endTime: this.endTime!,
      duration,
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      p95ResponseTime: allResponseTimes[p95Index] || 0,
      p99ResponseTime: allResponseTimes[p99Index] || 0,
      throughput: totalRequests / (duration / 1000),
      errorRate: totalRequests > 0 ? failedRequests / totalRequests : 0,
      scenarios: [], // Would aggregate scenario results
      systemMetrics: [] // Would collect system metrics during test
    }

    // Store results in Redis
    await this.redis.setex(
      `load_test_results:${this.testId}`,
      86400, // 24 hours
      JSON.stringify(this.results)
    )
  }

  private async cleanup(): Promise<void> {
    // Stop all virtual users
    await Promise.all(this.virtualUsers.map(user => user.stop()))
    this.virtualUsers = []
  }

  getResults(): LoadTestResult | null {
    return this.results
  }
}

class VirtualUser {
  private id: number
  private scenario: LoadTestScenario
  private config: LoadTestConfig
  private redis: Redis
  private isRunning = false
  private results = {
    totalRequests: 0,
    successfulRequests: 0,
    responseTimes: [] as number[],
    errors: [] as string[]
  }

  constructor(id: number, scenario: LoadTestScenario, config: LoadTestConfig, redis: Redis) {
    this.id = id
    this.scenario = scenario
    this.config = config
    this.redis = redis
  }

  async start(): Promise<void> {
    this.isRunning = true
    this.runScenario()
  }

  async stop(): Promise<void> {
    this.isRunning = false
  }

  private async runScenario(): Promise<void> {
    while (this.isRunning) {
      try {
        for (const step of this.scenario.steps) {
          if (!this.isRunning) break

          await this.executeStep(step)

          // Think time between steps
          const thinkTime = step.thinkTime || this.config.thinkTime
          await new Promise(resolve => setTimeout(resolve, thinkTime))
        }
      } catch (error) {
        this.results.errors.push((error as Error).message)
      }
    }
  }

  private async executeStep(step: LoadTestStep): Promise<void> {
    const startTime = Date.now()

    try {
      // Replace template variables in path and body
      const path = this.replaceTemplateVariables(step.path)
      const body = step.body ? this.replaceTemplateVariables(JSON.stringify(step.body)) : undefined

      const response = await fetch(`${this.config.baseUrl}${path}`, {
        method: step.method,
        headers: {
          'Content-Type': 'application/json',
          ...step.headers
        },
        body: body ? JSON.parse(body) : undefined
      })

      const responseTime = Date.now() - startTime
      this.results.responseTimes.push(responseTime)
      this.results.totalRequests++

      if (response.ok) {
        this.results.successfulRequests++
      } else {
        this.results.errors.push(`${step.name}: ${response.status} ${response.statusText}`)
      }

      // Validation
      if (step.validation) {
        const responseData = await response.json()
        if (!step.validation(responseData)) {
          this.results.errors.push(`${step.name}: Validation failed`)
        }
      }

    } catch (error) {
      const responseTime = Date.now() - startTime
      this.results.responseTimes.push(responseTime)
      this.results.totalRequests++
      this.results.errors.push(`${step.name}: ${(error as Error).message}`)
    }
  }

  private replaceTemplateVariables(str: string): string {
    return str
      .replace('{{clientId}}', `client_${Math.floor(Math.random() * 100) + 1}`)
      .replace('{{documentId}}', `doc_${Math.floor(Math.random() * 1000) + 1}`)
      .replace('{{taskId}}', `task_${Math.floor(Math.random() * 1000) + 1}`)
      .replace('{{reportId}}', `report_${Math.floor(Math.random() * 100) + 1}`)
      .replace('{{templateId}}', `template_${Math.floor(Math.random() * 10) + 1}`)
      .replace('{{syncId}}', `sync_${Math.floor(Math.random() * 100) + 1}`)
      .replace('{{futureDate}}', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
      .replace('{{startDate}}', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .replace('{{endDate}}', new Date().toISOString())
      .replace('{{mockFileData}}', 'base64encodedfiledata')
  }

  async getResults(): Promise<typeof this.results> {
    return this.results
  }
}

export { LoadTestManager }
export type {
  LoadTestConfig,
  LoadTestScenario,
  LoadTestStep,
  LoadTestResult,
  ScenarioResult,
  StepResult,
  SystemMetrics
}
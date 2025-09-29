/**
 * Artillery.js Load Test Processor
 *
 * This file contains custom functions for load testing scenarios,
 * including data generation, response validation, and custom metrics.
 */

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

module.exports = {
  // Generate random test data
  generateTestData,
  // Validate API responses
  validateResponse,
  // Custom metrics collection
  collectCustomMetrics,
  // Setup functions
  setupUserSession,
  // Cleanup functions
  cleanupTestData,
  // Performance monitoring
  monitorDatabasePerformance,
  // Error handling
  handleApiError
}

/**
 * Generate realistic test data for load testing
 */
function generateTestData(context, events, done) {
  // Generate random firm data
  context.vars.firmName = `Load Test Firm ${crypto.randomInt(1000, 9999)}`
  context.vars.userEmail = `loadtest${crypto.randomInt(10000, 99999)}@advisoros.test`
  context.vars.clientName = `Client ${crypto.randomInt(100, 999)}`

  // Random document types for realistic distribution
  const documentTypes = [
    'TAX_DOCUMENTS',
    'FINANCIAL_STATEMENTS',
    'BANK_STATEMENTS',
    'RECEIPTS',
    'INVOICES',
    'CONTRACTS'
  ]
  context.vars.documentType = documentTypes[crypto.randomInt(0, documentTypes.length)]

  // Random business types
  const businessTypes = ['LLC', 'CORPORATION', 'PARTNERSHIP', 'SOLE_PROPRIETORSHIP']
  context.vars.businessType = businessTypes[crypto.randomInt(0, businessTypes.length)]

  // Simulate realistic think times based on user behavior patterns
  const thinkTimes = {
    dashboard: crypto.randomInt(2, 8), // 2-8 seconds reviewing dashboard
    clientList: crypto.randomInt(3, 10), // 3-10 seconds browsing clients
    documentUpload: crypto.randomInt(5, 20), // 5-20 seconds uploading
    dataEntry: crypto.randomInt(10, 30), // 10-30 seconds entering data
  }
  context.vars.thinkTimes = thinkTimes

  // Performance baseline expectations
  context.vars.performanceExpectations = {
    dashboardLoad: 2000, // 2 seconds max
    apiResponse: 1000, // 1 second max
    documentUpload: 30000, // 30 seconds max for large files
    aiProcessing: 60000, // 1 minute max for AI analysis
  }

  return done()
}

/**
 * Validate API responses for correctness and performance
 */
function validateResponse(requestParams, response, context, ee, next) {
  const startTime = context.vars.requestStartTime
  const responseTime = Date.now() - startTime

  // Track response times by endpoint
  const endpoint = requestParams.url.split('/').pop()
  context.vars[`${endpoint}_response_time`] = responseTime

  // Validate response structure
  if (response.statusCode === 200) {
    try {
      const data = JSON.parse(response.body)

      // Validate specific endpoint responses
      switch (endpoint) {
        case 'stats':
          validateDashboardStats(data, context, ee)
          break
        case 'list':
          validateClientList(data, context, ee)
          break
        case 'create':
          validateClientCreation(data, context, ee)
          break
        case 'analyzeDocument':
          validateAIAnalysis(data, context, ee)
          break
      }

      // Check performance thresholds
      const threshold = context.vars.performanceExpectations[endpoint.replace('.', '_')]
      if (threshold && responseTime > threshold) {
        ee.emit('counter', `performance.threshold_exceeded.${endpoint}`, 1)
        console.warn(`Performance threshold exceeded for ${endpoint}: ${responseTime}ms > ${threshold}ms`)
      }

    } catch (error) {
      ee.emit('counter', 'validation.json_parse_error', 1)
      console.error('JSON parse error:', error.message)
    }
  }

  // Track error rates
  if (response.statusCode >= 400) {
    ee.emit('counter', `errors.status_${response.statusCode}`, 1)
    ee.emit('counter', `errors.endpoint.${endpoint}`, 1)
  }

  return next()
}

/**
 * Validate dashboard stats response
 */
function validateDashboardStats(data, context, ee) {
  const requiredFields = ['clients', 'documents', 'tasks', 'revenue']

  for (const field of requiredFields) {
    if (!(field in data)) {
      ee.emit('counter', `validation.missing_field.${field}`, 1)
    } else if (typeof data[field] !== 'number' || data[field] < 0) {
      ee.emit('counter', `validation.invalid_field.${field}`, 1)
    }
  }

  // Track business metrics
  ee.emit('histogram', 'business.active_clients', data.clients || 0)
  ee.emit('histogram', 'business.total_documents', data.documents || 0)
  ee.emit('histogram', 'business.pending_tasks', data.tasks || 0)
}

/**
 * Validate client list response
 */
function validateClientList(data, context, ee) {
  if (!data.clients || !Array.isArray(data.clients)) {
    ee.emit('counter', 'validation.invalid_client_list', 1)
    return
  }

  if (!data.pagination) {
    ee.emit('counter', 'validation.missing_pagination', 1)
    return
  }

  // Validate pagination structure
  const requiredPaginationFields = ['page', 'limit', 'total', 'pages']
  for (const field of requiredPaginationFields) {
    if (!(field in data.pagination)) {
      ee.emit('counter', `validation.missing_pagination.${field}`, 1)
    }
  }

  // Track pagination efficiency
  const clientsPerPage = data.clients.length
  ee.emit('histogram', 'pagination.clients_per_page', clientsPerPage)
  ee.emit('histogram', 'pagination.total_clients', data.pagination.total || 0)
}

/**
 * Validate client creation response
 */
function validateClientCreation(data, context, ee) {
  const requiredFields = ['id', 'businessName', 'status', 'createdAt']

  for (const field of requiredFields) {
    if (!(field in data)) {
      ee.emit('counter', `validation.missing_created_client.${field}`, 1)
    }
  }

  // Validate ID format (assuming CUID)
  if (data.id && !data.id.match(/^[a-z0-9]{25}$/)) {
    ee.emit('counter', 'validation.invalid_client_id_format', 1)
  }

  // Track client creation metrics
  ee.emit('counter', 'business.clients_created', 1)
}

/**
 * Validate AI analysis response
 */
function validateAIAnalysis(data, context, ee) {
  if (!data.analysisId) {
    ee.emit('counter', 'validation.missing_analysis_id', 1)
    return
  }

  // Track AI service usage
  ee.emit('counter', 'ai.analysis_requests', 1)

  // Monitor AI processing times if status is provided
  if (data.status === 'completed' && data.processingTime) {
    ee.emit('histogram', 'ai.processing_time', data.processingTime)
  }
}

/**
 * Collect custom metrics for CPA-specific operations
 */
function collectCustomMetrics(context, events, done) {
  const ee = events

  // Start timing for this request
  context.vars.requestStartTime = Date.now()

  // Track concurrent users per organization
  const orgId = context.vars.organizationId
  if (orgId) {
    ee.emit('counter', `concurrent_users.org.${orgId}`, 1)
  }

  // Track feature usage
  const feature = context.vars.currentFeature
  if (feature) {
    ee.emit('counter', `feature_usage.${feature}`, 1)
  }

  return done()
}

/**
 * Setup user session for realistic load testing
 */
function setupUserSession(context, events, done) {
  const ee = events

  // Generate session context
  context.vars.sessionId = crypto.randomUUID()
  context.vars.organizationId = `org_loadtest_${crypto.randomInt(1, 50)}` // Simulate 50 orgs
  context.vars.userRole = Math.random() > 0.7 ? 'ADMIN' : 'USER' // 30% admins, 70% users

  // Simulate different user behavior patterns
  const userTypes = ['power_user', 'casual_user', 'new_user']
  const weights = [0.2, 0.6, 0.2] // 20% power users, 60% casual, 20% new
  const random = Math.random()

  if (random < weights[0]) {
    context.vars.userType = userTypes[0]
    context.vars.actionsPerSession = crypto.randomInt(15, 30)
  } else if (random < weights[0] + weights[1]) {
    context.vars.userType = userTypes[1]
    context.vars.actionsPerSession = crypto.randomInt(5, 15)
  } else {
    context.vars.userType = userTypes[2]
    context.vars.actionsPerSession = crypto.randomInt(2, 8)
  }

  // Track user type distribution
  ee.emit('counter', `user_types.${context.vars.userType}`, 1)

  return done()
}

/**
 * Clean up test data to prevent database bloat
 */
function cleanupTestData(context, events, done) {
  const ee = events

  // Track cleanup operations
  ee.emit('counter', 'cleanup.sessions_ended', 1)

  // In a real implementation, this would call cleanup APIs
  // to remove test data created during the load test

  return done()
}

/**
 * Monitor database performance during load testing
 */
function monitorDatabasePerformance(context, events, done) {
  const ee = events

  // Simulate database metrics collection
  // In a real implementation, this would connect to database monitoring

  // Track simulated database metrics
  const dbResponseTime = crypto.randomInt(10, 200) // Simulated DB response time
  const connectionCount = crypto.randomInt(10, 100) // Simulated connection count

  ee.emit('histogram', 'database.response_time', dbResponseTime)
  ee.emit('histogram', 'database.connections', connectionCount)

  // Alert on high database load
  if (dbResponseTime > 150) {
    ee.emit('counter', 'database.slow_queries', 1)
  }

  if (connectionCount > 80) {
    ee.emit('counter', 'database.high_connections', 1)
  }

  return done()
}

/**
 * Handle API errors during load testing
 */
function handleApiError(requestParams, response, context, ee, next) {
  if (response.statusCode >= 400) {
    const endpoint = requestParams.url.split('/').pop()
    const errorType = getErrorType(response.statusCode)

    // Log error details for analysis
    console.error(`API Error: ${response.statusCode} on ${endpoint}`, {
      url: requestParams.url,
      method: requestParams.method,
      statusCode: response.statusCode,
      body: response.body?.substring(0, 200), // First 200 chars of error
      userType: context.vars.userType,
      organizationId: context.vars.organizationId
    })

    // Track error patterns
    ee.emit('counter', `errors.type.${errorType}`, 1)
    ee.emit('counter', `errors.endpoint.${endpoint}`, 1)
    ee.emit('counter', `errors.user_type.${context.vars.userType}`, 1)

    // Track error impact on user experience
    if (errorType === 'server_error') {
      ee.emit('counter', 'user_experience.server_errors', 1)
    } else if (errorType === 'client_error') {
      ee.emit('counter', 'user_experience.client_errors', 1)
    }
  }

  return next()
}

/**
 * Categorize error types for better analysis
 */
function getErrorType(statusCode) {
  if (statusCode >= 400 && statusCode < 500) {
    switch (statusCode) {
      case 401: return 'authentication_error'
      case 403: return 'authorization_error'
      case 404: return 'not_found_error'
      case 429: return 'rate_limit_error'
      default: return 'client_error'
    }
  } else if (statusCode >= 500) {
    switch (statusCode) {
      case 502: return 'bad_gateway_error'
      case 503: return 'service_unavailable_error'
      case 504: return 'gateway_timeout_error'
      default: return 'server_error'
    }
  }
  return 'unknown_error'
}

/**
 * Generate realistic file data for upload testing
 */
function generateFileData(context, events, done) {
  // Generate different file types with realistic sizes
  const fileTypes = [
    { type: 'pdf', size: crypto.randomInt(100000, 5000000), mimeType: 'application/pdf' },
    { type: 'xlsx', size: crypto.randomInt(50000, 2000000), mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    { type: 'png', size: crypto.randomInt(200000, 3000000), mimeType: 'image/png' },
    { type: 'jpg', size: crypto.randomInt(100000, 2000000), mimeType: 'image/jpeg' }
  ]

  const selectedFile = fileTypes[crypto.randomInt(0, fileTypes.length)]
  context.vars.uploadFile = {
    name: `loadtest-${crypto.randomUUID()}.${selectedFile.type}`,
    size: selectedFile.size,
    mimeType: selectedFile.mimeType,
    content: Buffer.alloc(selectedFile.size, 'x') // Dummy content
  }

  return done()
}

/**
 * Simulate realistic user navigation patterns
 */
function simulateUserBehavior(context, events, done) {
  const ee = events

  // Define navigation patterns based on user type
  const navigationPatterns = {
    power_user: ['dashboard', 'clients', 'documents', 'reports', 'settings'],
    casual_user: ['dashboard', 'clients', 'documents'],
    new_user: ['dashboard', 'help', 'clients']
  }

  const userType = context.vars.userType
  const availablePages = navigationPatterns[userType] || navigationPatterns.casual_user

  // Simulate page sequence
  context.vars.currentPage = availablePages[crypto.randomInt(0, availablePages.length)]
  context.vars.previousPage = context.vars.currentPage || 'dashboard'

  // Track navigation patterns
  ee.emit('counter', `navigation.${context.vars.previousPage}_to_${context.vars.currentPage}`, 1)

  return done()
}
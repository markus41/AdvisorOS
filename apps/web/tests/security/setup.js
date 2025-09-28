// Security test setup

// Mock security-related modules
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
}))

jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
  createHash: jest.fn(),
  createHmac: jest.fn(),
  timingSafeEqual: jest.fn(),
}))

// Mock rate limiting
global.mockRateLimit = {
  attempts: new Map(),
  reset: () => {
    global.mockRateLimit.attempts.clear()
  },
  check: (key, limit, window) => {
    const now = Date.now()
    const attempts = global.mockRateLimit.attempts.get(key) || []
    const validAttempts = attempts.filter(time => now - time < window * 1000)

    if (validAttempts.length >= limit) {
      return true // Rate limited
    }

    validAttempts.push(now)
    global.mockRateLimit.attempts.set(key, validAttempts)
    return false // Not rate limited
  }
}

// Security test helpers
global.createMaliciousPayload = (type) => {
  const payloads = {
    xss: '<script>alert("XSS")</script>',
    sqlInjection: "'; DROP TABLE users; --",
    pathTraversal: '../../../etc/passwd',
    cmdInjection: '; cat /etc/passwd',
    jsonInjection: '{"__proto__": {"admin": true}}',
    xxe: '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>',
    csrf: 'malicious_csrf_token',
    headerInjection: 'test\r\nSet-Cookie: admin=true',
    ldapInjection: '*)(uid=*))(|(uid=*',
    nosqlInjection: '{"$ne": null}',
  }

  return payloads[type] || 'malicious_input'
}

global.createLargePayload = (size = 1024 * 1024) => {
  return 'A'.repeat(size)
}

global.simulateSlowRequest = (delay = 5000) => {
  return new Promise(resolve => setTimeout(resolve, delay))
}

// Mock JWT for security tests
global.mockJWT = {
  validToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  expiredToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcf_h59nIc2Wk8H0Mx2Gg7SS7LMdpouWNjdJ5CKGY',
  malformedToken: 'not.a.valid.token',
  tamperedToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNTE2MjM5MDIyfQ.invalidSignature'
}

// Security assertion helpers
global.expectSecureHeaders = (response) => {
  expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff')
  expect(response.headers).toHaveProperty('x-frame-options', 'DENY')
  expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block')
  expect(response.headers).toHaveProperty('strict-transport-security')
  expect(response.headers).toHaveProperty('content-security-policy')
}

global.expectNoSensitiveDataInResponse = (response) => {
  const sensitivePatterns = [
    /password/i,
    /secret/i,
    /token/i,
    /key/i,
    /hash/i,
    /salt/i,
  ]

  const responseText = JSON.stringify(response.data || response.body || '')

  sensitivePatterns.forEach(pattern => {
    expect(responseText).not.toMatch(pattern)
  })
}

global.expectSanitizedInput = (input, output) => {
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /DROP\s+TABLE/i,
    /UNION\s+SELECT/i,
    /\.\.\//,
  ]

  maliciousPatterns.forEach(pattern => {
    if (pattern.test(input)) {
      expect(output).not.toMatch(pattern)
    }
  })
}

// Rate limiting test helper
global.testRateLimit = async (requestFn, limit, windowMs) => {
  const requests = []

  // Make requests up to the limit
  for (let i = 0; i < limit; i++) {
    requests.push(await requestFn())
  }

  // All should succeed
  requests.forEach(response => {
    expect(response.status).not.toBe(429)
  })

  // Next request should be rate limited
  const rateLimitedResponse = await requestFn()
  expect(rateLimitedResponse.status).toBe(429)

  return rateLimitedResponse
}

// Security constants
global.SECURITY_THRESHOLDS = {
  MAX_REQUEST_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_REQUEST_TIME: 30000, // 30 seconds
  MIN_PASSWORD_ENTROPY: 50,
  MAX_LOGIN_ATTEMPTS: 5,
  RATE_LIMIT_WINDOW: 3600, // 1 hour
}
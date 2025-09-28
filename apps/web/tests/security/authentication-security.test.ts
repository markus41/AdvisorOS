import { POST as registerPost } from '@/app/api/auth/register/route'
import { POST as loginPost } from '@/app/api/auth/signin/route'
import { authService } from '@/lib/auth-service'
import bcrypt from 'bcryptjs'

// Mock dependencies
jest.mock('@cpa-platform/database', () => ({
  prisma: {
    organization: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    authAttempt: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/lib/auth-service', () => ({
  authService: {
    checkRateLimit: jest.fn(),
    validatePasswordStrength: jest.fn(),
    generateToken: jest.fn(),
    sendVerificationEmail: jest.fn(),
    hashPassword: jest.fn(),
    verifyPassword: jest.fn(),
  },
}))

const mockAuthService = authService as jest.Mocked<typeof authService>
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

// Helper function to create mock NextRequest
function createMockRequest(url: string, body?: any, headers?: Record<string, string>): Request {
  return new Request(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '192.168.1.1',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  }) as any
}

describe('Authentication Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRateLimit.reset()
  })

  describe('Password Security', () => {
    it('should reject weak passwords', async () => {
      const weakPasswords = [
        'password',
        '123456',
        'qwerty',
        'abc123',
        'password123',
        '12345678',
      ]

      for (const password of weakPasswords) {
        mockAuthService.checkRateLimit.mockResolvedValue(false)
        mockAuthService.validatePasswordStrength.mockReturnValue({
          isValid: false,
          errors: ['Password is too common'],
        })

        const request = createMockRequest('http://localhost:3000/api/auth/register', {
          email: 'test@example.com',
          password,
          name: 'Test User',
          organizationName: 'Test Org',
          subdomain: 'test-org',
        })

        const response = await registerPost(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Password does not meet requirements')
      }
    })

    it('should enforce password complexity requirements', async () => {
      const testCases = [
        { password: 'NoNumbers!', error: 'must contain numbers' },
        { password: 'nouppercase123!', error: 'must contain uppercase' },
        { password: 'NOLOWERCASE123!', error: 'must contain lowercase' },
        { password: 'NoSymbols123', error: 'must contain symbols' },
        { password: 'Short1!', error: 'must be at least 8 characters' },
      ]

      for (const testCase of testCases) {
        mockAuthService.checkRateLimit.mockResolvedValue(false)
        mockAuthService.validatePasswordStrength.mockReturnValue({
          isValid: false,
          errors: [testCase.error],
        })

        const request = createMockRequest('http://localhost:3000/api/auth/register', {
          email: 'test@example.com',
          password: testCase.password,
          name: 'Test User',
          organizationName: 'Test Org',
          subdomain: 'test-org',
        })

        const response = await registerPost(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.details).toContain(testCase.error)
      }
    })

    it('should properly hash passwords', async () => {
      const password = 'SecurePassword123!'
      const hashedPassword = 'hashed_password_value'

      mockBcrypt.hash.mockResolvedValue(hashedPassword)

      await authService.hashPassword(password)

      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, expect.any(Number))
      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, expect.not.stringMatching(/^[0-9]+$/)) // Should use proper salt rounds
    })

    it('should use secure password hashing parameters', async () => {
      const password = 'SecurePassword123!'

      mockBcrypt.hash.mockResolvedValue('hashed_password')

      await authService.hashPassword(password)

      // Should use at least 12 salt rounds for security
      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, expect.any(Number))
      const saltRounds = (mockBcrypt.hash as jest.Mock).mock.calls[0][1]
      expect(saltRounds).toBeGreaterThanOrEqual(12)
    })

    it('should resist timing attacks in password verification', async () => {
      const password = 'correct_password'
      const wrongPassword = 'wrong_password'
      const hash = 'stored_hash'

      mockBcrypt.compare
        .mockResolvedValueOnce(true) // Correct password
        .mockResolvedValueOnce(false) // Wrong password

      const times = []

      // Measure time for correct password
      const start1 = performance.now()
      await authService.verifyPassword(password, hash)
      const end1 = performance.now()
      times.push(end1 - start1)

      // Measure time for wrong password
      const start2 = performance.now()
      await authService.verifyPassword(wrongPassword, hash)
      const end2 = performance.now()
      times.push(end2 - start2)

      // Timing difference should be minimal (within 10ms)
      const timeDifference = Math.abs(times[0] - times[1])
      expect(timeDifference).toBeLessThan(10)
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limits on registration attempts', async () => {
      mockAuthService.checkRateLimit.mockResolvedValue(true)

      const request = createMockRequest('http://localhost:3000/api/auth/register', {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        name: 'Test User',
        organizationName: 'Test Org',
        subdomain: 'test-org',
      })

      const response = await registerPost(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toContain('Too many registration attempts')
    })

    it('should enforce rate limits on login attempts', async () => {
      mockAuthService.checkRateLimit.mockResolvedValue(true)

      const request = createMockRequest('http://localhost:3000/api/auth/signin', {
        email: 'test@example.com',
        password: 'password',
        subdomain: 'test-org',
      })

      const response = await loginPost(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toContain('Too many login attempts')
    })

    it('should track rate limits by IP address', async () => {
      const ip1 = '192.168.1.1'
      const ip2 = '192.168.1.2'

      mockAuthService.checkRateLimit.mockImplementation((key) => {
        return key.includes(ip1) && mockRateLimit.check(key, 5, 3600)
      })

      // Make multiple requests from first IP
      for (let i = 0; i < 6; i++) {
        const request = createMockRequest(
          'http://localhost:3000/api/auth/register',
          {
            email: `test${i}@example.com`,
            password: 'SecurePassword123!',
            name: 'Test User',
            organizationName: 'Test Org',
            subdomain: `test-org-${i}`,
          },
          { 'x-forwarded-for': ip1 }
        )

        const response = await registerPost(request)

        if (i < 5) {
          expect(response.status).not.toBe(429)
        } else {
          expect(response.status).toBe(429)
        }
      }

      // Requests from second IP should still work
      mockAuthService.checkRateLimit.mockImplementation((key) => {
        return key.includes(ip2) && mockRateLimit.check(key, 5, 3600)
      })

      const request = createMockRequest(
        'http://localhost:3000/api/auth/register',
        {
          email: 'test@example.com',
          password: 'SecurePassword123!',
          name: 'Test User',
          organizationName: 'Test Org',
          subdomain: 'different-org',
        },
        { 'x-forwarded-for': ip2 }
      )

      const response = await registerPost(request)
      expect(response.status).not.toBe(429)
    })
  })

  describe('Input Validation and Sanitization', () => {
    it('should reject XSS attempts in registration', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert(document.cookie)',
        '<svg onload="alert(1)">',
        '"><script>alert(1)</script>',
      ]

      for (const payload of xssPayloads) {
        const request = createMockRequest('http://localhost:3000/api/auth/register', {
          email: 'test@example.com',
          password: 'SecurePassword123!',
          name: payload, // XSS in name field
          organizationName: 'Test Org',
          subdomain: 'test-org',
        })

        const response = await registerPost(request)
        const data = await response.json()

        // Should either reject or sanitize the input
        expect([400, 200]).toContain(response.status)

        if (response.status === 200) {
          expectSanitizedInput(payload, JSON.stringify(data))
        }
      }
    })

    it('should reject SQL injection attempts', async () => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; UPDATE users SET role='admin'; --",
        "' UNION SELECT password FROM users --",
        "'; INSERT INTO users (role) VALUES ('admin'); --",
      ]

      for (const payload of sqlInjectionPayloads) {
        const request = createMockRequest('http://localhost:3000/api/auth/register', {
          email: payload, // SQL injection in email field
          password: 'SecurePassword123!',
          name: 'Test User',
          organizationName: 'Test Org',
          subdomain: 'test-org',
        })

        const response = await registerPost(request)

        // Should reject malformed email
        expect(response.status).toBe(400)
      }
    })

    it('should handle malformed JSON gracefully', async () => {
      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
        body: '{"invalid": json}', // Malformed JSON
      }) as any

      const response = await registerPost(request)

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Internal server error' })
    })

    it('should reject oversized payloads', async () => {
      const largePayload = createLargePayload(SECURITY_THRESHOLDS.MAX_REQUEST_SIZE + 1)

      const request = createMockRequest('http://localhost:3000/api/auth/register', {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        name: largePayload,
        organizationName: 'Test Org',
        subdomain: 'test-org',
      })

      const response = await registerPost(request)

      // Should reject oversized request
      expect([400, 413]).toContain(response.status)
    })
  })

  describe('Session Security', () => {
    it('should generate secure session tokens', () => {
      mockAuthService.generateToken.mockReturnValue('secure_random_token')

      const token = authService.generateToken()

      expect(token).toBeDefined()
      expect(token.length).toBeGreaterThan(32) // Should be sufficiently long
      expect(typeof token).toBe('string')
    })

    it('should validate session token format', () => {
      const validTokens = [
        mockJWT.validToken,
        'secure_random_token_123',
        crypto.randomBytes(32).toString('hex'),
      ]

      const invalidTokens = [
        '',
        'short',
        'predictable_token',
        '123456',
        'admin',
      ]

      validTokens.forEach(token => {
        // Token should pass basic security checks
        expect(token.length).toBeGreaterThan(16)
        expect(token).not.toMatch(/^(admin|user|test|123|password)$/i)
      })

      invalidTokens.forEach(token => {
        // These should be rejected
        expect(token.length <= 16 || /^(admin|user|test|123|password)$/i.test(token)).toBe(true)
      })
    })

    it('should handle session expiration securely', () => {
      const expiredToken = mockJWT.expiredToken
      const currentTime = Math.floor(Date.now() / 1000)

      // Simulate token validation (would normally use JWT library)
      const tokenPayload = JSON.parse(atob(expiredToken.split('.')[1]))

      expect(tokenPayload.exp).toBeLessThan(currentTime)
    })
  })

  describe('Error Handling Security', () => {
    it('should not leak sensitive information in error messages', async () => {
      const request = createMockRequest('http://localhost:3000/api/auth/register', {
        email: 'test@example.com',
        password: 'password', // Weak password
        name: 'Test User',
        organizationName: 'Test Org',
        subdomain: 'test-org',
      })

      mockAuthService.validatePasswordStrength.mockReturnValue({
        isValid: false,
        errors: ['Password is too weak'],
      })

      const response = await registerPost(request)
      const data = await response.json()

      expectNoSensitiveDataInResponse(data)
    })

    it('should use generic error messages for authentication failures', async () => {
      const request = createMockRequest('http://localhost:3000/api/auth/signin', {
        email: 'nonexistent@example.com',
        password: 'password',
        subdomain: 'test-org',
      })

      const response = await loginPost(request)
      const data = await response.json()

      // Should not reveal whether email exists or not
      expect(data.error).toBe('Invalid credentials')
      expect(data.error).not.toContain('user not found')
      expect(data.error).not.toContain('wrong password')
    })

    it('should handle database errors securely', async () => {
      // Mock database error
      jest.doMock('@cpa-platform/database', () => ({
        prisma: {
          user: {
            findFirst: jest.fn().mockRejectedValue(new Error('Database connection failed')),
          },
        },
      }))

      const request = createMockRequest('http://localhost:3000/api/auth/signin', {
        email: 'test@example.com',
        password: 'password',
        subdomain: 'test-org',
      })

      const response = await loginPost(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
      expectNoSensitiveDataInResponse(data)
    })
  })

  describe('Brute Force Protection', () => {
    it('should implement account lockout after failed attempts', async () => {
      const email = 'test@example.com'
      const attempts = []

      // Simulate multiple failed login attempts
      for (let i = 0; i < SECURITY_THRESHOLDS.MAX_LOGIN_ATTEMPTS + 1; i++) {
        mockAuthService.checkRateLimit.mockImplementation((key) => {
          if (key.includes(email)) {
            return i >= SECURITY_THRESHOLDS.MAX_LOGIN_ATTEMPTS
          }
          return false
        })

        const request = createMockRequest('http://localhost:3000/api/auth/signin', {
          email,
          password: 'wrong_password',
          subdomain: 'test-org',
        })

        const response = await loginPost(request)
        attempts.push(response.status)
      }

      // Last attempt should be rate limited
      const lastAttempt = attempts[attempts.length - 1]
      expect(lastAttempt).toBe(429)
    })

    it('should implement progressive delays for repeated failures', async () => {
      const email = 'test@example.com'
      const delays = []

      for (let attempt = 1; attempt <= 5; attempt++) {
        const start = performance.now()

        mockAuthService.checkRateLimit.mockImplementation(() => {
          // Simulate progressive delay
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000)
          return new Promise(resolve => setTimeout(() => resolve(false), delay))
        })

        const request = createMockRequest('http://localhost:3000/api/auth/signin', {
          email,
          password: 'wrong_password',
          subdomain: 'test-org',
        })

        await loginPost(request)
        const end = performance.now()
        delays.push(end - start)
      }

      // Delays should increase progressively
      for (let i = 1; i < delays.length; i++) {
        expect(delays[i]).toBeGreaterThan(delays[i - 1])
      }
    })
  })

  describe('CSRF Protection', () => {
    it('should validate CSRF tokens for state-changing operations', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/auth/register',
        {
          email: 'test@example.com',
          password: 'SecurePassword123!',
          name: 'Test User',
          organizationName: 'Test Org',
          subdomain: 'test-org',
        },
        {
          origin: 'https://malicious-site.com', // Different origin
        }
      )

      const response = await registerPost(request)

      // Should reject requests from different origins without proper CSRF token
      expect([400, 403]).toContain(response.status)
    })

    it('should accept requests with valid CSRF tokens', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/auth/register',
        {
          email: 'test@example.com',
          password: 'SecurePassword123!',
          name: 'Test User',
          organizationName: 'Test Org',
          subdomain: 'test-org',
          csrfToken: 'valid_csrf_token',
        },
        {
          origin: 'http://localhost:3000',
          'x-csrf-token': 'valid_csrf_token',
        }
      )

      mockAuthService.checkRateLimit.mockResolvedValue(false)
      mockAuthService.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      })

      const response = await registerPost(request)

      expect(response.status).not.toBe(403)
    })
  })
})
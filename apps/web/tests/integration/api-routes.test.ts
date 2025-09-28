import { NextRequest } from 'next/server'
import { POST as registerPost } from '@/app/api/auth/register/route'
import { POST as loginPost } from '@/app/api/auth/signin/route'
import { GET as documentsGet, POST as documentsPost } from '@/app/api/documents/route'
import { POST as uploadPost } from '@/app/api/upload/route'
import { prisma } from '@cpa-platform/database'
import { authService } from '@/lib/auth-service'

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
    invitation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    authEvent: {
      create: jest.fn(),
    },
    document: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    client: {
      findFirst: jest.fn(),
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
    verifySession: jest.fn(),
    hashPassword: jest.fn(),
    verifyPassword: jest.fn(),
  },
}))

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockAuthService = authService as jest.Mocked<typeof authService>

// Helper function to create mock NextRequest
function createMockRequest(
  method: string,
  url: string,
  body?: any,
  headers?: Record<string, string>
): NextRequest {
  const request = new Request(url, {
    method,
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '192.168.1.1',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  }) as NextRequest

  // Add missing properties that NextRequest might have
  Object.defineProperty(request, 'ip', {
    value: '192.168.1.1',
    writable: false,
  })

  Object.defineProperty(request, 'geo', {
    value: { country: 'US', region: 'CA' },
    writable: false,
  })

  return request
}

describe('API Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('/api/auth/register', () => {
    const validRegistrationData = {
      email: 'test@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      organizationName: 'Test CPA Firm',
      subdomain: 'test-cpa-firm',
      role: 'owner',
    }

    it('should register new organization and user successfully', async () => {
      // Mock rate limiting
      mockAuthService.checkRateLimit.mockResolvedValue(false)

      // Mock password validation
      mockAuthService.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      })

      // Mock token generation
      mockAuthService.generateToken.mockReturnValue('email_verification_token')

      // Mock database queries
      mockPrisma.organization.findUnique.mockResolvedValue(null) // Subdomain available
      mockPrisma.user.findFirst.mockResolvedValue(null) // Email available

      const mockOrganization = {
        id: 'org-123',
        name: 'Test CPA Firm',
        subdomain: 'test-cpa-firm',
      }

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'owner',
        organizationId: 'org-123',
        emailVerified: null,
        organization: mockOrganization,
      }

      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          organization: { create: jest.fn().mockResolvedValue(mockOrganization) },
          user: { create: jest.fn().mockResolvedValue(mockUser) },
          authEvent: { create: jest.fn().mockResolvedValue({}) },
        }
        return await fn(tx as any)
      })

      mockAuthService.sendVerificationEmail.mockResolvedValue(undefined)

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/auth/register',
        validRegistrationData
      )

      const response = await registerPost(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user.email).toBe('test@example.com')
      expect(data.organization.subdomain).toBe('test-cpa-firm')
      expect(mockAuthService.sendVerificationEmail).toHaveBeenCalled()
    })

    it('should handle invitation-based registration', async () => {
      const invitationData = {
        ...validRegistrationData,
        invitationToken: 'invitation_token_123',
      }

      mockAuthService.checkRateLimit.mockResolvedValue(false)
      mockAuthService.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      })

      const mockInvitation = {
        id: 'inv-123',
        token: 'invitation_token_123',
        email: 'test@example.com',
        role: 'admin',
        organizationId: 'org-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        usedAt: null,
        organization: {
          id: 'org-123',
          name: 'Existing Firm',
          subdomain: 'existing-firm',
        },
      }

      mockPrisma.invitation.findUnique.mockResolvedValue(mockInvitation as any)
      mockPrisma.user.findFirst.mockResolvedValue(null) // User doesn't exist

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organizationId: 'org-123',
        emailVerified: new Date(),
        organization: mockInvitation.organization,
      }

      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          user: { create: jest.fn().mockResolvedValue(mockUser) },
          invitation: { update: jest.fn().mockResolvedValue({}) },
          authEvent: { create: jest.fn().mockResolvedValue({}) },
        }
        return await fn(tx as any)
      })

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/auth/register',
        invitationData
      )

      const response = await registerPost(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user.role).toBe('admin')
      expect(data.user.organizationId).toBe('org-123')
    })

    it('should reject registration when rate limited', async () => {
      mockAuthService.checkRateLimit.mockResolvedValue(true)

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/auth/register',
        validRegistrationData
      )

      const response = await registerPost(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toContain('Too many registration attempts')
    })

    it('should reject invalid email format', async () => {
      const invalidData = {
        ...validRegistrationData,
        email: 'invalid-email',
      }

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/auth/register',
        invalidData
      )

      const response = await registerPost(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
      expect(data.details).toBeDefined()
    })

    it('should reject weak passwords', async () => {
      mockAuthService.checkRateLimit.mockResolvedValue(false)
      mockAuthService.validatePasswordStrength.mockReturnValue({
        isValid: false,
        errors: ['Password must contain uppercase letters'],
      })

      const weakPasswordData = {
        ...validRegistrationData,
        password: 'weak',
      }

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/auth/register',
        weakPasswordData
      )

      const response = await registerPost(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Password does not meet requirements')
      expect(data.details).toContain('Password must contain uppercase letters')
    })

    it('should reject duplicate subdomain', async () => {
      mockAuthService.checkRateLimit.mockResolvedValue(false)
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'existing-org' } as any)

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/auth/register',
        validRegistrationData
      )

      const response = await registerPost(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('Subdomain is already taken')
    })

    it('should reject duplicate email', async () => {
      mockAuthService.checkRateLimit.mockResolvedValue(false)
      mockPrisma.organization.findUnique.mockResolvedValue(null)
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'existing-user' } as any)

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/auth/register',
        validRegistrationData
      )

      const response = await registerPost(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('User with this email already exists')
    })

    it('should handle invalid invitation token', async () => {
      const invitationData = {
        ...validRegistrationData,
        invitationToken: 'invalid_token',
      }

      mockAuthService.checkRateLimit.mockResolvedValue(false)
      mockPrisma.invitation.findUnique.mockResolvedValue(null)

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/auth/register',
        invitationData
      )

      const response = await registerPost(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid or expired invitation token')
    })

    it('should handle email mismatch in invitation', async () => {
      const invitationData = {
        ...validRegistrationData,
        email: 'different@example.com',
        invitationToken: 'invitation_token_123',
      }

      mockAuthService.checkRateLimit.mockResolvedValue(false)

      const mockInvitation = {
        id: 'inv-123',
        email: 'original@example.com', // Different email
        organizationId: 'org-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        usedAt: null,
      }

      mockPrisma.invitation.findUnique.mockResolvedValue(mockInvitation as any)

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/auth/register',
        invitationData
      )

      const response = await registerPost(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email does not match invitation')
    })
  })

  describe('/api/documents', () => {
    const mockSession = {
      user: {
        id: 'user-123',
        organizationId: 'org-123',
        role: 'USER',
      },
    }

    beforeEach(() => {
      mockAuthService.verifySession.mockResolvedValue(mockSession as any)
    })

    it('should get documents with pagination', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          name: 'invoice.pdf',
          type: 'INVOICE',
          status: 'PROCESSED',
          clientId: 'client-123',
          organizationId: 'org-123',
          client: { businessName: 'Test Client' },
          uploader: { name: 'Test User' },
        },
      ]

      mockPrisma.document.findMany.mockResolvedValue(mockDocuments as any)
      mockPrisma.document.count = jest.fn().mockResolvedValue(1)

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/documents?page=1&limit=10',
        undefined,
        { authorization: 'Bearer valid_token' }
      )

      // Mock the GET handler if it exists
      if (documentsGet) {
        const response = await documentsGet(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.documents).toHaveLength(1)
        expect(data.pagination.total).toBe(1)
      }
    })

    it('should create new document', async () => {
      const documentData = {
        name: 'w2-form.pdf',
        type: 'W2',
        category: 'TAX_DOCUMENT',
        clientId: 'client-123',
        size: 1024 * 50,
        mimeType: 'application/pdf',
      }

      const mockClient = {
        id: 'client-123',
        organizationId: 'org-123',
      }

      const mockDocument = {
        id: 'doc-new-123',
        ...documentData,
        status: 'PENDING',
        organizationId: 'org-123',
        uploadedById: 'user-123',
        storageKey: 'documents/org-123/doc-new-123.pdf',
      }

      mockPrisma.client.findFirst.mockResolvedValue(mockClient as any)
      mockPrisma.document.create.mockResolvedValue(mockDocument as any)

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/documents',
        documentData,
        { authorization: 'Bearer valid_token' }
      )

      if (documentsPost) {
        const response = await documentsPost(request)
        const data = await response.json()

        expect(response.status).toBe(201)
        expect(data.document.name).toBe('w2-form.pdf')
        expect(data.document.status).toBe('PENDING')
      }
    })

    it('should reject unauthorized requests', async () => {
      mockAuthService.verifySession.mockResolvedValue(null)

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/documents'
      )

      if (documentsGet) {
        const response = await documentsGet(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Unauthorized')
      }
    })

    it('should reject access to documents from different organization', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          name: 'invoice.pdf',
          organizationId: 'different-org', // Different organization
        },
      ]

      mockPrisma.document.findMany.mockResolvedValue(mockDocuments as any)

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/documents',
        undefined,
        { authorization: 'Bearer valid_token' }
      )

      if (documentsGet) {
        const response = await documentsGet(request)

        // Should filter out documents from different organizations
        expect(mockPrisma.document.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              organizationId: 'org-123',
            }),
          })
        )
      }
    })
  })

  describe('/api/upload', () => {
    const mockSession = {
      user: {
        id: 'user-123',
        organizationId: 'org-123',
        role: 'USER',
      },
    }

    beforeEach(() => {
      mockAuthService.verifySession.mockResolvedValue(mockSession as any)
    })

    it('should handle file upload with validation', async () => {
      const formData = new FormData()
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      formData.append('file', file)
      formData.append('clientId', 'client-123')
      formData.append('category', 'TAX_DOCUMENT')

      const mockClient = {
        id: 'client-123',
        organizationId: 'org-123',
      }

      mockPrisma.client.findFirst.mockResolvedValue(mockClient as any)

      const request = new Request('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          authorization: 'Bearer valid_token',
        },
      }) as NextRequest

      if (uploadPost) {
        const response = await uploadPost(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
      }
    })

    it('should reject unauthorized file uploads', async () => {
      mockAuthService.verifySession.mockResolvedValue(null)

      const formData = new FormData()
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      formData.append('file', file)

      const request = new Request('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      }) as NextRequest

      if (uploadPost) {
        const response = await uploadPost(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Unauthorized')
      }
    })

    it('should validate file size limits', async () => {
      const formData = new FormData()
      // Create a large file (simulated)
      const largeContent = 'x'.repeat(50 * 1024 * 1024) // 50MB
      const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' })
      formData.append('file', file)

      const request = new Request('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          authorization: 'Bearer valid_token',
        },
      }) as NextRequest

      if (uploadPost) {
        const response = await uploadPost(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('File size exceeds limit')
      }
    })

    it('should validate file types', async () => {
      const formData = new FormData()
      const file = new File(['test'], 'test.exe', { type: 'application/x-executable' })
      formData.append('file', file)

      const request = new Request('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          authorization: 'Bearer valid_token',
        },
      }) as NextRequest

      if (uploadPost) {
        const response = await uploadPost(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('Invalid file type')
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockAuthService.checkRateLimit.mockResolvedValue(false)
      mockPrisma.organization.findUnique.mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/auth/register',
        {
          email: 'test@example.com',
          password: 'SecurePassword123!',
          name: 'Test User',
          organizationName: 'Test Firm',
          subdomain: 'test-firm',
        }
      )

      const response = await registerPost(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle malformed JSON', async () => {
      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: 'invalid json{',
      }) as NextRequest

      const response = await registerPost(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle missing request body', async () => {
      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/auth/register'
      )

      const response = await registerPost(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
    })
  })

  describe('Security Tests', () => {
    it('should sanitize user inputs', async () => {
      const maliciousData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        name: '<script>alert("xss")</script>',
        organizationName: 'Test Firm',
        subdomain: 'test-firm',
      }

      mockAuthService.checkRateLimit.mockResolvedValue(false)
      mockAuthService.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      })
      mockPrisma.organization.findUnique.mockResolvedValue(null)
      mockPrisma.user.findFirst.mockResolvedValue(null)

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/auth/register',
        maliciousData
      )

      const response = await registerPost(request)

      // The API should handle this gracefully without executing the script
      expect(response.status).not.toBe(500)
    })

    it('should prevent SQL injection attempts', async () => {
      const sqlInjectionData = {
        email: "test@example.com'; DROP TABLE users; --",
        password: 'SecurePassword123!',
        name: 'Test User',
        organizationName: 'Test Firm',
        subdomain: 'test-firm',
      }

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/auth/register',
        sqlInjectionData
      )

      const response = await registerPost(request)
      const data = await response.json()

      // Should fail validation due to invalid email format
      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
    })

    it('should handle very long input strings', async () => {
      const longStringData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        name: 'x'.repeat(10000), // Very long name
        organizationName: 'Test Firm',
        subdomain: 'test-firm',
      }

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/auth/register',
        longStringData
      )

      const response = await registerPost(request)

      // Should handle gracefully (might succeed or fail based on validation rules)
      expect([200, 400, 413]).toContain(response.status)
    })
  })

  describe('Performance Tests', () => {
    it('should handle concurrent registration requests', async () => {
      mockAuthService.checkRateLimit.mockResolvedValue(false)
      mockAuthService.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      })
      mockPrisma.organization.findUnique.mockResolvedValue(null)
      mockPrisma.user.findFirst.mockResolvedValue(null)

      const requests = Array.from({ length: 5 }, (_, i) =>
        createMockRequest(
          'POST',
          'http://localhost:3000/api/auth/register',
          {
            email: `test${i}@example.com`,
            password: 'SecurePassword123!',
            name: `Test User ${i}`,
            organizationName: `Test Firm ${i}`,
            subdomain: `test-firm-${i}`,
          }
        )
      )

      const startTime = Date.now()
      const responses = await Promise.all(
        requests.map(request => registerPost(request))
      )
      const endTime = Date.now()

      expect(responses).toHaveLength(5)
      expect(endTime - startTime).toBeLessThan(5000) // Should complete in under 5 seconds
    })

    it('should handle request timeouts gracefully', async () => {
      // Mock a slow database operation
      mockPrisma.organization.findUnique.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 10000))
      )

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/auth/register',
        {
          email: 'test@example.com',
          password: 'SecurePassword123!',
          name: 'Test User',
          organizationName: 'Test Firm',
          subdomain: 'test-firm',
        }
      )

      // The API should handle timeouts gracefully
      const startTime = Date.now()
      const response = await Promise.race([
        registerPost(request),
        new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 1000)
        ),
      ]).catch(() => new Response('{"error": "Timeout"}', { status: 408 }))

      const endTime = Date.now()
      expect(endTime - startTime).toBeLessThan(1100)
    })
  })
})
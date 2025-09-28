import { PrismaClient } from '@prisma/client'
import { mockOrganization, mockAdminUser, mockClient, mockDocument } from '../fixtures/test-data'

// Use the global prisma instance from setup
declare global {
  var prisma: PrismaClient
  var createTestOrganization: (overrides?: any) => Promise<any>
  var createTestUser: (organizationId: string, overrides?: any) => Promise<any>
  var createTestClient: (organizationId: string, overrides?: any) => Promise<any>
}

describe('Database Integration Tests', () => {
  describe('Organization operations', () => {
    it('should create an organization', async () => {
      const organization = await createTestOrganization({
        name: 'Test CPA Firm',
        subdomain: 'test-cpa-firm',
      })

      expect(organization).toMatchObject({
        name: 'Test CPA Firm',
        subdomain: 'test-cpa-firm',
        subscriptionTier: 'trial',
      })
      expect(organization.id).toBeDefined()
      expect(organization.createdAt).toBeDefined()
    })

    it('should enforce unique subdomain constraint', async () => {
      await createTestOrganization({ subdomain: 'unique-firm' })

      await expect(
        createTestOrganization({ subdomain: 'unique-firm' })
      ).rejects.toThrow()
    })

    it('should allow soft deletion and recreation', async () => {
      const org = await createTestOrganization({ subdomain: 'soft-delete-test' })

      // Soft delete
      await prisma.organization.update({
        where: { id: org.id },
        data: { deletedAt: new Date() },
      })

      // Should be able to create new organization with same subdomain
      const newOrg = await createTestOrganization({ subdomain: 'soft-delete-test' })
      expect(newOrg.id).not.toBe(org.id)
    })
  })

  describe('User operations', () => {
    let organization: any

    beforeEach(async () => {
      organization = await createTestOrganization()
    })

    it('should create a user with organization relationship', async () => {
      const user = await createTestUser(organization.id, {
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
      })

      expect(user).toMatchObject({
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        organizationId: organization.id,
      })
    })

    it('should enforce unique email constraint within organization', async () => {
      await createTestUser(organization.id, { email: 'duplicate@example.com' })

      await expect(
        createTestUser(organization.id, { email: 'duplicate@example.com' })
      ).rejects.toThrow()
    })

    it('should allow same email across different organizations', async () => {
      const org2 = await createTestOrganization({ subdomain: 'org2' })

      const user1 = await createTestUser(organization.id, { email: 'same@example.com' })
      const user2 = await createTestUser(org2.id, { email: 'same@example.com' })

      expect(user1.organizationId).not.toBe(user2.organizationId)
      expect(user1.email).toBe(user2.email)
    })

    it('should cascade delete users when organization is deleted', async () => {
      const user = await createTestUser(organization.id)

      await prisma.organization.delete({
        where: { id: organization.id },
      })

      const deletedUser = await prisma.user.findUnique({
        where: { id: user.id },
      })

      expect(deletedUser).toBeNull()
    })
  })

  describe('Client operations', () => {
    let organization: any
    let user: any

    beforeEach(async () => {
      organization = await createTestOrganization()
      user = await createTestUser(organization.id)
    })

    it('should create a client with all required fields', async () => {
      const client = await createTestClient(organization.id, {
        businessName: 'Test Business',
        legalName: 'Test Business LLC',
        primaryContactName: 'John Doe',
        primaryContactEmail: 'john@testbusiness.com',
        status: 'ACTIVE',
        riskLevel: 'MEDIUM',
      })

      expect(client).toMatchObject({
        businessName: 'Test Business',
        organizationId: organization.id,
        status: 'ACTIVE',
        riskLevel: 'MEDIUM',
      })
    })

    it('should enforce business name uniqueness within organization', async () => {
      await createTestClient(organization.id, { businessName: 'Unique Business' })

      await expect(
        createTestClient(organization.id, { businessName: 'Unique Business' })
      ).rejects.toThrow()
    })

    it('should allow same business name across organizations', async () => {
      const org2 = await createTestOrganization({ subdomain: 'org2' })

      const client1 = await createTestClient(organization.id, { businessName: 'Same Name Corp' })
      const client2 = await createTestClient(org2.id, { businessName: 'Same Name Corp' })

      expect(client1.organizationId).not.toBe(client2.organizationId)
    })

    it('should handle custom fields as JSON', async () => {
      const customFields = {
        industryCode: 'NAICS-541211',
        preferredContactMethod: 'email',
        tags: ['high-value', 'tech-startup'],
      }

      const client = await createTestClient(organization.id, {
        customFields,
      })

      expect(client.customFields).toEqual(customFields)
    })
  })

  describe('Document operations', () => {
    let organization: any
    let user: any
    let client: any

    beforeEach(async () => {
      organization = await createTestOrganization()
      user = await createTestUser(organization.id)
      client = await createTestClient(organization.id)
    })

    it('should create a document with file metadata', async () => {
      const document = await prisma.document.create({
        data: {
          name: 'test-w2.pdf',
          originalName: 'W2_Form_2023.pdf',
          type: 'W2',
          category: 'TAX_DOCUMENT',
          status: 'PENDING',
          size: 1024 * 50, // 50KB
          mimeType: 'application/pdf',
          storageKey: 'documents/org-123/w2-123.pdf',
          uploadedById: user.id,
          clientId: client.id,
          organizationId: organization.id,
        },
      })

      expect(document).toMatchObject({
        name: 'test-w2.pdf',
        type: 'W2',
        status: 'PENDING',
        clientId: client.id,
        organizationId: organization.id,
      })
    })

    it('should handle OCR extracted data as JSON', async () => {
      const extractedData = {
        employeeName: 'John Doe',
        employerName: 'Acme Corp',
        wages: 75000,
        federalWithholding: 12000,
      }

      const document = await prisma.document.create({
        data: {
          name: 'w2-processed.pdf',
          type: 'W2',
          category: 'TAX_DOCUMENT',
          status: 'PROCESSED',
          size: 1024,
          mimeType: 'application/pdf',
          storageKey: 'documents/processed.pdf',
          uploadedById: user.id,
          organizationId: organization.id,
          extractedData,
          confidence: 0.95,
        },
      })

      expect(document.extractedData).toEqual(extractedData)
      expect(document.confidence).toBe(0.95)
    })

    it('should cascade delete documents when client is deleted', async () => {
      const document = await prisma.document.create({
        data: {
          name: 'client-doc.pdf',
          type: 'INVOICE',
          category: 'FINANCIAL',
          status: 'PROCESSED',
          size: 1024,
          mimeType: 'application/pdf',
          storageKey: 'documents/client-doc.pdf',
          uploadedById: user.id,
          clientId: client.id,
          organizationId: organization.id,
        },
      })

      await prisma.client.delete({
        where: { id: client.id },
      })

      const deletedDocument = await prisma.document.findUnique({
        where: { id: document.id },
      })

      expect(deletedDocument).toBeNull()
    })
  })

  describe('Workflow and Task operations', () => {
    let organization: any
    let user: any
    let client: any

    beforeEach(async () => {
      organization = await createTestOrganization()
      user = await createTestUser(organization.id, { role: 'ADMIN' })
      client = await createTestClient(organization.id)
    })

    it('should create engagement with tasks', async () => {
      const engagement = await prisma.engagement.create({
        data: {
          name: 'Tax Preparation 2023',
          type: 'TAX_PREPARATION',
          status: 'PLANNING',
          clientId: client.id,
          assignedToId: user.id,
          organizationId: organization.id,
          estimatedHours: 40,
          startDate: new Date('2024-01-15'),
          targetDate: new Date('2024-04-15'),
        },
      })

      const task = await prisma.task.create({
        data: {
          title: 'Review W-2 forms',
          description: 'Verify all W-2 forms are received and accurate',
          status: 'TODO',
          priority: 'HIGH',
          assignedToId: user.id,
          engagementId: engagement.id,
          organizationId: organization.id,
          dueDate: new Date('2024-02-01'),
          estimatedHours: 2,
        },
      })

      expect(engagement).toMatchObject({
        name: 'Tax Preparation 2023',
        type: 'TAX_PREPARATION',
        clientId: client.id,
      })

      expect(task).toMatchObject({
        title: 'Review W-2 forms',
        engagementId: engagement.id,
        assignedToId: user.id,
      })
    })

    it('should handle workflow templates and executions', async () => {
      const template = await prisma.workflowTemplate.create({
        data: {
          name: 'Client Onboarding',
          description: 'Standard client onboarding process',
          version: '1.0',
          isActive: true,
          organizationId: organization.id,
          createdById: user.id,
          triggerType: 'MANUAL',
          steps: [
            {
              id: 'step-1',
              type: 'SEND_EMAIL',
              name: 'Welcome Email',
              config: {
                template: 'client_welcome',
                recipient: 'client',
              },
            },
            {
              id: 'step-2',
              type: 'CREATE_TASK',
              name: 'Setup Client File',
              config: {
                title: 'Setup client file structure',
                assignTo: 'creator',
              },
            },
          ],
        },
      })

      const execution = await prisma.workflowExecution.create({
        data: {
          templateId: template.id,
          status: 'RUNNING',
          organizationId: organization.id,
          startedById: user.id,
          context: {
            clientId: client.id,
            engagementType: 'TAX_PREPARATION',
          },
          currentStep: 0,
        },
      })

      expect(template.steps).toHaveLength(2)
      expect(execution).toMatchObject({
        templateId: template.id,
        status: 'RUNNING',
        currentStep: 0,
      })
    })
  })

  describe('Billing and Invoice operations', () => {
    let organization: any
    let user: any
    let client: any

    beforeEach(async () => {
      organization = await createTestOrganization()
      user = await createTestUser(organization.id)
      client = await createTestClient(organization.id)
    })

    it('should create subscription with stripe integration', async () => {
      const subscription = await prisma.subscription.create({
        data: {
          organizationId: organization.id,
          stripeSubscriptionId: 'sub_test123',
          stripePriceId: 'price_professional',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          plan: 'PROFESSIONAL',
          seats: 5,
          monthlyPrice: 9900, // $99.00
        },
      })

      expect(subscription).toMatchObject({
        organizationId: organization.id,
        status: 'ACTIVE',
        plan: 'PROFESSIONAL',
        seats: 5,
      })
    })

    it('should create invoice with line items', async () => {
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: 'INV-2024-001',
          status: 'DRAFT',
          clientId: client.id,
          organizationId: organization.id,
          issueDate: new Date('2024-01-15'),
          dueDate: new Date('2024-02-14'),
          subtotal: 5000,
          taxAmount: 450,
          totalAmount: 5450,
          paidAmount: 0,
          items: [
            {
              description: 'Tax Preparation Services',
              quantity: 1,
              rate: 4000,
              amount: 4000,
            },
            {
              description: 'Bookkeeping Services',
              quantity: 10,
              rate: 100,
              amount: 1000,
            },
          ],
          notes: 'Payment due within 30 days',
        },
      })

      expect(invoice).toMatchObject({
        invoiceNumber: 'INV-2024-001',
        status: 'DRAFT',
        totalAmount: 5450,
        clientId: client.id,
      })

      expect(invoice.items).toHaveLength(2)
      expect(invoice.items[0]).toMatchObject({
        description: 'Tax Preparation Services',
        amount: 4000,
      })
    })

    it('should track payment history', async () => {
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: 'INV-2024-002',
          status: 'SENT',
          clientId: client.id,
          organizationId: organization.id,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          subtotal: 1000,
          totalAmount: 1000,
          paidAmount: 0,
          items: [{ description: 'Consulting', quantity: 1, rate: 1000, amount: 1000 }],
        },
      })

      // Record partial payment
      const payment = await prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: 500,
          method: 'BANK_TRANSFER',
          status: 'COMPLETED',
          transactionId: 'TXN-123',
          paidAt: new Date(),
          organizationId: organization.id,
        },
      })

      // Update invoice paid amount
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: 500,
          status: 'PARTIAL',
        },
      })

      const updatedInvoice = await prisma.invoice.findUnique({
        where: { id: invoice.id },
        include: { payments: true },
      })

      expect(updatedInvoice?.status).toBe('PARTIAL')
      expect(updatedInvoice?.paidAmount).toBe(500)
      expect(updatedInvoice?.payments).toHaveLength(1)
      expect(updatedInvoice?.payments[0].amount).toBe(500)
    })
  })

  describe('Audit and Compliance', () => {
    let organization: any
    let user: any

    beforeEach(async () => {
      organization = await createTestOrganization()
      user = await createTestUser(organization.id)
    })

    it('should create audit logs for sensitive operations', async () => {
      const auditLog = await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          entityType: 'CLIENT',
          entityId: 'client-123',
          userId: user.id,
          organizationId: organization.id,
          oldValues: null,
          newValues: {
            businessName: 'New Client Corp',
            status: 'ACTIVE',
          },
          metadata: {
            userAgent: 'Mozilla/5.0...',
            ipAddress: '192.168.1.1',
            source: 'web_dashboard',
          },
        },
      })

      expect(auditLog).toMatchObject({
        action: 'CREATE',
        entityType: 'CLIENT',
        userId: user.id,
        organizationId: organization.id,
      })

      expect(auditLog.newValues).toEqual({
        businessName: 'New Client Corp',
        status: 'ACTIVE',
      })
    })

    it('should track authentication attempts', async () => {
      const authAttempt = await prisma.authAttempt.create({
        data: {
          email: 'test@example.com',
          success: false,
          organizationId: organization.id,
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Test Browser)',
          failureReason: 'INVALID_PASSWORD',
          metadata: {
            loginMethod: 'email_password',
            mfaRequired: false,
          },
        },
      })

      expect(authAttempt).toMatchObject({
        email: 'test@example.com',
        success: false,
        failureReason: 'INVALID_PASSWORD',
      })
    })

    it('should handle 2FA settings', async () => {
      const userWith2FA = await prisma.user.create({
        data: {
          email: '2fa@example.com',
          name: '2FA User',
          role: 'USER',
          organizationId: organization.id,
          emailVerified: new Date(),
          twoFactorEnabled: true,
          twoFactorSecret: 'encrypted_secret_key',
          backupCodes: ['code1', 'code2', 'code3'],
        },
      })

      expect(userWith2FA.twoFactorEnabled).toBe(true)
      expect(userWith2FA.backupCodes).toHaveLength(3)
    })
  })

  describe('Performance and Indexing', () => {
    let organization: any

    beforeEach(async () => {
      organization = await createTestOrganization()
    })

    it('should efficiently query clients with filters', async () => {
      // Create multiple clients for testing
      const clients = await Promise.all([
        createTestClient(organization.id, { businessName: 'Alpha Corp', status: 'ACTIVE', riskLevel: 'LOW' }),
        createTestClient(organization.id, { businessName: 'Beta LLC', status: 'PROSPECT', riskLevel: 'MEDIUM' }),
        createTestClient(organization.id, { businessName: 'Gamma Inc', status: 'ACTIVE', riskLevel: 'HIGH' }),
      ])

      const startTime = Date.now()

      // Complex query with filters
      const results = await prisma.client.findMany({
        where: {
          organizationId: organization.id,
          status: 'ACTIVE',
          OR: [
            { businessName: { contains: 'Alpha' } },
            { riskLevel: 'HIGH' },
          ],
        },
        include: {
          _count: {
            select: {
              documents: true,
              engagements: true,
              invoices: true,
            },
          },
        },
        orderBy: { businessName: 'asc' },
      })

      const endTime = Date.now()

      expect(results).toHaveLength(2) // Alpha Corp and Gamma Inc
      expect(endTime - startTime).toBeLessThan(100) // Should be fast
    })

    it('should handle large datasets efficiently', async () => {
      // Create multiple documents
      const user = await createTestUser(organization.id)
      const client = await createTestClient(organization.id)

      const documentPromises = Array.from({ length: 50 }, (_, i) =>
        prisma.document.create({
          data: {
            name: `document-${i}.pdf`,
            type: 'RECEIPT',
            category: 'EXPENSE',
            status: 'PROCESSED',
            size: 1024,
            mimeType: 'application/pdf',
            storageKey: `documents/doc-${i}.pdf`,
            uploadedById: user.id,
            clientId: client.id,
            organizationId: organization.id,
          },
        })
      )

      await Promise.all(documentPromises)

      const startTime = Date.now()

      // Paginated query
      const results = await prisma.document.findMany({
        where: {
          organizationId: organization.id,
          clientId: client.id,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
        include: {
          uploader: {
            select: { name: true, email: true },
          },
        },
      })

      const endTime = Date.now()

      expect(results).toHaveLength(10)
      expect(endTime - startTime).toBeLessThan(50) // Should be very fast with proper indexing
    })
  })

  describe('Data Integrity and Constraints', () => {
    let organization: any

    beforeEach(async () => {
      organization = await createTestOrganization()
    })

    it('should enforce foreign key constraints', async () => {
      await expect(
        prisma.client.create({
          data: {
            businessName: 'Invalid Client',
            primaryContactName: 'Test',
            primaryContactEmail: 'test@example.com',
            status: 'ACTIVE',
            riskLevel: 'MEDIUM',
            organizationId: 'non-existent-org',
          },
        })
      ).rejects.toThrow()
    })

    it('should handle transaction rollbacks', async () => {
      const user = await createTestUser(organization.id)

      try {
        await prisma.$transaction(async (tx) => {
          // Create client
          const client = await tx.client.create({
            data: {
              businessName: 'Transaction Test',
              primaryContactName: 'Test',
              primaryContactEmail: 'test@example.com',
              status: 'ACTIVE',
              riskLevel: 'MEDIUM',
              organizationId: organization.id,
            },
          })

          // This should fail and rollback the entire transaction
          await tx.client.create({
            data: {
              businessName: 'Transaction Test', // Duplicate name
              primaryContactName: 'Test2',
              primaryContactEmail: 'test2@example.com',
              status: 'ACTIVE',
              riskLevel: 'MEDIUM',
              organizationId: organization.id,
            },
          })
        })
      } catch (error) {
        // Transaction should have rolled back
      }

      // Verify no client was created
      const clients = await prisma.client.findMany({
        where: {
          organizationId: organization.id,
          businessName: 'Transaction Test',
        },
      })

      expect(clients).toHaveLength(0)
    })

    it('should handle concurrent operations safely', async () => {
      const user = await createTestUser(organization.id)

      // Simulate concurrent client creation
      const promises = Array.from({ length: 5 }, (_, i) =>
        createTestClient(organization.id, {
          businessName: `Concurrent Client ${i}`,
          primaryContactEmail: `client${i}@example.com`,
        })
      )

      const results = await Promise.all(promises)
      expect(results).toHaveLength(5)

      // Verify all clients were created
      const clients = await prisma.client.findMany({
        where: {
          organizationId: organization.id,
          businessName: { startsWith: 'Concurrent Client' },
        },
      })

      expect(clients).toHaveLength(5)
    })
  })
})
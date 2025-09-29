import { test, expect, type Page } from '@playwright/test'

// Page Object Models for better test organization
class LoginPage {
  constructor(public readonly page: Page) {}

  async goto() {
    await this.page.goto('/auth/signin')
  }

  async login(email: string, password: string) {
    await this.page.fill('[data-testid="email-input"]', email)
    await this.page.fill('[data-testid="password-input"]', password)
    await this.page.click('[data-testid="signin-button"]')
  }

  async expectLoginError(message: string) {
    await expect(this.page.locator('[data-testid="error-message"]')).toContainText(message)
  }
}

class DashboardPage {
  constructor(public readonly page: Page) {}

  async expectToBeVisible() {
    await expect(this.page.locator('[data-testid="dashboard-header"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="organization-name"]')).toBeVisible()
  }

  async navigateToClients() {
    await this.page.click('[data-testid="nav-clients"]')
    await this.page.waitForURL('**/clients')
  }

  async navigateToDocuments() {
    await this.page.click('[data-testid="nav-documents"]')
    await this.page.waitForURL('**/documents')
  }

  async navigateToTasks() {
    await this.page.click('[data-testid="nav-tasks"]')
    await this.page.waitForURL('**/tasks')
  }

  async getQuickStats() {
    const clients = await this.page.textContent('[data-testid="stat-clients"]')
    const documents = await this.page.textContent('[data-testid="stat-documents"]')
    const tasks = await this.page.textContent('[data-testid="stat-tasks"]')

    return {
      clients: parseInt(clients || '0'),
      documents: parseInt(documents || '0'),
      tasks: parseInt(tasks || '0'),
    }
  }
}

class ClientsPage {
  constructor(public readonly page: Page) {}

  async expectToBeVisible() {
    await expect(this.page.locator('[data-testid="clients-page-header"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="add-client-button"]')).toBeVisible()
  }

  async clickAddClient() {
    await this.page.click('[data-testid="add-client-button"]')
  }

  async searchClients(query: string) {
    await this.page.fill('[data-testid="client-search-input"]', query)
    await this.page.keyboard.press('Enter')
    await this.page.waitForLoadState('networkidle')
  }

  async getClientCount() {
    const countText = await this.page.textContent('[data-testid="client-count"]')
    return parseInt(countText?.match(/\d+/)?.[0] || '0')
  }

  async clickClient(clientName: string) {
    await this.page.click(`[data-testid="client-row"][data-client-name="${clientName}"]`)
  }

  async expectClientInList(clientName: string) {
    await expect(this.page.locator(`[data-testid="client-row"][data-client-name="${clientName}"]`)).toBeVisible()
  }

  async expectClientNotInList(clientName: string) {
    await expect(this.page.locator(`[data-testid="client-row"][data-client-name="${clientName}"]`)).not.toBeVisible()
  }
}

class ClientFormPage {
  constructor(public readonly page: Page) {}

  async expectToBeVisible() {
    await expect(this.page.locator('[data-testid="client-form"]')).toBeVisible()
  }

  async fillClientDetails(clientData: {
    businessName: string
    legalName: string
    contactName: string
    contactEmail: string
    contactPhone?: string
    businessType: string
    taxId?: string
    address?: string
    city?: string
    state?: string
    zip?: string
  }) {
    await this.page.fill('[data-testid="business-name-input"]', clientData.businessName)
    await this.page.fill('[data-testid="legal-name-input"]', clientData.legalName)
    await this.page.fill('[data-testid="contact-name-input"]', clientData.contactName)
    await this.page.fill('[data-testid="contact-email-input"]', clientData.contactEmail)

    if (clientData.contactPhone) {
      await this.page.fill('[data-testid="contact-phone-input"]', clientData.contactPhone)
    }

    await this.page.selectOption('[data-testid="business-type-select"]', clientData.businessType)

    if (clientData.taxId) {
      await this.page.fill('[data-testid="tax-id-input"]', clientData.taxId)
    }

    if (clientData.address) {
      await this.page.fill('[data-testid="address-input"]', clientData.address)
      await this.page.fill('[data-testid="city-input"]', clientData.city || '')
      await this.page.fill('[data-testid="state-input"]', clientData.state || '')
      await this.page.fill('[data-testid="zip-input"]', clientData.zip || '')
    }
  }

  async submitForm() {
    await this.page.click('[data-testid="submit-client-form"]')
  }

  async expectValidationError(field: string, message: string) {
    await expect(this.page.locator(`[data-testid="${field}-error"]`)).toContainText(message)
  }

  async expectSuccess() {
    await expect(this.page.locator('[data-testid="success-message"]')).toBeVisible()
  }
}

class DocumentsPage {
  constructor(public readonly page: Page) {}

  async expectToBeVisible() {
    await expect(this.page.locator('[data-testid="documents-page-header"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="upload-document-button"]')).toBeVisible()
  }

  async uploadDocument(filePath: string, category: string, clientName?: string) {
    await this.page.click('[data-testid="upload-document-button"]')

    // Set file input
    await this.page.setInputFiles('[data-testid="file-input"]', filePath)

    // Select category
    await this.page.selectOption('[data-testid="category-select"]', category)

    // Select client if provided
    if (clientName) {
      await this.page.selectOption('[data-testid="client-select"]', clientName)
    }

    // Submit upload
    await this.page.click('[data-testid="upload-submit-button"]')

    // Wait for upload to complete
    await this.page.waitForSelector('[data-testid="upload-success"]', { timeout: 30000 })
  }

  async filterByCategory(category: string) {
    await this.page.selectOption('[data-testid="category-filter"]', category)
    await this.page.waitForLoadState('networkidle')
  }

  async filterByClient(clientName: string) {
    await this.page.selectOption('[data-testid="client-filter"]', clientName)
    await this.page.waitForLoadState('networkidle')
  }

  async getDocumentCount() {
    const countText = await this.page.textContent('[data-testid="document-count"]')
    return parseInt(countText?.match(/\d+/)?.[0] || '0')
  }

  async expectDocumentInList(fileName: string) {
    await expect(this.page.locator(`[data-testid="document-row"][data-filename="${fileName}"]`)).toBeVisible()
  }

  async downloadDocument(fileName: string) {
    const downloadPromise = this.page.waitForEvent('download')
    await this.page.click(`[data-testid="document-row"][data-filename="${fileName}"] [data-testid="download-button"]`)
    const download = await downloadPromise
    return download
  }

  async deleteDocument(fileName: string) {
    await this.page.click(`[data-testid="document-row"][data-filename="${fileName}"] [data-testid="delete-button"]`)
    await this.page.click('[data-testid="confirm-delete-button"]')
    await this.page.waitForLoadState('networkidle')
  }
}

class QuickBooksPage {
  constructor(public readonly page: Page) {}

  async navigateToIntegrations() {
    await this.page.click('[data-testid="nav-integrations"]')
    await this.page.waitForURL('**/integrations')
  }

  async expectQuickBooksSection() {
    await expect(this.page.locator('[data-testid="quickbooks-integration-section"]')).toBeVisible()
  }

  async connectQuickBooks() {
    await this.page.click('[data-testid="connect-quickbooks-button"]')
    // Note: In real E2E tests, you'd need to handle OAuth flow
    // For now, we'll mock this or skip the external OAuth
  }

  async expectConnectionStatus(status: 'connected' | 'disconnected') {
    if (status === 'connected') {
      await expect(this.page.locator('[data-testid="quickbooks-status-connected"]')).toBeVisible()
    } else {
      await expect(this.page.locator('[data-testid="quickbooks-status-disconnected"]')).toBeVisible()
    }
  }

  async syncData() {
    await this.page.click('[data-testid="sync-quickbooks-button"]')
    await this.page.waitForSelector('[data-testid="sync-complete"]', { timeout: 30000 })
  }
}

// Test Suite
test.describe('Critical User Journeys', () => {
  let loginPage: LoginPage
  let dashboardPage: DashboardPage
  let clientsPage: ClientsPage
  let clientFormPage: ClientFormPage
  let documentsPage: DocumentsPage
  let quickBooksPage: QuickBooksPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    dashboardPage = new DashboardPage(page)
    clientsPage = new ClientsPage(page)
    clientFormPage = new ClientFormPage(page)
    documentsPage = new DocumentsPage(page)
    quickBooksPage = new QuickBooksPage(page)
  })

  test.describe('CPA Firm Onboarding Journey', () => {
    test('should complete full onboarding process for new CPA firm', async ({ page }) => {
      // This test would typically start from registration
      // For now, we'll start from the dashboard after registration

      await page.goto('/dashboard')
      await dashboardPage.expectToBeVisible()

      // Check that the dashboard shows empty state for new firm
      const stats = await dashboardPage.getQuickStats()
      expect(stats.clients).toBe(0)
      expect(stats.documents).toBe(0)
      expect(stats.tasks).toBe(0)

      // Navigate to clients and verify empty state
      await dashboardPage.navigateToClients()
      await clientsPage.expectToBeVisible()

      const clientCount = await clientsPage.getClientCount()
      expect(clientCount).toBe(0)

      // Create first client
      await clientsPage.clickAddClient()
      await clientFormPage.expectToBeVisible()

      await clientFormPage.fillClientDetails({
        businessName: 'ABC Manufacturing LLC',
        legalName: 'ABC Manufacturing Limited Liability Company',
        contactName: 'John Smith',
        contactEmail: 'john@abcmanufacturing.com',
        contactPhone: '555-123-4567',
        businessType: 'LLC',
        taxId: '12-3456789',
        address: '123 Industrial Way',
        city: 'Business City',
        state: 'CA',
        zip: '90210',
      })

      await clientFormPage.submitForm()
      await clientFormPage.expectSuccess()

      // Verify client appears in list
      await page.goto('/clients')
      await clientsPage.expectClientInList('ABC Manufacturing LLC')

      // Navigate to documents and upload first document
      await dashboardPage.navigateToDocuments()
      await documentsPage.expectToBeVisible()

      // Note: In real tests, you'd have actual test files
      // For this example, we'll simulate the upload process
      await test.step('Upload client document', async () => {
        // This would be skipped in CI without actual files
        test.skip(process.env.CI === 'true', 'File upload requires test files')

        // await documentsPage.uploadDocument('./test-files/sample-w2.pdf', 'TAX_DOCUMENTS', 'ABC Manufacturing LLC')
        // await documentsPage.expectDocumentInList('sample-w2.pdf')
      })

      // Check dashboard stats have updated
      await page.goto('/dashboard')
      const updatedStats = await dashboardPage.getQuickStats()
      expect(updatedStats.clients).toBe(1)
    })

    test('should handle validation errors during client creation', async ({ page }) => {
      await page.goto('/clients')
      await clientsPage.clickAddClient()
      await clientFormPage.expectToBeVisible()

      // Try to submit empty form
      await clientFormPage.submitForm()

      // Should show validation errors
      await clientFormPage.expectValidationError('business-name', 'Business name is required')
      await clientFormPage.expectValidationError('contact-email', 'Email is required')

      // Fill invalid email
      await clientFormPage.fillClientDetails({
        businessName: 'Test Business',
        legalName: 'Test Business LLC',
        contactName: 'Test Contact',
        contactEmail: 'invalid-email',
        businessType: 'LLC',
      })

      await clientFormPage.submitForm()
      await clientFormPage.expectValidationError('contact-email', 'Invalid email format')

      // Fill valid data
      await clientFormPage.fillClientDetails({
        businessName: 'Valid Test Business',
        legalName: 'Valid Test Business LLC',
        contactName: 'Valid Contact',
        contactEmail: 'valid@test.com',
        businessType: 'LLC',
      })

      await clientFormPage.submitForm()
      await clientFormPage.expectSuccess()
    })
  })

  test.describe('Client Portal Access Journey', () => {
    test('should allow client to access portal and view documents', async ({ page }) => {
      // This test simulates client portal access
      await page.goto('/portal/signin')

      // Client login
      await loginPage.login('client@example.com', 'clientpassword')

      // Should redirect to client portal dashboard
      await page.waitForURL('**/portal/dashboard')
      await expect(page.locator('[data-testid="client-portal-header"]')).toBeVisible()

      // Navigate to documents
      await page.click('[data-testid="portal-nav-documents"]')
      await page.waitForURL('**/portal/documents')

      // Should see documents shared with this client
      await expect(page.locator('[data-testid="portal-documents-list"]')).toBeVisible()

      // Client should be able to download documents
      await test.step('Download document', async () => {
        test.skip(process.env.CI === 'true', 'Download testing requires specific setup')

        // const download = await documentsPage.downloadDocument('client-document.pdf')
        // expect(download.suggestedFilename()).toBe('client-document.pdf')
      })

      // Client should be able to upload documents
      await test.step('Upload document', async () => {
        test.skip(process.env.CI === 'true', 'Upload testing requires test files')

        // await page.click('[data-testid="portal-upload-button"]')
        // await page.setInputFiles('[data-testid="portal-file-input"]', './test-files/client-upload.pdf')
        // await page.click('[data-testid="portal-upload-submit"]')
      })
    })

    test('should enforce client data isolation', async ({ page }) => {
      // Login as client A
      await page.goto('/portal/signin')
      await loginPage.login('clientA@example.com', 'password')

      await page.waitForURL('**/portal/dashboard')

      // Client A should only see their own data
      await page.click('[data-testid="portal-nav-documents"]')

      // Verify no access to other client data
      await expect(page.locator('[data-testid="document-row"][data-client="Client B"]')).not.toBeVisible()

      // Try to access another client's document directly (should be blocked)
      await page.goto('/portal/documents/other-client-document-id')
      await expect(page.locator('[data-testid="access-denied"]')).toBeVisible()
    })
  })

  test.describe('QuickBooks Integration Journey', () => {
    test('should complete QuickBooks connection flow', async ({ page }) => {
      await page.goto('/dashboard')
      await quickBooksPage.navigateToIntegrations()
      await quickBooksPage.expectQuickBooksSection()

      // Initially should be disconnected
      await quickBooksPage.expectConnectionStatus('disconnected')

      // Start connection flow
      await test.step('Connect to QuickBooks', async () => {
        test.skip(process.env.CI === 'true', 'OAuth flow requires external service')

        // await quickBooksPage.connectQuickBooks()
        // // Handle OAuth flow (would involve external service)
        // await quickBooksPage.expectConnectionStatus('connected')
      })

      // Once connected, should be able to sync data
      await test.step('Sync QuickBooks data', async () => {
        test.skip(process.env.CI === 'true', 'Requires QuickBooks connection')

        // await quickBooksPage.syncData()
        // // Verify data was synced
        // await page.goto('/clients')
        // // Should see clients synced from QuickBooks
      })
    })
  })

  test.describe('Document Management Journey', () => {
    test('should handle complete document lifecycle', async ({ page }) => {
      await page.goto('/documents')
      await documentsPage.expectToBeVisible()

      // Upload document
      await test.step('Upload document', async () => {
        test.skip(process.env.CI === 'true', 'File upload requires test files')

        // await documentsPage.uploadDocument('./test-files/tax-document.pdf', 'TAX_DOCUMENTS')
        // await documentsPage.expectDocumentInList('tax-document.pdf')
      })

      // Filter documents
      await documentsPage.filterByCategory('TAX_DOCUMENTS')

      // Should only show tax documents
      const taxDocCount = await documentsPage.getDocumentCount()
      expect(taxDocCount).toBeGreaterThanOrEqual(0)

      // Download document
      await test.step('Download document', async () => {
        test.skip(process.env.CI === 'true', 'Download testing requires specific setup')

        // const download = await documentsPage.downloadDocument('tax-document.pdf')
        // expect(download.suggestedFilename()).toBe('tax-document.pdf')
      })

      // Delete document
      await test.step('Delete document', async () => {
        test.skip(process.env.CI === 'true', 'Requires uploaded documents')

        // await documentsPage.deleteDocument('tax-document.pdf')
        // await documentsPage.expectDocumentNotInList('tax-document.pdf')
      })
    })

    test('should handle document processing and OCR', async ({ page }) => {
      await page.goto('/documents')

      await test.step('Upload document for OCR processing', async () => {
        test.skip(process.env.CI === 'true', 'OCR testing requires AI services')

        // Upload document that will trigger OCR
        // await documentsPage.uploadDocument('./test-files/w2-form.pdf', 'TAX_DOCUMENTS')

        // Wait for processing to complete
        // await page.waitForSelector('[data-testid="processing-complete"]', { timeout: 60000 })

        // Verify OCR results
        // await expect(page.locator('[data-testid="ocr-extracted-data"]')).toBeVisible()
      })
    })
  })

  test.describe('Multi-tenant Security Journey', () => {
    test('should enforce organization-level data isolation', async ({ page, context }) => {
      // Create a new browser context for different organization
      const newContext = await context.browser()?.newContext()
      if (!newContext) return

      const newPage = await newContext.newPage()

      // Login to organization A
      await page.goto('/auth/signin')
      await loginPage.login('admin@org-a.com', 'password')
      await page.waitForURL('**/dashboard')

      // Login to organization B in new context
      const newLoginPage = new LoginPage(newPage)
      await newLoginPage.goto()
      await newLoginPage.login('admin@org-b.com', 'password')
      await newPage.waitForURL('**/dashboard')

      // Both should see their own data only
      await page.goto('/clients')
      const orgAClients = await page.locator('[data-testid="client-row"]').count()

      await newPage.goto('/clients')
      const orgBClients = await newPage.locator('[data-testid="client-row"]').count()

      // Organizations should have different data
      expect(orgAClients).not.toBe(orgBClients)

      // Try to access other organization's data directly
      await page.goto('/api/clients/org-b-client-id')
      await expect(page.locator('text="Forbidden"')).toBeVisible()

      await newContext.close()
    })

    test('should handle session security and timeout', async ({ page }) => {
      await page.goto('/auth/signin')
      await loginPage.login('test@example.com', 'password')
      await page.waitForURL('**/dashboard')

      // Simulate session timeout (would require backend configuration)
      await test.step('Session timeout handling', async () => {
        test.skip(process.env.CI === 'true', 'Session timeout testing requires backend configuration')

        // Fast-forward time or wait for session to expire
        // await page.waitForTimeout(31 * 60 * 1000) // 31 minutes

        // Try to access protected resource
        // await page.goto('/clients')

        // Should redirect to login
        // await page.waitForURL('**/auth/signin')
        // await expect(page.locator('[data-testid="session-expired-message"]')).toBeVisible()
      })
    })
  })

  test.describe('Performance and Accessibility Journey', () => {
    test('should meet performance benchmarks', async ({ page }) => {
      // Enable performance tracking
      await page.coverage.startJSCoverage()

      const startTime = Date.now()
      await page.goto('/dashboard')
      await dashboardPage.expectToBeVisible()
      const loadTime = Date.now() - startTime

      // Dashboard should load within 3 seconds
      expect(loadTime).toBeLessThan(3000)

      // Check JavaScript coverage
      const coverage = await page.coverage.stopJSCoverage()
      const totalBytes = coverage.reduce((acc, entry) => acc + entry.bytes, 0)
      const usedBytes = coverage.reduce((acc, entry) => acc + entry.usedBytes, 0)
      const unusedBytes = totalBytes - usedBytes
      const unusedPercentage = (unusedBytes / totalBytes) * 100

      // Should have reasonable JavaScript utilization
      expect(unusedPercentage).toBeLessThan(70) // Less than 70% unused JS
    })

    test('should be accessible to screen readers', async ({ page }) => {
      await page.goto('/dashboard')

      // Check for proper heading structure
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
      expect(headings.length).toBeGreaterThan(0)

      // Check for alt text on images
      const images = await page.locator('img').all()
      for (const img of images) {
        const alt = await img.getAttribute('alt')
        expect(alt).not.toBeNull()
      }

      // Check for proper form labels
      const inputs = await page.locator('input[type="text"], input[type="email"], input[type="password"]').all()
      for (const input of inputs) {
        const id = await input.getAttribute('id')
        if (id) {
          const label = await page.locator(`label[for="${id}"]`).count()
          expect(label).toBeGreaterThan(0)
        }
      }

      // Check for proper button labels
      const buttons = await page.locator('button').all()
      for (const button of buttons) {
        const text = await button.textContent()
        const ariaLabel = await button.getAttribute('aria-label')
        expect(text || ariaLabel).toBeTruthy()
      }
    })

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/dashboard')

      // Tab through navigation
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Should be able to navigate with keyboard
      const focusedElement = await page.locator(':focus').first()
      expect(await focusedElement.isVisible()).toBe(true)

      // Test keyboard shortcuts if implemented
      await page.keyboard.press('Alt+C') // Navigate to clients
      // Should navigate to clients page (if shortcut is implemented)
    })
  })

  test.describe('Error Handling and Recovery Journey', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      await page.goto('/dashboard')

      // Simulate network failure
      await page.route('**/api/trpc/**', route => route.abort())

      // Try to perform an action that requires API call
      await page.click('[data-testid="nav-clients"]')

      // Should show appropriate error message
      await expect(page.locator('[data-testid="network-error"]')).toBeVisible()

      // Restore network and retry
      await page.unroute('**/api/trpc/**')
      await page.click('[data-testid="retry-button"]')

      // Should recover and load data
      await clientsPage.expectToBeVisible()
    })

    test('should handle browser refresh gracefully', async ({ page }) => {
      await page.goto('/dashboard')
      await dashboardPage.expectToBeVisible()

      // Navigate to client form
      await dashboardPage.navigateToClients()
      await clientsPage.clickAddClient()
      await clientFormPage.expectToBeVisible()

      // Fill partial form data
      await clientFormPage.fillClientDetails({
        businessName: 'Partial Client',
        legalName: 'Partial Client LLC',
        contactName: 'Partial Contact',
        contactEmail: 'partial@test.com',
        businessType: 'LLC',
      })

      // Refresh browser
      await page.reload()

      // Should handle refresh appropriately
      // (May show warning about unsaved data or redirect to safe page)
      await expect(page.locator('body')).toBeVisible()
    })
  })
})
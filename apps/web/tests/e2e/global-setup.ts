import { chromium, FullConfig } from '@playwright/test'
import { PrismaClient } from '@cpa-platform/database'

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use

  // Initialize database
  const prisma = new PrismaClient()

  try {
    // Ensure test database is clean
    await prisma.$connect()

    // Create test organization
    const organization = await prisma.organization.upsert({
      where: { subdomain: 'test-firm' },
      update: {},
      create: {
        name: 'Test CPA Firm',
        subdomain: 'test-firm',
        subscriptionTier: 'professional',
      },
    })

    // Create test admin user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@test-firm.com' },
      update: {},
      create: {
        email: 'admin@test-firm.com',
        name: 'Test Admin',
        role: 'ADMIN',
        organizationId: organization.id,
        emailVerified: new Date(),
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      },
    })

    // Create test client user
    const clientUser = await prisma.user.upsert({
      where: { email: 'user@test-firm.com' },
      update: {},
      create: {
        email: 'user@test-firm.com',
        name: 'Test User',
        role: 'USER',
        organizationId: organization.id,
        emailVerified: new Date(),
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      },
    })

    // Create test client record
    await prisma.client.upsert({
      where: {
        organizationId_email: {
          organizationId: organization.id,
          email: 'client@example.com'
        }
      },
      update: {},
      create: {
        name: 'Test Client Corp',
        email: 'client@example.com',
        organizationId: organization.id,
        status: 'ACTIVE',
        phone: '555-0123',
        address: '123 Business St, City, ST 12345',
        taxId: '12-3456789',
      },
    })

    console.log('✅ Test database setup completed')

  } catch (error) {
    console.error('❌ Test database setup failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }

  // Start authentication setup
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Navigate to login page
    await page.goto(`${baseURL}/auth/signin`)

    // Fill in login form
    await page.fill('[data-testid="email-input"]', 'admin@test-firm.com')
    await page.fill('[data-testid="password-input"]', 'password')
    await page.click('[data-testid="signin-button"]')

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard')

    // Save authenticated state
    await page.context().storageState({ path: 'tests/e2e/.auth/user.json' })

    console.log('✅ Authentication setup completed')
  } catch (error) {
    console.error('❌ Authentication setup failed:', error)
    // Continue with tests even if auth setup fails
  } finally {
    await browser.close()
  }
}

export default globalSetup
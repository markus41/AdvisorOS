import { FullConfig } from '@playwright/test'
import { PrismaClient } from '@prisma/client'

async function globalTeardown(config: FullConfig) {
  const prisma = new PrismaClient()

  try {
    await prisma.$connect()

    // Clean up test data
    await prisma.$transaction([
      prisma.auditLog.deleteMany({}),
      prisma.document.deleteMany({}),
      prisma.client.deleteMany({}),
      prisma.user.deleteMany({}),
      prisma.organization.deleteMany({
        where: { subdomain: 'test-firm' }
      }),
    ])

    console.log('✅ Test database cleanup completed')
  } catch (error) {
    console.error('❌ Test database cleanup failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

export default globalTeardown
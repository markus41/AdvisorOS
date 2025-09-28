import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create a sample organization
  const org = await prisma.organization.create({
    data: {
      name: 'Demo CPA Firm',
      subdomain: 'demo',
      subscriptionTier: 'trial',
    },
  })

  // Create a sample user
  const user = await prisma.user.create({
    data: {
      email: 'demo@cpafirm.com',
      name: 'John CPA',
      role: 'owner',
      organizationId: org.id,
    },
  })

  // Create a sample client
  const client = await prisma.client.create({
    data: {
      businessName: 'ABC Corporation',
      primaryContactEmail: 'contact@abc-corp.com',
      primaryContactName: 'Jane Smith',
      organizationId: org.id,
      taxId: '12-3456789',
    },
  })

  console.log('Seed data created:', { org, user, client })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
#!/usr/bin/env tsx

/**
 * Test Data Setup Script
 *
 * Command-line utility for managing test data across different environments
 * and test scenarios.
 *
 * Usage:
 *   pnpm run test:data:setup [scenario] [options]
 *   pnpm run test:data:cleanup [scenario]
 *   pnpm run test:data:reset
 */

import { PrismaClient } from '@prisma/client'
import { program } from 'commander'
import { createTestDataManager, TEST_DATA_CONFIGS } from '../tests/helpers/test-data-manager'
import chalk from 'chalk'
import ora from 'ora'
import inquirer from 'inquirer'

const prisma = new PrismaClient()

async function main() {
  program
    .name('test-data-setup')
    .description('AdvisorOS Test Data Management CLI')
    .version('1.0.0')

  program
    .command('setup')
    .description('Create test data for specified scenario')
    .argument('[scenario]', 'Test scenario (minimal, standard, performance, e2e)', 'standard')
    .option('-c, --config <path>', 'Custom configuration file')
    .option('-p, --persist', 'Persist data (don\'t cleanup on exit)')
    .option('-v, --verbose', 'Verbose output')
    .option('--orgs <number>', 'Number of organizations to create')
    .option('--users <number>', 'Number of users per organization')
    .option('--clients <number>', 'Number of clients per organization')
    .action(async (scenario, options) => {
      const spinner = ora('Setting up test data...').start()

      try {
        await setupTestData(scenario, options, spinner)
        spinner.succeed(chalk.green('Test data setup completed successfully!'))
      } catch (error) {
        spinner.fail(chalk.red('Test data setup failed'))
        console.error(error)
        process.exit(1)
      }
    })

  program
    .command('cleanup')
    .description('Clean up test data for specified scenario')
    .argument('[scenario]', 'Test scenario to cleanup (or "all" for everything)')
    .option('-f, --force', 'Force cleanup without confirmation')
    .action(async (scenario, options) => {
      await cleanupTestData(scenario, options)
    })

  program
    .command('reset')
    .description('Reset all test data (complete database cleanup)')
    .option('-f, --force', 'Force reset without confirmation')
    .action(async (options) => {
      await resetAllTestData(options)
    })

  program
    .command('status')
    .description('Show status of test data')
    .action(async () => {
      await showTestDataStatus()
    })

  program
    .command('seed')
    .description('Seed database with sample data for development')
    .option('-s, --size <size>', 'Data size (small, medium, large)', 'medium')
    .action(async (options) => {
      await seedDevelopmentData(options)
    })

  program
    .command('export')
    .description('Export test data configuration')
    .argument('<scenario>', 'Scenario to export')
    .option('-o, --output <file>', 'Output file path')
    .action(async (scenario, options) => {
      await exportTestDataConfig(scenario, options)
    })

  program
    .command('import')
    .description('Import test data from configuration')
    .argument('<file>', 'Configuration file to import')
    .action(async (file) => {
      await importTestDataConfig(file)
    })

  await program.parseAsync()
}

async function setupTestData(scenario: string, options: any, spinner: ora.Ora): Promise<void> {
  // Get configuration
  let config = getScenarioConfig(scenario)

  // Apply command line overrides
  if (options.orgs) config = { ...config, organizations: parseInt(options.orgs) }
  if (options.users) config = { ...config, usersPerOrg: parseInt(options.users) }
  if (options.clients) config = { ...config, clientsPerOrg: parseInt(options.clients) }
  if (options.persist) config = { ...config, cleanup: false, persistData: true }

  // Load custom config if provided
  if (options.config) {
    try {
      const customConfig = await import(options.config)
      config = { ...config, ...customConfig.default }
    } catch (error) {
      spinner.fail(chalk.red(`Failed to load custom config: ${options.config}`))
      throw error
    }
  }

  if (options.verbose) {
    spinner.info(chalk.blue('Configuration:'))
    console.log(JSON.stringify(config, null, 2))
    spinner.start()
  }

  // Create test data manager
  const dataManager = createTestDataManager(prisma, config)

  // Setup data
  const result = await dataManager.createTestDataset(scenario)

  if (options.verbose) {
    spinner.info(chalk.blue('Created test data:'))
    console.log(`Organizations: ${result.organizations.length}`)
    console.log(`Users: ${result.totalUsers}`)
    console.log(`Clients: ${result.totalClients}`)
    console.log(`Documents: ${result.totalDocuments}`)
    console.log(`Tasks: ${result.totalTasks}`)
  }

  // Store data manager reference for cleanup
  process.on('SIGINT', async () => {
    spinner.info(chalk.yellow('Cleaning up test data...'))
    await dataManager.cleanup()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    await dataManager.cleanup()
    process.exit(0)
  })
}

async function cleanupTestData(scenario: string, options: any): Promise<void> {
  if (!options.force) {
    const confirmation = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: `Are you sure you want to cleanup test data for scenario "${scenario}"?`,
        default: false,
      },
    ])

    if (!confirmation.proceed) {
      console.log(chalk.yellow('Cleanup cancelled'))
      return
    }
  }

  const spinner = ora('Cleaning up test data...').start()

  try {
    const dataManager = createTestDataManager(prisma)

    if (scenario === 'all') {
      // Clean up all test data
      await dataManager.cleanup()

      // Also clean up by known scenarios
      const scenarios = ['minimal', 'standard', 'performance', 'e2e']
      for (const s of scenarios) {
        try {
          await dataManager.cleanupByScenario(s)
        } catch (error) {
          // Ignore errors for non-existent scenarios
        }
      }
    } else {
      await dataManager.cleanupByScenario(scenario)
    }

    spinner.succeed(chalk.green('Test data cleanup completed successfully!'))
  } catch (error) {
    spinner.fail(chalk.red('Test data cleanup failed'))
    console.error(error)
    process.exit(1)
  }
}

async function resetAllTestData(options: any): Promise<void> {
  if (!options.force) {
    const confirmation = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: chalk.red('This will delete ALL data from the database. Are you absolutely sure?'),
        default: false,
      },
      {
        type: 'confirm',
        name: 'doubleConfirm',
        message: chalk.red('Type "yes" to confirm complete database reset'),
        default: false,
        when: (answers) => answers.proceed,
      },
    ])

    if (!confirmation.proceed || !confirmation.doubleConfirm) {
      console.log(chalk.yellow('Database reset cancelled'))
      return
    }
  }

  const spinner = ora('Resetting database...').start()

  try {
    // Delete all data in correct order
    await prisma.task.deleteMany()
    await prisma.document.deleteMany()
    await prisma.auditLog.deleteMany()
    await prisma.client.deleteMany()
    await prisma.user.deleteMany()
    await prisma.organization.deleteMany()

    // Reset sequences if using PostgreSQL
    if (process.env.DATABASE_URL?.includes('postgresql')) {
      await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"Organization"', 'id'), 1, false);`
      await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"User"', 'id'), 1, false);`
      await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"Client"', 'id'), 1, false);`
      await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"Document"', 'id'), 1, false);`
      await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"Task"', 'id'), 1, false);`
    }

    spinner.succeed(chalk.green('Database reset completed successfully!'))
  } catch (error) {
    spinner.fail(chalk.red('Database reset failed'))
    console.error(error)
    process.exit(1)
  }
}

async function showTestDataStatus(): Promise<void> {
  const spinner = ora('Checking test data status...').start()

  try {
    const [orgCount, userCount, clientCount, documentCount, taskCount] = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.client.count(),
      prisma.document.count(),
      prisma.task.count(),
    ])

    spinner.stop()

    console.log(chalk.blue('\n📊 Test Data Status:'))
    console.log(`Organizations: ${chalk.cyan(orgCount)}`)
    console.log(`Users: ${chalk.cyan(userCount)}`)
    console.log(`Clients: ${chalk.cyan(clientCount)}`)
    console.log(`Documents: ${chalk.cyan(documentCount)}`)
    console.log(`Tasks: ${chalk.cyan(taskCount)}`)

    // Check for test organizations
    const testOrgs = await prisma.organization.findMany({
      where: {
        OR: [
          { name: { contains: 'Test' } },
          { subdomain: { contains: 'test' } },
          { subdomain: { contains: 'minimal' } },
          { subdomain: { contains: 'performance' } },
          { subdomain: { contains: 'e2e' } },
        ],
      },
      select: {
        id: true,
        name: true,
        subdomain: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            clients: true,
          },
        },
      },
    })

    if (testOrgs.length > 0) {
      console.log(chalk.blue('\n🧪 Test Organizations:'))
      for (const org of testOrgs) {
        console.log(`${chalk.yellow(org.name)} (${org.subdomain})`)
        console.log(`  Users: ${org._count.users}, Clients: ${org._count.clients}`)
        console.log(`  Created: ${org.createdAt.toISOString()}`)
      }
    }
  } catch (error) {
    spinner.fail(chalk.red('Failed to check test data status'))
    console.error(error)
    process.exit(1)
  }
}

async function seedDevelopmentData(options: any): Promise<void> {
  const spinner = ora('Seeding development data...').start()

  try {
    const sizeConfigs = {
      small: { organizations: 1, usersPerOrg: 2, clientsPerOrg: 5, documentsPerClient: 2, tasksPerClient: 1 },
      medium: { organizations: 2, usersPerOrg: 5, clientsPerOrg: 15, documentsPerClient: 5, tasksPerClient: 3 },
      large: { organizations: 5, usersPerOrg: 10, clientsPerOrg: 50, documentsPerClient: 10, tasksPerClient: 5 },
    }

    const config = {
      ...sizeConfigs[options.size as keyof typeof sizeConfigs],
      cleanup: false,
      persistData: true,
    }

    const dataManager = createTestDataManager(prisma, config)
    await dataManager.createTestDataset('development')

    spinner.succeed(chalk.green(`Development data seeded successfully (${options.size} dataset)!`))
  } catch (error) {
    spinner.fail(chalk.red('Development data seeding failed'))
    console.error(error)
    process.exit(1)
  }
}

async function exportTestDataConfig(scenario: string, options: any): Promise<void> {
  const spinner = ora('Exporting test data configuration...').start()

  try {
    const config = getScenarioConfig(scenario)
    const outputFile = options.output || `test-config-${scenario}.json`

    const fs = await import('fs/promises')
    await fs.writeFile(outputFile, JSON.stringify(config, null, 2))

    spinner.succeed(chalk.green(`Configuration exported to ${outputFile}`))
  } catch (error) {
    spinner.fail(chalk.red('Configuration export failed'))
    console.error(error)
    process.exit(1)
  }
}

async function importTestDataConfig(file: string): Promise<void> {
  const spinner = ora('Importing test data configuration...').start()

  try {
    const fs = await import('fs/promises')
    const configContent = await fs.readFile(file, 'utf-8')
    const config = JSON.parse(configContent)

    const dataManager = createTestDataManager(prisma, config)
    await dataManager.createTestDataset('imported')

    spinner.succeed(chalk.green('Test data created from imported configuration!'))
  } catch (error) {
    spinner.fail(chalk.red('Configuration import failed'))
    console.error(error)
    process.exit(1)
  }
}

function getScenarioConfig(scenario: string) {
  switch (scenario.toLowerCase()) {
    case 'minimal':
      return TEST_DATA_CONFIGS.MINIMAL
    case 'standard':
      return TEST_DATA_CONFIGS.STANDARD
    case 'performance':
      return TEST_DATA_CONFIGS.PERFORMANCE
    case 'e2e':
      return TEST_DATA_CONFIGS.E2E
    default:
      console.warn(chalk.yellow(`Unknown scenario "${scenario}", using standard configuration`))
      return TEST_DATA_CONFIGS.STANDARD
  }
}

// Handle unhandled errors
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('Unhandled rejection:'), error)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught exception:'), error)
  process.exit(1)
})

// Cleanup on exit
process.on('exit', async () => {
  await prisma.$disconnect()
})

if (require.main === module) {
  main().catch((error) => {
    console.error(chalk.red('Script failed:'), error)
    process.exit(1)
  })
}
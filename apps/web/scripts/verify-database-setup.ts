#!/usr/bin/env ts-node

/**
 * Database Setup Verification Script
 *
 * Verifies that all database migrations, indexes, and configurations are properly set up.
 *
 * Usage:
 *   npx ts-node scripts/verify-database-setup.ts
 *
 * What it checks:
 * - All migrations applied
 * - All tables exist with correct structure
 * - All indexes created
 * - pgvector extension enabled
 * - Foreign key constraints valid
 * - Partition structure (if enabled)
 * - Read replica connectivity (if configured)
 */

import { PrismaClient } from '@prisma/client'
import { getDbRouter } from '../src/lib/database/replica-router'

interface CheckResult {
  name: string
  passed: boolean
  message: string
  details?: any
}

class DatabaseVerifier {
  private prisma: PrismaClient
  private results: CheckResult[] = []

  constructor() {
    this.prisma = new PrismaClient()
  }

  private addResult(name: string, passed: boolean, message: string, details?: any) {
    this.results.push({ name, passed, message, details })
  }

  private printResults() {
    console.log('\n' + '='.repeat(80))
    console.log('DATABASE SETUP VERIFICATION RESULTS')
    console.log('='.repeat(80) + '\n')

    let passedCount = 0
    let failedCount = 0

    for (const result of this.results) {
      const icon = result.passed ? '✓' : '✗'
      const color = result.passed ? '\x1b[32m' : '\x1b[31m'
      const reset = '\x1b[0m'

      console.log(`${color}${icon}${reset} ${result.name}`)
      console.log(`  ${result.message}`)

      if (result.details) {
        console.log(`  Details: ${JSON.stringify(result.details, null, 2)}`)
      }

      console.log()

      if (result.passed) passedCount++
      else failedCount++
    }

    console.log('='.repeat(80))
    console.log(`Total Checks: ${this.results.length}`)
    console.log(`Passed: ${passedCount}`)
    console.log(`Failed: ${failedCount}`)
    console.log('='.repeat(80) + '\n')

    return failedCount === 0
  }

  async verifyConnection() {
    try {
      await this.prisma.$connect()
      await this.prisma.$queryRaw`SELECT 1 as connected`
      this.addResult(
        'Database Connection',
        true,
        'Successfully connected to primary database'
      )
    } catch (error) {
      this.addResult(
        'Database Connection',
        false,
        `Failed to connect: ${error.message}`
      )
    }
  }

  async verifyExtensions() {
    try {
      const extensions = await this.prisma.$queryRaw<Array<{ extname: string }>>`
        SELECT extname FROM pg_extension
        WHERE extname IN ('uuid-ossp', 'citext', 'vector')
      `

      const extNames = extensions.map(e => e.extname)
      const requiredExtensions = ['uuid-ossp', 'citext', 'vector']
      const missingExtensions = requiredExtensions.filter(ext => !extNames.includes(ext))

      if (missingExtensions.length === 0) {
        this.addResult(
          'Database Extensions',
          true,
          'All required extensions installed',
          { installed: extNames }
        )
      } else {
        this.addResult(
          'Database Extensions',
          false,
          'Missing required extensions',
          { installed: extNames, missing: missingExtensions }
        )
      }
    } catch (error) {
      this.addResult(
        'Database Extensions',
        false,
        `Failed to check extensions: ${error.message}`
      )
    }
  }

  async verifyTables() {
    try {
      const tables = await this.prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
      `

      const tableNames = tables.map(t => t.tablename)

      // Critical tables that must exist
      const criticalTables = [
        'organizations',
        'users',
        'clients',
        'documents',
        'document_processing',
        'document_embeddings',
        'job_executions',
        'document_sessions',
        'api_usage_metrics',
        'webhook_deliveries',
        'engagements',
        'tasks',
        'invoices',
        'audit_logs',
        'workflow_executions',
        'task_executions'
      ]

      const missingTables = criticalTables.filter(t => !tableNames.includes(t))

      if (missingTables.length === 0) {
        this.addResult(
          'Database Tables',
          true,
          `All ${criticalTables.length} critical tables exist (${tableNames.length} total)`,
          { totalTables: tableNames.length }
        )
      } else {
        this.addResult(
          'Database Tables',
          false,
          'Missing critical tables',
          { missing: missingTables }
        )
      }
    } catch (error) {
      this.addResult(
        'Database Tables',
        false,
        `Failed to check tables: ${error.message}`
      )
    }
  }

  async verifyIndexes() {
    try {
      const indexes = await this.prisma.$queryRaw<Array<{ indexname: string, tablename: string }>>`
        SELECT indexname, tablename FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname NOT LIKE '%_pkey'
        ORDER BY tablename, indexname
      `

      // Critical indexes for performance
      const criticalIndexes = [
        'idx_documents_org_client_status',
        'idx_tasks_org_assignee_status',
        'idx_invoices_org_status_due',
        'idx_documents_needs_review',
        'idx_tasks_overdue',
        'idx_invoices_overdue',
        'idx_documents_metadata_gin',
        'idx_documents_tags_gin'
      ]

      const indexNames = indexes.map(i => i.indexname)
      const missingIndexes = criticalIndexes.filter(idx => !indexNames.includes(idx))

      if (missingIndexes.length === 0) {
        this.addResult(
          'Performance Indexes',
          true,
          `All critical indexes exist (${indexes.length} total indexes)`,
          { totalIndexes: indexes.length }
        )
      } else {
        this.addResult(
          'Performance Indexes',
          false,
          'Missing critical performance indexes',
          { missing: missingIndexes, totalIndexes: indexes.length }
        )
      }
    } catch (error) {
      this.addResult(
        'Performance Indexes',
        false,
        `Failed to check indexes: ${error.message}`
      )
    }
  }

  async verifyForeignKeys() {
    try {
      const foreignKeys = await this.prisma.$queryRaw<Array<{ constraint_name: string }>>`
        SELECT constraint_name FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
          AND table_schema = 'public'
      `

      if (foreignKeys.length >= 60) {
        this.addResult(
          'Foreign Key Constraints',
          true,
          `${foreignKeys.length} foreign key constraints defined`,
          { count: foreignKeys.length }
        )
      } else {
        this.addResult(
          'Foreign Key Constraints',
          false,
          'Fewer foreign keys than expected',
          { expected: 60, actual: foreignKeys.length }
        )
      }
    } catch (error) {
      this.addResult(
        'Foreign Key Constraints',
        false,
        `Failed to check foreign keys: ${error.message}`
      )
    }
  }

  async verifyPartitions() {
    try {
      // Check if partitioned tables exist
      const partitionedTables = await this.prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
          AND (tablename LIKE 'audit_logs_%' OR tablename LIKE 'documents_%')
        ORDER BY tablename
      `

      if (partitionedTables.length > 0) {
        this.addResult(
          'Table Partitioning',
          true,
          `Table partitioning configured (${partitionedTables.length} partitions)`,
          { partitions: partitionedTables.map(p => p.tablename) }
        )
      } else {
        this.addResult(
          'Table Partitioning',
          true,
          'Partitioning not yet enabled (optional - will be enabled in production)',
          { note: 'This is normal for development environments' }
        )
      }
    } catch (error) {
      this.addResult(
        'Table Partitioning',
        true,
        'Could not check partitions (non-critical)',
        { error: error.message }
      )
    }
  }

  async verifyReplicaConnections() {
    try {
      const dbRouter = getDbRouter()

      // Check if replicas are configured
      const hasReplicas =
        process.env.DATABASE_READ_REPLICA_1_URL ||
        process.env.DATABASE_READ_REPLICA_2_URL

      if (!hasReplicas) {
        this.addResult(
          'Read Replicas',
          true,
          'Read replicas not configured (optional for development)',
          { note: 'Configure DATABASE_READ_REPLICA_* environment variables for production' }
        )
        return
      }

      // Wait a moment for health checks to complete
      await new Promise(resolve => setTimeout(resolve, 2000))

      const healthStatus = dbRouter.getHealthStatus()
      const metrics = dbRouter.getMetrics()

      const allHealthy = Array.from(healthStatus.values()).every(h => h.isHealthy)

      if (allHealthy) {
        this.addResult(
          'Read Replicas',
          true,
          'All configured replicas are healthy',
          {
            replicas: Object.fromEntries(healthStatus),
            metrics: {
              queriesRouted: metrics.queriesRouted,
              failovers: metrics.failovers
            }
          }
        )
      } else {
        const unhealthy = Array.from(healthStatus.entries())
          .filter(([_, health]) => !health.isHealthy)
          .map(([name, _]) => name)

        this.addResult(
          'Read Replicas',
          false,
          'Some replicas are unhealthy',
          { unhealthyReplicas: unhealthy, healthStatus: Object.fromEntries(healthStatus) }
        )
      }
    } catch (error) {
      this.addResult(
        'Read Replicas',
        false,
        `Failed to check replicas: ${error.message}`
      )
    }
  }

  async verifyMultiTenantSecurity() {
    try {
      // Check that critical tables have organization_id column
      const tablesWithOrgId = await this.prisma.$queryRaw<Array<{ table_name: string }>>`
        SELECT DISTINCT table_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND column_name = 'organization_id'
          AND table_name IN (
            'users', 'clients', 'documents', 'engagements', 'tasks',
            'invoices', 'audit_logs', 'document_processing', 'document_embeddings',
            'job_executions', 'document_sessions', 'api_usage_metrics', 'webhook_deliveries'
          )
      `

      const criticalTenantTables = [
        'users', 'clients', 'documents', 'engagements', 'tasks',
        'invoices', 'audit_logs', 'document_processing', 'document_embeddings',
        'job_executions', 'document_sessions', 'api_usage_metrics', 'webhook_deliveries'
      ]

      const tablesWithTenancy = tablesWithOrgId.map(t => t.table_name)
      const missingTenancy = criticalTenantTables.filter(t => !tablesWithTenancy.includes(t))

      if (missingTenancy.length === 0) {
        this.addResult(
          'Multi-Tenant Security',
          true,
          'All critical tables have organization_id for tenant isolation',
          { tablesChecked: criticalTenantTables.length }
        )
      } else {
        this.addResult(
          'Multi-Tenant Security',
          false,
          'Some tables missing organization_id',
          { missing: missingTenancy }
        )
      }
    } catch (error) {
      this.addResult(
        'Multi-Tenant Security',
        false,
        `Failed to check multi-tenancy: ${error.message}`
      )
    }
  }

  async verifyMigrations() {
    try {
      const migrations = await this.prisma.$queryRaw<Array<{ migration_name: string }>>`
        SELECT migration_name FROM _prisma_migrations
        ORDER BY finished_at DESC
      `

      const expectedMigrations = [
        '20240930000000_initial_schema',
        '20240930000001_add_missing_tables',
        '20240930000002_performance_indexes'
      ]

      const migrationNames = migrations.map(m => m.migration_name)
      const appliedExpected = expectedMigrations.filter(m => migrationNames.includes(m))

      if (appliedExpected.length === expectedMigrations.length) {
        this.addResult(
          'Database Migrations',
          true,
          `All ${expectedMigrations.length} required migrations applied (${migrations.length} total)`,
          { totalMigrations: migrations.length, latestMigration: migrations[0]?.migration_name }
        )
      } else {
        const missing = expectedMigrations.filter(m => !migrationNames.includes(m))
        this.addResult(
          'Database Migrations',
          false,
          'Some required migrations not applied',
          { missing, applied: migrationNames }
        )
      }
    } catch (error) {
      this.addResult(
        'Database Migrations',
        false,
        `Failed to check migrations: ${error.message}`
      )
    }
  }

  async runAllChecks() {
    console.log('Starting database verification...\n')

    await this.verifyConnection()
    await this.verifyMigrations()
    await this.verifyExtensions()
    await this.verifyTables()
    await this.verifyIndexes()
    await this.verifyForeignKeys()
    await this.verifyMultiTenantSecurity()
    await this.verifyPartitions()
    await this.verifyReplicaConnections()

    const allPassed = this.printResults()

    await this.prisma.$disconnect()

    return allPassed
  }
}

// Main execution
async function main() {
  const verifier = new DatabaseVerifier()

  try {
    const success = await verifier.runAllChecks()
    process.exit(success ? 0 : 1)
  } catch (error) {
    console.error('Fatal error during verification:', error)
    process.exit(1)
  }
}

main().catch(console.error)
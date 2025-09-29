#!/usr/bin/env node

/**
 * Database Connection Test for AdvisorOS
 * Tests Supabase PostgreSQL connectivity and basic operations
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class DatabaseTester {
  constructor() {
    this.prisma = null;
    this.results = {
      connection: false,
      schema: false,
      basicOperations: false,
      models: {},
      performance: {}
    };
  }

  log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logResult(test, status, message = '') {
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'WARN' ? '⚠️' : '⏭️';
    const color = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : status === 'WARN' ? 'yellow' : 'yellow';
    this.log(`${emoji} ${test}: ${status} ${message}`, color);
  }

  async testDatabaseConnection() {
    this.log('\n🗄️  Testing Database Connection', 'cyan');
    this.log('================================================', 'cyan');

    try {
      // Initialize Prisma Client
      this.prisma = new PrismaClient({
        log: ['error', 'warn'],
        errorFormat: 'pretty',
      });

      // Test basic connection
      const startTime = Date.now();
      await this.prisma.$connect();
      const connectionTime = Date.now() - startTime;

      this.results.connection = true;
      this.results.performance.connectionTime = connectionTime;
      this.logResult('Database Connection', 'PASS', `(${connectionTime}ms)`);

      // Test database query
      const queryStartTime = Date.now();
      await this.prisma.$queryRaw`SELECT 1 as test`;
      const queryTime = Date.now() - queryStartTime;

      this.results.performance.queryTime = queryTime;
      this.logResult('Basic Query Execution', 'PASS', `(${queryTime}ms)`);

      return true;
    } catch (error) {
      this.results.connection = false;
      this.logResult('Database Connection', 'FAIL', `(${error.message})`);
      return false;
    }
  }

  async testSchemaSync() {
    this.log('\n📋 Testing Database Schema', 'cyan');
    this.log('================================================', 'cyan');

    try {
      // Check if migrations are up to date
      try {
        execSync('npx prisma migrate status', {
          cwd: './apps/web',
          stdio: 'pipe'
        });
        this.logResult('Database Migrations', 'PASS', '(all migrations applied)');
      } catch (error) {
        this.logResult('Database Migrations', 'WARN', '(may need migration)');
      }

      // Test each model by trying to query it
      const models = [
        'organization',
        'user',
        'client',
        'document',
        'engagement',
        'invoice',
        'quickBooksToken',
        'subscription',
        'report'
      ];

      let workingModels = 0;
      for (const model of models) {
        try {
          await this.prisma[model].findMany({ take: 1 });
          this.results.models[model] = true;
          this.logResult(`Model: ${model}`, 'PASS', '(table accessible)');
          workingModels++;
        } catch (error) {
          this.results.models[model] = false;
          this.logResult(`Model: ${model}`, 'FAIL', `(${error.message.split('\n')[0]})`);
        }
      }

      this.results.schema = workingModels === models.length;
      this.logResult('Schema Completeness', this.results.schema ? 'PASS' : 'WARN',
        `(${workingModels}/${models.length} models accessible)`);

      return true;
    } catch (error) {
      this.logResult('Schema Testing', 'FAIL', `(${error.message})`);
      return false;
    }
  }

  async testBasicOperations() {
    this.log('\n⚙️  Testing Basic Database Operations', 'cyan');
    this.log('================================================', 'cyan');

    try {
      // Test CREATE operation
      const testOrgData = {
        name: 'Test Organization',
        subdomain: `test-${Date.now()}`,
        subscriptionTier: 'trial'
      };

      const createStartTime = Date.now();
      const createdOrg = await this.prisma.organization.create({
        data: testOrgData
      });
      const createTime = Date.now() - createStartTime;

      this.results.performance.createTime = createTime;
      this.logResult('CREATE Operation', 'PASS', `(${createTime}ms)`);

      // Test READ operation
      const readStartTime = Date.now();
      const foundOrg = await this.prisma.organization.findUnique({
        where: { id: createdOrg.id }
      });
      const readTime = Date.now() - readStartTime;

      this.results.performance.readTime = readTime;
      this.logResult('READ Operation', 'PASS', `(${readTime}ms)`);

      // Test UPDATE operation
      const updateStartTime = Date.now();
      const updatedOrg = await this.prisma.organization.update({
        where: { id: createdOrg.id },
        data: { name: 'Updated Test Organization' }
      });
      const updateTime = Date.now() - updateStartTime;

      this.results.performance.updateTime = updateTime;
      this.logResult('UPDATE Operation', 'PASS', `(${updateTime}ms)`);

      // Test DELETE operation
      const deleteStartTime = Date.now();
      await this.prisma.organization.delete({
        where: { id: createdOrg.id }
      });
      const deleteTime = Date.now() - deleteStartTime;

      this.results.performance.deleteTime = deleteTime;
      this.logResult('DELETE Operation', 'PASS', `(${deleteTime}ms)`);

      this.results.basicOperations = true;
      return true;

    } catch (error) {
      this.results.basicOperations = false;
      this.logResult('Basic Operations', 'FAIL', `(${error.message})`);
      return false;
    }
  }

  async testRelationalOperations() {
    this.log('\n🔗 Testing Relational Operations', 'cyan');
    this.log('================================================', 'cyan');

    try {
      // Create test organization
      const testOrg = await this.prisma.organization.create({
        data: {
          name: 'Relational Test Org',
          subdomain: `reltest-${Date.now()}`,
          subscriptionTier: 'trial'
        }
      });

      // Create user with relation
      const testUser = await this.prisma.user.create({
        data: {
          email: `test-${Date.now()}@example.com`,
          name: 'Test User',
          password: 'hashedpassword',
          role: 'admin',
          organizationId: testOrg.id
        }
      });

      this.logResult('Relational CREATE', 'PASS', '(user with organization)');

      // Test relational query
      const orgWithUsers = await this.prisma.organization.findUnique({
        where: { id: testOrg.id },
        include: { users: true }
      });

      if (orgWithUsers && orgWithUsers.users.length === 1) {
        this.logResult('Relational QUERY', 'PASS', '(include relations)');
      } else {
        this.logResult('Relational QUERY', 'FAIL', '(relations not working)');
      }

      // Test cascade delete
      await this.prisma.organization.delete({
        where: { id: testOrg.id }
      });

      // Verify user was cascade deleted
      const deletedUser = await this.prisma.user.findUnique({
        where: { id: testUser.id }
      });

      if (!deletedUser) {
        this.logResult('Cascade DELETE', 'PASS', '(related records deleted)');
      } else {
        this.logResult('Cascade DELETE', 'WARN', '(cascade may not be working)');
      }

      return true;

    } catch (error) {
      this.logResult('Relational Operations', 'FAIL', `(${error.message})`);
      return false;
    }
  }

  async testPerformance() {
    this.log('\n⚡ Performance Analysis', 'cyan');
    this.log('================================================', 'cyan');

    const avgConnectionTime = this.results.performance.connectionTime || 0;
    const avgQueryTime = this.results.performance.queryTime || 0;
    const avgCreateTime = this.results.performance.createTime || 0;
    const avgReadTime = this.results.performance.readTime || 0;
    const avgUpdateTime = this.results.performance.updateTime || 0;
    const avgDeleteTime = this.results.performance.deleteTime || 0;

    // Performance thresholds (ms)
    const thresholds = {
      connection: 1000,
      query: 100,
      crud: 200
    };

    this.logResult('Connection Time',
      avgConnectionTime < thresholds.connection ? 'PASS' : 'WARN',
      `(${avgConnectionTime}ms)`);

    this.logResult('Query Performance',
      avgQueryTime < thresholds.query ? 'PASS' : 'WARN',
      `(${avgQueryTime}ms)`);

    this.logResult('CRUD Performance',
      Math.max(avgCreateTime, avgReadTime, avgUpdateTime, avgDeleteTime) < thresholds.crud ? 'PASS' : 'WARN',
      `(max: ${Math.max(avgCreateTime, avgReadTime, avgUpdateTime, avgDeleteTime)}ms)`);

    return true;
  }

  async generateReport() {
    this.log('\n📊 Database Test Summary', 'cyan');
    this.log('================================================', 'cyan');

    const totalTests = 4; // connection, schema, operations, relations
    let passedTests = 0;

    if (this.results.connection) passedTests++;
    if (this.results.schema) passedTests++;
    if (this.results.basicOperations) passedTests++;

    const successRate = Math.round((passedTests / totalTests) * 100);

    this.log(`\n📈 Test Results: ${passedTests}/${totalTests} passed (${successRate}%)`,
      successRate >= 75 ? 'green' : successRate >= 50 ? 'yellow' : 'red');

    // Database status
    if (this.results.connection && this.results.schema && this.results.basicOperations) {
      this.log('🎯 Database Status: READY FOR DEVELOPMENT', 'green');
    } else if (this.results.connection && this.results.schema) {
      this.log('🎯 Database Status: PARTIALLY READY', 'yellow');
    } else {
      this.log('🎯 Database Status: NEEDS CONFIGURATION', 'red');
    }

    // Recommendations
    const recommendations = [];

    if (!this.results.connection) {
      recommendations.push('Fix database connection - check DATABASE_URL and network connectivity');
    }
    if (!this.results.schema) {
      recommendations.push('Run database migrations: npx prisma migrate deploy');
    }
    if (!this.results.basicOperations) {
      recommendations.push('Check database permissions and schema integrity');
    }

    if (recommendations.length > 0) {
      this.log('\n💡 Recommendations:', 'yellow');
      recommendations.forEach((rec, index) => {
        this.log(`   ${index + 1}. ${rec}`, 'yellow');
      });
    }

    const report = {
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: {
        passedTests,
        totalTests,
        successRate: `${successRate}%`,
        status: this.results.connection && this.results.schema && this.results.basicOperations ? 'READY' : 'NEEDS_WORK'
      },
      recommendations,
      performance: this.results.performance
    };

    // Save report
    const fs = require('fs');
    fs.writeFileSync('database-test-report.json', JSON.stringify(report, null, 2));
    this.log('\n📄 Detailed report saved to: database-test-report.json', 'cyan');

    return report;
  }

  async cleanup() {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
  }

  async runAllTests() {
    this.log('🗄️  Starting Database Integration Tests', 'magenta');

    try {
      const connectionSuccess = await this.testDatabaseConnection();

      if (connectionSuccess) {
        await this.testSchemaSync();
        await this.testBasicOperations();
        await this.testRelationalOperations();
        await this.testPerformance();
      }

      const report = await this.generateReport();
      this.log('\n🎉 Database testing complete!', 'green');

      return report;

    } catch (error) {
      this.log(`\n❌ Database test failed: ${error.message}`, 'red');
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new DatabaseTester();
  tester.runAllTests()
    .then(report => {
      process.exit(report.summary.status === 'READY' ? 0 : 1);
    })
    .catch(error => {
      console.error('Database test failed:', error);
      process.exit(1);
    });
}

module.exports = DatabaseTester;
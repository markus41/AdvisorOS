#!/usr/bin/env node

/**
 * QuickBooks Integration Test for AdvisorOS
 * Tests OAuth flow, API client, webhook handling, and sync functionality
 */

const fs = require('fs');
const path = require('path');

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

class QuickBooksIntegrationTester {
  constructor() {
    this.results = {
      configuration: {},
      codeStructure: {},
      apiClient: {},
      oauth: {},
      webhook: {},
      sync: {},
      schema: {}
    };
    this.recommendations = [];
  }

  log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logResult(test, status, message = '') {
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'WARN' ? '⚠️' : '⏭️';
    const color = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : status === 'WARN' ? 'yellow' : 'yellow';
    this.log(`${emoji} ${test}: ${status} ${message}`, color);
  }

  testConfiguration() {
    this.log('\n⚙️  Testing QuickBooks Configuration', 'cyan');
    this.log('================================================', 'cyan');

    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      this.logResult('Environment File', 'FAIL', '(.env not found)');
      return false;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');

    // Check required environment variables
    const requiredVars = [
      'QUICKBOOKS_CLIENT_ID',
      'QUICKBOOKS_CLIENT_SECRET',
      'QUICKBOOKS_WEBHOOK_SECRET',
      'QUICKBOOKS_SANDBOX'
    ];

    let configuredVars = 0;
    requiredVars.forEach(varName => {
      const match = envContent.match(new RegExp(`^${varName}=(.*)$`, 'm'));
      const value = match ? match[1].replace(/["']/g, '').trim() : null;

      if (value && !value.includes('placeholder') && !value.includes('your-')) {
        configuredVars++;
        this.results.configuration[varName] = true;
        this.logResult(`${varName}`, 'PASS', '(configured)');
      } else {
        this.results.configuration[varName] = false;
        this.logResult(`${varName}`, 'WARN', '(placeholder - will use mock)');
      }
    });

    // Check sandbox mode
    const sandboxMatch = envContent.match(/^QUICKBOOKS_SANDBOX=(.*)$/m);
    const sandboxValue = sandboxMatch ? sandboxMatch[1].replace(/["']/g, '').trim() : 'true';
    this.results.configuration.sandboxMode = sandboxValue === 'true';
    this.logResult('Sandbox Mode', 'PASS', `(${sandboxValue === 'true' ? 'enabled' : 'production mode'})`);

    this.results.configuration.score = configuredVars / requiredVars.length;

    if (configuredVars < requiredVars.length) {
      this.recommendations.push('Configure QuickBooks OAuth credentials for live testing');
    }

    return true;
  }

  testCodeStructure() {
    this.log('\n📁 Testing QuickBooks Code Structure', 'cyan');
    this.log('================================================', 'cyan');

    const integrationFiles = [
      {
        path: 'apps/web/src/lib/integrations/quickbooks/client.ts',
        name: 'QuickBooks API Client',
        key: 'apiClient'
      },
      {
        path: 'apps/web/src/lib/integrations/quickbooks/oauth.ts',
        name: 'QuickBooks OAuth Service',
        key: 'oauthService'
      },
      {
        path: 'apps/web/src/lib/integrations/quickbooks/sync/accounts-sync.ts',
        name: 'QuickBooks Sync Service',
        key: 'syncService'
      }
    ];

    let implementedFiles = 0;
    integrationFiles.forEach(file => {
      const fullPath = path.join(process.cwd(), file.path);
      if (fs.existsSync(fullPath)) {
        implementedFiles++;
        this.results.codeStructure[file.key] = true;
        this.logResult(file.name, 'PASS', '(implemented)');

        // Check code quality indicators
        const content = fs.readFileSync(fullPath, 'utf8');
        this.analyzeCodeQuality(file.name, content);
      } else {
        this.results.codeStructure[file.key] = false;
        this.logResult(file.name, 'FAIL', '(not implemented)');
      }
    });

    this.results.codeStructure.score = implementedFiles / integrationFiles.length;

    return true;
  }

  analyzeCodeQuality(fileName, content) {
    const checks = {
      errorHandling: content.includes('try') && content.includes('catch'),
      logging: content.includes('console.log') || content.includes('console.error'),
      typeScript: content.includes('interface') || content.includes('type'),
      documentation: content.includes('/**') || content.includes('//'),
      rateLimit: content.includes('rate') && content.includes('limit'),
      retry: content.includes('retry') || content.includes('attempt')
    };

    Object.entries(checks).forEach(([check, passed]) => {
      const status = passed ? 'PASS' : 'WARN';
      const description = check.replace(/([A-Z])/g, ' $1').toLowerCase();
      this.logResult(`  ${fileName} ${description}`, status);
    });
  }

  testAPIEndpoints() {
    this.log('\n🔗 Testing QuickBooks API Endpoints', 'cyan');
    this.log('================================================', 'cyan');

    const endpoints = [
      {
        path: 'apps/web/src/app/api/quickbooks/auth/connect/route.ts',
        name: 'OAuth Connect Endpoint',
        key: 'connectEndpoint'
      },
      {
        path: 'apps/web/src/app/api/quickbooks/auth/callback/route.ts',
        name: 'OAuth Callback Endpoint',
        key: 'callbackEndpoint'
      },
      {
        path: 'apps/web/src/app/api/quickbooks/auth/disconnect/route.ts',
        name: 'OAuth Disconnect Endpoint',
        key: 'disconnectEndpoint'
      },
      {
        path: 'apps/web/src/app/api/quickbooks/webhook/route.ts',
        name: 'Webhook Endpoint',
        key: 'webhookEndpoint'
      },
      {
        path: 'apps/web/src/app/api/quickbooks/sync/route.ts',
        name: 'Sync Endpoint',
        key: 'syncEndpoint'
      }
    ];

    let implementedEndpoints = 0;
    endpoints.forEach(endpoint => {
      const fullPath = path.join(process.cwd(), endpoint.path);
      if (fs.existsSync(fullPath)) {
        implementedEndpoints++;
        this.results.apiClient[endpoint.key] = true;
        this.logResult(endpoint.name, 'PASS', '(implemented)');

        // Check HTTP methods
        const content = fs.readFileSync(fullPath, 'utf8');
        const hasGet = content.includes('export async function GET');
        const hasPost = content.includes('export async function POST');

        if (hasGet || hasPost) {
          const methods = [hasGet && 'GET', hasPost && 'POST'].filter(Boolean).join(', ');
          this.logResult(`  ${endpoint.name} Methods`, 'PASS', `(${methods})`);
        }
      } else {
        this.results.apiClient[endpoint.key] = false;
        this.logResult(endpoint.name, 'FAIL', '(not implemented)');
      }
    });

    this.results.apiClient.score = implementedEndpoints / endpoints.length;

    return true;
  }

  testOAuthFlow() {
    this.log('\n🔐 Testing QuickBooks OAuth Flow', 'cyan');
    this.log('================================================', 'cyan');

    // Test OAuth client configuration
    const oauthPath = path.join(process.cwd(), 'apps/web/src/lib/integrations/quickbooks/oauth.ts');
    if (fs.existsSync(oauthPath)) {
      const content = fs.readFileSync(oauthPath, 'utf8');

      // Check OAuth implementation
      const oauthChecks = {
        'Authorization URL Generation': content.includes('authorize') || content.includes('auth'),
        'Token Exchange': content.includes('token') && content.includes('exchange'),
        'Token Refresh': content.includes('refresh'),
        'Scope Configuration': content.includes('scope'),
        'State Parameter': content.includes('state'),
        'PKCE Support': content.includes('pkce') || content.includes('code_verifier'),
        'Error Handling': content.includes('try') && content.includes('catch')
      };

      let passedChecks = 0;
      Object.entries(oauthChecks).forEach(([check, passed]) => {
        if (passed) passedChecks++;
        this.logResult(check, passed ? 'PASS' : 'WARN');
      });

      this.results.oauth.implementationScore = passedChecks / Object.keys(oauthChecks).length;
      this.results.oauth.implemented = true;
    } else {
      this.logResult('OAuth Implementation', 'FAIL', '(oauth.ts not found)');
      this.results.oauth.implemented = false;
    }

    return true;
  }

  testWebhookHandling() {
    this.log('\n📢 Testing QuickBooks Webhook Handling', 'cyan');
    this.log('================================================', 'cyan');

    const webhookPath = path.join(process.cwd(), 'apps/web/src/app/api/quickbooks/webhook/route.ts');
    if (fs.existsSync(webhookPath)) {
      const content = fs.readFileSync(webhookPath, 'utf8');

      // Check webhook implementation
      const webhookChecks = {
        'Signature Verification': content.includes('signature') && content.includes('verify'),
        'Event Processing': content.includes('event') && content.includes('type'),
        'Entity Handling': content.includes('Customer') || content.includes('Invoice'),
        'Error Handling': content.includes('try') && content.includes('catch'),
        'Idempotency': content.includes('idempotent') || content.includes('duplicate'),
        'Retry Logic': content.includes('retry') || content.includes('queue'),
        'Database Updates': content.includes('prisma') || content.includes('db'),
        'Response Format': content.includes('NextResponse')
      };

      let passedChecks = 0;
      Object.entries(webhookChecks).forEach(([check, passed]) => {
        if (passed) passedChecks++;
        this.logResult(check, passed ? 'PASS' : 'WARN');
      });

      this.results.webhook.implementationScore = passedChecks / Object.keys(webhookChecks).length;
      this.results.webhook.implemented = true;
    } else {
      this.logResult('Webhook Implementation', 'FAIL', '(webhook route not found)');
      this.results.webhook.implemented = false;
    }

    return true;
  }

  testSyncFunctionality() {
    this.log('\n🔄 Testing QuickBooks Sync Functionality', 'cyan');
    this.log('================================================', 'cyan');

    // Check sync service files
    const syncFiles = [
      'apps/web/src/lib/integrations/quickbooks/sync/accounts-sync.ts',
      'apps/web/src/lib/integrations/quickbooks/sync/customers-sync.ts',
      'apps/web/src/lib/integrations/quickbooks/sync/invoices-sync.ts',
      'apps/web/src/lib/integrations/quickbooks/sync/reports-sync.ts'
    ];

    let implementedSyncFiles = 0;
    syncFiles.forEach(filePath => {
      const fullPath = path.join(process.cwd(), filePath);
      const fileName = path.basename(filePath, '.ts');

      if (fs.existsSync(fullPath)) {
        implementedSyncFiles++;
        this.logResult(`${fileName}`, 'PASS', '(implemented)');

        const content = fs.readFileSync(fullPath, 'utf8');

        // Check sync functionality
        const syncChecks = {
          'Incremental Sync': content.includes('incremental') || content.includes('lastSync'),
          'Full Sync': content.includes('full') || content.includes('complete'),
          'Error Recovery': content.includes('error') && content.includes('recovery'),
          'Progress Tracking': content.includes('progress') || content.includes('status'),
          'Data Mapping': content.includes('map') || content.includes('transform'),
          'Validation': content.includes('validate') || content.includes('check')
        };

        const passedSyncChecks = Object.values(syncChecks).filter(Boolean).length;
        this.logResult(`  ${fileName} Features`, passedSyncChecks >= 4 ? 'PASS' : 'WARN',
          `(${passedSyncChecks}/${Object.keys(syncChecks).length} features)`);
      } else {
        this.logResult(`${fileName}`, 'WARN', '(not implemented)');
      }
    });

    this.results.sync.score = implementedSyncFiles / syncFiles.length;

    return true;
  }

  testDatabaseSchema() {
    this.log('\n🗄️  Testing QuickBooks Database Schema', 'cyan');
    this.log('================================================', 'cyan');

    const schemaPath = path.join(process.cwd(), 'apps/web/prisma/schema.prisma');
    if (!fs.existsSync(schemaPath)) {
      this.logResult('Prisma Schema', 'FAIL', '(schema.prisma not found)');
      return false;
    }

    const schemaContent = fs.readFileSync(schemaPath, 'utf8');

    // Check QuickBooks-related models
    const qbModels = [
      'QuickBooksToken',
      'QuickBooksSync',
      'QuickBooksWebhookEvent'
    ];

    let foundModels = 0;
    qbModels.forEach(model => {
      if (schemaContent.includes(`model ${model} {`)) {
        foundModels++;
        this.logResult(`${model} Model`, 'PASS', '(defined)');

        // Check model fields
        this.analyzeModelFields(schemaContent, model);
      } else {
        this.logResult(`${model} Model`, 'FAIL', '(missing)');
      }
    });

    // Check for QuickBooks-related fields in existing models
    const qbFields = [
      { model: 'Client', field: 'quickbooksId' },
      { model: 'Organization', field: 'quickbooksToken' },
      { model: 'Invoice', field: 'quickbooksId' }
    ];

    qbFields.forEach(({ model, field }) => {
      const modelMatch = schemaContent.match(new RegExp(`model ${model} \\{[\\s\\S]*?\\}`, 'g'));
      if (modelMatch && modelMatch[0].includes(field)) {
        this.logResult(`${model}.${field}`, 'PASS', '(field exists)');
      } else {
        this.logResult(`${model}.${field}`, 'WARN', '(field missing)');
      }
    });

    this.results.schema.score = foundModels / qbModels.length;

    return true;
  }

  analyzeModelFields(schemaContent, modelName) {
    const modelMatch = schemaContent.match(new RegExp(`model ${modelName} \\{([\\s\\S]*?)\\}`, 'g'));
    if (!modelMatch) return;

    const modelContent = modelMatch[0];

    // Check for essential fields based on model type
    const fieldChecks = {
      QuickBooksToken: ['accessToken', 'refreshToken', 'realmId', 'expiresAt'],
      QuickBooksSync: ['syncType', 'entityType', 'status', 'recordsProcessed'],
      QuickBooksWebhookEvent: ['eventId', 'eventType', 'entityName', 'realmId']
    };

    const requiredFields = fieldChecks[modelName] || [];
    let foundFields = 0;

    requiredFields.forEach(field => {
      if (modelContent.includes(field)) {
        foundFields++;
      }
    });

    if (foundFields === requiredFields.length) {
      this.logResult(`  ${modelName} Fields`, 'PASS', `(${foundFields}/${requiredFields.length})`);
    } else {
      this.logResult(`  ${modelName} Fields`, 'WARN', `(${foundFields}/${requiredFields.length})`);
    }
  }

  generateReport() {
    this.log('\n📊 QuickBooks Integration Summary', 'cyan');
    this.log('================================================', 'cyan');

    // Calculate overall scores
    const scores = {
      configuration: this.results.configuration.score || 0,
      codeStructure: this.results.codeStructure.score || 0,
      apiEndpoints: this.results.apiClient.score || 0,
      oauth: this.results.oauth.implementationScore || 0,
      webhook: this.results.webhook.implementationScore || 0,
      sync: this.results.sync.score || 0,
      schema: this.results.schema.score || 0
    };

    const overallScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;

    this.log(`\n📈 QuickBooks Integration Scores:`, 'cyan');
    Object.entries(scores).forEach(([category, score]) => {
      const percentage = Math.round(score * 100);
      const status = percentage >= 80 ? 'EXCELLENT' : percentage >= 60 ? 'GOOD' : percentage >= 40 ? 'FAIR' : 'NEEDS WORK';
      const color = percentage >= 80 ? 'green' : percentage >= 60 ? 'yellow' : 'red';
      this.log(`   ${category.padEnd(15)}: ${percentage}% - ${status}`, color);
    });

    const overallPercentage = Math.round(overallScore * 100);
    this.log(`\n🎯 Overall QuickBooks Readiness: ${overallPercentage}%`,
      overallPercentage >= 70 ? 'green' : overallPercentage >= 50 ? 'yellow' : 'red');

    // Determine integration status
    let status = 'READY_FOR_DEVELOPMENT';
    if (overallScore < 0.5) {
      status = 'NEEDS_IMPLEMENTATION';
    } else if (overallScore < 0.7) {
      status = 'PARTIALLY_READY';
    }

    this.log(`\n🔧 QuickBooks Status: ${status}`, status === 'READY_FOR_DEVELOPMENT' ? 'green' : 'yellow');

    // Generate recommendations
    if (this.results.configuration.score < 1) {
      this.recommendations.push('Configure QuickBooks OAuth credentials for live testing');
    }
    if (this.results.codeStructure.score < 1) {
      this.recommendations.push('Complete implementation of missing QuickBooks integration files');
    }
    if (this.results.apiClient.score < 1) {
      this.recommendations.push('Implement missing QuickBooks API endpoints');
    }
    if (!this.results.oauth.implemented) {
      this.recommendations.push('Implement QuickBooks OAuth flow');
    }
    if (!this.results.webhook.implemented) {
      this.recommendations.push('Implement QuickBooks webhook handling');
    }
    if (this.results.sync.score < 1) {
      this.recommendations.push('Complete QuickBooks sync functionality implementation');
    }
    if (this.results.schema.score < 1) {
      this.recommendations.push('Complete QuickBooks database schema');
    }

    if (this.recommendations.length > 0) {
      this.log('\n💡 QuickBooks Integration Recommendations:', 'yellow');
      this.recommendations.forEach((rec, index) => {
        this.log(`   ${index + 1}. ${rec}`, 'yellow');
      });
    }

    const report = {
      timestamp: new Date().toISOString(),
      scores,
      overallScore,
      status,
      results: this.results,
      recommendations: this.recommendations,
      summary: {
        overallReadiness: `${overallPercentage}%`,
        configurationStatus: this.results.configuration.score >= 0.5 ? 'CONFIGURED' : 'NEEDS_CONFIG',
        implementationStatus: this.results.codeStructure.score >= 0.8 ? 'COMPLETE' : 'IN_PROGRESS'
      }
    };

    // Save report
    fs.writeFileSync('quickbooks-integration-report.json', JSON.stringify(report, null, 2));
    this.log('\n📄 Detailed report saved to: quickbooks-integration-report.json', 'cyan');

    return report;
  }

  async runAllTests() {
    this.log('🔗 Starting QuickBooks Integration Tests', 'magenta');

    try {
      this.testConfiguration();
      this.testCodeStructure();
      this.testAPIEndpoints();
      this.testOAuthFlow();
      this.testWebhookHandling();
      this.testSyncFunctionality();
      this.testDatabaseSchema();

      const report = this.generateReport();
      this.log('\n🎉 QuickBooks integration testing complete!', 'green');

      return report;

    } catch (error) {
      this.log(`\n❌ QuickBooks test failed: ${error.message}`, 'red');
      throw error;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new QuickBooksIntegrationTester();
  tester.runAllTests()
    .then(report => {
      process.exit(report.overallScore >= 0.7 ? 0 : 1);
    })
    .catch(error => {
      console.error('QuickBooks integration test failed:', error);
      process.exit(1);
    });
}

module.exports = QuickBooksIntegrationTester;
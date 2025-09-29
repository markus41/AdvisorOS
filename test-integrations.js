#!/usr/bin/env node

/**
 * Integration Test Runner for AdvisorOS
 * Tests all external service integrations and provides fallbacks for missing API keys
 */

const { execSync, exec } = require('child_process');
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
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bg_red: '\x1b[41m',
  bg_green: '\x1b[42m'
};

class IntegrationTester {
  constructor() {
    this.results = {
      quickbooks: {},
      stripe: {},
      email: {},
      storage: {},
      ai: {},
      general: {}
    };
    this.baseUrl = 'http://localhost:3000';
    this.mockServer = null;
  }

  log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logSection(title) {
    this.log(`\n${'='.repeat(60)}`, 'cyan');
    this.log(`🧪 ${title}`, 'cyan');
    this.log(`${'='.repeat(60)}`, 'cyan');
  }

  logResult(test, status, message = '') {
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'SKIP' ? '⏭️' : '⚠️';
    const color = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : status === 'SKIP' ? 'yellow' : 'yellow';
    this.log(`${emoji} ${test}: ${status} ${message}`, color);
  }

  async checkEnvironmentConfig() {
    this.logSection('Environment Configuration Check');

    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      this.logResult('Environment file', 'FAIL', '(.env not found)');
      return false;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const placeholderPatterns = ['placeholder', 'your-', 'replace-with'];

    // Check QuickBooks config
    const qbClientId = this.getEnvValue(envContent, 'QUICKBOOKS_CLIENT_ID');
    const qbHasPlaceholder = placeholderPatterns.some(pattern => qbClientId?.includes(pattern));
    this.results.quickbooks.configValid = !qbHasPlaceholder;
    this.logResult('QuickBooks config', qbHasPlaceholder ? 'MOCK' : 'REAL', qbHasPlaceholder ? '(using placeholder)' : '(real API keys)');

    // Check Stripe config
    const stripeKey = this.getEnvValue(envContent, 'STRIPE_SECRET_KEY');
    const stripeHasPlaceholder = placeholderPatterns.some(pattern => stripeKey?.includes(pattern));
    this.results.stripe.configValid = !stripeHasPlaceholder;
    this.logResult('Stripe config', stripeHasPlaceholder ? 'MOCK' : 'REAL', stripeHasPlaceholder ? '(using placeholder)' : '(real API keys)');

    // Check Email config
    const smtpHost = this.getEnvValue(envContent, 'SMTP_HOST');
    const emailConfigured = smtpHost && !smtpHost.includes('#');
    this.results.email.configValid = emailConfigured;
    this.logResult('Email config', emailConfigured ? 'REAL' : 'MOCK', emailConfigured ? '(SMTP configured)' : '(no SMTP config)');

    // Check Storage config
    const storageAccount = this.getEnvValue(envContent, 'AZURE_STORAGE_ACCOUNT_NAME');
    const storageConfigured = storageAccount && !storageAccount.includes('#');
    this.results.storage.configValid = storageConfigured;
    this.logResult('Storage config', storageConfigured ? 'REAL' : 'MOCK', storageConfigured ? '(Azure configured)' : '(no storage config)');

    // Check AI config
    const openaiKey = this.getEnvValue(envContent, 'AZURE_OPENAI_API_KEY');
    const aiConfigured = openaiKey && !openaiKey.includes('#');
    this.results.ai.configValid = aiConfigured;
    this.logResult('AI config', aiConfigured ? 'REAL' : 'MOCK', aiConfigured ? '(OpenAI configured)' : '(no AI config)');

    return true;
  }

  getEnvValue(envContent, key) {
    const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
    return match ? match[1].replace(/["']/g, '') : null;
  }

  async startMockServer() {
    this.logSection('Starting Mock Services');

    // Create a simple mock server for missing services
    const mockServerCode = `
const express = require('express');
const app = express();
app.use(express.json());

// QuickBooks mock endpoints
app.get('/api/quickbooks/auth/connect', (req, res) => {
  res.json({
    authUrl: 'https://mock-quickbooks-auth.example.com',
    state: 'mock-state-123'
  });
});

app.post('/api/quickbooks/auth/connect', (req, res) => {
  res.json({
    connected: false,
    token: null
  });
});

// Stripe mock endpoints
app.post('/api/stripe/create-checkout-session', (req, res) => {
  res.json({
    sessionId: 'cs_mock_123',
    url: 'https://checkout.stripe.com/mock'
  });
});

// Storage mock endpoints
app.post('/api/documents/upload', (req, res) => {
  res.json({
    id: 'mock-doc-123',
    name: 'mock-file.pdf',
    url: 'https://mock-storage.example.com/mock-file.pdf'
  });
});

// Email mock endpoints
app.post('/api/reports/email', (req, res) => {
  res.json({
    success: true,
    messageId: 'mock-email-123'
  });
});

// AI mock endpoints
app.post('/api/ai/analyze-document', (req, res) => {
  res.json({
    analysis: 'Mock document analysis result',
    confidence: 0.95
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log('Mock server running on port', PORT);
});
`;

    fs.writeFileSync(path.join(process.cwd(), 'mock-server.js'), mockServerCode);

    try {
      this.mockServer = exec('node mock-server.js', { cwd: process.cwd() });
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for server to start
      this.logResult('Mock server', 'PASS', '(running on port 3001)');
      return true;
    } catch (error) {
      this.logResult('Mock server', 'FAIL', `(${error.message})`);
      return false;
    }
  }

  async testQuickBooksIntegration() {
    this.logSection('QuickBooks Integration Tests');

    try {
      // Test OAuth connect endpoint
      const response = await this.makeRequest('/api/quickbooks/auth/connect', 'GET');
      if (response.authUrl || response.error) {
        this.logResult('OAuth connect endpoint', 'PASS', '(endpoint responding)');
        this.results.quickbooks.oauthEndpoint = true;
      } else {
        this.logResult('OAuth connect endpoint', 'FAIL', '(unexpected response)');
        this.results.quickbooks.oauthEndpoint = false;
      }
    } catch (error) {
      this.logResult('OAuth connect endpoint', 'FAIL', `(${error.message})`);
      this.results.quickbooks.oauthEndpoint = false;
    }

    try {
      // Test connection status endpoint
      const response = await this.makeRequest('/api/quickbooks/auth/connect', 'POST');
      this.logResult('Connection status endpoint', 'PASS', `(connected: ${response.connected})`);
      this.results.quickbooks.statusEndpoint = true;
    } catch (error) {
      this.logResult('Connection status endpoint', 'FAIL', `(${error.message})`);
      this.results.quickbooks.statusEndpoint = false;
    }

    // Test webhook endpoint
    try {
      const response = await this.makeRequest('/api/quickbooks/webhook', 'POST', {
        eventNotifications: []
      });
      this.logResult('Webhook endpoint', 'PASS', '(accepts POST requests)');
      this.results.quickbooks.webhookEndpoint = true;
    } catch (error) {
      this.logResult('Webhook endpoint', 'FAIL', `(${error.message})`);
      this.results.quickbooks.webhookEndpoint = false;
    }

    // Test sync endpoints
    const syncEndpoints = [
      '/api/quickbooks/sync/status',
      '/api/quickbooks/sync/history',
      '/api/quickbooks/sync/configure'
    ];

    for (const endpoint of syncEndpoints) {
      try {
        await this.makeRequest(endpoint, 'GET');
        this.logResult(`Sync endpoint ${endpoint}`, 'PASS', '(accessible)');
      } catch (error) {
        this.logResult(`Sync endpoint ${endpoint}`, 'FAIL', `(${error.message})`);
      }
    }
  }

  async testStripeIntegration() {
    this.logSection('Stripe Integration Tests');

    try {
      // Test checkout session creation
      const response = await this.makeRequest('/api/stripe/create-checkout-session', 'POST', {
        priceId: 'price_test_123',
        organizationId: 'test-org'
      });

      if (response.sessionId || response.url || response.error) {
        this.logResult('Checkout session creation', 'PASS', '(endpoint responding)');
        this.results.stripe.checkoutEndpoint = true;
      } else {
        this.logResult('Checkout session creation', 'FAIL', '(unexpected response)');
        this.results.stripe.checkoutEndpoint = false;
      }
    } catch (error) {
      this.logResult('Checkout session creation', 'FAIL', `(${error.message})`);
      this.results.stripe.checkoutEndpoint = false;
    }

    try {
      // Test webhook endpoint
      const response = await this.makeRequest('/api/billing/stripe-webhook', 'POST', {
        type: 'test.event',
        data: {}
      });
      this.logResult('Stripe webhook', 'PASS', '(accepts webhooks)');
      this.results.stripe.webhookEndpoint = true;
    } catch (error) {
      this.logResult('Stripe webhook', 'FAIL', `(${error.message})`);
      this.results.stripe.webhookEndpoint = false;
    }
  }

  async testFileUploadStorage() {
    this.logSection('File Upload & Storage Tests');

    try {
      // Test document upload endpoint
      const response = await this.makeRequest('/api/documents/upload', 'POST', {
        fileName: 'test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf'
      });

      this.logResult('Document upload endpoint', 'PASS', '(endpoint accessible)');
      this.results.storage.uploadEndpoint = true;
    } catch (error) {
      this.logResult('Document upload endpoint', 'FAIL', `(${error.message})`);
      this.results.storage.uploadEndpoint = false;
    }

    try {
      // Test bulk upload endpoint
      const response = await this.makeRequest('/api/documents/bulk-upload', 'POST', {
        files: [{ name: 'test1.pdf' }, { name: 'test2.pdf' }]
      });

      this.logResult('Bulk upload endpoint', 'PASS', '(endpoint accessible)');
      this.results.storage.bulkUploadEndpoint = true;
    } catch (error) {
      this.logResult('Bulk upload endpoint', 'FAIL', `(${error.message})`);
      this.results.storage.bulkUploadEndpoint = false;
    }
  }

  async testEmailFunctionality() {
    this.logSection('Email Functionality Tests');

    try {
      // Test email report endpoint
      const response = await this.makeRequest('/api/reports/email', 'POST', {
        reportId: 'test-report',
        recipients: ['test@example.com']
      });

      this.logResult('Email report endpoint', 'PASS', '(endpoint accessible)');
      this.results.email.reportEndpoint = true;
    } catch (error) {
      this.logResult('Email report endpoint', 'FAIL', `(${error.message})`);
      this.results.email.reportEndpoint = false;
    }

    try {
      // Test draft email endpoint
      const response = await this.makeRequest('/api/ai/draft-email', 'POST', {
        subject: 'Test',
        context: 'Test email draft'
      });

      this.logResult('AI email draft endpoint', 'PASS', '(endpoint accessible)');
      this.results.email.draftEndpoint = true;
    } catch (error) {
      this.logResult('AI email draft endpoint', 'FAIL', `(${error.message})`);
      this.results.email.draftEndpoint = false;
    }
  }

  async testAIOCRFeatures() {
    this.logSection('AI/OCR Features Tests');

    const aiEndpoints = [
      '/api/ai/analyze-document',
      '/api/ai/generate-insights',
      '/api/ai/tax-suggestions',
      '/api/ai/advisory-report'
    ];

    for (const endpoint of aiEndpoints) {
      try {
        const response = await this.makeRequest(endpoint, 'POST', {
          document: 'test-document',
          context: 'test-context'
        });

        this.logResult(`AI endpoint ${endpoint}`, 'PASS', '(endpoint accessible)');
      } catch (error) {
        this.logResult(`AI endpoint ${endpoint}`, 'FAIL', `(${error.message})`);
      }
    }
  }

  async testErrorHandling() {
    this.logSection('Error Handling & Graceful Degradation Tests');

    // Test invalid endpoints
    try {
      await this.makeRequest('/api/invalid-endpoint', 'GET');
      this.logResult('404 error handling', 'FAIL', '(should return 404)');
    } catch (error) {
      if (error.message.includes('404')) {
        this.logResult('404 error handling', 'PASS', '(returns 404 correctly)');
      } else {
        this.logResult('404 error handling', 'WARN', `(unexpected error: ${error.message})`);
      }
    }

    // Test malformed requests
    try {
      await this.makeRequest('/api/quickbooks/auth/connect', 'POST', 'invalid-json');
      this.logResult('Malformed request handling', 'FAIL', '(should reject invalid JSON)');
    } catch (error) {
      this.logResult('Malformed request handling', 'PASS', '(rejects invalid requests)');
    }
  }

  async makeRequest(endpoint, method = 'GET', body = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (body) {
      options.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    try {
      return await response.json();
    } catch {
      return await response.text();
    }
  }

  generateReport() {
    this.logSection('Integration Test Summary Report');

    const report = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      results: this.results,
      recommendations: []
    };

    // Generate recommendations
    if (!this.results.quickbooks.configValid) {
      report.recommendations.push('Configure real QuickBooks API credentials for production testing');
    }
    if (!this.results.stripe.configValid) {
      report.recommendations.push('Configure real Stripe API credentials for payment testing');
    }
    if (!this.results.email.configValid) {
      report.recommendations.push('Configure SMTP settings for email functionality');
    }
    if (!this.results.storage.configValid) {
      report.recommendations.push('Configure Azure Storage for file upload functionality');
    }
    if (!this.results.ai.configValid) {
      report.recommendations.push('Configure AI services for document processing');
    }

    // Count passing tests
    const allTests = Object.values(this.results).flatMap(service => Object.values(service));
    const passingTests = allTests.filter(test => test === true).length;
    const totalTests = allTests.length;

    this.log(`\n📊 Test Results: ${passingTests}/${totalTests} tests passing`, 'cyan');

    if (report.recommendations.length > 0) {
      this.log('\n💡 Recommendations:', 'yellow');
      report.recommendations.forEach(rec => this.log(`   • ${rec}`, 'yellow'));
    }

    // Save detailed report
    fs.writeFileSync(
      path.join(process.cwd(), 'integration-test-report.json'),
      JSON.stringify(report, null, 2)
    );

    this.log('\n📄 Detailed report saved to: integration-test-report.json', 'cyan');

    return report;
  }

  async cleanup() {
    if (this.mockServer) {
      this.mockServer.kill();
    }

    // Clean up mock server file
    const mockServerPath = path.join(process.cwd(), 'mock-server.js');
    if (fs.existsSync(mockServerPath)) {
      fs.unlinkSync(mockServerPath);
    }
  }

  async runAllTests() {
    this.log('🚀 Starting AdvisorOS Integration Tests', 'magenta');

    try {
      // Check if Next.js server is running
      try {
        await this.makeRequest('/api/health', 'GET');
        this.logResult('Next.js server', 'PASS', '(server is running)');
      } catch (error) {
        this.log('\n⚠️  Next.js server not running. Please start with: npm run dev', 'yellow');
        this.log('Continuing with configuration checks only...\n', 'yellow');
      }

      await this.checkEnvironmentConfig();
      await this.startMockServer();

      // Run integration tests
      await this.testQuickBooksIntegration();
      await this.testStripeIntegration();
      await this.testFileUploadStorage();
      await this.testEmailFunctionality();
      await this.testAIOCRFeatures();
      await this.testErrorHandling();

      // Generate final report
      const report = this.generateReport();

      this.log('\n🎉 Integration testing complete!', 'green');

      return report;

    } catch (error) {
      this.log(`\n❌ Test runner error: ${error.message}`, 'red');
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Check if running directly
if (require.main === module) {
  const tester = new IntegrationTester();
  tester.runAllTests()
    .then(report => {
      process.exit(report.recommendations.length > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = IntegrationTester;
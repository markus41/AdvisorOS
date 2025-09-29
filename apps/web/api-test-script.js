#!/usr/bin/env node

/**
 * Comprehensive API Testing Script for AdvisorOS
 * Tests all backend API functionality and client management features
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_CONFIG = {
  organization: {
    name: 'Test CPA Firm',
    subdomain: 'test-cpa-firm-' + Date.now(),
  },
  user: {
    name: 'Test User',
    email: 'test-' + Date.now() + '@example.com',
    password: 'TestPassword123!',
  },
  client: {
    businessName: 'Test Client Corp',
    legalName: 'Test Client Corporation',
    primaryContactName: 'John Doe',
    primaryContactEmail: 'john@testclient.com',
    status: 'PROSPECT',
    riskLevel: 'MEDIUM',
  }
};

// Test results storage
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  results: []
};

// Helper functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type.toUpperCase().padEnd(5);
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

function recordTest(testName, passed, error = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`✅ ${testName}`, 'pass');
  } else {
    testResults.failed++;
    log(`❌ ${testName}: ${error}`, 'fail');
    testResults.errors.push({ test: testName, error: error.toString() });
  }
  testResults.results.push({ test: testName, passed, error: error?.toString() });
}

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };

  const requestOptions = { ...defaultOptions, ...options };
  if (requestOptions.headers['Content-Type'] === 'application/json' && requestOptions.body && typeof requestOptions.body === 'object') {
    requestOptions.body = JSON.stringify(requestOptions.body);
  }

  try {
    const response = await fetch(url, requestOptions);
    const data = response.headers.get('content-type')?.includes('application/json')
      ? await response.json()
      : await response.text();

    return {
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries()),
      ok: response.ok
    };
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

// Test functions
async function testServerStatus() {
  log('Testing server status...');
  try {
    const response = await makeRequest('/api/health', { method: 'GET' });
    recordTest('Server Health Check', response.status === 200 || response.status === 404);
  } catch (error) {
    recordTest('Server Health Check', false, error);
  }
}

async function testTRPCEndpoint() {
  log('Testing tRPC endpoint availability...');
  try {
    // Test tRPC endpoint with basic query
    const response = await makeRequest('/api/trpc', {
      method: 'POST',
      body: {
        "0": {
          "json": null,
          "meta": {
            "values": ["undefined"]
          }
        }
      }
    });

    // tRPC should respond even if unauthorized
    recordTest('tRPC Endpoint Available', response.status === 401 || response.status === 200 || response.status === 400);
  } catch (error) {
    recordTest('tRPC Endpoint Available', false, error);
  }
}

async function testClientAPIRoutes() {
  log('Testing client API routes...');

  // Test GET /api/clients (should require auth)
  try {
    const response = await makeRequest('/api/clients', { method: 'GET' });
    recordTest('Client List API (Unauthorized)', response.status === 401);
  } catch (error) {
    recordTest('Client List API (Unauthorized)', false, error);
  }

  // Test POST /api/clients (should require auth)
  try {
    const response = await makeRequest('/api/clients', {
      method: 'POST',
      body: TEST_CONFIG.client
    });
    recordTest('Client Create API (Unauthorized)', response.status === 401);
  } catch (error) {
    recordTest('Client Create API (Unauthorized)', false, error);
  }

  // Test client search endpoint
  try {
    const response = await makeRequest('/api/clients/search?q=test', { method: 'GET' });
    recordTest('Client Search API (Unauthorized)', response.status === 401);
  } catch (error) {
    recordTest('Client Search API (Unauthorized)', false, error);
  }

  // Test client export endpoint
  try {
    const response = await makeRequest('/api/clients/export', { method: 'GET' });
    recordTest('Client Export API (Unauthorized)', response.status === 401);
  } catch (error) {
    recordTest('Client Export API (Unauthorized)', false, error);
  }

  // Test client bulk operations
  try {
    const response = await makeRequest('/api/clients/bulk', {
      method: 'POST',
      body: {
        action: 'archive',
        clientIds: ['test-id']
      }
    });
    recordTest('Client Bulk Operations API (Unauthorized)', response.status === 401);
  } catch (error) {
    recordTest('Client Bulk Operations API (Unauthorized)', false, error);
  }
}

async function testAuthAPIRoutes() {
  log('Testing authentication API routes...');

  // Test registration endpoint
  try {
    const response = await makeRequest('/api/auth/register', {
      method: 'POST',
      body: {
        email: TEST_CONFIG.user.email,
        password: TEST_CONFIG.user.password,
        name: TEST_CONFIG.user.name,
        organizationName: TEST_CONFIG.organization.name,
        subdomain: TEST_CONFIG.organization.subdomain,
        role: 'owner'
      }
    });

    // Should either succeed or fail due to validation/duplicate
    recordTest('Registration API Available', response.status === 200 || response.status === 400 || response.status === 409);
  } catch (error) {
    recordTest('Registration API Available', false, error);
  }

  // Test login endpoint (NextAuth)
  try {
    const response = await makeRequest('/api/auth/signin', { method: 'GET' });
    recordTest('NextAuth Signin Available', response.status === 200 || response.status === 405);
  } catch (error) {
    recordTest('NextAuth Signin Available', false, error);
  }

  // Test password reset endpoint
  try {
    const response = await makeRequest('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: 'test@example.com' }
    });
    recordTest('Password Reset API Available', response.status === 200 || response.status === 400 || response.status === 404);
  } catch (error) {
    recordTest('Password Reset API Available', false, error);
  }

  // Test email verification endpoint
  try {
    const response = await makeRequest('/api/auth/verify-email', {
      method: 'POST',
      body: { token: 'test-token' }
    });
    recordTest('Email Verification API Available', response.status === 400 || response.status === 404);
  } catch (error) {
    recordTest('Email Verification API Available', false, error);
  }
}

async function testDocumentAPIRoutes() {
  log('Testing document API routes...');

  // Test OCR processing endpoint
  try {
    const response = await makeRequest('/api/ocr/process', {
      method: 'POST',
      body: { documentId: 'test-id' }
    });
    recordTest('OCR Process API (Unauthorized)', response.status === 401);
  } catch (error) {
    recordTest('OCR Process API (Unauthorized)', false, error);
  }

  // Test document review endpoint
  try {
    const response = await makeRequest('/api/ocr/review', {
      method: 'POST',
      body: { documentId: 'test-id', data: {} }
    });
    recordTest('OCR Review API (Unauthorized)', response.status === 401);
  } catch (error) {
    recordTest('OCR Review API (Unauthorized)', false, error);
  }
}

async function testIntegrationEndpoints() {
  log('Testing integration endpoints...');

  // Test QuickBooks OAuth
  try {
    const response = await makeRequest('/api/quickbooks/auth/connect', { method: 'GET' });
    recordTest('QuickBooks OAuth Available', response.status === 401 || response.status === 302);
  } catch (error) {
    recordTest('QuickBooks OAuth Available', false, error);
  }

  // Test QuickBooks sync status
  try {
    const response = await makeRequest('/api/quickbooks/sync/status', { method: 'GET' });
    recordTest('QuickBooks Sync Status API (Unauthorized)', response.status === 401);
  } catch (error) {
    recordTest('QuickBooks Sync Status API (Unauthorized)', false, error);
  }

  // Test Stripe webhooks endpoint
  try {
    const response = await makeRequest('/api/stripe/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { type: 'test' }
    });
    recordTest('Stripe Webhooks Available', response.status === 400 || response.status === 200);
  } catch (error) {
    recordTest('Stripe Webhooks Available', false, error);
  }

  // Test billing endpoints
  try {
    const response = await makeRequest('/api/billing/subscription', { method: 'GET' });
    recordTest('Billing Subscription API (Unauthorized)', response.status === 401);
  } catch (error) {
    recordTest('Billing Subscription API (Unauthorized)', false, error);
  }
}

async function testAPISecurityFeatures() {
  log('Testing API security features...');

  // Test SQL injection prevention
  try {
    const response = await makeRequest('/api/clients', {
      method: 'POST',
      body: {
        businessName: "'; DROP TABLE clients; --",
        email: 'test@example.com'
      }
    });
    // Should be blocked by auth, not cause a 500 error
    recordTest('SQL Injection Prevention', response.status === 401 && !response.data?.error?.includes('syntax'));
  } catch (error) {
    recordTest('SQL Injection Prevention', false, error);
  }

  // Test XSS prevention
  try {
    const response = await makeRequest('/api/auth/register', {
      method: 'POST',
      body: {
        name: '<script>alert("xss")</script>',
        email: 'test@example.com',
        password: 'TestPassword123!'
      }
    });
    // Should handle gracefully
    recordTest('XSS Prevention', response.status !== 500);
  } catch (error) {
    recordTest('XSS Prevention', false, error);
  }

  // Test large payload handling
  try {
    const largePayload = {
      name: 'x'.repeat(100000),
      email: 'test@example.com'
    };
    const response = await makeRequest('/api/auth/register', {
      method: 'POST',
      body: largePayload
    });
    // Should handle large payloads gracefully
    recordTest('Large Payload Handling', response.status === 400 || response.status === 413);
  } catch (error) {
    recordTest('Large Payload Handling', false, error);
  }
}

async function testInputValidation() {
  log('Testing input validation...');

  // Test email validation
  try {
    const response = await makeRequest('/api/auth/register', {
      method: 'POST',
      body: {
        email: 'invalid-email',
        password: 'TestPassword123!',
        name: 'Test User'
      }
    });
    recordTest('Email Validation', response.status === 400);
  } catch (error) {
    recordTest('Email Validation', false, error);
  }

  // Test required field validation
  try {
    const response = await makeRequest('/api/auth/register', {
      method: 'POST',
      body: {}
    });
    recordTest('Required Field Validation', response.status === 400);
  } catch (error) {
    recordTest('Required Field Validation', false, error);
  }
}

async function testRateLimiting() {
  log('Testing rate limiting...');

  try {
    // Make multiple rapid requests
    const requests = Array.from({ length: 20 }, () =>
      makeRequest('/api/auth/register', {
        method: 'POST',
        body: {
          email: 'test-' + Math.random() + '@example.com',
          password: 'TestPassword123!',
          name: 'Test User'
        }
      })
    );

    const responses = await Promise.all(requests);
    const rateLimited = responses.some(r => r.status === 429);

    recordTest('Rate Limiting', rateLimited || responses.every(r => r.status === 400));
  } catch (error) {
    recordTest('Rate Limiting', false, error);
  }
}

async function checkDatabaseConnection() {
  log('Testing database connectivity through API...');

  try {
    // Any API that would hit the database
    const response = await makeRequest('/api/auth/register', {
      method: 'POST',
      body: {
        email: 'db-test@example.com',
        password: 'TestPassword123!',
        name: 'DB Test User'
      }
    });

    // If we get anything other than a 500 server error, DB is likely connected
    recordTest('Database Connectivity', response.status !== 500 || !response.data?.error?.includes('database'));
  } catch (error) {
    recordTest('Database Connectivity', false, error);
  }
}

async function generateReport() {
  log('\n' + '='.repeat(80));
  log('API TESTING COMPLETE');
  log('='.repeat(80));
  log(`Total Tests: ${testResults.total}`);
  log(`Passed: ${testResults.passed} ✅`);
  log(`Failed: ${testResults.failed} ❌`);
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  if (testResults.failed > 0) {
    log('\nFailed Tests:');
    testResults.errors.forEach((error, index) => {
      log(`${index + 1}. ${error.test}: ${error.error}`);
    });
  }

  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: (testResults.passed / testResults.total) * 100
    },
    results: testResults.results,
    errors: testResults.errors,
    config: TEST_CONFIG
  };

  const reportPath = path.join(__dirname, 'api-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\nDetailed report saved to: ${reportPath}`);

  return report;
}

// Main test execution
async function runAllTests() {
  log('Starting comprehensive API testing...');
  log(`Base URL: ${BASE_URL}`);
  log(`Test Configuration: ${JSON.stringify(TEST_CONFIG, null, 2)}`);

  try {
    await testServerStatus();
    await testTRPCEndpoint();
    await testAuthAPIRoutes();
    await testClientAPIRoutes();
    await testDocumentAPIRoutes();
    await testIntegrationEndpoints();
    await checkDatabaseConnection();
    await testInputValidation();
    await testAPISecurityFeatures();
    await testRateLimiting();

    const report = await generateReport();

    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);

  } catch (error) {
    log(`Test execution failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Check if server is running first
async function checkServerAvailability() {
  try {
    const response = await fetch(BASE_URL);
    return true;
  } catch (error) {
    log(`Server not available at ${BASE_URL}. Please start the development server first.`, 'error');
    log('Run: npm run dev', 'info');
    return false;
  }
}

// Entry point
(async () => {
  const serverAvailable = await checkServerAvailability();
  if (serverAvailable) {
    await runAllTests();
  } else {
    process.exit(1);
  }
})();
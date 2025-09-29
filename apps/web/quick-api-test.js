#!/usr/bin/env node

/**
 * Quick API Testing Script for AdvisorOS
 * Tests core API functionality without external dependencies
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

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
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      status: response.status,
      data,
      ok: response.ok
    };
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

async function runQuickTests() {
  console.log('🚀 Starting Quick API Tests...\n');

  const tests = [
    {
      name: 'Server Health',
      test: async () => {
        const response = await makeRequest('/');
        return response.status === 200 || response.status === 404;
      }
    },
    {
      name: 'tRPC Endpoint',
      test: async () => {
        const response = await makeRequest('/api/trpc');
        return response.status === 405 || response.status === 400; // Method not allowed for GET
      }
    },
    {
      name: 'NextAuth Endpoint',
      test: async () => {
        const response = await makeRequest('/api/auth/signin');
        return response.status === 200 || response.status === 405;
      }
    },
    {
      name: 'Client API (Unauthorized)',
      test: async () => {
        const response = await makeRequest('/api/clients');
        return response.status === 401 || response.status === 405;
      }
    },
    {
      name: 'Registration API',
      test: async () => {
        const response = await makeRequest('/api/auth/register', {
          method: 'POST',
          body: {
            email: 'test@example.com',
            password: 'TestPassword123!',
            name: 'Test User'
          }
        });
        return response.status === 400 || response.status === 200 || response.status === 409;
      }
    },
    {
      name: 'QuickBooks Auth',
      test: async () => {
        const response = await makeRequest('/api/quickbooks/auth/connect');
        return response.status === 401 || response.status === 302 || response.status === 405;
      }
    },
    {
      name: 'OCR Process API',
      test: async () => {
        const response = await makeRequest('/api/ocr/process', {
          method: 'POST',
          body: { documentId: 'test' }
        });
        return response.status === 401 || response.status === 400;
      }
    },
    {
      name: 'Stripe Webhooks',
      test: async () => {
        const response = await makeRequest('/api/stripe/webhooks', {
          method: 'POST',
          body: { type: 'test' }
        });
        return response.status === 400 || response.status === 200;
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const { name, test } of tests) {
    try {
      const result = await test();
      if (result) {
        console.log(`✅ ${name}`);
        passed++;
      } else {
        console.log(`❌ ${name}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  console.log(`Success rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  return { passed, failed };
}

runQuickTests().catch(console.error);
/**
 * Artillery.js Load Testing Configuration for AdvisorOS
 *
 * This file defines load testing scenarios for the CPA platform,
 * focusing on real-world usage patterns during peak periods (tax season).
 *
 * Run with: npx artillery run tests/performance/load-testing.js
 */

module.exports = {
  config: {
    target: process.env.LOAD_TEST_TARGET || 'http://localhost:3000',
    phases: [
      // Warm-up phase: Gradual ramp up
      {
        duration: 300, // 5 minutes
        arrivalRate: 1,
        rampTo: 10,
        name: 'Warm-up'
      },
      // Peak load phase: Simulate tax season traffic
      {
        duration: 600, // 10 minutes
        arrivalRate: 50,
        name: 'Peak Load'
      },
      // Stress test phase: Push beyond normal capacity
      {
        duration: 300, // 5 minutes
        arrivalRate: 100,
        name: 'Stress Test'
      },
      // Cool down phase: Gradual reduction
      {
        duration: 300, // 5 minutes
        arrivalRate: 100,
        rampTo: 10,
        name: 'Cool Down'
      }
    ],
    payload: {
      // Test data for realistic scenarios
      path: './test-data/load-test-data.csv',
      fields: ['firmName', 'userEmail', 'clientName', 'documentType'],
      skipHeader: true
    },
    defaults: {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Artillery Load Test'
      }
    },
    processor: './load-test-processor.js',
    plugins: {
      // Custom metrics for CPA-specific operations
      metrics: {
        namespace: 'advisoros',
        tags: {
          environment: process.env.NODE_ENV || 'test',
          version: process.env.APP_VERSION || '1.0.0'
        }
      },
      // Memory and CPU monitoring
      monitoring: {
        enabled: true,
        interval: 10000 // 10 seconds
      }
    }
  },
  scenarios: [
    {
      name: 'CPA Dashboard Access Pattern',
      weight: 30,
      flow: [
        // Authenticate user
        {
          post: {
            url: '/api/auth/signin',
            json: {
              email: '{{ userEmail }}',
              password: 'testpassword123'
            },
            capture: {
              json: '$.token',
              as: 'authToken'
            }
          }
        },
        // Access dashboard
        {
          get: {
            url: '/api/trpc/dashboard.stats',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            expect: [
              { statusCode: 200 },
              { hasProperty: 'clients' },
              { hasProperty: 'documents' }
            ]
          }
        },
        // Check recent activity
        {
          get: {
            url: '/api/trpc/dashboard.recentActivity',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            expect: [
              { statusCode: 200 }
            ]
          }
        },
        // Think time - user reviewing dashboard
        { think: { seconds: 3 } }
      ]
    },
    {
      name: 'Client Management Workflow',
      weight: 25,
      flow: [
        // Authenticate
        {
          post: {
            url: '/api/auth/signin',
            json: {
              email: '{{ userEmail }}',
              password: 'testpassword123'
            },
            capture: {
              json: '$.token',
              as: 'authToken'
            }
          }
        },
        // List clients with pagination
        {
          get: {
            url: '/api/trpc/client.list?input={"pagination":{"page":1,"limit":20}}',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            expect: [
              { statusCode: 200 },
              { hasProperty: 'clients' },
              { hasProperty: 'pagination' }
            ]
          }
        },
        // Search clients
        {
          get: {
            url: '/api/trpc/client.search?input={"query":"{{ clientName }}","limit":10}',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            expect: [
              { statusCode: 200 }
            ]
          }
        },
        // Create new client
        {
          post: {
            url: '/api/trpc/client.create',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            json: {
              businessName: 'Load Test Client {{ $randomString() }}',
              legalName: 'Load Test Client LLC {{ $randomString() }}',
              primaryContactEmail: 'loadtest{{ $randomInt(1000,9999) }}@example.com',
              primaryContactName: 'Load Test Contact',
              businessType: 'LLC',
              status: 'ACTIVE'
            },
            capture: {
              json: '$.id',
              as: 'clientId'
            },
            expect: [
              { statusCode: 200 },
              { hasProperty: 'id' }
            ]
          }
        },
        // Get client details
        {
          get: {
            url: '/api/trpc/client.byId?input={"id":"{{ clientId }}"}',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            expect: [
              { statusCode: 200 },
              { hasProperty: 'businessName' }
            ]
          }
        },
        // Think time - user reviewing client data
        { think: { seconds: 5 } }
      ]
    },
    {
      name: 'Document Upload and Processing',
      weight: 20,
      flow: [
        // Authenticate
        {
          post: {
            url: '/api/auth/signin',
            json: {
              email: '{{ userEmail }}',
              password: 'testpassword123'
            },
            capture: {
              json: '$.token',
              as: 'authToken'
            }
          }
        },
        // Get upload URL/token
        {
          post: {
            url: '/api/trpc/document.getUploadUrl',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            json: {
              fileName: 'load-test-{{ $randomString() }}.pdf',
              fileSize: 1048576, // 1MB
              contentType: 'application/pdf'
            },
            capture: [
              { json: '$.uploadUrl', as: 'uploadUrl' },
              { json: '$.documentId', as: 'documentId' }
            ],
            expect: [
              { statusCode: 200 }
            ]
          }
        },
        // Simulate file upload (mock)
        {
          post: {
            url: '/api/trpc/document.confirmUpload',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            json: {
              documentId: '{{ documentId }}',
              category: '{{ documentType }}',
              clientId: 'load-test-client'
            },
            expect: [
              { statusCode: 200 }
            ]
          }
        },
        // Check processing status
        {
          get: {
            url: '/api/trpc/document.getProcessingStatus?input={"id":"{{ documentId }}"}',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            expect: [
              { statusCode: 200 }
            ]
          }
        },
        // Think time - processing time
        { think: { seconds: 2 } }
      ]
    },
    {
      name: 'QuickBooks Sync Operations',
      weight: 15,
      flow: [
        // Authenticate
        {
          post: {
            url: '/api/auth/signin',
            json: {
              email: '{{ userEmail }}',
              password: 'testpassword123'
            },
            capture: {
              json: '$.token',
              as: 'authToken'
            }
          }
        },
        // Check QB connection status
        {
          get: {
            url: '/api/trpc/quickbooks.getStatus',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            expect: [
              { statusCode: 200 }
            ]
          }
        },
        // Trigger data sync
        {
          post: {
            url: '/api/trpc/quickbooks.syncData',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            json: {
              syncType: 'incremental',
              entities: ['customers', 'invoices', 'accounts']
            },
            expect: [
              { statusCode: 200 }
            ]
          }
        },
        // Check sync progress
        {
          get: {
            url: '/api/trpc/quickbooks.getSyncStatus',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            expect: [
              { statusCode: 200 }
            ]
          }
        },
        // Think time - sync processing
        { think: { seconds: 8 } }
      ]
    },
    {
      name: 'AI Document Processing',
      weight: 10,
      flow: [
        // Authenticate
        {
          post: {
            url: '/api/auth/signin',
            json: {
              email: '{{ userEmail }}',
              password: 'testpassword123'
            },
            capture: {
              json: '$.token',
              as: 'authToken'
            }
          }
        },
        // Submit document for AI analysis
        {
          post: {
            url: '/api/trpc/ai.analyzeDocument',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            json: {
              documentId: 'sample-document-id',
              analysisType: 'tax_document_extraction'
            },
            capture: {
              json: '$.analysisId',
              as: 'analysisId'
            },
            expect: [
              { statusCode: 200 }
            ]
          }
        },
        // Check analysis progress
        {
          get: {
            url: '/api/trpc/ai.getAnalysisStatus?input={"id":"{{ analysisId }}"}',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            expect: [
              { statusCode: 200 }
            ]
          }
        },
        // Get analysis results
        {
          get: {
            url: '/api/trpc/ai.getAnalysisResults?input={"id":"{{ analysisId }}"}',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            expect: [
              { statusCode: 200 }
            ]
          }
        },
        // Think time - AI processing
        { think: { seconds: 15 } }
      ]
    }
  ]
}
# CPA Platform Testing Suite

This document describes the comprehensive testing strategy and setup for the CPA Platform application.

## Overview

The testing suite includes:
- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test interactions between components and external services
- **API Route Tests**: Test all API endpoints for functionality, security, and performance
- **Component Tests**: Test React components with user interactions
- **E2E Tests**: Test complete user workflows across the application
- **Performance Tests**: Ensure the application meets performance requirements
- **Security Tests**: Validate security measures and prevent vulnerabilities

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (for integration tests)
- Chrome/Chromium (for E2E tests)

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Environment Setup

Create a `.env.test` file:

```env
DATABASE_URL=postgresql://test:test@localhost:5432/cpa_platform_test
NEXTAUTH_SECRET=test-secret-key
NEXTAUTH_URL=http://localhost:3000
AZURE_FORM_RECOGNIZER_ENDPOINT=https://test.cognitiveservices.azure.com/
AZURE_FORM_RECOGNIZER_KEY=test-key
STRIPE_SECRET_KEY=sk_test_123
```

## Test Commands

### Run All Tests
```bash
npm run test:all
```

### Unit Tests
```bash
# Run unit tests
npm run test:unit

# Run with watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Integration Tests
```bash
npm run test:integration
```

### API Route Tests
```bash
npm run test:api
```

### Component Tests
```bash
npm run test:components
```

### E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/e2e/auth/login.test.ts
```

### Performance Tests
```bash
npm run test:performance
```

### Security Tests
```bash
npm run test:security
```

## Test Structure

```
tests/
├── __tests__/              # Unit tests
│   ├── lib/                # Library function tests
│   ├── components/         # React component tests
│   └── fixtures/           # Test data and helpers
├── integration/            # Integration tests
│   ├── database.test.ts    # Database operations
│   ├── trpc.test.ts       # tRPC procedures
│   ├── api-routes.test.ts  # API endpoint tests
│   └── setup.js           # Integration test setup
├── e2e/                    # End-to-end tests
│   ├── auth/              # Authentication flows
│   ├── clients/           # Client management
│   ├── documents/         # Document handling
│   ├── .auth/             # Authentication state
│   ├── global-setup.ts    # E2E global setup
│   └── global-teardown.ts # E2E cleanup
├── performance/           # Performance tests
│   ├── database-performance.test.ts
│   ├── api-performance.test.ts
│   └── setup.js
├── security/              # Security tests
│   ├── authentication-security.test.ts
│   ├── input-validation.test.ts
│   └── setup.js
└── fixtures/              # Shared test data
    ├── test-data.ts       # Mock data
    ├── clients.csv        # Test CSV files
    └── documents/         # Test documents
```

## Writing Tests

### Unit Tests

```typescript
// __tests__/lib/utils.test.ts
import { formatCurrency } from '@/lib/utils'

describe('formatCurrency', () => {
  it('should format USD currency correctly', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })
})
```

### Component Tests

```typescript
// __tests__/components/login-form.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { LoginForm } from '@/components/auth/login-form'

describe('LoginForm', () => {
  it('should validate required fields', async () => {
    render(<LoginForm />)
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(screen.getByText('Email is required')).toBeInTheDocument()
  })
})
```

### Integration Tests

```typescript
// tests/integration/api.test.ts
import { createTRPCMsw } from 'msw-trpc'
import { appRouter } from '@/server/api/root'

describe('Client API', () => {
  it('should create client with valid data', async () => {
    const client = await caller.client.create({
      businessName: 'Test Corp',
      email: 'test@corp.com'
    })

    expect(client.businessName).toBe('Test Corp')
  })
})
```

### E2E Tests

```typescript
// tests/e2e/auth/login.test.ts
import { test, expect } from '@playwright/test'

test('should login successfully', async ({ page }) => {
  await page.goto('/auth/signin')
  await page.fill('[data-testid="email-input"]', 'admin@test.com')
  await page.fill('[data-testid="password-input"]', 'password')
  await page.click('[data-testid="signin-button"]')

  await expect(page).toHaveURL('/dashboard')
})
```

## Test Data Management

### Fixtures
Test data is centralized in the `tests/fixtures/` directory:

```typescript
// tests/fixtures/test-data.ts
export const mockClient = {
  businessName: 'Acme Corporation',
  email: 'contact@acme.com',
  status: 'ACTIVE'
}
```

### Database Seeding
Integration and E2E tests use database seeding:

```typescript
// Before each test
beforeEach(async () => {
  await prisma.client.deleteMany()
  await createTestOrganization()
  await createTestUser()
})
```

## Mocking Strategy

### External Services
```typescript
// Mock Stripe
jest.mock('stripe', () => ({
  Stripe: jest.fn().mockImplementation(() => ({
    customers: { create: jest.fn() }
  }))
}))

// Mock Azure services
jest.mock('@azure/ai-form-recognizer', () => ({
  DocumentAnalysisClient: jest.fn()
}))
```

### API Responses
```typescript
// Mock tRPC procedures
const mockCreateClient = jest.fn()
jest.mock('@/server/api/routers/client', () => ({
  clientRouter: {
    create: mockCreateClient
  }
}))
```

## Performance Testing

### Database Performance
```typescript
test('should handle large datasets efficiently', async () => {
  const largeDataset = Array.from({ length: 10000 }, createMockClient)

  const startTime = performance.now()
  await ClientService.getClients('org-123')
  const endTime = performance.now()

  expect(endTime - startTime).toBeLessThan(1000) // 1 second
})
```

### API Performance
```typescript
test('should respond to API calls within SLA', async () => {
  const response = await fetch('/api/clients')
  const responseTime = response.headers.get('x-response-time')

  expect(Number(responseTime)).toBeLessThan(500) // 500ms
})
```

## Security Testing

### Input Validation
```typescript
test('should reject XSS attempts', async () => {
  const maliciousInput = '<script>alert("xss")</script>'

  const response = await request(app)
    .post('/api/clients')
    .send({ name: maliciousInput })

  expect(response.status).toBe(400)
})
```

### Authentication Security
```typescript
test('should enforce rate limits', async () => {
  // Make multiple rapid requests
  const requests = Array.from({ length: 10 }, () =>
    request(app).post('/api/auth/login')
  )

  const responses = await Promise.all(requests)
  const rateLimited = responses.filter(r => r.status === 429)

  expect(rateLimited.length).toBeGreaterThan(0)
})
```

## Coverage Requirements

### Minimum Coverage Thresholds
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

### Critical Path Coverage
- Authentication flows: 95%
- Payment processing: 95%
- Data validation: 90%
- Security functions: 95%

## Continuous Integration

### GitHub Actions
The test suite runs on every push and pull request:

1. **Unit Tests**: Fast feedback on code changes
2. **Integration Tests**: Validate component interactions
3. **E2E Tests**: Ensure user workflows work end-to-end
4. **Performance Tests**: Catch performance regressions
5. **Security Tests**: Validate security measures

### Test Reports
- Coverage reports uploaded to Codecov
- E2E test reports with screenshots/videos
- Performance benchmark reports
- Security scan results

## Debugging Tests

### Failed Unit Tests
```bash
# Run specific test file
npm test -- --testNamePattern="specific test name"

# Run with verbose output
npm test -- --verbose
```

### Failed E2E Tests
```bash
# Run with debug mode
npx playwright test --debug

# Run with headed browser
npx playwright test --headed

# Generate trace
npx playwright test --trace on
```

### Test Database Issues
```bash
# Reset test database
npx prisma migrate reset --force

# Check database connection
npx prisma db push
```

## Best Practices

### Test Isolation
- Each test should be independent
- Clean up data after each test
- Use fresh instances for mocks

### Test Naming
```typescript
// Good: Descriptive and specific
test('should create client with valid business information')

// Bad: Vague
test('client creation')
```

### Assertions
```typescript
// Good: Specific assertions
expect(response.status).toBe(201)
expect(response.body.client.businessName).toBe('Acme Corp')

// Bad: Generic assertions
expect(response).toBeTruthy()
```

### Test Data
```typescript
// Good: Use factories or fixtures
const client = createTestClient({ businessName: 'Test Corp' })

// Bad: Inline test data
const client = { businessName: 'Test Corp', email: 'test@test.com', ... }
```

## Troubleshooting

### Common Issues

1. **Test Database Connection**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL environment variable
   - Run `npx prisma db push` to sync schema

2. **E2E Test Failures**
   - Check if application is running on correct port
   - Verify test data is properly seeded
   - Check browser compatibility

3. **Performance Test Failures**
   - Ensure adequate system resources
   - Check if other processes are affecting performance
   - Review performance thresholds

4. **Security Test Failures**
   - Verify security configurations
   - Check if rate limiting is properly configured
   - Ensure input validation is working

### Getting Help

- Check the test logs for detailed error messages
- Review the test documentation for specific test suites
- Check GitHub Actions for CI/CD pipeline issues
- Consult the main README for application setup issues

## Contributing

When adding new features:

1. Write unit tests for new functions/components
2. Add integration tests for new API endpoints
3. Include E2E tests for new user workflows
4. Consider performance implications
5. Add security tests for sensitive operations
6. Update test documentation

All pull requests must have:
- ✅ All tests passing
- ✅ Code coverage meeting thresholds
- ✅ Security tests for sensitive changes
- ✅ Performance tests for critical paths
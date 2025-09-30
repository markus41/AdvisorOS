# Generate Tests Command

Automatically generates comprehensive test suites for specified files, including unit tests, integration tests, and multi-tenant security tests.

## Usage

```bash
/generate-tests <file_path>
```

## What This Command Does

1. **Unit Tests**: Creates Jest tests for functions and components
2. **Integration Tests**: Generates API endpoint tests with database
3. **Security Tests**: Multi-tenant isolation and permission tests
4. **Edge Cases**: Identifies and tests boundary conditions
5. **Mock Data**: Generates realistic test data
6. **Coverage Analysis**: Ensures comprehensive code coverage

## Test Types Generated

### For React Components
- Render tests with various props
- User interaction tests (click, input, etc.)
- State management tests
- Hook behavior tests
- Accessibility tests

### For API Routes
- Success scenarios with valid inputs
- Error handling with invalid inputs
- Multi-tenant isolation tests
- Permission/RBAC validation tests
- Rate limiting tests

### For Service Classes
- Business logic validation
- Database interaction mocking
- Error handling scenarios
- Audit trail verification

## Arguments

- `$ARGUMENTS`: File path to generate tests for (required)

## Example

```bash
/generate-tests apps/web/src/server/services/client.service.ts
```

---

**Test Generation**: Uses test-suite-developer agent to analyze $ARGUMENTS and generate comprehensive, production-ready test suites with proper mocking, assertions, and multi-tenant security validation.
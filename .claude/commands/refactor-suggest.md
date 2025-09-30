# Refactor Suggest Command

Analyzes code and provides intelligent refactoring suggestions to improve code quality, maintainability, performance, and security.

## Usage

```bash
/refactor-suggest <file_path>
```

## What This Command Does

1. **Code Smell Detection**: Identifies anti-patterns and code smells
2. **DRY Violations**: Finds duplicated code that should be extracted
3. **Complexity Analysis**: Measures cyclomatic complexity and suggests simplification
4. **Type Safety**: Recommends stronger TypeScript typing
5. **Performance**: Identifies optimization opportunities
6. **Security**: Suggests security improvements
7. **Best Practices**: Ensures alignment with AdvisorOS patterns

## Refactoring Categories

### Structure & Organization
- Extract functions/components from large implementations
- Consolidate duplicate logic
- Improve module organization
- Better separation of concerns

### Type Safety
- Replace `any` with proper types
- Add missing type annotations
- Use discriminated unions
- Leverage TypeScript utility types

### Performance
- Memoization opportunities
- Lazy loading candidates
- Caching strategies
- Query optimization

### Security & Compliance
- Multi-tenant isolation improvements
- Audit trail additions
- Input validation enhancements
- Permission check additions

## Arguments

- `$ARGUMENTS`: File path to analyze (required)

## Example

```bash
/refactor-suggest apps/web/src/components/ClientDashboard.tsx
```

---

**AI-Powered Analysis**: Uses technical-debt-planner and architecture-designer agents to analyze $ARGUMENTS and provide actionable refactoring recommendations aligned with AdvisorOS best practices.
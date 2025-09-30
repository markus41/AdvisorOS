# Migration Plan Command

Creates comprehensive migration plans for database schema changes, framework upgrades, or technology transitions with minimal downtime and risk.

## Usage

```bash
/migration-plan <from> <to>
```

## What This Command Does

1. **Impact Analysis**: Assesses scope and risk of migration
2. **Step-by-Step Plan**: Creates detailed migration strategy
3. **Rollback Strategy**: Plans for safe rollback if needed
4. **Testing Strategy**: Defines test scenarios for validation
5. **Downtime Estimation**: Calculates expected downtime
6. **Data Integrity**: Ensures data preservation during migration
7. **Multi-Tenant Considerations**: Plans for zero-downtime for customers

## Migration Types Supported

### Database Migrations
```bash
/migration-plan "add Client.industry field" "database schema"
```
- Schema changes
- Data migrations
- Index additions
- Constraint modifications

### Framework Upgrades
```bash
/migration-plan "Next.js 14" "Next.js 15"
```
- Breaking changes analysis
- Deprecation handling
- Dependency updates
- Code modifications needed

### Technology Transitions
```bash
/migration-plan "REST API" "tRPC"
```
- API redesign
- Client updates
- Gradual rollout strategy
- Backward compatibility

## Arguments

- `$ARGUMENTS`: Migration description (from → to)

## Example Output

```markdown
# Migration Plan: Add Client.industry Field

## Overview
Add industry classification to Client model for better categorization and reporting.

## Impact Analysis
- Affected Models: Client
- Affected APIs: client.create, client.update, client.list
- Affected Components: ClientForm, ClientCard, ClientDashboard
- Risk Level: LOW
- Estimated Effort: 4 hours

## Migration Steps

### Phase 1: Database Schema (1 hour)
1. Create migration file
2. Add industry field (nullable initially)
3. Run migration on staging
4. Verify data integrity

### Phase 2: Backend Updates (1.5 hours)
1. Update Prisma schema
2. Update Zod validation schemas
3. Modify API endpoints to accept industry
4. Add industry to service methods
5. Update tests

### Phase 3: Frontend Updates (1 hour)
1. Add industry dropdown to ClientForm
2. Display industry in ClientCard
3. Add industry filter to dashboard
4. Update TypeScript types

### Phase 4: Data Backfill (30 minutes)
1. Script to populate industry for existing clients
2. Validation and QA
3. Make field non-nullable

## Rollback Strategy
- Revert migration: `npx prisma migrate resolve --rolled-back [migration-id]`
- Restore from backup if data issues
- Frontend/backend can gracefully handle missing field

## Testing Checklist
- [ ] Unit tests pass
- [ ] Integration tests with new field
- [ ] Multi-tenant isolation verified
- [ ] Existing clients work without industry
- [ ] New clients can be created with industry

## Deployment Plan
1. Deploy database migration (off-peak hours)
2. Deploy backend changes
3. Deploy frontend changes
4. Run data backfill script
5. Monitor for 24 hours

## Success Criteria
- All existing clients accessible
- New clients can be created with industry
- Industry filtering works correctly
- No performance degradation
```

---

**Migration Planning**: Uses architecture-designer and database-optimizer agents to analyze $ARGUMENTS and create comprehensive, low-risk migration plans with detailed steps and rollback strategies.
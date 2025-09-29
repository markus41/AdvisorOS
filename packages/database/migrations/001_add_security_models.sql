-- Migration: Add Enhanced Security and Audit Models
-- Date: 2025-09-28
-- Description: Adds new security models including UserSession, ApiKey, SecurityEvent, etc.

-- 1. Add missing User columns for enhanced security
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mfaEnabled" BOOLEAN DEFAULT FALSE;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mfaSecret" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "backupCodes" TEXT[];
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "accountLocked" BOOLEAN DEFAULT FALSE;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lockoutUntil" TIMESTAMP;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER DEFAULT 0;

-- 2. Create UserSession table with advanced tracking
CREATE TABLE IF NOT EXISTS "user_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL UNIQUE,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" JSONB,
    "deviceInfo" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "lastAccessAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "expiresAt" TIMESTAMP NOT NULL,
    "revokedAt" TIMESTAMP,
    "revokedBy" TEXT,
    "revokedReason" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT "user_sessions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
);

-- 3. Create ApiKey table
CREATE TABLE IF NOT EXISTS "api_keys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL UNIQUE,
    "keyPrefix" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "scopes" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "lastUsedAt" TIMESTAMP,
    "expiresAt" TIMESTAMP,
    "rateLimit" INTEGER,
    "ipWhitelist" TEXT[],
    "metadata" JSONB,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "api_keys_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE,
    CONSTRAINT "api_keys_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id")
);

-- 4. Create ApiKeyUsage table
CREATE TABLE IF NOT EXISTS "api_key_usage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "apiKeyId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "statusCode" INTEGER NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "requestSize" INTEGER,
    "responseSize" INTEGER,
    "error" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "api_key_usage_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "api_keys"("id") ON DELETE CASCADE
);

-- 5. Create SecurityEvent table
CREATE TABLE IF NOT EXISTS "security_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT,
    "organizationId" TEXT,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "riskScore" INTEGER,
    "resolved" BOOLEAN NOT NULL DEFAULT FALSE,
    "resolvedAt" TIMESTAMP,
    "resolvedBy" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "security_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id"),
    CONSTRAINT "security_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id"),
    CONSTRAINT "security_events_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "users"("id")
);

-- 6. Create DataExport table
CREATE TABLE IF NOT EXISTS "data_exports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestedBy" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "exportType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "parameters" JSONB,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileSize" BIGINT,
    "recordCount" INTEGER,
    "reason" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP,
    "completedAt" TIMESTAMP,
    "expiresAt" TIMESTAMP,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "lastDownloadAt" TIMESTAMP,
    "error" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "data_exports_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "users"("id"),
    CONSTRAINT "data_exports_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE,
    CONSTRAINT "data_exports_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id")
);

-- 7. Create ComplianceEvent table
CREATE TABLE IF NOT EXISTS "compliance_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "dataTypes" TEXT[],
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "dueDate" TIMESTAMP,
    "assignedTo" TEXT,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP,
    "evidence" JSONB,
    "notifiedParties" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "compliance_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE,
    CONSTRAINT "compliance_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id"),
    CONSTRAINT "compliance_events_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id")
);

-- 8. Create RolePermission table
CREATE TABLE IF NOT EXISTS "role_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT TRUE,
    "conditions" JSONB,
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "revokedBy" TEXT,
    "revokedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE,
    UNIQUE("role", "permissionId")
);

-- 9. Create performance indexes for UserSession
CREATE INDEX IF NOT EXISTS "user_sessions_userId_idx" ON "user_sessions"("userId");
CREATE INDEX IF NOT EXISTS "user_sessions_organizationId_idx" ON "user_sessions"("organizationId");
CREATE INDEX IF NOT EXISTS "user_sessions_sessionToken_idx" ON "user_sessions"("sessionToken");
CREATE INDEX IF NOT EXISTS "user_sessions_isActive_idx" ON "user_sessions"("isActive");
CREATE INDEX IF NOT EXISTS "user_sessions_expiresAt_idx" ON "user_sessions"("expiresAt");
CREATE INDEX IF NOT EXISTS "user_sessions_lastAccessAt_idx" ON "user_sessions"("lastAccessAt");

-- 10. Create performance indexes for ApiKey
CREATE INDEX IF NOT EXISTS "api_keys_organizationId_idx" ON "api_keys"("organizationId");
CREATE INDEX IF NOT EXISTS "api_keys_createdBy_idx" ON "api_keys"("createdBy");
CREATE INDEX IF NOT EXISTS "api_keys_keyHash_idx" ON "api_keys"("keyHash");
CREATE INDEX IF NOT EXISTS "api_keys_keyPrefix_idx" ON "api_keys"("keyPrefix");
CREATE INDEX IF NOT EXISTS "api_keys_isActive_idx" ON "api_keys"("isActive");
CREATE INDEX IF NOT EXISTS "api_keys_expiresAt_idx" ON "api_keys"("expiresAt");

-- 11. Create performance indexes for ApiKeyUsage
CREATE INDEX IF NOT EXISTS "api_key_usage_apiKeyId_idx" ON "api_key_usage"("apiKeyId");
CREATE INDEX IF NOT EXISTS "api_key_usage_endpoint_idx" ON "api_key_usage"("endpoint");
CREATE INDEX IF NOT EXISTS "api_key_usage_timestamp_idx" ON "api_key_usage"("timestamp");
CREATE INDEX IF NOT EXISTS "api_key_usage_statusCode_idx" ON "api_key_usage"("statusCode");

-- 12. Create performance indexes for SecurityEvent
CREATE INDEX IF NOT EXISTS "security_events_eventType_idx" ON "security_events"("eventType");
CREATE INDEX IF NOT EXISTS "security_events_severity_idx" ON "security_events"("severity");
CREATE INDEX IF NOT EXISTS "security_events_userId_idx" ON "security_events"("userId");
CREATE INDEX IF NOT EXISTS "security_events_organizationId_idx" ON "security_events"("organizationId");
CREATE INDEX IF NOT EXISTS "security_events_resolved_idx" ON "security_events"("resolved");
CREATE INDEX IF NOT EXISTS "security_events_createdAt_idx" ON "security_events"("createdAt");
CREATE INDEX IF NOT EXISTS "security_events_riskScore_idx" ON "security_events"("riskScore");

-- 13. Create performance indexes for DataExport
CREATE INDEX IF NOT EXISTS "data_exports_requestedBy_idx" ON "data_exports"("requestedBy");
CREATE INDEX IF NOT EXISTS "data_exports_organizationId_idx" ON "data_exports"("organizationId");
CREATE INDEX IF NOT EXISTS "data_exports_status_idx" ON "data_exports"("status");
CREATE INDEX IF NOT EXISTS "data_exports_exportType_idx" ON "data_exports"("exportType");
CREATE INDEX IF NOT EXISTS "data_exports_expiresAt_idx" ON "data_exports"("expiresAt");
CREATE INDEX IF NOT EXISTS "data_exports_createdAt_idx" ON "data_exports"("createdAt");

-- 14. Create performance indexes for ComplianceEvent
CREATE INDEX IF NOT EXISTS "compliance_events_eventType_idx" ON "compliance_events"("eventType");
CREATE INDEX IF NOT EXISTS "compliance_events_organizationId_idx" ON "compliance_events"("organizationId");
CREATE INDEX IF NOT EXISTS "compliance_events_severity_idx" ON "compliance_events"("severity");
CREATE INDEX IF NOT EXISTS "compliance_events_status_idx" ON "compliance_events"("status");
CREATE INDEX IF NOT EXISTS "compliance_events_dueDate_idx" ON "compliance_events"("dueDate");
CREATE INDEX IF NOT EXISTS "compliance_events_assignedTo_idx" ON "compliance_events"("assignedTo");
CREATE INDEX IF NOT EXISTS "compliance_events_createdAt_idx" ON "compliance_events"("createdAt");

-- 15. Create performance indexes for RolePermission
CREATE INDEX IF NOT EXISTS "role_permissions_role_idx" ON "role_permissions"("role");
CREATE INDEX IF NOT EXISTS "role_permissions_permissionId_idx" ON "role_permissions"("permissionId");

-- 16. Multi-tenant isolation indexes for existing models
CREATE INDEX IF NOT EXISTS "clients_organizationId_active_idx" ON "clients"("organizationId", "status") WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "documents_organizationId_category_idx" ON "documents"("organizationId", "category") WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "engagements_organizationId_status_idx" ON "engagements"("organizationId", "status") WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "tasks_organizationId_status_idx" ON "tasks"("organizationId", "status") WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "invoices_organizationId_status_idx" ON "invoices"("organizationId", "status") WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "audit_logs_organizationId_entityType_idx" ON "audit_logs"("organizationId", "entityType");
CREATE INDEX IF NOT EXISTS "audit_logs_organizationId_createdAt_idx" ON "audit_logs"("organizationId", "createdAt");

-- 17. Add user security indexes
CREATE INDEX IF NOT EXISTS "users_organizationId_isActive_idx" ON "users"("organizationId", "isActive") WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "users_email_isActive_idx" ON "users"("email", "isActive") WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "users_accountLocked_idx" ON "users"("accountLocked") WHERE "accountLocked" = TRUE;

-- 18. Add enhanced audit log indexes for performance
CREATE INDEX IF NOT EXISTS "audit_logs_action_entityType_idx" ON "audit_logs"("action", "entityType");
CREATE INDEX IF NOT EXISTS "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt") WHERE "userId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "audit_logs_entityId_entityType_idx" ON "audit_logs"("entityId", "entityType") WHERE "entityId" IS NOT NULL;

-- 19. Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "user_sessions_userId_isActive_lastAccess_idx" ON "user_sessions"("userId", "isActive", "lastAccessAt");
CREATE INDEX IF NOT EXISTS "api_keys_organizationId_isActive_idx" ON "api_keys"("organizationId", "isActive") WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "security_events_orgId_eventType_severity_idx" ON "security_events"("organizationId", "eventType", "severity");

-- 20. Add function for automatic user session cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    UPDATE "user_sessions"
    SET "isActive" = FALSE, "revokedAt" = NOW(), "revokedReason" = 'expired'
    WHERE "expiresAt" < NOW() AND "isActive" = TRUE;
END;
$$ LANGUAGE plpgsql;

-- 21. Add function for automatic API key usage aggregation
CREATE OR REPLACE FUNCTION update_api_key_usage_count()
RETURNS void AS $$
BEGIN
    UPDATE "api_keys"
    SET "usageCount" = (
        SELECT COUNT(*)
        FROM "api_key_usage"
        WHERE "api_key_usage"."apiKeyId" = "api_keys"."id"
    ),
    "lastUsedAt" = (
        SELECT MAX("timestamp")
        FROM "api_key_usage"
        WHERE "api_key_usage"."apiKeyId" = "api_keys"."id"
    );
END;
$$ LANGUAGE plpgsql;

-- 22. Create updated_at triggers for new tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON "user_sessions"
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON "api_keys"
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_exports_updated_at BEFORE UPDATE ON "data_exports"
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_events_updated_at BEFORE UPDATE ON "compliance_events"
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_permissions_updated_at BEFORE UPDATE ON "role_permissions"
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
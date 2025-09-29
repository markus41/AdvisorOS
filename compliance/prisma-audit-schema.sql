-- SOC2 & GDPR Compliance Database Schema Extensions
-- Add these tables to your existing Prisma schema

-- Audit Log Table for comprehensive logging
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "userEmail" TEXT,
    "userRole" TEXT,
    "clientId" TEXT,
    "sessionId" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "outcome" TEXT NOT NULL CHECK ("outcome" IN ('SUCCESS', 'FAILURE', 'PARTIAL')),
    "details" JSONB NOT NULL DEFAULT '{}',
    "riskLevel" TEXT NOT NULL CHECK ("riskLevel" IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    "complianceFramework" TEXT[] NOT NULL,
    "dataClassification" TEXT NOT NULL CHECK ("dataClassification" IN ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED')),
    "retentionPolicy" TEXT NOT NULL,
    "encryptionStatus" TEXT NOT NULL CHECK ("encryptionStatus" IN ('ENCRYPTED', 'UNENCRYPTED')),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Indexes for audit log performance and compliance queries
CREATE INDEX IF NOT EXISTS "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_userEmail_idx" ON "AuditLog"("userEmail");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "AuditLog_resource_idx" ON "AuditLog"("resource");
CREATE INDEX IF NOT EXISTS "AuditLog_outcome_idx" ON "AuditLog"("outcome");
CREATE INDEX IF NOT EXISTS "AuditLog_riskLevel_idx" ON "AuditLog"("riskLevel");
CREATE INDEX IF NOT EXISTS "AuditLog_complianceFramework_idx" ON "AuditLog" USING GIN("complianceFramework");
CREATE INDEX IF NOT EXISTS "AuditLog_clientId_timestamp_idx" ON "AuditLog"("clientId", "timestamp");

-- GDPR Data Processing Log (Article 30 compliance)
CREATE TABLE IF NOT EXISTS "GDPRProcessingLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "dataSubjectId" TEXT NOT NULL,
    "processingPurpose" TEXT NOT NULL,
    "legalBasis" TEXT NOT NULL CHECK ("legalBasis" IN ('CONSENT', 'CONTRACT', 'LEGAL_OBLIGATION', 'VITAL_INTERESTS', 'PUBLIC_TASK', 'LEGITIMATE_INTERESTS')),
    "dataCategories" TEXT[] NOT NULL,
    "recipients" TEXT[] NOT NULL,
    "transferMechanism" TEXT,
    "retentionPeriod" TEXT NOT NULL,
    "securityMeasures" TEXT[] NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for GDPR processing log
CREATE INDEX IF NOT EXISTS "GDPRProcessingLog_timestamp_idx" ON "GDPRProcessingLog"("timestamp");
CREATE INDEX IF NOT EXISTS "GDPRProcessingLog_userId_idx" ON "GDPRProcessingLog"("userId");
CREATE INDEX IF NOT EXISTS "GDPRProcessingLog_dataSubjectId_idx" ON "GDPRProcessingLog"("dataSubjectId");
CREATE INDEX IF NOT EXISTS "GDPRProcessingLog_legalBasis_idx" ON "GDPRProcessingLog"("legalBasis");

-- Security Incidents Table (SOC2 CC7.4, GDPR Article 33)
CREATE TABLE IF NOT EXISTS "SecurityIncident" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "severity" TEXT NOT NULL CHECK ("severity" IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    "type" TEXT NOT NULL CHECK ("type" IN ('UNAUTHORIZED_ACCESS', 'DATA_BREACH', 'SYSTEM_COMPROMISE', 'MALWARE', 'PHISHING', 'OTHER')),
    "description" TEXT NOT NULL,
    "affectedUsers" TEXT[] NOT NULL,
    "affectedSystems" TEXT[] NOT NULL,
    "responseActions" TEXT[] NOT NULL,
    "status" TEXT NOT NULL CHECK ("status" IN ('OPEN', 'INVESTIGATING', 'CONTAINED', 'RESOLVED')),
    "notificationRequired" BOOLEAN NOT NULL DEFAULT false,
    "regulatoryReporting" TEXT[] NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Indexes for security incidents
CREATE INDEX IF NOT EXISTS "SecurityIncident_timestamp_idx" ON "SecurityIncident"("timestamp");
CREATE INDEX IF NOT EXISTS "SecurityIncident_severity_idx" ON "SecurityIncident"("severity");
CREATE INDEX IF NOT EXISTS "SecurityIncident_type_idx" ON "SecurityIncident"("type");
CREATE INDEX IF NOT EXISTS "SecurityIncident_status_idx" ON "SecurityIncident"("status");
CREATE INDEX IF NOT EXISTS "SecurityIncident_notificationRequired_idx" ON "SecurityIncident"("notificationRequired");

-- Data Subject Rights Requests (GDPR Articles 15-22)
CREATE TABLE IF NOT EXISTS "DataSubjectRightsRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataSubjectId" TEXT NOT NULL,
    "dataSubjectEmail" TEXT NOT NULL,
    "requestType" TEXT NOT NULL CHECK ("requestType" IN ('ACCESS', 'RECTIFICATION', 'ERASURE', 'RESTRICTION', 'PORTABILITY', 'OBJECTION', 'AUTOMATED_DECISION')),
    "description" TEXT,
    "status" TEXT NOT NULL CHECK ("status" IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED')) DEFAULT 'PENDING',
    "responseDeadline" TIMESTAMP(3) NOT NULL,
    "responseDate" TIMESTAMP(3),
    "responseDetails" TEXT,
    "verificationMethod" TEXT,
    "verificationCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Indexes for data subject rights requests
CREATE INDEX IF NOT EXISTS "DataSubjectRightsRequest_timestamp_idx" ON "DataSubjectRightsRequest"("timestamp");
CREATE INDEX IF NOT EXISTS "DataSubjectRightsRequest_dataSubjectId_idx" ON "DataSubjectRightsRequest"("dataSubjectId");
CREATE INDEX IF NOT EXISTS "DataSubjectRightsRequest_requestType_idx" ON "DataSubjectRightsRequest"("requestType");
CREATE INDEX IF NOT EXISTS "DataSubjectRightsRequest_status_idx" ON "DataSubjectRightsRequest"("status");
CREATE INDEX IF NOT EXISTS "DataSubjectRightsRequest_responseDeadline_idx" ON "DataSubjectRightsRequest"("responseDeadline");

-- Consent Management (GDPR Article 7)
CREATE TABLE IF NOT EXISTS "ConsentRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataSubjectId" TEXT NOT NULL,
    "dataSubjectEmail" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "consentGiven" BOOLEAN NOT NULL,
    "consentMethod" TEXT NOT NULL, -- 'EXPLICIT', 'IMPLIED', 'OPT_IN', 'OPT_OUT'
    "consentText" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "withdrawnAt" TIMESTAMP(3),
    "withdrawalMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for consent records
CREATE INDEX IF NOT EXISTS "ConsentRecord_timestamp_idx" ON "ConsentRecord"("timestamp");
CREATE INDEX IF NOT EXISTS "ConsentRecord_dataSubjectId_idx" ON "ConsentRecord"("dataSubjectId");
CREATE INDEX IF NOT EXISTS "ConsentRecord_consentType_idx" ON "ConsentRecord"("consentType");
CREATE INDEX IF NOT EXISTS "ConsentRecord_consentGiven_idx" ON "ConsentRecord"("consentGiven");

-- Data Retention Policy Tracking
CREATE TABLE IF NOT EXISTS "DataRetentionPolicy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dataCategory" TEXT NOT NULL,
    "retentionPeriod" TEXT NOT NULL,
    "legalBasis" TEXT NOT NULL,
    "disposalMethod" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Backup and Recovery Logs (SOC2 CC5.1)
CREATE TABLE IF NOT EXISTS "BackupLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "backupType" TEXT NOT NULL CHECK ("backupType" IN ('FULL', 'INCREMENTAL', 'DIFFERENTIAL')),
    "status" TEXT NOT NULL CHECK ("status" IN ('SUCCESS', 'FAILURE', 'PARTIAL')),
    "dataSize" BIGINT,
    "duration" INTEGER, -- in seconds
    "location" TEXT NOT NULL,
    "checksum" TEXT,
    "encryptionStatus" TEXT NOT NULL CHECK ("encryptionStatus" IN ('ENCRYPTED', 'UNENCRYPTED')),
    "retentionDate" TIMESTAMP(3) NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- System Access Log (SOC2 CC6.1)
CREATE TABLE IF NOT EXISTS "SystemAccessLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "accessType" TEXT NOT NULL CHECK ("accessType" IN ('LOGIN', 'LOGOUT', 'SYSTEM_ACCESS', 'PRIVILEGED_ACCESS')),
    "systemComponent" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "sessionDuration" INTEGER, -- in seconds
    "outcome" TEXT NOT NULL CHECK ("outcome" IN ('SUCCESS', 'FAILURE')),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for system access log
CREATE INDEX IF NOT EXISTS "SystemAccessLog_timestamp_idx" ON "SystemAccessLog"("timestamp");
CREATE INDEX IF NOT EXISTS "SystemAccessLog_userId_idx" ON "SystemAccessLog"("userId");
CREATE INDEX IF NOT EXISTS "SystemAccessLog_accessType_idx" ON "SystemAccessLog"("accessType");
CREATE INDEX IF NOT EXISTS "SystemAccessLog_outcome_idx" ON "SystemAccessLog"("outcome");

-- Compliance Report Generation
CREATE TABLE IF NOT EXISTS "ComplianceReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportType" TEXT NOT NULL CHECK ("reportType" IN ('SOC2', 'GDPR', 'SECURITY_ASSESSMENT', 'AUDIT_FINDINGS')),
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" TEXT NOT NULL,
    "reportData" JSONB NOT NULL,
    "status" TEXT NOT NULL CHECK ("status" IN ('DRAFT', 'FINAL', 'SUBMITTED')) DEFAULT 'DRAFT',
    "filePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Row Level Security Policies (PostgreSQL specific)
-- Enable RLS on sensitive tables
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GDPRProcessingLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SecurityIncident" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DataSubjectRightsRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConsentRecord" ENABLE ROW LEVEL SECURITY;

-- Create policies for audit log access (example - customize based on your role system)
CREATE POLICY audit_log_policy ON "AuditLog"
    FOR ALL
    TO authenticated_users
    USING (
        -- Users can only see their own logs unless they have audit role
        "userId" = current_setting('app.current_user_id')::text
        OR
        current_setting('app.current_user_role')::text IN ('ADMIN', 'AUDITOR', 'COMPLIANCE_OFFICER')
    );

-- Triggers for automatic audit logging
CREATE OR REPLACE FUNCTION trigger_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    -- This function can be attached to sensitive tables to automatically create audit logs
    INSERT INTO "AuditLog" (
        "id",
        "timestamp",
        "userId",
        "action",
        "resource",
        "resourceId",
        "outcome",
        "details",
        "riskLevel",
        "complianceFramework",
        "dataClassification",
        "retentionPolicy",
        "encryptionStatus",
        "ipAddress",
        "userAgent"
    ) VALUES (
        gen_random_uuid()::text,
        NOW(),
        current_setting('app.current_user_id', true),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        'SUCCESS',
        jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW)),
        'MEDIUM',
        ARRAY['SOC2_CC6.3'],
        'CONFIDENTIAL',
        '7_YEARS',
        'ENCRYPTED',
        current_setting('app.current_ip_address', true),
        current_setting('app.current_user_agent', true)
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to key tables (example)
-- DROP TRIGGER IF EXISTS audit_client_changes ON "Client";
-- CREATE TRIGGER audit_client_changes
--     AFTER INSERT OR UPDATE OR DELETE ON "Client"
--     FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();

-- Data masking function for sensitive data
CREATE OR REPLACE FUNCTION mask_sensitive_data(input_text TEXT, mask_type TEXT DEFAULT 'PARTIAL')
RETURNS TEXT AS $$
BEGIN
    CASE mask_type
        WHEN 'FULL' THEN
            RETURN repeat('*', length(input_text));
        WHEN 'PARTIAL' THEN
            IF length(input_text) <= 4 THEN
                RETURN repeat('*', length(input_text));
            ELSE
                RETURN left(input_text, 2) || repeat('*', length(input_text) - 4) || right(input_text, 2);
            END IF;
        WHEN 'EMAIL' THEN
            RETURN left(split_part(input_text, '@', 1), 2) || '***@' || split_part(input_text, '@', 2);
        ELSE
            RETURN input_text;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Views for compliance reporting
CREATE OR REPLACE VIEW compliance_dashboard AS
SELECT
    DATE_TRUNC('day', timestamp) as date,
    COUNT(*) as total_events,
    COUNT(*) FILTER (WHERE outcome = 'FAILURE') as failed_events,
    COUNT(*) FILTER (WHERE "riskLevel" IN ('HIGH', 'CRITICAL')) as high_risk_events,
    COUNT(DISTINCT "userId") as unique_users,
    COUNT(*) FILTER (WHERE action LIKE 'DATA_%') as data_access_events
FROM "AuditLog"
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', timestamp)
ORDER BY date DESC;

-- Materialized view for performance (refresh periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS audit_summary AS
SELECT
    DATE_TRUNC('hour', timestamp) as hour,
    action,
    resource,
    outcome,
    "riskLevel",
    COUNT(*) as event_count
FROM "AuditLog"
WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', timestamp), action, resource, outcome, "riskLevel";

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS audit_summary_hour_idx ON audit_summary(hour);

-- Refresh the materialized view (run this periodically)
-- REFRESH MATERIALIZED VIEW audit_summary;
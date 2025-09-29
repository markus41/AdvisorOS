-- ================================================================
-- AdvisorOS Production Database Migration Script
-- Enterprise-grade CPA practice management platform
-- Comprehensive schema setup with security, compliance, and performance optimizations
-- ================================================================

-- Set session parameters for optimal performance
SET statement_timeout = '30min';
SET lock_timeout = '5min';
SET idle_in_transaction_session_timeout = '10min';

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ================================================================
-- Create Application Schemas
-- ================================================================

-- Main application schema
CREATE SCHEMA IF NOT EXISTS app;

-- Audit and compliance schema
CREATE SCHEMA IF NOT EXISTS audit;

-- Reporting and analytics schema
CREATE SCHEMA IF NOT EXISTS analytics;

-- Document management schema
CREATE SCHEMA IF NOT EXISTS documents;

-- Integration schema for external APIs
CREATE SCHEMA IF NOT EXISTS integrations;

-- ================================================================
-- User Management and Roles
-- ================================================================

-- Create application database roles
DO $$
BEGIN
    -- Application service role
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'advisoros_app') THEN
        CREATE ROLE advisoros_app LOGIN PASSWORD 'CHANGE_ME_IN_PRODUCTION';
    END IF;

    -- Read-only reporting role
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'advisoros_reporting') THEN
        CREATE ROLE advisoros_reporting LOGIN PASSWORD 'CHANGE_ME_IN_PRODUCTION';
    END IF;

    -- Data migration role
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'advisoros_migration') THEN
        CREATE ROLE advisoros_migration LOGIN PASSWORD 'CHANGE_ME_IN_PRODUCTION';
    END IF;

    -- Backup role
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'advisoros_backup') THEN
        CREATE ROLE advisoros_backup LOGIN PASSWORD 'CHANGE_ME_IN_PRODUCTION';
    END IF;
END
$$;

-- Grant schema permissions
GRANT USAGE ON SCHEMA app TO advisoros_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA app TO advisoros_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA app TO advisoros_app;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA app TO advisoros_app;

GRANT USAGE ON SCHEMA audit TO advisoros_app;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA audit TO advisoros_app;

GRANT USAGE ON SCHEMA analytics TO advisoros_reporting;
GRANT SELECT ON ALL TABLES IN SCHEMA analytics TO advisoros_reporting;

-- ================================================================
-- Core Application Tables
-- ================================================================

-- Organizations (CPA firms)
CREATE TABLE IF NOT EXISTS app.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255),
    tax_id VARCHAR(50),
    address JSONB,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    billing_address JSONB,
    subscription_plan VARCHAR(50) DEFAULT 'starter',
    subscription_status VARCHAR(20) DEFAULT 'active',
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}',
    features JSONB DEFAULT '{}',
    compliance_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Users (CPAs, staff, clients)
CREATE TABLE IF NOT EXISTS app.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES app.organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'user',
    permissions JSONB DEFAULT '[]',
    profile JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Clients (taxpayers, businesses)
CREATE TABLE IF NOT EXISTS app.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES app.organizations(id) ON DELETE CASCADE,
    client_number VARCHAR(50),
    entity_type VARCHAR(20) DEFAULT 'individual', -- individual, business, trust, estate
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    business_name VARCHAR(255),
    ssn_ein VARCHAR(20), -- Encrypted
    date_of_birth DATE,
    email VARCHAR(255),
    phone VARCHAR(20),
    address JSONB,
    mailing_address JSONB,
    contact_preferences JSONB DEFAULT '{}',
    tax_info JSONB DEFAULT '{}',
    filing_status VARCHAR(20),
    dependents JSONB DEFAULT '[]',
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active',
    assigned_staff JSONB DEFAULT '[]',
    portal_access BOOLEAN DEFAULT FALSE,
    portal_last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Tax Returns
CREATE TABLE IF NOT EXISTS app.tax_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES app.organizations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES app.clients(id) ON DELETE CASCADE,
    tax_year INTEGER NOT NULL,
    return_type VARCHAR(20) NOT NULL, -- 1040, 1120, 1065, etc.
    filing_status VARCHAR(20),
    status VARCHAR(20) DEFAULT 'not_started', -- not_started, in_progress, review, approved, filed, amended
    priority VARCHAR(10) DEFAULT 'normal', -- high, normal, low
    due_date DATE,
    extension_date DATE,
    prepared_by UUID REFERENCES app.users(id),
    reviewed_by UUID REFERENCES app.users(id),
    approved_by UUID REFERENCES app.users(id),
    efile_status VARCHAR(20),
    efile_date TIMESTAMP WITH TIME ZONE,
    efile_confirmation VARCHAR(50),
    refund_amount DECIMAL(12,2),
    amount_owed DECIMAL(12,2),
    estimated_payments DECIMAL(12,2),
    forms_data JSONB DEFAULT '{}',
    schedules_data JSONB DEFAULT '{}',
    calculations JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Documents
CREATE TABLE IF NOT EXISTS documents.document_storage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES app.organizations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES app.clients(id) ON DELETE SET NULL,
    tax_return_id UUID REFERENCES app.tax_returns(id) ON DELETE SET NULL,
    uploaded_by UUID REFERENCES app.users(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    document_type VARCHAR(50), -- w2, 1099, receipt, statement, etc.
    tax_year INTEGER,
    category VARCHAR(50),
    tags JSONB DEFAULT '[]',
    ocr_text TEXT,
    extracted_data JSONB DEFAULT '{}',
    processing_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    encryption_key_id VARCHAR(100),
    checksum VARCHAR(64),
    virus_scan_status VARCHAR(20) DEFAULT 'pending',
    virus_scan_date TIMESTAMP WITH TIME ZONE,
    retention_date DATE,
    is_archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- QuickBooks Integration
CREATE TABLE IF NOT EXISTS integrations.quickbooks_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES app.organizations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES app.clients(id) ON DELETE CASCADE,
    company_id VARCHAR(100) NOT NULL,
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    realm_id VARCHAR(100),
    company_name VARCHAR(255),
    country VARCHAR(5),
    base_currency VARCHAR(3),
    sync_status VARCHAR(20) DEFAULT 'connected',
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_errors JSONB DEFAULT '[]',
    webhook_token VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ================================================================
-- Audit and Compliance Tables
-- ================================================================

-- Audit Log for all data changes
CREATE TABLE IF NOT EXISTS audit.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID,
    user_id UUID,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_fields JSONB DEFAULT '[]',
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    compliance_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Access Log for security monitoring
CREATE TABLE IF NOT EXISTS audit.access_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID,
    user_id UUID,
    resource_type VARCHAR(50),
    resource_id UUID,
    action VARCHAR(50),
    success BOOLEAN,
    failure_reason TEXT,
    ip_address INET,
    user_agent TEXT,
    location_data JSONB,
    risk_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GDPR Data Processing Log
CREATE TABLE IF NOT EXISTS audit.gdpr_processing_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID,
    data_subject_id UUID,
    processing_purpose VARCHAR(100),
    legal_basis VARCHAR(50),
    data_categories JSONB DEFAULT '[]',
    retention_period VARCHAR(50),
    third_party_sharing JSONB DEFAULT '[]',
    consent_given BOOLEAN DEFAULT FALSE,
    consent_date TIMESTAMP WITH TIME ZONE,
    consent_withdrawn BOOLEAN DEFAULT FALSE,
    withdrawal_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- Performance Optimization Tables
-- ================================================================

-- Query Performance Monitoring
CREATE TABLE IF NOT EXISTS analytics.query_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_hash VARCHAR(64),
    query_text TEXT,
    execution_time_ms INTEGER,
    rows_returned INTEGER,
    user_id UUID,
    organization_id UUID,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Application Metrics
CREATE TABLE IF NOT EXISTS analytics.application_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100),
    metric_value DECIMAL(12,4),
    metric_type VARCHAR(20), -- counter, gauge, histogram
    tags JSONB DEFAULT '{}',
    organization_id UUID,
    user_id UUID,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- Indexes for Performance
-- ================================================================

-- Organizations
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON app.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_domain ON app.organizations(domain);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription ON app.organizations(subscription_status, subscription_plan);

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON app.users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization ON app.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON app.users(role);
CREATE INDEX IF NOT EXISTS idx_users_last_activity ON app.users(last_activity_at);

-- Clients
CREATE INDEX IF NOT EXISTS idx_clients_organization ON app.clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_client_number ON app.clients(client_number);
CREATE INDEX IF NOT EXISTS idx_clients_email ON app.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON app.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_search ON app.clients USING gin((first_name || ' ' || last_name || ' ' || COALESCE(business_name, '')) gin_trgm_ops);

-- Tax Returns
CREATE INDEX IF NOT EXISTS idx_tax_returns_client ON app.tax_returns(client_id);
CREATE INDEX IF NOT EXISTS idx_tax_returns_organization ON app.tax_returns(organization_id);
CREATE INDEX IF NOT EXISTS idx_tax_returns_tax_year ON app.tax_returns(tax_year);
CREATE INDEX IF NOT EXISTS idx_tax_returns_status ON app.tax_returns(status);
CREATE INDEX IF NOT EXISTS idx_tax_returns_due_date ON app.tax_returns(due_date);
CREATE INDEX IF NOT EXISTS idx_tax_returns_assigned ON app.tax_returns(prepared_by, reviewed_by, approved_by);

-- Documents
CREATE INDEX IF NOT EXISTS idx_documents_organization ON documents.document_storage(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_client ON documents.document_storage(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_tax_return ON documents.document_storage(tax_return_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents.document_storage(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_year ON documents.document_storage(tax_year);
CREATE INDEX IF NOT EXISTS idx_documents_processing ON documents.document_storage(processing_status);
CREATE INDEX IF NOT EXISTS idx_documents_search ON documents.document_storage USING gin(ocr_text gin_trgm_ops);

-- Audit Logs
CREATE INDEX IF NOT EXISTS idx_audit_log_organization ON audit.audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON audit.audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit.audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_record ON audit.audit_log(table_name, record_id);

-- Access Logs
CREATE INDEX IF NOT EXISTS idx_access_log_user ON audit.access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_access_log_organization ON audit.access_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_access_log_created ON audit.access_log(created_at);
CREATE INDEX IF NOT EXISTS idx_access_log_ip ON audit.access_log(ip_address);

-- QuickBooks Integration
CREATE INDEX IF NOT EXISTS idx_qb_connections_organization ON integrations.quickbooks_connections(organization_id);
CREATE INDEX IF NOT EXISTS idx_qb_connections_client ON integrations.quickbooks_connections(client_id);
CREATE INDEX IF NOT EXISTS idx_qb_connections_company ON integrations.quickbooks_connections(company_id);

-- ================================================================
-- Functions and Triggers
-- ================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all relevant tables
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname IN ('app', 'documents', 'integrations')
        AND EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = schemaname
            AND table_name = tablename
            AND column_name = 'updated_at'
        )
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trigger_update_updated_at ON %I.%I',
                      table_record.schemaname, table_record.tablename);
        EXECUTE format('CREATE TRIGGER trigger_update_updated_at
                       BEFORE UPDATE ON %I.%I
                       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
                      table_record.schemaname, table_record.tablename);
    END LOOP;
END
$$;

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit.audit_log (
            organization_id, user_id, table_name, record_id, action, old_values,
            ip_address, user_agent, session_id
        ) VALUES (
            COALESCE(OLD.organization_id, (current_setting('app.current_organization_id', true))::uuid),
            COALESCE((current_setting('app.current_user_id', true))::uuid, NULL),
            TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
            OLD.id,
            'DELETE',
            to_jsonb(OLD),
            COALESCE((current_setting('app.current_ip_address', true))::inet, NULL),
            current_setting('app.current_user_agent', true),
            current_setting('app.current_session_id', true)
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit.audit_log (
            organization_id, user_id, table_name, record_id, action, old_values, new_values,
            ip_address, user_agent, session_id
        ) VALUES (
            COALESCE(NEW.organization_id, (current_setting('app.current_organization_id', true))::uuid),
            COALESCE((current_setting('app.current_user_id', true))::uuid, NULL),
            TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
            NEW.id,
            'UPDATE',
            to_jsonb(OLD),
            to_jsonb(NEW),
            COALESCE((current_setting('app.current_ip_address', true))::inet, NULL),
            current_setting('app.current_user_agent', true),
            current_setting('app.current_session_id', true)
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit.audit_log (
            organization_id, user_id, table_name, record_id, action, new_values,
            ip_address, user_agent, session_id
        ) VALUES (
            COALESCE(NEW.organization_id, (current_setting('app.current_organization_id', true))::uuid),
            COALESCE((current_setting('app.current_user_id', true))::uuid, NULL),
            TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
            NEW.id,
            'INSERT',
            to_jsonb(NEW),
            COALESCE((current_setting('app.current_ip_address', true))::inet, NULL),
            current_setting('app.current_user_agent', true),
            current_setting('app.current_session_id', true)
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to sensitive tables
DO $$
DECLARE
    audit_tables TEXT[] := ARRAY[
        'app.organizations',
        'app.users',
        'app.clients',
        'app.tax_returns',
        'documents.document_storage',
        'integrations.quickbooks_connections'
    ];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY audit_tables
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS audit_trigger ON %s', table_name);
        EXECUTE format('CREATE TRIGGER audit_trigger
                       AFTER INSERT OR UPDATE OR DELETE ON %s
                       FOR EACH ROW EXECUTE FUNCTION audit_trigger_function()', table_name);
    END LOOP;
END
$$;

-- ================================================================
-- Views for Common Queries
-- ================================================================

-- Active clients with latest tax return info
CREATE OR REPLACE VIEW analytics.active_clients_summary AS
SELECT
    c.id as client_id,
    c.organization_id,
    c.client_number,
    c.first_name,
    c.last_name,
    c.business_name,
    c.entity_type,
    c.email,
    c.phone,
    c.status,
    c.created_at as client_since,
    COUNT(tr.id) as total_returns,
    MAX(tr.tax_year) as latest_tax_year,
    MAX(tr.created_at) as latest_return_date,
    COUNT(CASE WHEN tr.status IN ('not_started', 'in_progress') THEN 1 END) as pending_returns,
    COUNT(d.id) as document_count
FROM app.clients c
LEFT JOIN app.tax_returns tr ON c.id = tr.client_id AND tr.deleted_at IS NULL
LEFT JOIN documents.document_storage d ON c.id = d.client_id AND d.deleted_at IS NULL
WHERE c.deleted_at IS NULL AND c.status = 'active'
GROUP BY c.id, c.organization_id, c.client_number, c.first_name, c.last_name,
         c.business_name, c.entity_type, c.email, c.phone, c.status, c.created_at;

-- Tax season workload summary
CREATE OR REPLACE VIEW analytics.tax_season_workload AS
SELECT
    tr.organization_id,
    tr.tax_year,
    tr.status,
    tr.priority,
    COUNT(*) as return_count,
    COUNT(CASE WHEN tr.due_date <= CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as due_soon,
    COUNT(CASE WHEN tr.due_date < CURRENT_DATE THEN 1 END) as overdue,
    AVG(EXTRACT(EPOCH FROM (COALESCE(tr.updated_at, tr.created_at) - tr.created_at)) / 3600) as avg_processing_hours
FROM app.tax_returns tr
WHERE tr.deleted_at IS NULL
    AND tr.tax_year >= EXTRACT(YEAR FROM CURRENT_DATE) - 1
GROUP BY tr.organization_id, tr.tax_year, tr.status, tr.priority;

-- Document processing status
CREATE OR REPLACE VIEW analytics.document_processing_status AS
SELECT
    d.organization_id,
    d.processing_status,
    d.document_type,
    COUNT(*) as document_count,
    SUM(d.file_size) as total_size_bytes,
    MIN(d.created_at) as oldest_document,
    MAX(d.created_at) as newest_document
FROM documents.document_storage d
WHERE d.deleted_at IS NULL
GROUP BY d.organization_id, d.processing_status, d.document_type;

-- ================================================================
-- Security Policies (Row Level Security)
-- ================================================================

-- Enable RLS on all application tables
ALTER TABLE app.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.tax_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents.document_storage ENABLE ROW LEVEL SECURITY;

-- Organization isolation policy
CREATE POLICY org_isolation_organizations ON app.organizations
    FOR ALL TO advisoros_app
    USING (id = (current_setting('app.current_organization_id', true))::uuid);

CREATE POLICY org_isolation_users ON app.users
    FOR ALL TO advisoros_app
    USING (organization_id = (current_setting('app.current_organization_id', true))::uuid);

CREATE POLICY org_isolation_clients ON app.clients
    FOR ALL TO advisoros_app
    USING (organization_id = (current_setting('app.current_organization_id', true))::uuid);

CREATE POLICY org_isolation_tax_returns ON app.tax_returns
    FOR ALL TO advisoros_app
    USING (organization_id = (current_setting('app.current_organization_id', true))::uuid);

CREATE POLICY org_isolation_documents ON documents.document_storage
    FOR ALL TO advisoros_app
    USING (organization_id = (current_setting('app.current_organization_id', true))::uuid);

-- ================================================================
-- Database Configuration for Production
-- ================================================================

-- Configure PostgreSQL for optimal performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET log_statement = 'mod';
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';
ALTER SYSTEM SET log_checkpoints = on;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
ALTER SYSTEM SET log_lock_waits = on;

-- Memory settings (will be adjusted based on actual Azure PostgreSQL instance)
-- ALTER SYSTEM SET shared_buffers = '256MB';
-- ALTER SYSTEM SET effective_cache_size = '1GB';
-- ALTER SYSTEM SET work_mem = '16MB';
-- ALTER SYSTEM SET maintenance_work_mem = '128MB';

-- ================================================================
-- Initial Data Setup
-- ================================================================

-- Create initial system organization (if needed for system operations)
INSERT INTO app.organizations (
    id, name, slug, email, subscription_plan, subscription_status, settings
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'System Organization',
    'system',
    'system@advisoros.com',
    'enterprise',
    'active',
    '{"system_org": true}'
) ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- Migration Completion Log
-- ================================================================

-- Log migration completion
INSERT INTO analytics.application_metrics (
    metric_name, metric_value, metric_type, tags, recorded_at
) VALUES (
    'database_migration_completed',
    1,
    'counter',
    '{"version": "production_v1.0", "migration_date": "' || NOW()::text || '"}',
    NOW()
);

-- Create migration tracking table
CREATE TABLE IF NOT EXISTS app.migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    execution_time_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    notes TEXT
);

-- Record this migration
INSERT INTO app.migrations (migration_name, notes)
VALUES ('production_initial_setup', 'Initial production database schema and security setup');

COMMIT;

-- ================================================================
-- Post-Migration Verification
-- ================================================================

-- Verify critical tables exist
DO $$
BEGIN
    ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'app') >= 5,
           'Application tables not created properly';

    ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'audit') >= 2,
           'Audit tables not created properly';

    ASSERT (SELECT COUNT(*) FROM pg_roles WHERE rolname LIKE 'advisoros_%') >= 4,
           'Database roles not created properly';

    RAISE NOTICE 'Database migration completed successfully!';
END
$$;
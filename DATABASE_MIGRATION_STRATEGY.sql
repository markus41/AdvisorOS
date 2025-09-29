-- AdvisorOS Database Migration Strategy
-- Comprehensive migration plan for Wave 0-3 integration
-- Author: Integration Team
-- Date: 2025-01-28

-- =====================================================
-- PHASE 1A: CORE SECURITY MODELS (Week 1, Day 1-2)
-- =====================================================

-- Migration 001: Security Foundation Models
BEGIN;

-- Create schema versioning table if not exists
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    version INTEGER NOT NULL UNIQUE,
    migration_name TEXT NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum TEXT
);

-- User Sessions for advanced session tracking
CREATE TABLE user_sessions (
    id TEXT PRIMARY KEY DEFAULT generate_ulid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    device_fingerprint TEXT,
    ip_address INET,
    user_agent TEXT,
    location JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for user sessions
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_organization_id ON user_sessions(organization_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_active ON user_sessions(user_id, organization_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_user_sessions_device ON user_sessions(device_fingerprint) WHERE device_fingerprint IS NOT NULL;

-- API Keys for secure API access
CREATE TABLE api_keys (
    id TEXT PRIMARY KEY DEFAULT generate_ulid(),
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    key_prefix TEXT NOT NULL,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by TEXT NOT NULL REFERENCES users(id),
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    allowed_ips INET[],
    rate_limit INTEGER DEFAULT 1000,
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for API keys
CREATE INDEX idx_api_keys_organization_id ON api_keys(organization_id);
CREATE INDEX idx_api_keys_created_by ON api_keys(created_by);
CREATE INDEX idx_api_keys_active ON api_keys(organization_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_api_keys_expires_at ON api_keys(expires_at) WHERE expires_at IS NOT NULL;

-- API Key Usage tracking
CREATE TABLE api_key_usage (
    id TEXT PRIMARY KEY DEFAULT generate_ulid(),
    api_key_id TEXT NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Partitioning for API key usage (by month)
CREATE TABLE api_key_usage_y2025m01 PARTITION OF api_key_usage
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE api_key_usage_y2025m02 PARTITION OF api_key_usage
FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE api_key_usage_y2025m03 PARTITION OF api_key_usage
FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

-- Indexes for API key usage
CREATE INDEX idx_api_key_usage_api_key_id ON api_key_usage(api_key_id, timestamp);
CREATE INDEX idx_api_key_usage_organization_id ON api_key_usage(organization_id, timestamp);
CREATE INDEX idx_api_key_usage_endpoint ON api_key_usage(endpoint, timestamp);

-- Security Events for monitoring and threat detection
CREATE TABLE security_events (
    id TEXT PRIMARY KEY DEFAULT generate_ulid(),
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id),
    session_id TEXT REFERENCES user_sessions(id),
    event_type TEXT NOT NULL, -- 'login_attempt', 'suspicious_activity', 'data_access', etc.
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    resolved_by TEXT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for security events
CREATE INDEX idx_security_events_organization_id ON security_events(organization_id, created_at DESC);
CREATE INDEX idx_security_events_user_id ON security_events(user_id, created_at DESC);
CREATE INDEX idx_security_events_type_severity ON security_events(event_type, severity, created_at DESC);
CREATE INDEX idx_security_events_unresolved ON security_events(organization_id, created_at DESC) WHERE resolved = FALSE;
CREATE INDEX idx_security_events_ip_address ON security_events(ip_address, created_at DESC);

-- Record migration
INSERT INTO schema_migrations (version, migration_name, checksum)
VALUES (1, 'add_security_models', md5('security_models_v1'));

COMMIT;

-- =====================================================
-- PHASE 1B: AUDIT AND COMPLIANCE MODELS (Week 1, Day 3-4)
-- =====================================================

-- Migration 002: Audit and Compliance Framework
BEGIN;

-- Enhanced Audit Logs
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY DEFAULT generate_ulid(),
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id),
    session_id TEXT REFERENCES user_sessions(id),
    api_key_id TEXT REFERENCES api_keys(id),
    entity_type TEXT NOT NULL, -- 'client', 'document', 'workflow', etc.
    entity_id TEXT,
    action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete', 'export', etc.
    old_values JSONB,
    new_values JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    request_id TEXT, -- For tracing across services
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partitioning for audit logs (by month)
ALTER TABLE audit_logs PARTITION BY RANGE (created_at);
CREATE TABLE audit_logs_y2025m01 PARTITION OF audit_logs
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE audit_logs_y2025m02 PARTITION OF audit_logs
FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE audit_logs_y2025m03 PARTITION OF audit_logs
FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

-- Indexes for audit logs
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_logs_request_id ON audit_logs(request_id) WHERE request_id IS NOT NULL;

-- Compliance Events for regulatory tracking
CREATE TABLE compliance_events (
    id TEXT PRIMARY KEY DEFAULT generate_ulid(),
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'gdpr_request', 'audit_preparation', 'regulatory_filing', etc.
    description TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    deadline TIMESTAMP,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    completed_by TEXT REFERENCES users(id),
    evidence_paths TEXT[], -- File paths or references to compliance evidence
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for compliance events
CREATE INDEX idx_compliance_events_organization_id ON compliance_events(organization_id, created_at DESC);
CREATE INDEX idx_compliance_events_type ON compliance_events(event_type, created_at DESC);
CREATE INDEX idx_compliance_events_status ON compliance_events(status, deadline);
CREATE INDEX idx_compliance_events_pending_deadline ON compliance_events(deadline) WHERE status = 'pending';

-- Data Export Requests for GDPR compliance
CREATE TABLE data_exports (
    id TEXT PRIMARY KEY DEFAULT generate_ulid(),
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    requested_by TEXT NOT NULL REFERENCES users(id),
    subject_user_id TEXT REFERENCES users(id), -- For GDPR subject requests
    export_type TEXT NOT NULL, -- 'gdpr_export', 'data_backup', 'audit_export', etc.
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
    file_path TEXT,
    file_size_bytes BIGINT,
    expires_at TIMESTAMP,
    downloaded_at TIMESTAMP,
    download_count INTEGER DEFAULT 0,
    encryption_key_id TEXT, -- Reference to encryption key for secure exports
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for data exports
CREATE INDEX idx_data_exports_organization_id ON data_exports(organization_id, created_at DESC);
CREATE INDEX idx_data_exports_requested_by ON data_exports(requested_by, created_at DESC);
CREATE INDEX idx_data_exports_status ON data_exports(status, created_at DESC);
CREATE INDEX idx_data_exports_expires_at ON data_exports(expires_at) WHERE expires_at IS NOT NULL;

-- Enhanced Role Permissions for granular RBAC
CREATE TABLE role_permissions (
    id TEXT PRIMARY KEY DEFAULT generate_ulid(),
    role_id TEXT NOT NULL, -- Reference to existing roles
    permission TEXT NOT NULL, -- e.g., 'clients:read', 'documents:export'
    resource_type TEXT, -- Optional: specific resource type restriction
    resource_ids TEXT[], -- Optional: specific resource ID restrictions
    conditions JSONB DEFAULT '{}'::jsonb, -- Time-based, IP-based, or other conditions
    granted_by TEXT NOT NULL REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    revoked_at TIMESTAMP,
    revoked_by TEXT REFERENCES users(id)
);

-- Indexes for role permissions
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission);
CREATE INDEX idx_role_permissions_active ON role_permissions(role_id, permission) WHERE revoked_at IS NULL;

-- User-specific permission overrides
CREATE TABLE user_permissions (
    id TEXT PRIMARY KEY DEFAULT generate_ulid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    permission TEXT NOT NULL,
    resource_type TEXT,
    resource_ids TEXT[],
    conditions JSONB DEFAULT '{}'::jsonb,
    granted_by TEXT NOT NULL REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    revoked_at TIMESTAMP,
    revoked_by TEXT REFERENCES users(id)
);

-- Indexes for user permissions
CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id, organization_id);
CREATE INDEX idx_user_permissions_permission ON user_permissions(permission);
CREATE INDEX idx_user_permissions_active ON user_permissions(user_id, permission) WHERE revoked_at IS NULL;

-- Record migration
INSERT INTO schema_migrations (version, migration_name, checksum)
VALUES (2, 'add_audit_compliance_models', md5('audit_compliance_v1'));

COMMIT;

-- =====================================================
-- PHASE 2A: WORKFLOW AND INTEGRATION MODELS (Week 5)
-- =====================================================

-- Migration 003: Workflow and Integration Framework
BEGIN;

-- Workflow Definitions
CREATE TABLE workflows (
    id TEXT PRIMARY KEY DEFAULT generate_ulid(),
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT, -- 'tax_preparation', 'client_onboarding', 'document_processing', etc.
    definition JSONB NOT NULL, -- Workflow graph definition
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'deprecated')),
    version INTEGER DEFAULT 1,
    parent_workflow_id TEXT REFERENCES workflows(id), -- For versioning
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    archived_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for workflows
CREATE INDEX idx_workflows_organization_id ON workflows(organization_id, status);
CREATE INDEX idx_workflows_category ON workflows(category, status);
CREATE INDEX idx_workflows_created_by ON workflows(created_by, created_at DESC);
CREATE INDEX idx_workflows_parent ON workflows(parent_workflow_id) WHERE parent_workflow_id IS NOT NULL;

-- Workflow Executions
CREATE TABLE workflow_executions (
    id TEXT PRIMARY KEY DEFAULT generate_ulid(),
    workflow_id TEXT NOT NULL REFERENCES workflows(id),
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    triggered_by TEXT REFERENCES users(id),
    trigger_type TEXT NOT NULL, -- 'manual', 'scheduled', 'webhook', 'event'
    trigger_data JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    input_data JSONB DEFAULT '{}'::jsonb,
    output_data JSONB DEFAULT '{}'::jsonb,
    current_step TEXT, -- Current step ID in workflow
    steps_completed TEXT[], -- Array of completed step IDs
    error_message TEXT,
    error_details JSONB,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    duration_ms INTEGER, -- Execution duration in milliseconds
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for workflow executions
CREATE INDEX idx_workflow_executions_workflow_id ON workflow_executions(workflow_id, started_at DESC);
CREATE INDEX idx_workflow_executions_organization_id ON workflow_executions(organization_id, started_at DESC);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status, started_at DESC);
CREATE INDEX idx_workflow_executions_triggered_by ON workflow_executions(triggered_by, started_at DESC);

-- Workflow Step Executions (for detailed tracking)
CREATE TABLE workflow_step_executions (
    id TEXT PRIMARY KEY DEFAULT generate_ulid(),
    execution_id TEXT NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    step_id TEXT NOT NULL, -- Step ID from workflow definition
    step_name TEXT NOT NULL,
    step_type TEXT NOT NULL, -- 'action', 'condition', 'integration', etc.
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
    input_data JSONB DEFAULT '{}'::jsonb,
    output_data JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    duration_ms INTEGER,
    retry_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for workflow step executions
CREATE INDEX idx_workflow_step_executions_execution_id ON workflow_step_executions(execution_id, started_at);
CREATE INDEX idx_workflow_step_executions_status ON workflow_step_executions(status, started_at DESC);

-- QuickBooks Integration Models
CREATE TABLE quickbooks_connections (
    id TEXT PRIMARY KEY DEFAULT generate_ulid(),
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    company_id TEXT NOT NULL, -- QuickBooks Company ID
    access_token_hash TEXT NOT NULL,
    refresh_token_hash TEXT NOT NULL,
    realm_id TEXT NOT NULL,
    base_url TEXT NOT NULL,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_sync_at TIMESTAMP,
    token_expires_at TIMESTAMP NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'disconnected', 'error')),
    sync_settings JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for QuickBooks connections
CREATE INDEX idx_quickbooks_connections_organization_id ON quickbooks_connections(organization_id);
CREATE INDEX idx_quickbooks_connections_company_id ON quickbooks_connections(company_id);
CREATE INDEX idx_quickbooks_connections_status ON quickbooks_connections(status);

-- QuickBooks Sync Records
CREATE TABLE quickbooks_sync_records (
    id TEXT PRIMARY KEY DEFAULT generate_ulid(),
    connection_id TEXT NOT NULL REFERENCES quickbooks_connections(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL, -- 'customer', 'invoice', 'item', etc.
    quickbooks_id TEXT NOT NULL,
    local_id TEXT, -- Reference to local entity
    sync_direction TEXT NOT NULL CHECK (sync_direction IN ('import', 'export', 'bidirectional')),
    last_sync_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error', 'conflict')),
    error_message TEXT,
    quickbooks_data JSONB, -- Cached QuickBooks data
    local_data JSONB, -- Cached local data
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for QuickBooks sync records
CREATE INDEX idx_quickbooks_sync_records_connection_id ON quickbooks_sync_records(connection_id, entity_type);
CREATE INDEX idx_quickbooks_sync_records_organization_id ON quickbooks_sync_records(organization_id, entity_type);
CREATE INDEX idx_quickbooks_sync_records_entity ON quickbooks_sync_records(entity_type, quickbooks_id);
CREATE INDEX idx_quickbooks_sync_records_local ON quickbooks_sync_records(entity_type, local_id) WHERE local_id IS NOT NULL;
CREATE INDEX idx_quickbooks_sync_records_status ON quickbooks_sync_records(sync_status, last_sync_at DESC);

-- Record migration
INSERT INTO schema_migrations (version, migration_name, checksum)
VALUES (3, 'add_workflow_integration_models', md5('workflow_integration_v1'));

COMMIT;

-- =====================================================
-- PHASE 3A: ANALYTICS AND INTELLIGENCE MODELS (Week 9)
-- =====================================================

-- Migration 004: Analytics and Intelligence Framework
BEGIN;

-- Client Health Scoring
CREATE TABLE client_health_scores (
    id TEXT PRIMARY KEY DEFAULT generate_ulid(),
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    score DECIMAL(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
    score_breakdown JSONB NOT NULL, -- Detailed scoring factors
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    trends JSONB DEFAULT '{}'::jsonb, -- Historical trend data
    recommendations JSONB DEFAULT '{}'::jsonb, -- AI-generated recommendations
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- For cache invalidation
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for client health scores
CREATE INDEX idx_client_health_scores_client_id ON client_health_scores(client_id, calculated_at DESC);
CREATE INDEX idx_client_health_scores_organization_id ON client_health_scores(organization_id, score DESC);
CREATE INDEX idx_client_health_scores_risk_level ON client_health_scores(risk_level, calculated_at DESC);
CREATE INDEX idx_client_health_scores_expires_at ON client_health_scores(expires_at) WHERE expires_at IS NOT NULL;

-- Feature Usage Analytics
CREATE TABLE feature_usage_analytics (
    id TEXT PRIMARY KEY DEFAULT generate_ulid(),
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id),
    feature_name TEXT NOT NULL,
    feature_category TEXT, -- 'documents', 'workflows', 'reports', etc.
    action TEXT NOT NULL, -- 'view', 'create', 'edit', 'delete', 'export'
    usage_count INTEGER NOT NULL DEFAULT 1,
    session_duration_ms INTEGER, -- Time spent in feature
    success_rate DECIMAL(5,4), -- Success rate for the action
    error_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_bucket DATE GENERATED ALWAYS AS (date_trunc('day', last_used_at)::date) STORED,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Partitioning for feature usage analytics (by month)
ALTER TABLE feature_usage_analytics PARTITION BY RANGE (last_used_at);
CREATE TABLE feature_usage_analytics_y2025m01 PARTITION OF feature_usage_analytics
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE feature_usage_analytics_y2025m02 PARTITION OF feature_usage_analytics
FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE feature_usage_analytics_y2025m03 PARTITION OF feature_usage_analytics
FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

-- Indexes for feature usage analytics
CREATE INDEX idx_feature_usage_analytics_organization_id ON feature_usage_analytics(organization_id, date_bucket DESC);
CREATE INDEX idx_feature_usage_analytics_user_id ON feature_usage_analytics(user_id, date_bucket DESC);
CREATE INDEX idx_feature_usage_analytics_feature ON feature_usage_analytics(feature_name, date_bucket DESC);
CREATE INDEX idx_feature_usage_analytics_category ON feature_usage_analytics(feature_category, date_bucket DESC);

-- Revenue Intelligence Data
CREATE TABLE revenue_analytics (
    id TEXT PRIMARY KEY DEFAULT generate_ulid(),
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    metric_type TEXT NOT NULL, -- 'mrr', 'arr', 'churn_rate', 'ltv', etc.
    metric_value DECIMAL(15,2) NOT NULL,
    metric_unit TEXT, -- 'currency', 'percentage', 'count'
    breakdown JSONB DEFAULT '{}'::jsonb, -- Detailed breakdown by segment
    comparison_data JSONB DEFAULT '{}'::jsonb, -- Previous period comparisons
    predictions JSONB DEFAULT '{}'::jsonb, -- AI-generated predictions
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for revenue analytics
CREATE INDEX idx_revenue_analytics_organization_id ON revenue_analytics(organization_id, period_end DESC);
CREATE INDEX idx_revenue_analytics_metric_type ON revenue_analytics(metric_type, period_end DESC);
CREATE INDEX idx_revenue_analytics_period ON revenue_analytics(period_start, period_end);

-- Performance Metrics
CREATE TABLE performance_metrics (
    id TEXT PRIMARY KEY DEFAULT generate_ulid(),
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL, -- 'api_response_time', 'database_query_time', 'cache_hit_rate'
    metric_name TEXT NOT NULL, -- Specific metric identifier
    metric_value DECIMAL(15,6) NOT NULL,
    metric_unit TEXT NOT NULL, -- 'milliseconds', 'percentage', 'count'
    tags JSONB DEFAULT '{}'::jsonb, -- Additional metadata for grouping
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_bucket TIMESTAMP GENERATED ALWAYS AS (date_trunc('minute', timestamp)) STORED
);

-- Partitioning for performance metrics (by day)
ALTER TABLE performance_metrics PARTITION BY RANGE (timestamp);
CREATE TABLE performance_metrics_y2025m01d01 PARTITION OF performance_metrics
FOR VALUES FROM ('2025-01-01') TO ('2025-01-02');
-- Additional daily partitions would be created automatically

-- Indexes for performance metrics
CREATE INDEX idx_performance_metrics_organization_id ON performance_metrics(organization_id, date_bucket DESC);
CREATE INDEX idx_performance_metrics_type_name ON performance_metrics(metric_type, metric_name, date_bucket DESC);
CREATE INDEX idx_performance_metrics_tags ON performance_metrics USING GIN(tags);

-- Document Intelligence Results
CREATE TABLE document_intelligence_results (
    id TEXT PRIMARY KEY DEFAULT generate_ulid(),
    document_id TEXT NOT NULL, -- Reference to document
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    processing_type TEXT NOT NULL, -- 'ocr', 'classification', 'extraction', 'analysis'
    ai_service TEXT NOT NULL, -- 'azure_form_recognizer', 'openai_gpt4', 'custom_model'
    confidence_score DECIMAL(5,4), -- AI confidence in results
    extracted_data JSONB NOT NULL, -- Structured extracted data
    raw_results JSONB, -- Raw AI service response
    validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'rejected', 'needs_review')),
    validated_by TEXT REFERENCES users(id),
    validated_at TIMESTAMP,
    processing_time_ms INTEGER NOT NULL,
    cost_cents INTEGER, -- AI service cost in cents
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for document intelligence results
CREATE INDEX idx_document_intelligence_results_document_id ON document_intelligence_results(document_id, created_at DESC);
CREATE INDEX idx_document_intelligence_results_organization_id ON document_intelligence_results(organization_id, created_at DESC);
CREATE INDEX idx_document_intelligence_results_type ON document_intelligence_results(processing_type, created_at DESC);
CREATE INDEX idx_document_intelligence_results_validation_status ON document_intelligence_results(validation_status, created_at DESC);

-- Market Intelligence Data
CREATE TABLE market_intelligence (
    id TEXT PRIMARY KEY DEFAULT generate_ulid(),
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE, -- NULL for global data
    intelligence_type TEXT NOT NULL, -- 'competitor_analysis', 'market_trend', 'regulatory_change'
    title TEXT NOT NULL,
    description TEXT,
    content JSONB NOT NULL, -- Structured intelligence data
    sources TEXT[], -- Data sources URLs or references
    confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')),
    impact_level TEXT CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
    effective_date DATE,
    expiry_date DATE,
    tags TEXT[], -- For categorization and search
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for market intelligence
CREATE INDEX idx_market_intelligence_organization_id ON market_intelligence(organization_id, created_at DESC);
CREATE INDEX idx_market_intelligence_type ON market_intelligence(intelligence_type, created_at DESC);
CREATE INDEX idx_market_intelligence_impact ON market_intelligence(impact_level, effective_date DESC);
CREATE INDEX idx_market_intelligence_tags ON market_intelligence USING GIN(tags);
CREATE INDEX idx_market_intelligence_effective_date ON market_intelligence(effective_date DESC) WHERE effective_date IS NOT NULL;

-- Record migration
INSERT INTO schema_migrations (version, migration_name, checksum)
VALUES (4, 'add_analytics_intelligence_models', md5('analytics_intelligence_v1'));

COMMIT;

-- =====================================================
-- HELPER FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to generate ULID (Universally Unique Lexicographically Sortable Identifier)
CREATE OR REPLACE FUNCTION generate_ulid() RETURNS TEXT AS $$
DECLARE
    -- Crockford's Base32
    encoding   BYTEA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    timestamp  BIGINT;
    output     TEXT = '';

BEGIN
    -- 10 character timestamp
    timestamp = FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000);
    WHILE timestamp > 0 LOOP
        output = CHR(GET_BYTE(encoding, timestamp % 32)) || output;
        timestamp = timestamp / 32;
    END LOOP;

    -- Pad with zeros if needed
    WHILE LENGTH(output) < 10 LOOP
        output = '0' || output;
    END LOOP;

    -- 16 character randomness
    FOR i IN 1..16 LOOP
        output = output || CHR(GET_BYTE(encoding, FLOOR(RANDOM() * 32)::INT));
    END LOOP;

    RETURN output;
END
$$ LANGUAGE PLPGSQL VOLATILE;

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE PLPGSQL;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_workflows_updated_at
    BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_events_updated_at
    BEFORE UPDATE ON compliance_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_market_intelligence_updated_at
    BEFORE UPDATE ON market_intelligence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE PLPGSQL;

-- Function to automatically clean up expired data exports
CREATE OR REPLACE FUNCTION cleanup_expired_data_exports()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    UPDATE data_exports
    SET status = 'expired'
    WHERE expires_at < CURRENT_TIMESTAMP AND status = 'completed';

    DELETE FROM data_exports
    WHERE status = 'expired' AND expires_at < CURRENT_TIMESTAMP - INTERVAL '90 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE PLPGSQL;

-- =====================================================
-- ROLLBACK PROCEDURES
-- =====================================================

-- Rollback script for Migration 004
/*
BEGIN;
DROP TABLE IF EXISTS market_intelligence CASCADE;
DROP TABLE IF EXISTS document_intelligence_results CASCADE;
DROP TABLE IF EXISTS performance_metrics CASCADE;
DROP TABLE IF EXISTS revenue_analytics CASCADE;
DROP TABLE IF EXISTS feature_usage_analytics CASCADE;
DROP TABLE IF EXISTS client_health_scores CASCADE;
DELETE FROM schema_migrations WHERE version = 4;
COMMIT;
*/

-- Rollback script for Migration 003
/*
BEGIN;
DROP TABLE IF EXISTS quickbooks_sync_records CASCADE;
DROP TABLE IF EXISTS quickbooks_connections CASCADE;
DROP TABLE IF EXISTS workflow_step_executions CASCADE;
DROP TABLE IF EXISTS workflow_executions CASCADE;
DROP TABLE IF EXISTS workflows CASCADE;
DELETE FROM schema_migrations WHERE version = 3;
COMMIT;
*/

-- Rollback script for Migration 002
/*
BEGIN;
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS data_exports CASCADE;
DROP TABLE IF EXISTS compliance_events CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DELETE FROM schema_migrations WHERE version = 2;
COMMIT;
*/

-- Rollback script for Migration 001
/*
BEGIN;
DROP TABLE IF EXISTS security_events CASCADE;
DROP TABLE IF EXISTS api_key_usage CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DELETE FROM schema_migrations WHERE version = 1;
COMMIT;
*/

-- =====================================================
-- VALIDATION QUERIES
-- =====================================================

-- Validate migration integrity
SELECT
    version,
    migration_name,
    executed_at,
    checksum
FROM schema_migrations
ORDER BY version;

-- Check table sizes and row counts
SELECT
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
AND tablename IN (
    'user_sessions', 'api_keys', 'security_events', 'audit_logs',
    'workflows', 'workflow_executions', 'quickbooks_connections',
    'client_health_scores', 'feature_usage_analytics'
)
ORDER BY tablename, attname;

-- Validate foreign key constraints
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- Validate indexes
SELECT
    t.relname AS table_name,
    i.relname AS index_name,
    array_to_string(array_agg(a.attname), ', ') AS column_names
FROM pg_class t,
     pg_class i,
     pg_index ix,
     pg_attribute a
WHERE t.oid = ix.indrelid
    AND i.oid = ix.indexrelid
    AND a.attrelid = t.oid
    AND a.attnum = ANY(ix.indkey)
    AND t.relkind = 'r'
    AND t.relname IN (
        'user_sessions', 'api_keys', 'security_events', 'audit_logs',
        'workflows', 'workflow_executions', 'client_health_scores'
    )
GROUP BY t.relname, i.relname
ORDER BY t.relname, i.relname;

-- =====================================================
-- MAINTENANCE PROCEDURES
-- =====================================================

-- Create maintenance functions for automatic cleanup
CREATE OR REPLACE FUNCTION maintain_database()
RETURNS TABLE(operation TEXT, affected_rows INTEGER) AS $$
BEGIN
    -- Clean up expired sessions
    RETURN QUERY SELECT 'cleanup_expired_sessions'::TEXT, cleanup_expired_sessions();

    -- Clean up expired data exports
    RETURN QUERY SELECT 'cleanup_expired_data_exports'::TEXT, cleanup_expired_data_exports();

    -- Update table statistics
    ANALYZE user_sessions, api_keys, security_events, audit_logs;
    RETURN QUERY SELECT 'update_statistics'::TEXT, 0;

    -- Log maintenance completion
    INSERT INTO audit_logs (organization_id, entity_type, action, metadata)
    VALUES (NULL, 'system', 'maintenance', '{"type": "automated_maintenance"}'::jsonb);

    RETURN QUERY SELECT 'maintenance_logged'::TEXT, 1;
END;
$$ LANGUAGE PLPGSQL;

-- Schedule automated maintenance (example for PostgreSQL with pg_cron extension)
-- SELECT cron.schedule('maintain-advisoros-db', '0 2 * * *', 'SELECT maintain_database();');

-- =====================================================
-- PERFORMANCE OPTIMIZATION
-- =====================================================

-- Optimize PostgreSQL settings for the new schema
-- These should be set in postgresql.conf or via ALTER SYSTEM

/*
-- Memory settings
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';

-- Connection settings
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET max_worker_processes = 8;

-- Checkpoint settings
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';

-- Query planner settings
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Logging settings for monitoring
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_checkpoints = on;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
ALTER SYSTEM SET log_lock_waits = on;

-- Reload configuration
SELECT pg_reload_conf();
*/

-- =====================================================
-- MIGRATION VALIDATION AND COMPLETION
-- =====================================================

-- Final validation query to ensure all migrations completed successfully
DO $$
DECLARE
    expected_migrations INTEGER := 4;
    actual_migrations INTEGER;
    missing_tables TEXT[];
    table_name TEXT;
BEGIN
    -- Check migration count
    SELECT COUNT(*) INTO actual_migrations FROM schema_migrations;

    IF actual_migrations != expected_migrations THEN
        RAISE EXCEPTION 'Migration validation failed: Expected % migrations, found %',
            expected_migrations, actual_migrations;
    END IF;

    -- Check required tables exist
    FOR table_name IN SELECT unnest(ARRAY[
        'user_sessions', 'api_keys', 'api_key_usage', 'security_events',
        'audit_logs', 'compliance_events', 'data_exports', 'role_permissions', 'user_permissions',
        'workflows', 'workflow_executions', 'workflow_step_executions',
        'quickbooks_connections', 'quickbooks_sync_records',
        'client_health_scores', 'feature_usage_analytics', 'revenue_analytics',
        'performance_metrics', 'document_intelligence_results', 'market_intelligence'
    ]) AS table_name)
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = table_name
        ) THEN
            missing_tables := array_append(missing_tables, table_name);
        END IF;
    END LOOP;

    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'Migration validation failed: Missing tables: %',
            array_to_string(missing_tables, ', ');
    END IF;

    RAISE NOTICE 'Database migration validation completed successfully. All % migrations applied and % tables created.',
        actual_migrations, array_length(ARRAY[
            'user_sessions', 'api_keys', 'api_key_usage', 'security_events',
            'audit_logs', 'compliance_events', 'data_exports', 'role_permissions', 'user_permissions',
            'workflows', 'workflow_executions', 'workflow_step_executions',
            'quickbooks_connections', 'quickbooks_sync_records',
            'client_health_scores', 'feature_usage_analytics', 'revenue_analytics',
            'performance_metrics', 'document_intelligence_results', 'market_intelligence'
        ], 1);
END $$;
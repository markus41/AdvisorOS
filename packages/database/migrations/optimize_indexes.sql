-- Database Performance Optimization Migration
-- This migration adds composite indexes, partial indexes, and specialized indexes
-- for optimal query performance in the CPA platform

-- =============================================================================
-- COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- =============================================================================

-- Organization + CreatedAt indexes for time-based queries across all models
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_org_created
ON users (organization_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_org_created
ON clients (organization_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_org_created
ON documents (organization_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_engagements_org_created
ON engagements (organization_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_org_created
ON tasks (organization_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_org_created
ON invoices (organization_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_org_created
ON reports (organization_id, created_at DESC);

-- Client + Status indexes for client management
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_org_status
ON clients (organization_id, status) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_engagements_client_status
ON engagements (client_id, status) WHERE deleted_at IS NULL;

-- Document optimization indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_client_type_year
ON documents (client_id, category, year DESC) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_org_category_year
ON documents (organization_id, category, year DESC) WHERE deleted_at IS NULL;

-- Task assignment and status indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_assigned_status_due
ON tasks (assigned_to_id, status, due_date ASC) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_org_status_priority
ON tasks (organization_id, status, priority) WHERE deleted_at IS NULL;

-- Invoice payment and due date indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_due_status
ON invoices (due_date ASC, status) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_client_status_due
ON invoices (client_id, status, due_date ASC) WHERE deleted_at IS NULL;

-- =============================================================================
-- PARTIAL INDEXES FOR SOFT DELETES AND ACTIVE RECORDS
-- =============================================================================

-- Active users only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_org_active
ON users (organization_id) WHERE deleted_at IS NULL AND is_active = true;

-- Active clients only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_org_active
ON clients (organization_id) WHERE deleted_at IS NULL AND status = 'active';

-- Non-archived documents
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_client_not_archived
ON documents (client_id, category) WHERE deleted_at IS NULL AND is_archived = false;

-- Latest document versions only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_client_latest
ON documents (client_id, category, year DESC) WHERE deleted_at IS NULL AND is_latest_version = true;

-- Pending OCR documents
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_ocr_pending
ON documents (organization_id, ocr_status, created_at ASC) WHERE ocr_status IN ('pending', 'processing');

-- Documents needing review
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_review_needed
ON documents (organization_id, created_at ASC) WHERE needs_review = true AND deleted_at IS NULL;

-- Active tasks only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_assigned_active
ON tasks (assigned_to_id, priority, due_date ASC) WHERE deleted_at IS NULL AND status NOT IN ('completed', 'cancelled');

-- Open invoices
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_open
ON invoices (organization_id, due_date ASC) WHERE deleted_at IS NULL AND status NOT IN ('paid', 'cancelled');

-- Overdue invoices
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_overdue
ON invoices (organization_id, due_date ASC, total_amount DESC) WHERE deleted_at IS NULL AND due_date < CURRENT_DATE AND status NOT IN ('paid', 'cancelled');

-- =============================================================================
-- COVERING INDEXES TO ELIMINATE TABLE LOOKUPS
-- =============================================================================

-- Client list with essential info
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_list_covering
ON clients (organization_id, status) INCLUDE (business_name, primary_contact_name, primary_contact_email, risk_level, created_at)
WHERE deleted_at IS NULL;

-- Document list covering index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_list_covering
ON documents (client_id, category) INCLUDE (file_name, file_type, year, created_at, file_size)
WHERE deleted_at IS NULL AND is_latest_version = true;

-- Task dashboard covering index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_dashboard_covering
ON tasks (assigned_to_id, status) INCLUDE (title, priority, due_date, engagement_id, estimated_hours)
WHERE deleted_at IS NULL;

-- Invoice summary covering index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_summary_covering
ON invoices (organization_id, status) INCLUDE (invoice_number, total_amount, due_date, client_id)
WHERE deleted_at IS NULL;

-- =============================================================================
-- JSON FIELD INDEXES FOR QUICKBOOKS AND METADATA
-- =============================================================================

-- QuickBooks ID lookup in client financial data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_quickbooks_id
ON clients USING GIN ((financial_data->'quickbooks_id')) WHERE financial_data IS NOT NULL;

-- Document metadata tags search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_metadata_search
ON documents USING GIN (metadata) WHERE metadata IS NOT NULL;

-- Task checklist completion tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_checklist_progress
ON tasks USING GIN (checklist) WHERE checklist IS NOT NULL;

-- Invoice line items for reporting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_line_items
ON invoices USING GIN (line_items) WHERE line_items IS NOT NULL;

-- =============================================================================
-- TIME-BASED INDEXES FOR REPORTING AND ANALYTICS
-- =============================================================================

-- Monthly/Quarterly reporting indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_year_quarter
ON documents (organization_id, year DESC, quarter DESC) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_engagements_year_quarter
ON engagements (organization_id, year DESC, quarter DESC) WHERE deleted_at IS NULL;

-- Revenue tracking by month
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_monthly_revenue
ON invoices (organization_id, date_trunc('month', invoice_date), status) WHERE deleted_at IS NULL;

-- Task completion tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_completion_tracking
ON tasks (organization_id, date_trunc('week', completed_date)) WHERE completed_date IS NOT NULL AND deleted_at IS NULL;

-- =============================================================================
-- SPECIALIZED INDEXES FOR AUDIT AND COMPLIANCE
-- =============================================================================

-- Audit log performance for compliance queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_entity_action
ON audit_logs (organization_id, entity_type, entity_id, action, created_at DESC);

-- Auth attempts security monitoring
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_attempts_security
ON auth_attempts (email, success, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_attempts_ip_tracking
ON auth_attempts (ip_address, created_at DESC) WHERE success = false;

-- Document retention and archival
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_retention
ON documents (organization_id, retention_date ASC) WHERE retention_date IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_archive_candidates
ON documents (organization_id, archive_date ASC) WHERE archive_date IS NOT NULL AND is_archived = false AND deleted_at IS NULL;

-- =============================================================================
-- QUICKBOOKS SYNC OPTIMIZATION
-- =============================================================================

-- QuickBooks sync status tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quickbooks_syncs_status
ON quickbooks_syncs (organization_id, status, started_at DESC);

-- Webhook event processing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quickbooks_webhooks_processing
ON quickbooks_webhook_events (organization_id, status, next_retry_at ASC) WHERE status = 'pending';

-- =============================================================================
-- STATISTICS UPDATE FOR OPTIMIZER
-- =============================================================================

-- Update table statistics for query planner
ANALYZE users;
ANALYZE clients;
ANALYZE documents;
ANALYZE engagements;
ANALYZE tasks;
ANALYZE invoices;
ANALYZE reports;
ANALYZE audit_logs;
ANALYZE auth_attempts;
ANALYZE quickbooks_syncs;
ANALYZE quickbooks_webhook_events;

-- =============================================================================
-- PERFORMANCE MONITORING VIEWS
-- =============================================================================

-- Create view for slow query monitoring
CREATE OR REPLACE VIEW slow_queries AS
SELECT
  query,
  calls,
  total_time,
  mean_time,
  (total_time / calls) as avg_time_ms,
  rows,
  100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
WHERE calls > 100
ORDER BY total_time DESC;

-- Create view for index usage monitoring
CREATE OR REPLACE VIEW index_usage AS
SELECT
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch,
  idx_scan,
  idx_tup_read / nullif(idx_scan, 0) as tuples_per_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Create view for table size monitoring
CREATE OR REPLACE VIEW table_sizes AS
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_total_relation_size(schemaname||'.'||tablename) as bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

COMMENT ON VIEW slow_queries IS 'Monitor slow queries for performance optimization';
COMMENT ON VIEW index_usage IS 'Track index usage statistics for optimization';
COMMENT ON VIEW table_sizes IS 'Monitor table and index sizes for capacity planning';
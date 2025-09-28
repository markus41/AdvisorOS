-- Performance Optimization Migration: Advanced Indexing Strategy
-- This migration adds comprehensive indexes to optimize query performance
-- Execute during low-traffic periods to minimize impact

-- ============================================================================
-- COMPOSITE INDEXES FOR MULTI-TENANT QUERIES
-- ============================================================================

-- Critical organization-scoped composite indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_org_active_role
ON users(organization_id, is_active, role)
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_org_status_name
ON clients(organization_id, status, business_name)
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_org_client_category
ON documents(organization_id, client_id, category, created_at DESC)
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_engagements_org_status_due
ON engagements(organization_id, status, due_date)
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_org_assigned_status
ON tasks(organization_id, assigned_to_id, status, due_date)
WHERE deleted_at IS NULL;

-- ============================================================================
-- FULL-TEXT SEARCH INDEXES
-- ============================================================================

-- GIN indexes for full-text search capabilities
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_search_gin
ON clients USING gin(
  to_tsvector('english',
    coalesce(business_name, '') || ' ' ||
    coalesce(legal_name, '') || ' ' ||
    coalesce(primary_contact_name, '') || ' ' ||
    coalesce(primary_contact_email, '')
  )
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_search_gin
ON documents USING gin(
  to_tsvector('english',
    coalesce(file_name, '') || ' ' ||
    coalesce(description, '')
  )
);

-- GIN index for document tags array search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_tags_gin
ON documents USING gin(tags);

-- ============================================================================
-- PERFORMANCE-CRITICAL PARTIAL INDEXES
-- ============================================================================

-- Index only active records for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_org
ON users(organization_id, email)
WHERE is_active = true AND deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_active_org
ON clients(organization_id, business_name)
WHERE status = 'active' AND deleted_at IS NULL;

-- OCR processing optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_ocr_pending
ON documents(organization_id, created_at)
WHERE ocr_status IN ('pending', 'processing');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_needs_review
ON documents(organization_id, uploaded_by, created_at)
WHERE needs_review = true AND deleted_at IS NULL;

-- Workflow and task execution optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflow_executions_active
ON workflow_executions(organization_id, status, scheduled_for)
WHERE status IN ('pending', 'running') AND deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_executions_pending
ON task_executions(workflow_execution_id, status, step_index)
WHERE status IN ('pending', 'ready') AND deleted_at IS NULL;

-- ============================================================================
-- FINANCIAL DATA AND QUICKBOOKS OPTIMIZATION
-- ============================================================================

-- QuickBooks sync optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qb_syncs_org_status_started
ON quickbooks_syncs(organization_id, status, started_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qb_webhook_events_processing
ON quickbooks_webhook_events(organization_id, status, next_retry_at)
WHERE status IN ('pending', 'failed') AND next_retry_at IS NOT NULL;

-- Invoice and billing optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_org_status_due
ON invoices(organization_id, status, due_date)
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_overdue
ON invoices(organization_id, client_id, due_date)
WHERE status IN ('sent', 'viewed', 'partial') AND due_date < CURRENT_DATE;

-- ============================================================================
-- AUDIT AND SECURITY INDEXES
-- ============================================================================

-- Audit log performance optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_org_entity_action
ON audit_logs(organization_id, entity_type, action, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_recent
ON audit_logs(user_id, created_at DESC)
WHERE created_at > CURRENT_DATE - INTERVAL '30 days';

-- Security and authentication
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_attempts_failed_recent
ON auth_attempts(email, ip_address, created_at)
WHERE success = false AND created_at > CURRENT_DATE - INTERVAL '1 hour';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_events_security
ON auth_events(organization_id, event_type, created_at DESC)
WHERE event_type IN ('account_locked', 'password_change', 'mfa_enabled');

-- ============================================================================
-- DOCUMENT MANAGEMENT AND COLLABORATION
-- ============================================================================

-- Document annotations and collaboration
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_annotations_doc_type
ON document_annotations(document_id, type, page, created_at)
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_comments_doc_status
ON document_comments(document_id, status, created_at)
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_shares_active
ON document_shares(document_id, share_type, expires_at)
WHERE is_active = true AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP);

-- ============================================================================
-- REPORTING AND ANALYTICS
-- ============================================================================

-- Report generation optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_org_type_status
ON reports(organization_id, report_type, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_report_schedules_active_next_run
ON report_schedules(organization_id, is_active, next_run_at)
WHERE is_active = true AND next_run_at IS NOT NULL;

-- ============================================================================
-- TASK QUEUE AND BACKGROUND PROCESSING
-- ============================================================================

-- Task queue optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_queue_processing
ON task_queue_items(queue_name, status, priority DESC, scheduled_for)
WHERE status IN ('pending', 'processing');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_queue_retry
ON task_queue_items(status, next_retry_at)
WHERE status = 'failed' AND next_retry_at IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_queue_lock_cleanup
ON task_queue_items(processing_lock_id, lock_expires_at)
WHERE processing_lock_id IS NOT NULL;

-- ============================================================================
-- JSON FIELD OPTIMIZATION (GIN INDEXES)
-- ============================================================================

-- Client financial data search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_financial_data_gin
ON clients USING gin(financial_data)
WHERE financial_data IS NOT NULL;

-- Document extracted data search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_extracted_data_gin
ON documents USING gin(extracted_data)
WHERE extracted_data IS NOT NULL;

-- Workflow configuration search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflows_steps_gin
ON workflows USING gin(steps);

-- Task checklist and configuration
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_checklist_gin
ON tasks USING gin(checklist)
WHERE checklist IS NOT NULL;

-- ============================================================================
-- PERFORMANCE MONITORING FUNCTIONS
-- ============================================================================

-- Function to analyze index usage
CREATE OR REPLACE FUNCTION analyze_index_usage()
RETURNS TABLE(
  schema_name text,
  table_name text,
  index_name text,
  index_size text,
  scans bigint,
  tuples_read bigint,
  tuples_fetched bigint,
  usage_ratio numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    schemaname::text,
    tablename::text,
    indexname::text,
    pg_size_pretty(pg_relation_size(indexrelid))::text as index_size,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    CASE
      WHEN idx_scan = 0 THEN 0
      ELSE round((idx_tup_fetch::numeric / idx_tup_read::numeric) * 100, 2)
    END as usage_ratio
  FROM pg_stat_user_indexes
  ORDER BY idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to identify slow queries
CREATE OR REPLACE FUNCTION identify_slow_queries()
RETURNS TABLE(
  query_text text,
  calls bigint,
  total_time_ms numeric,
  mean_time_ms numeric,
  stddev_time_ms numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    query::text,
    calls,
    round(total_time::numeric, 2) as total_time_ms,
    round(mean_time::numeric, 2) as mean_time_ms,
    round(stddev_time::numeric, 2) as stddev_time_ms
  FROM pg_stat_statements
  WHERE calls > 10 AND mean_time > 100  -- Queries taking more than 100ms on average
  ORDER BY mean_time DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INDEX MAINTENANCE PROCEDURES
-- ============================================================================

-- Function for automatic index maintenance
CREATE OR REPLACE FUNCTION maintain_indexes()
RETURNS void AS $$
DECLARE
  index_record record;
BEGIN
  -- Reindex heavily used indexes
  FOR index_record IN
    SELECT schemaname, indexname
    FROM pg_stat_user_indexes
    WHERE idx_scan > 1000000  -- Heavily used indexes
  LOOP
    EXECUTE format('REINDEX INDEX CONCURRENTLY %I.%I', index_record.schemaname, index_record.indexname);
  END LOOP;

  -- Update table statistics
  ANALYZE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMPLETION AND VERIFICATION
-- ============================================================================

-- Verify all indexes were created successfully
DO $$
DECLARE
  index_count integer;
BEGIN
  SELECT count(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%';

  RAISE NOTICE 'Performance optimization complete. Total indexes: %', index_count;
END $$;

-- Create performance baseline
INSERT INTO audit_logs (
  id,
  action,
  entity_type,
  organization_id,
  metadata,
  created_at
) VALUES (
  gen_random_uuid()::text,
  'performance_optimization',
  'database',
  'system',
  jsonb_build_object(
    'migration', '001_performance_indexes',
    'indexes_created', (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%'),
    'optimization_date', CURRENT_TIMESTAMP
  ),
  CURRENT_TIMESTAMP
);
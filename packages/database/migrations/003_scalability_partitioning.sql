-- Scalability and Partitioning Migration
-- This migration implements table partitioning and scalability optimizations
-- CRITICAL: This migration requires careful planning and should be executed during maintenance

-- ============================================================================
-- TABLE PARTITIONING STRATEGY
-- ============================================================================

-- Partition audit_logs by organization_id and date (most critical for scaling)
-- This table grows rapidly and benefits from both org and time-based partitioning

-- Step 1: Create new partitioned audit_logs table
CREATE TABLE audit_logs_partitioned (
  LIKE audit_logs INCLUDING ALL
) PARTITION BY HASH (organization_id);

-- Create hash partitions for organizations (start with 8 partitions)
CREATE TABLE audit_logs_part_0 PARTITION OF audit_logs_partitioned
  FOR VALUES WITH (MODULUS 8, REMAINDER 0);

CREATE TABLE audit_logs_part_1 PARTITION OF audit_logs_partitioned
  FOR VALUES WITH (MODULUS 8, REMAINDER 1);

CREATE TABLE audit_logs_part_2 PARTITION OF audit_logs_partitioned
  FOR VALUES WITH (MODULUS 8, REMAINDER 2);

CREATE TABLE audit_logs_part_3 PARTITION OF audit_logs_partitioned
  FOR VALUES WITH (MODULUS 8, REMAINDER 3);

CREATE TABLE audit_logs_part_4 PARTITION OF audit_logs_partitioned
  FOR VALUES WITH (MODULUS 8, REMAINDER 4);

CREATE TABLE audit_logs_part_5 PARTITION OF audit_logs_partitioned
  FOR VALUES WITH (MODULUS 8, REMAINDER 5);

CREATE TABLE audit_logs_part_6 PARTITION OF audit_logs_partitioned
  FOR VALUES WITH (MODULUS 8, REMAINDER 6);

CREATE TABLE audit_logs_part_7 PARTITION OF audit_logs_partitioned
  FOR VALUES WITH (MODULUS 8, REMAINDER 7);

-- Create time-based sub-partitions for each organization partition
-- This allows for efficient data purging and query performance

CREATE TABLE audit_logs_part_0_2024 PARTITION OF audit_logs_part_0
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE audit_logs_part_0_2025 PARTITION OF audit_logs_part_0
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Note: In production, you would create similar sub-partitions for all organization partitions

-- ============================================================================
-- DOCUMENTS TABLE PARTITIONING (High Volume Expected)
-- ============================================================================

-- Partition documents by organization_id for tenant isolation
CREATE TABLE documents_partitioned (
  LIKE documents INCLUDING ALL
) PARTITION BY HASH (organization_id);

-- Create partitions for documents
CREATE TABLE documents_part_0 PARTITION OF documents_partitioned
  FOR VALUES WITH (MODULUS 4, REMAINDER 0);

CREATE TABLE documents_part_1 PARTITION OF documents_partitioned
  FOR VALUES WITH (MODULUS 4, REMAINDER 1);

CREATE TABLE documents_part_2 PARTITION OF documents_partitioned
  FOR VALUES WITH (MODULUS 4, REMAINDER 2);

CREATE TABLE documents_part_3 PARTITION OF documents_partitioned
  FOR VALUES WITH (MODULUS 4, REMAINDER 3);

-- ============================================================================
-- TASK QUEUE PARTITIONING FOR BACKGROUND PROCESSING
-- ============================================================================

-- Partition task queue by status and priority for efficient processing
CREATE TABLE task_queue_items_partitioned (
  LIKE task_queue_items INCLUDING ALL
) PARTITION BY LIST (status);

-- Create partitions by status
CREATE TABLE task_queue_items_pending PARTITION OF task_queue_items_partitioned
  FOR VALUES IN ('pending');

CREATE TABLE task_queue_items_processing PARTITION OF task_queue_items_partitioned
  FOR VALUES IN ('processing');

CREATE TABLE task_queue_items_completed PARTITION OF task_queue_items_partitioned
  FOR VALUES IN ('completed', 'failed', 'cancelled');

-- ============================================================================
-- QUICKBOOKS SYNC PARTITIONING FOR HIGH VOLUME SYNCS
-- ============================================================================

-- Partition QuickBooks syncs by organization for tenant isolation
CREATE TABLE quickbooks_syncs_partitioned (
  LIKE quickbooks_syncs INCLUDING ALL
) PARTITION BY HASH (organization_id);

CREATE TABLE quickbooks_syncs_part_0 PARTITION OF quickbooks_syncs_partitioned
  FOR VALUES WITH (MODULUS 4, REMAINDER 0);

CREATE TABLE quickbooks_syncs_part_1 PARTITION OF quickbooks_syncs_partitioned
  FOR VALUES WITH (MODULUS 4, REMAINDER 1);

CREATE TABLE quickbooks_syncs_part_2 PARTITION OF quickbooks_syncs_partitioned
  FOR VALUES WITH (MODULUS 4, REMAINDER 2);

CREATE TABLE quickbooks_syncs_part_3 PARTITION OF quickbooks_syncs_partitioned
  FOR VALUES WITH (MODULUS 4, REMAINDER 3);

-- ============================================================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- ============================================================================

-- Client statistics materialized view
CREATE MATERIALIZED VIEW client_stats_mv AS
SELECT
  organization_id,
  status,
  business_type,
  risk_level,
  COUNT(*) as client_count,
  AVG(annual_revenue) as avg_revenue,
  SUM(annual_revenue) as total_revenue,
  MAX(created_at) as last_client_added
FROM clients
WHERE deleted_at IS NULL
GROUP BY organization_id, status, business_type, risk_level;

-- Create indexes on materialized view
CREATE INDEX idx_client_stats_mv_org ON client_stats_mv(organization_id);
CREATE INDEX idx_client_stats_mv_status ON client_stats_mv(status);

-- Document processing statistics materialized view
CREATE MATERIALIZED VIEW document_processing_stats_mv AS
SELECT
  organization_id,
  category,
  ocr_status,
  DATE_TRUNC('day', created_at) as processing_date,
  COUNT(*) as document_count,
  AVG(ocr_confidence) as avg_confidence,
  SUM(CASE WHEN needs_review THEN 1 ELSE 0 END) as needs_review_count
FROM documents
WHERE deleted_at IS NULL
GROUP BY organization_id, category, ocr_status, DATE_TRUNC('day', created_at);

-- Create indexes on document stats
CREATE INDEX idx_document_stats_mv_org ON document_processing_stats_mv(organization_id);
CREATE INDEX idx_document_stats_mv_date ON document_processing_stats_mv(processing_date DESC);

-- Task performance materialized view
CREATE MATERIALIZED VIEW task_performance_mv AS
SELECT
  organization_id,
  task_type,
  status,
  DATE_TRUNC('week', created_at) as week_created,
  COUNT(*) as task_count,
  AVG(EXTRACT(EPOCH FROM (completed_date - start_date))/3600) as avg_completion_hours,
  AVG(estimated_hours) as avg_estimated_hours,
  SUM(CASE WHEN completed_date IS NOT NULL AND start_date IS NOT NULL
    THEN EXTRACT(EPOCH FROM (completed_date - start_date))/3600
    ELSE 0 END) as total_actual_hours
FROM tasks
WHERE deleted_at IS NULL
GROUP BY organization_id, task_type, status, DATE_TRUNC('week', created_at);

-- ============================================================================
-- READ REPLICA OPTIMIZATION VIEWS
-- ============================================================================

-- Create read-only views for reporting and analytics
-- These can be directed to read replicas in the application

CREATE VIEW client_dashboard_view AS
SELECT
  c.id,
  c.organization_id,
  c.business_name,
  c.status,
  c.risk_level,
  c.annual_revenue,
  c.created_at,
  COUNT(DISTINCT d.id) as document_count,
  COUNT(DISTINCT e.id) as engagement_count,
  COUNT(DISTINCT i.id) as invoice_count,
  SUM(CASE WHEN i.status IN ('sent', 'viewed', 'partial') THEN i.balance_amount ELSE 0 END) as outstanding_balance
FROM clients c
LEFT JOIN documents d ON c.id = d.client_id AND d.deleted_at IS NULL
LEFT JOIN engagements e ON c.id = e.client_id AND e.deleted_at IS NULL
LEFT JOIN invoices i ON c.id = i.client_id AND i.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.organization_id, c.business_name, c.status, c.risk_level, c.annual_revenue, c.created_at;

-- Engagement performance view
CREATE VIEW engagement_performance_view AS
SELECT
  e.id,
  e.organization_id,
  e.client_id,
  e.name,
  e.type,
  e.status,
  e.estimated_hours,
  e.actual_hours,
  e.due_date,
  c.business_name as client_name,
  u.name as assigned_to_name,
  COUNT(DISTINCT t.id) as task_count,
  COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
  SUM(CASE WHEN t.status = 'completed' THEN t.actual_hours ELSE 0 END) as total_task_hours
FROM engagements e
JOIN clients c ON e.client_id = c.id
LEFT JOIN users u ON e.assigned_to_id = u.id
LEFT JOIN tasks t ON e.id = t.engagement_id AND t.deleted_at IS NULL
WHERE e.deleted_at IS NULL AND c.deleted_at IS NULL
GROUP BY e.id, e.organization_id, e.client_id, e.name, e.type, e.status,
         e.estimated_hours, e.actual_hours, e.due_date, c.business_name, u.name;

-- ============================================================================
-- CACHING LAYER SUPPORT TABLES
-- ============================================================================

-- Cache invalidation tracking table
CREATE TABLE cache_invalidation_log (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  cache_key TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  organization_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'invalidate', 'refresh', 'delete'
  triggered_by TEXT, -- user_id or 'system'
  metadata JSONB,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for cache invalidation queries
CREATE INDEX idx_cache_invalidation_org ON cache_invalidation_log(organization_id);
CREATE INDEX idx_cache_invalidation_entity ON cache_invalidation_log(entity_type, entity_id);
CREATE INDEX idx_cache_invalidation_created ON cache_invalidation_log(created_at DESC);

-- ============================================================================
-- PARTITION MAINTENANCE FUNCTIONS
-- ============================================================================

-- Function to create new time-based partitions automatically
CREATE OR REPLACE FUNCTION create_monthly_partitions()
RETURNS void AS $$
DECLARE
  start_date DATE;
  end_date DATE;
  partition_name TEXT;
  base_table TEXT;
BEGIN
  -- Calculate next month
  start_date := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month');
  end_date := start_date + INTERVAL '1 month';

  -- Create audit log partitions for next month
  FOR i IN 0..7 LOOP
    partition_name := format('audit_logs_part_%s_%s', i, to_char(start_date, 'YYYY_MM'));
    base_table := format('audit_logs_part_%s', i);

    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
                   partition_name, base_table, start_date, end_date);
  END LOOP;

  RAISE NOTICE 'Created monthly partitions for %', to_char(start_date, 'YYYY-MM');
END;
$$ LANGUAGE plpgsql;

-- Function to drop old partitions
CREATE OR REPLACE FUNCTION drop_old_partitions(retention_months INTEGER DEFAULT 24)
RETURNS void AS $$
DECLARE
  partition_record RECORD;
  cutoff_date DATE;
BEGIN
  cutoff_date := CURRENT_DATE - (retention_months || ' months')::INTERVAL;

  -- Find and drop old audit log partitions
  FOR partition_record IN
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename LIKE 'audit_logs_part_%'
    AND tablename ~ '_\d{4}_\d{2}$'
    AND to_date(right(tablename, 7), 'YYYY_MM') < cutoff_date
  LOOP
    EXECUTE format('DROP TABLE IF EXISTS %I.%I', partition_record.schemaname, partition_record.tablename);
    RAISE NOTICE 'Dropped old partition: %', partition_record.tablename;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MATERIALIZED VIEW REFRESH FUNCTIONS
-- ============================================================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY client_stats_mv;
  REFRESH MATERIALIZED VIEW CONCURRENTLY document_processing_stats_mv;
  REFRESH MATERIALIZED VIEW CONCURRENTLY task_performance_mv;

  -- Log the refresh
  INSERT INTO cache_invalidation_log (
    cache_key,
    entity_type,
    organization_id,
    action,
    triggered_by,
    metadata
  ) VALUES (
    'materialized_views',
    'database',
    'system',
    'refresh',
    'system',
    jsonb_build_object(
      'refreshed_at', CURRENT_TIMESTAMP,
      'views', ARRAY['client_stats_mv', 'document_processing_stats_mv', 'task_performance_mv']
    )
  );

  RAISE NOTICE 'Refreshed all materialized views at %', CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HORIZONTAL SCALING PREPARATION
-- ============================================================================

-- Function to analyze data distribution across partitions
CREATE OR REPLACE FUNCTION analyze_partition_distribution()
RETURNS TABLE(
  partition_name TEXT,
  row_count BIGINT,
  table_size TEXT,
  index_size TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    schemaname || '.' || tablename as partition_name,
    n_live_tup,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size
  FROM pg_stat_user_tables
  WHERE tablename LIKE '%_part_%'
  ORDER BY n_live_tup DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to identify hot partitions that might need splitting
CREATE OR REPLACE FUNCTION identify_hot_partitions()
RETURNS TABLE(
  partition_name TEXT,
  row_count BIGINT,
  reads_per_second NUMERIC,
  writes_per_second NUMERIC,
  recommendation TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    schemaname || '.' || tablename,
    n_live_tup,
    COALESCE(seq_tup_read / EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - stats_reset)), 0)::NUMERIC(10,2),
    COALESCE((n_tup_ins + n_tup_upd + n_tup_del) / EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - stats_reset)), 0)::NUMERIC(10,2),
    CASE
      WHEN n_live_tup > 10000000 THEN 'Consider splitting partition'
      WHEN seq_tup_read / EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - stats_reset)) > 1000 THEN 'High read activity - consider read replica'
      WHEN (n_tup_ins + n_tup_upd + n_tup_del) / EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - stats_reset)) > 100 THEN 'High write activity - monitor performance'
      ELSE 'Normal operation'
    END
  FROM pg_stat_user_tables
  WHERE tablename LIKE '%_part_%'
    AND stats_reset IS NOT NULL
  ORDER BY n_live_tup DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CONNECTION POOLING OPTIMIZATION
-- ============================================================================

-- Create connection statistics view
CREATE VIEW connection_pool_stats AS
SELECT
  datname as database_name,
  count(*) as total_connections,
  count(*) FILTER (WHERE state = 'active') as active_connections,
  count(*) FILTER (WHERE state = 'idle') as idle_connections,
  count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
  count(*) FILTER (WHERE state = 'idle in transaction (aborted)') as idle_in_transaction_aborted,
  avg(EXTRACT(EPOCH FROM (now() - query_start))) FILTER (WHERE state = 'active') as avg_active_query_time,
  max(EXTRACT(EPOCH FROM (now() - query_start))) FILTER (WHERE state = 'active') as max_active_query_time
FROM pg_stat_activity
WHERE datname IS NOT NULL
GROUP BY datname;

-- ============================================================================
-- AUTOMATED MAINTENANCE SCHEDULING
-- ============================================================================

-- Note: These would typically be scheduled via pg_cron or external cron
-- Provided here as reference for the maintenance procedures

-- Schedule monthly partition creation (would run on 1st of each month)
-- SELECT cron.schedule('create-monthly-partitions', '0 0 1 * *', 'SELECT create_monthly_partitions();');

-- Schedule quarterly partition cleanup (would run on 1st of Jan, Apr, Jul, Oct)
-- SELECT cron.schedule('drop-old-partitions', '0 2 1 1,4,7,10 *', 'SELECT drop_old_partitions(24);');

-- Schedule daily materialized view refresh (would run at 2 AM)
-- SELECT cron.schedule('refresh-materialized-views', '0 2 * * *', 'SELECT refresh_materialized_views();');

-- Schedule weekly statistics update (would run Sunday at 3 AM)
-- SELECT cron.schedule('update-statistics', '0 3 * * 0', 'ANALYZE;');

-- ============================================================================
-- MONITORING AND ALERTING SETUP
-- ============================================================================

-- Create performance monitoring view
CREATE VIEW database_performance_metrics AS
SELECT
  'database_size' as metric_name,
  pg_size_pretty(pg_database_size(current_database())) as metric_value,
  pg_database_size(current_database()) as metric_value_bytes,
  CURRENT_TIMESTAMP as collected_at
UNION ALL
SELECT
  'connection_count' as metric_name,
  count(*)::text as metric_value,
  count(*)::bigint as metric_value_bytes,
  CURRENT_TIMESTAMP as collected_at
FROM pg_stat_activity
WHERE datname = current_database()
UNION ALL
SELECT
  'slow_query_count' as metric_name,
  count(*)::text as metric_value,
  count(*)::bigint as metric_value_bytes,
  CURRENT_TIMESTAMP as collected_at
FROM pg_stat_statements
WHERE mean_time > 1000;

-- ============================================================================
-- COMPLETION AND VERIFICATION
-- ============================================================================

-- Verify partitioning setup
DO $$
DECLARE
  partition_count INTEGER;
  mv_count INTEGER;
BEGIN
  SELECT count(*) INTO partition_count
  FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename LIKE '%_part_%';

  SELECT count(*) INTO mv_count
  FROM pg_matviews
  WHERE schemaname = 'public';

  RAISE NOTICE 'Scalability optimization complete. Partitions: %, Materialized Views: %',
    partition_count, mv_count;
END $$;

-- Log the completion
INSERT INTO audit_logs (
  id,
  action,
  entity_type,
  organization_id,
  metadata,
  created_at
) VALUES (
  gen_random_uuid()::text,
  'scalability_optimization',
  'database',
  'system',
  jsonb_build_object(
    'migration', '003_scalability_partitioning',
    'partitions_created', (
      SELECT count(*)
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename LIKE '%_part_%'
    ),
    'materialized_views_created', (
      SELECT count(*)
      FROM pg_matviews
      WHERE schemaname = 'public'
    ),
    'optimization_date', CURRENT_TIMESTAMP
  ),
  CURRENT_TIMESTAMP
);
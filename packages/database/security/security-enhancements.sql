-- Security and Compliance Enhancement Migration
-- This migration implements advanced security features and compliance controls
-- Execute during maintenance window with proper security review

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) IMPLEMENTATION
-- ============================================================================

-- Enable RLS on all tenant-scoped tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quickbooks_syncs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quickbooks_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;

-- Create application role for RLS
CREATE ROLE app_user;

-- Organization isolation policies
CREATE POLICY org_isolation_users ON users
  FOR ALL TO app_user
  USING (organization_id = current_setting('app.current_organization_id', true));

CREATE POLICY org_isolation_clients ON clients
  FOR ALL TO app_user
  USING (organization_id = current_setting('app.current_organization_id', true));

CREATE POLICY org_isolation_documents ON documents
  FOR ALL TO app_user
  USING (organization_id = current_setting('app.current_organization_id', true));

CREATE POLICY org_isolation_engagements ON engagements
  FOR ALL TO app_user
  USING (organization_id = current_setting('app.current_organization_id', true));

CREATE POLICY org_isolation_tasks ON tasks
  FOR ALL TO app_user
  USING (organization_id = current_setting('app.current_organization_id', true));

CREATE POLICY org_isolation_invoices ON invoices
  FOR ALL TO app_user
  USING (organization_id = current_setting('app.current_organization_id', true));

CREATE POLICY org_isolation_reports ON reports
  FOR ALL TO app_user
  USING (organization_id = current_setting('app.current_organization_id', true));

CREATE POLICY org_isolation_workflows ON workflows
  FOR ALL TO app_user
  USING (organization_id = current_setting('app.current_organization_id', true));

CREATE POLICY org_isolation_audit_logs ON audit_logs
  FOR ALL TO app_user
  USING (organization_id = current_setting('app.current_organization_id', true));

-- Document access level policies (additional security layer)
CREATE POLICY document_access_level ON documents
  FOR SELECT TO app_user
  USING (
    organization_id = current_setting('app.current_organization_id', true)
    AND (
      access_level = 'organization'
      OR (access_level = 'client' AND client_id = current_setting('app.current_client_id', true))
      OR (access_level = 'restricted' AND uploaded_by = current_setting('app.current_user_id', true))
      OR (access_level = 'public')
    )
  );

-- User role-based access policies
CREATE POLICY user_role_access ON users
  FOR ALL TO app_user
  USING (
    organization_id = current_setting('app.current_organization_id', true)
    AND (
      -- Users can always see themselves
      id = current_setting('app.current_user_id', true)
      -- Admins and owners can see all users
      OR current_setting('app.current_user_role', true) IN ('owner', 'admin')
      -- CPAs can see staff
      OR (current_setting('app.current_user_role', true) = 'cpa' AND role = 'staff')
    )
  );

-- ============================================================================
-- DATA ENCRYPTION AND MASKING
-- ============================================================================

-- Create encryption functions for sensitive data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to encrypt sensitive text fields
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data text, key_id text DEFAULT 'default')
RETURNS text AS $$
BEGIN
  RETURN encode(
    encrypt_iv(
      data::bytea,
      decode(current_setting('app.encryption_key_' || key_id), 'base64'),
      decode(current_setting('app.encryption_iv_' || key_id), 'base64'),
      'aes-cbc'
    ),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt sensitive text fields
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data text, key_id text DEFAULT 'default')
RETURNS text AS $$
BEGIN
  RETURN convert_from(
    decrypt_iv(
      decode(encrypted_data, 'base64'),
      decode(current_setting('app.encryption_key_' || key_id), 'base64'),
      decode(current_setting('app.encryption_iv_' || key_id), 'base64'),
      'aes-cbc'
    ),
    'UTF8'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN '[ENCRYPTED]';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mask SSN/TIN for display
CREATE OR REPLACE FUNCTION mask_tax_id(tax_id text)
RETURNS text AS $$
BEGIN
  IF tax_id IS NULL OR length(tax_id) < 4 THEN
    RETURN tax_id;
  END IF;

  RETURN 'XXX-XX-' || right(tax_id, 4);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to mask email addresses
CREATE OR REPLACE FUNCTION mask_email(email text)
RETURNS text AS $$
DECLARE
  local_part text;
  domain_part text;
  at_position int;
BEGIN
  IF email IS NULL OR email = '' THEN
    RETURN email;
  END IF;

  at_position := position('@' in email);
  IF at_position = 0 THEN
    RETURN email;
  END IF;

  local_part := left(email, at_position - 1);
  domain_part := substring(email from at_position);

  IF length(local_part) <= 2 THEN
    RETURN repeat('*', length(local_part)) || domain_part;
  ELSE
    RETURN left(local_part, 1) || repeat('*', length(local_part) - 2) || right(local_part, 1) || domain_part;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create views with masked data for reporting
CREATE VIEW clients_masked AS
SELECT
  id,
  organization_id,
  business_name,
  legal_name,
  mask_tax_id(tax_id) as tax_id,
  quickbooks_id,
  mask_email(primary_contact_email) as primary_contact_email,
  primary_contact_name,
  primary_contact_phone,
  business_address,
  mailing_address,
  business_type,
  industry,
  website,
  status,
  risk_level,
  annual_revenue,
  -- Keep financial_data as is (assuming it's already structured appropriately)
  financial_data,
  custom_fields,
  deleted_at,
  created_at,
  updated_at,
  created_by,
  updated_by
FROM clients;

-- ============================================================================
-- AUDIT LOGGING ENHANCEMENTS
-- ============================================================================

-- Enhanced audit logging function
CREATE OR REPLACE FUNCTION enhanced_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  old_values jsonb;
  new_values jsonb;
  sensitive_fields text[] := ARRAY['password', 'access_token', 'refresh_token', 'encryption_key'];
  field_name text;
BEGIN
  -- Convert OLD and NEW to jsonb, masking sensitive fields
  IF TG_OP != 'INSERT' THEN
    old_values := to_jsonb(OLD);
    FOREACH field_name IN ARRAY sensitive_fields LOOP
      IF old_values ? field_name THEN
        old_values := old_values || jsonb_build_object(field_name, '[REDACTED]');
      END IF;
    END LOOP;
  END IF;

  IF TG_OP != 'DELETE' THEN
    new_values := to_jsonb(NEW);
    FOREACH field_name IN ARRAY sensitive_fields LOOP
      IF new_values ? field_name THEN
        new_values := new_values || jsonb_build_object(field_name, '[REDACTED]');
      END IF;
    END LOOP;
  END IF;

  -- Insert audit record
  INSERT INTO audit_logs (
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    metadata,
    ip_address,
    user_agent,
    session_id,
    organization_id,
    user_id,
    created_at
  ) VALUES (
    TG_OP,
    TG_TABLE_NAME,
    CASE
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    old_values,
    new_values,
    jsonb_build_object(
      'table_name', TG_TABLE_NAME,
      'schema_name', TG_TABLE_SCHEMA,
      'trigger_name', TG_NAME
    ),
    current_setting('app.client_ip', true),
    current_setting('app.user_agent', true),
    current_setting('app.session_id', true),
    COALESCE(
      current_setting('app.current_organization_id', true),
      CASE
        WHEN TG_OP = 'DELETE' THEN OLD.organization_id
        ELSE NEW.organization_id
      END
    ),
    current_setting('app.current_user_id', true),
    CURRENT_TIMESTAMP
  );

  RETURN CASE
    WHEN TG_OP = 'DELETE' THEN OLD
    ELSE NEW
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers on sensitive tables
CREATE TRIGGER audit_users_changes
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION enhanced_audit_log();

CREATE TRIGGER audit_clients_changes
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW EXECUTE FUNCTION enhanced_audit_log();

CREATE TRIGGER audit_documents_changes
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW EXECUTE FUNCTION enhanced_audit_log();

CREATE TRIGGER audit_invoices_changes
  AFTER INSERT OR UPDATE OR DELETE ON invoices
  FOR EACH ROW EXECUTE FUNCTION enhanced_audit_log();

CREATE TRIGGER audit_quickbooks_tokens_changes
  AFTER INSERT OR UPDATE OR DELETE ON quickbooks_tokens
  FOR EACH ROW EXECUTE FUNCTION enhanced_audit_log();

-- ============================================================================
-- DATA RETENTION AND PURGING
-- ============================================================================

-- Function to implement data retention policies
CREATE OR REPLACE FUNCTION apply_data_retention_policies()
RETURNS void AS $$
DECLARE
  retention_config jsonb := jsonb_build_object(
    'audit_logs', '7 years',
    'auth_attempts', '2 years',
    'auth_events', '2 years',
    'quickbooks_syncs', '3 years',
    'documents_archived', '10 years',
    'task_queue_items_completed', '90 days'
  );
  table_name text;
  retention_period text;
  cutoff_date timestamp;
  deleted_count integer;
BEGIN
  -- Apply retention policies
  FOR table_name, retention_period IN SELECT * FROM jsonb_each_text(retention_config) LOOP
    cutoff_date := CURRENT_TIMESTAMP - retention_period::interval;

    CASE table_name
      WHEN 'audit_logs' THEN
        DELETE FROM audit_logs WHERE created_at < cutoff_date;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;

      WHEN 'auth_attempts' THEN
        DELETE FROM auth_attempts WHERE created_at < cutoff_date;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;

      WHEN 'auth_events' THEN
        DELETE FROM auth_events WHERE created_at < cutoff_date;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;

      WHEN 'quickbooks_syncs' THEN
        DELETE FROM quickbooks_syncs WHERE created_at < cutoff_date;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;

      WHEN 'documents_archived' THEN
        UPDATE documents
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE is_archived = true
          AND archive_date < cutoff_date
          AND deleted_at IS NULL;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;

      WHEN 'task_queue_items_completed' THEN
        DELETE FROM task_queue_items
        WHERE status IN ('completed', 'failed', 'cancelled')
          AND created_at < cutoff_date;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
    END CASE;

    -- Log retention action
    INSERT INTO audit_logs (
      action,
      entity_type,
      organization_id,
      metadata
    ) VALUES (
      'data_retention_applied',
      table_name,
      'system',
      jsonb_build_object(
        'retention_period', retention_period,
        'cutoff_date', cutoff_date,
        'records_affected', deleted_count
      )
    );

    RAISE NOTICE 'Applied retention policy to %: % records affected', table_name, deleted_count;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GDPR COMPLIANCE FUNCTIONS
-- ============================================================================

-- Function to export all data for a specific user (GDPR Article 15)
CREATE OR REPLACE FUNCTION export_user_data(target_user_id text)
RETURNS jsonb AS $$
DECLARE
  user_data jsonb := '{}';
  org_id text;
BEGIN
  -- Get user's organization
  SELECT organization_id INTO org_id FROM users WHERE id = target_user_id;

  IF org_id IS NULL THEN
    RAISE EXCEPTION 'User not found: %', target_user_id;
  END IF;

  -- Set organization context for RLS
  PERFORM set_config('app.current_organization_id', org_id, true);
  PERFORM set_config('app.current_user_id', target_user_id, true);

  -- Collect user data from all relevant tables
  user_data := jsonb_build_object(
    'user', (SELECT row_to_json(u) FROM users u WHERE id = target_user_id),
    'team_member', (SELECT row_to_json(tm) FROM team_members tm WHERE user_id = target_user_id),
    'uploaded_documents', (
      SELECT jsonb_agg(row_to_json(d))
      FROM documents d
      WHERE uploaded_by = target_user_id
    ),
    'assigned_tasks', (
      SELECT jsonb_agg(row_to_json(t))
      FROM tasks t
      WHERE assigned_to_id = target_user_id
    ),
    'created_tasks', (
      SELECT jsonb_agg(row_to_json(t))
      FROM tasks t
      WHERE created_by_id = target_user_id
    ),
    'notes', (
      SELECT jsonb_agg(row_to_json(n))
      FROM notes n
      WHERE author_id = target_user_id
    ),
    'audit_logs', (
      SELECT jsonb_agg(row_to_json(al))
      FROM audit_logs al
      WHERE user_id = target_user_id
      ORDER BY created_at DESC
      LIMIT 1000  -- Limit to recent entries
    )
  );

  -- Log the data export
  INSERT INTO audit_logs (
    action,
    entity_type,
    entity_id,
    organization_id,
    user_id,
    metadata
  ) VALUES (
    'gdpr_data_export',
    'user',
    target_user_id,
    org_id,
    target_user_id,
    jsonb_build_object(
      'export_timestamp', CURRENT_TIMESTAMP,
      'data_size_bytes', length(user_data::text)
    )
  );

  RETURN user_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to anonymize user data (GDPR Article 17 - Right to be forgotten)
CREATE OR REPLACE FUNCTION anonymize_user_data(target_user_id text)
RETURNS jsonb AS $$
DECLARE
  org_id text;
  anonymized_data jsonb;
  anonymized_email text;
BEGIN
  -- Get user's organization
  SELECT organization_id INTO org_id FROM users WHERE id = target_user_id;

  IF org_id IS NULL THEN
    RAISE EXCEPTION 'User not found: %', target_user_id;
  END IF;

  -- Generate anonymized email
  anonymized_email := 'anonymized-' || substr(md5(target_user_id), 1, 8) || '@deleted.local';

  -- Anonymize user record
  UPDATE users SET
    email = anonymized_email,
    name = 'Anonymized User',
    password = '[ANONYMIZED]',
    deleted_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = target_user_id;

  -- Anonymize team member record
  UPDATE team_members SET
    deleted_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id = target_user_id;

  -- Remove personal data from notes
  UPDATE notes SET
    content = '[Content removed - user anonymized]',
    updated_at = CURRENT_TIMESTAMP
  WHERE author_id = target_user_id;

  -- Remove personal identifiers from audit logs
  UPDATE audit_logs SET
    user_id = NULL,
    ip_address = NULL,
    user_agent = NULL,
    session_id = NULL
  WHERE user_id = target_user_id;

  -- Update document records to remove personal association
  UPDATE documents SET
    uploaded_by = 'anonymized-user'
  WHERE uploaded_by = target_user_id;

  anonymized_data := jsonb_build_object(
    'user_id', target_user_id,
    'anonymized_at', CURRENT_TIMESTAMP,
    'anonymized_email', anonymized_email
  );

  -- Log the anonymization
  INSERT INTO audit_logs (
    action,
    entity_type,
    entity_id,
    organization_id,
    metadata
  ) VALUES (
    'gdpr_data_anonymization',
    'user',
    target_user_id,
    org_id,
    anonymized_data
  );

  RETURN anonymized_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECURITY MONITORING FUNCTIONS
-- ============================================================================

-- Function to detect suspicious activity
CREATE OR REPLACE FUNCTION detect_suspicious_activity()
RETURNS TABLE(
  alert_type text,
  severity text,
  description text,
  affected_entity text,
  event_count bigint,
  time_window text
) AS $$
BEGIN
  -- Multiple failed login attempts
  RETURN QUERY
  SELECT
    'failed_login_attempts'::text,
    'high'::text,
    'Multiple failed login attempts detected'::text,
    email::text,
    count(*)::bigint,
    '1 hour'::text
  FROM auth_attempts
  WHERE success = false
    AND created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
  GROUP BY email
  HAVING count(*) >= 5;

  -- Unusual access patterns
  RETURN QUERY
  SELECT
    'unusual_access_pattern'::text,
    'medium'::text,
    'User accessing from multiple IP addresses'::text,
    user_id::text,
    count(DISTINCT ip_address)::bigint,
    '24 hours'::text
  FROM auth_events
  WHERE event_type = 'login'
    AND success = true
    AND created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
    AND user_id IS NOT NULL
  GROUP BY user_id
  HAVING count(DISTINCT ip_address) >= 5;

  -- Bulk data access
  RETURN QUERY
  SELECT
    'bulk_data_access'::text,
    'medium'::text,
    'High volume of document access detected'::text,
    organization_id::text,
    count(*)::bigint,
    '1 hour'::text
  FROM audit_logs
  WHERE action = 'SELECT'
    AND entity_type = 'documents'
    AND created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
  GROUP BY organization_id, user_id
  HAVING count(*) >= 100;

  -- Privilege escalation attempts
  RETURN QUERY
  SELECT
    'privilege_escalation'::text,
    'critical'::text,
    'Potential privilege escalation detected'::text,
    entity_id::text,
    count(*)::bigint,
    '24 hours'::text
  FROM audit_logs
  WHERE entity_type = 'team_member_permissions'
    AND action IN ('INSERT', 'UPDATE')
    AND created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
  GROUP BY entity_id
  HAVING count(*) >= 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- BACKUP AND RECOVERY SECURITY
-- ============================================================================

-- Function to verify backup integrity
CREATE OR REPLACE FUNCTION verify_backup_integrity(backup_checksum text)
RETURNS jsonb AS $$
DECLARE
  current_checksum text;
  verification_result jsonb;
BEGIN
  -- Calculate current database checksum (simplified version)
  SELECT md5(string_agg(t.table_checksum, '' ORDER BY t.table_name))
  INTO current_checksum
  FROM (
    SELECT
      table_name,
      md5(string_agg(column_data, '' ORDER BY column_name)) as table_checksum
    FROM (
      SELECT
        table_name,
        column_name,
        md5(string_agg(coalesce(column_value, 'NULL'), '' ORDER BY column_value)) as column_data
      FROM information_schema.columns c
      WHERE table_schema = 'public'
        AND table_name IN (
          'organizations', 'users', 'clients', 'documents',
          'engagements', 'tasks', 'invoices'
        )
      GROUP BY table_name, column_name
    ) cols
    GROUP BY table_name
  ) t;

  verification_result := jsonb_build_object(
    'backup_checksum', backup_checksum,
    'current_checksum', current_checksum,
    'integrity_verified', backup_checksum = current_checksum,
    'verification_timestamp', CURRENT_TIMESTAMP
  );

  -- Log verification attempt
  INSERT INTO audit_logs (
    action,
    entity_type,
    organization_id,
    metadata
  ) VALUES (
    'backup_integrity_verification',
    'database',
    'system',
    verification_result
  );

  RETURN verification_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMPLIANCE REPORTING
-- ============================================================================

-- Function to generate compliance report
CREATE OR REPLACE FUNCTION generate_compliance_report(org_id text, report_date date DEFAULT CURRENT_DATE)
RETURNS jsonb AS $$
DECLARE
  report jsonb;
BEGIN
  -- Set organization context
  PERFORM set_config('app.current_organization_id', org_id, true);

  report := jsonb_build_object(
    'organization_id', org_id,
    'report_date', report_date,
    'audit_summary', (
      SELECT jsonb_build_object(
        'total_audit_entries', count(*),
        'entries_last_30_days', count(*) FILTER (WHERE created_at > CURRENT_DATE - INTERVAL '30 days'),
        'critical_actions', count(*) FILTER (WHERE action IN ('DELETE', 'anonymize_user_data')),
        'data_exports', count(*) FILTER (WHERE action = 'gdpr_data_export')
      )
      FROM audit_logs
      WHERE organization_id = org_id
        AND created_at >= report_date - INTERVAL '1 year'
    ),
    'user_access_summary', (
      SELECT jsonb_build_object(
        'total_users', count(*),
        'active_users', count(*) FILTER (WHERE is_active = true AND deleted_at IS NULL),
        'admin_users', count(*) FILTER (WHERE role IN ('owner', 'admin')),
        'last_login_summary', jsonb_build_object(
          'users_logged_in_last_30_days', count(*) FILTER (WHERE last_login_at > CURRENT_DATE - INTERVAL '30 days'),
          'users_never_logged_in', count(*) FILTER (WHERE last_login_at IS NULL)
        )
      )
      FROM users
      WHERE organization_id = org_id
    ),
    'data_protection_summary', (
      SELECT jsonb_build_object(
        'total_documents', count(*),
        'confidential_documents', count(*) FILTER (WHERE is_confidential = true),
        'encrypted_documents', count(*) FILTER (WHERE encryption_key IS NOT NULL),
        'documents_with_retention', count(*) FILTER (WHERE retention_date IS NOT NULL)
      )
      FROM documents
      WHERE organization_id = org_id
        AND deleted_at IS NULL
    ),
    'security_events', (
      SELECT jsonb_build_object(
        'failed_login_attempts', count(*) FILTER (WHERE success = false),
        'successful_logins', count(*) FILTER (WHERE success = true),
        'password_changes', count(*) FILTER (WHERE event_type = 'password_change'),
        'account_lockouts', count(*) FILTER (WHERE event_type = 'account_locked')
      )
      FROM auth_attempts aa
      JOIN users u ON aa.user_id = u.id
      WHERE u.organization_id = org_id
        AND aa.created_at >= report_date - INTERVAL '1 year'
    )
  );

  -- Log report generation
  INSERT INTO audit_logs (
    action,
    entity_type,
    organization_id,
    metadata
  ) VALUES (
    'compliance_report_generated',
    'organization',
    org_id,
    jsonb_build_object(
      'report_date', report_date,
      'generated_at', CURRENT_TIMESTAMP,
      'report_size_bytes', length(report::text)
    )
  );

  RETURN report;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECURITY CONFIGURATION VALIDATION
-- ============================================================================

-- Function to validate security configuration
CREATE OR REPLACE FUNCTION validate_security_configuration()
RETURNS TABLE(
  check_name text,
  status text,
  description text,
  recommendation text
) AS $$
BEGIN
  -- Check if RLS is enabled on critical tables
  RETURN QUERY
  SELECT
    'rls_enabled'::text,
    CASE WHEN count(*) = 0 THEN 'FAIL' ELSE 'PASS' END::text,
    'Row Level Security enabled on critical tables'::text,
    CASE WHEN count(*) = 0 THEN 'Enable RLS on all tenant-scoped tables' ELSE 'No action needed' END::text
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND c.relname IN ('users', 'clients', 'documents', 'engagements')
    AND c.relrowsecurity = false;

  -- Check for audit triggers
  RETURN QUERY
  SELECT
    'audit_triggers'::text,
    CASE WHEN count(*) >= 4 THEN 'PASS' ELSE 'FAIL' END::text,
    'Audit triggers configured on sensitive tables'::text,
    CASE WHEN count(*) >= 4 THEN 'No action needed' ELSE 'Configure audit triggers on all sensitive tables' END::text
  FROM pg_trigger
  WHERE tgname LIKE 'audit_%';

  -- Check for encrypted connections
  RETURN QUERY
  SELECT
    'ssl_connections'::text,
    CASE WHEN current_setting('ssl') = 'on' THEN 'PASS' ELSE 'FAIL' END::text,
    'SSL connections enforced'::text,
    CASE WHEN current_setting('ssl') = 'on' THEN 'No action needed' ELSE 'Enable SSL connections' END::text;

  -- Check password encryption
  RETURN QUERY
  SELECT
    'password_encryption'::text,
    CASE WHEN current_setting('password_encryption') = 'scram-sha-256' THEN 'PASS' ELSE 'WARN' END::text,
    'Strong password encryption enabled'::text,
    CASE WHEN current_setting('password_encryption') = 'scram-sha-256' THEN 'No action needed' ELSE 'Consider upgrading to SCRAM-SHA-256' END::text;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMPLETION AND VERIFICATION
-- ============================================================================

-- Verify security enhancements
DO $$
DECLARE
  rls_enabled_count integer;
  audit_triggers_count integer;
BEGIN
  SELECT count(*) INTO rls_enabled_count
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND c.relrowsecurity = true;

  SELECT count(*) INTO audit_triggers_count
  FROM pg_trigger
  WHERE tgname LIKE 'audit_%';

  RAISE NOTICE 'Security enhancement complete. RLS enabled on % tables, % audit triggers configured',
    rls_enabled_count, audit_triggers_count;
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
  'security_enhancement',
  'database',
  'system',
  jsonb_build_object(
    'migration', 'security_enhancements',
    'rls_enabled_tables', (
      SELECT count(*)
      FROM pg_class c
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = 'public' AND c.relrowsecurity = true
    ),
    'audit_triggers_configured', (
      SELECT count(*)
      FROM pg_trigger
      WHERE tgname LIKE 'audit_%'
    ),
    'enhancement_date', CURRENT_TIMESTAMP
  ),
  CURRENT_TIMESTAMP
);
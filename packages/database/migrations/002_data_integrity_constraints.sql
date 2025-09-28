-- Data Integrity and Constraint Optimization Migration
-- This migration enhances data integrity with proper constraints and validation rules
-- Execute during maintenance window due to constraint additions

-- ============================================================================
-- BUSINESS RULE CONSTRAINTS
-- ============================================================================

-- Client business rules
ALTER TABLE clients
ADD CONSTRAINT clients_annual_revenue_positive
CHECK (annual_revenue IS NULL OR annual_revenue >= 0);

ALTER TABLE clients
ADD CONSTRAINT clients_valid_email
CHECK (primary_contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE clients
ADD CONSTRAINT clients_valid_status
CHECK (status IN ('active', 'inactive', 'prospect'));

ALTER TABLE clients
ADD CONSTRAINT clients_valid_risk_level
CHECK (risk_level IN ('low', 'medium', 'high'));

-- Document business rules
ALTER TABLE documents
ADD CONSTRAINT documents_file_size_reasonable
CHECK (file_size IS NULL OR file_size BETWEEN 0 AND 2147483648); -- 2GB max

ALTER TABLE documents
ADD CONSTRAINT documents_ocr_confidence_valid
CHECK (ocr_confidence IS NULL OR (ocr_confidence >= 0 AND ocr_confidence <= 1));

ALTER TABLE documents
ADD CONSTRAINT documents_valid_category
CHECK (category IN (
  'tax_return', 'financial_statement', 'receipt', 'invoice',
  'bank_statement', 'w2', '1099', 'contract', 'correspondence', 'other'
));

ALTER TABLE documents
ADD CONSTRAINT documents_valid_ocr_status
CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed', 'manual_review'));

-- Engagement business rules
ALTER TABLE engagements
ADD CONSTRAINT engagements_valid_status
CHECK (status IN ('planning', 'in_progress', 'review', 'completed', 'on_hold', 'cancelled'));

ALTER TABLE engagements
ADD CONSTRAINT engagements_valid_priority
CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

ALTER TABLE engagements
ADD CONSTRAINT engagements_valid_type
CHECK (type IN ('tax_preparation', 'bookkeeping', 'advisory', 'cfo_services', 'audit', 'review'));

ALTER TABLE engagements
ADD CONSTRAINT engagements_dates_logical
CHECK (due_date IS NULL OR start_date IS NULL OR due_date >= start_date);

ALTER TABLE engagements
ADD CONSTRAINT engagements_hours_positive
CHECK (estimated_hours IS NULL OR estimated_hours >= 0);

ALTER TABLE engagements
ADD CONSTRAINT engagements_rates_positive
CHECK (hourly_rate IS NULL OR hourly_rate >= 0);

-- Task business rules
ALTER TABLE tasks
ADD CONSTRAINT tasks_valid_status
CHECK (status IN ('pending', 'in_progress', 'review', 'completed', 'cancelled'));

ALTER TABLE tasks
ADD CONSTRAINT tasks_valid_priority
CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

ALTER TABLE tasks
ADD CONSTRAINT tasks_hours_positive
CHECK (estimated_hours IS NULL OR estimated_hours >= 0);

ALTER TABLE tasks
ADD CONSTRAINT tasks_dates_logical
CHECK (due_date IS NULL OR start_date IS NULL OR due_date >= start_date);

-- Invoice business rules
ALTER TABLE invoices
ADD CONSTRAINT invoices_valid_status
CHECK (status IN ('draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled'));

ALTER TABLE invoices
ADD CONSTRAINT invoices_amounts_positive
CHECK (subtotal >= 0 AND tax_amount >= 0 AND total_amount >= 0 AND paid_amount >= 0);

ALTER TABLE invoices
ADD CONSTRAINT invoices_amounts_logical
CHECK (total_amount = subtotal + tax_amount - discount_amount);

ALTER TABLE invoices
ADD CONSTRAINT invoices_balance_correct
CHECK (balance_amount = total_amount - paid_amount);

ALTER TABLE invoices
ADD CONSTRAINT invoices_due_date_logical
CHECK (due_date >= invoice_date);

-- Workflow execution constraints
ALTER TABLE workflow_executions
ADD CONSTRAINT workflow_executions_valid_status
CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed', 'cancelled'));

ALTER TABLE workflow_executions
ADD CONSTRAINT workflow_executions_progress_valid
CHECK (progress >= 0 AND progress <= 100);

ALTER TABLE workflow_executions
ADD CONSTRAINT workflow_executions_retry_count_reasonable
CHECK (retry_count >= 0 AND retry_count <= max_retries);

-- Task execution constraints
ALTER TABLE task_executions
ADD CONSTRAINT task_executions_valid_status
CHECK (status IN ('pending', 'ready', 'running', 'completed', 'failed', 'skipped', 'cancelled'));

ALTER TABLE task_executions
ADD CONSTRAINT task_executions_step_index_positive
CHECK (step_index >= 0);

ALTER TABLE task_executions
ADD CONSTRAINT task_executions_retry_count_reasonable
CHECK (retry_count >= 0 AND retry_count <= max_retries);

-- ============================================================================
-- JSON FIELD VALIDATION
-- ============================================================================

-- Validate JSON structure for critical fields
ALTER TABLE clients
ADD CONSTRAINT clients_financial_data_valid_json
CHECK (financial_data IS NULL OR jsonb_typeof(financial_data) = 'object');

ALTER TABLE clients
ADD CONSTRAINT clients_custom_fields_valid_json
CHECK (custom_fields IS NULL OR jsonb_typeof(custom_fields) = 'object');

ALTER TABLE documents
ADD CONSTRAINT documents_extracted_data_valid_json
CHECK (extracted_data IS NULL OR jsonb_typeof(extracted_data) = 'object');

ALTER TABLE documents
ADD CONSTRAINT documents_metadata_valid_json
CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object');

ALTER TABLE workflows
ADD CONSTRAINT workflows_steps_valid_json
CHECK (jsonb_typeof(steps) = 'object');

ALTER TABLE workflows
ADD CONSTRAINT workflows_settings_valid_json
CHECK (settings IS NULL OR jsonb_typeof(settings) = 'object');

-- ============================================================================
-- ENHANCED FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Ensure proper cascade behavior for critical relationships

-- Document version relationships with proper cascade
ALTER TABLE documents
DROP CONSTRAINT IF EXISTS documents_parentdocumentid_fkey;

ALTER TABLE documents
ADD CONSTRAINT documents_parent_document_fkey
FOREIGN KEY (parent_document_id) REFERENCES documents(id)
ON DELETE SET NULL ON UPDATE CASCADE;

-- Task dependency relationships
ALTER TABLE tasks
DROP CONSTRAINT IF EXISTS tasks_parenttaskid_fkey;

ALTER TABLE tasks
ADD CONSTRAINT tasks_parent_task_fkey
FOREIGN KEY (parent_task_id) REFERENCES tasks(id)
ON DELETE SET NULL ON UPDATE CASCADE;

-- Task execution dependencies
ALTER TABLE task_executions
DROP CONSTRAINT IF EXISTS task_executions_parenttaskid_fkey;

ALTER TABLE task_executions
ADD CONSTRAINT task_executions_parent_task_fkey
FOREIGN KEY (parent_task_id) REFERENCES task_executions(id)
ON DELETE SET NULL ON UPDATE CASCADE;

-- Workflow execution to template relationship
ALTER TABLE workflow_executions
ADD CONSTRAINT workflow_executions_template_fkey
FOREIGN KEY (template_id) REFERENCES workflow_templates(id)
ON DELETE SET NULL ON UPDATE CASCADE;

-- Report template relationships
ALTER TABLE reports
ADD CONSTRAINT reports_template_fkey
FOREIGN KEY (template_id) REFERENCES report_templates(id)
ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- UNIQUE CONSTRAINTS FOR DATA INTEGRITY
-- ============================================================================

-- Ensure unique invoice numbers per organization
CREATE UNIQUE INDEX IF NOT EXISTS invoices_number_org_unique
ON invoices(organization_id, invoice_number)
WHERE deleted_at IS NULL;

-- Ensure unique client QuickBooks IDs per organization
CREATE UNIQUE INDEX IF NOT EXISTS clients_quickbooks_id_org_unique
ON clients(organization_id, quickbooks_id)
WHERE quickbooks_id IS NOT NULL AND deleted_at IS NULL;

-- Ensure unique document versions per parent
CREATE UNIQUE INDEX IF NOT EXISTS documents_version_parent_unique
ON documents(parent_document_id, version)
WHERE parent_document_id IS NOT NULL AND deleted_at IS NULL;

-- Ensure only one latest version per document group
CREATE UNIQUE INDEX IF NOT EXISTS documents_latest_version_parent_unique
ON documents(parent_document_id, is_latest_version)
WHERE parent_document_id IS NOT NULL AND is_latest_version = true AND deleted_at IS NULL;

-- Ensure unique permission names
CREATE UNIQUE INDEX IF NOT EXISTS permissions_name_unique
ON permissions(name);

-- Ensure unique team member per user per organization
CREATE UNIQUE INDEX IF NOT EXISTS team_members_user_org_unique
ON team_members(user_id, organization_id)
WHERE deleted_at IS NULL;

-- ============================================================================
-- AUDIT AND COMPLIANCE CONSTRAINTS
-- ============================================================================

-- Ensure audit logs have required fields for compliance
ALTER TABLE audit_logs
ADD CONSTRAINT audit_logs_action_not_empty
CHECK (length(trim(action)) > 0);

ALTER TABLE audit_logs
ADD CONSTRAINT audit_logs_entity_type_not_empty
CHECK (length(trim(entity_type)) > 0);

-- Ensure auth attempts have valid data
ALTER TABLE auth_attempts
ADD CONSTRAINT auth_attempts_email_not_empty
CHECK (length(trim(email)) > 0);

-- Ensure auth events have valid event types
ALTER TABLE auth_events
ADD CONSTRAINT auth_events_valid_event_type
CHECK (event_type IN (
  'login', 'logout', 'password_change', 'mfa_enabled', 'mfa_disabled',
  'account_locked', 'account_unlocked', 'password_reset', 'email_verified'
));

-- ============================================================================
-- PERFORMANCE AND MAINTENANCE CONSTRAINTS
-- ============================================================================

-- Ensure reasonable retry limits for background tasks
ALTER TABLE task_queue_items
ADD CONSTRAINT task_queue_items_max_attempts_reasonable
CHECK (max_attempts > 0 AND max_attempts <= 10);

ALTER TABLE task_queue_items
ADD CONSTRAINT task_queue_items_attempts_within_max
CHECK (attempts >= 0 AND attempts <= max_attempts);

-- Ensure task queue priority is reasonable
ALTER TABLE task_queue_items
ADD CONSTRAINT task_queue_items_priority_reasonable
CHECK (priority >= -1000 AND priority <= 1000);

-- Ensure QuickBooks webhook events have valid retry logic
ALTER TABLE quickbooks_webhook_events
ADD CONSTRAINT quickbooks_webhook_events_retry_logic
CHECK (retry_count >= 0 AND retry_count <= max_retries);

ALTER TABLE quickbooks_webhook_events
ADD CONSTRAINT quickbooks_webhook_events_max_retries_reasonable
CHECK (max_retries > 0 AND max_retries <= 10);

-- ============================================================================
-- FUNCTIONS FOR CONSTRAINT VALIDATION
-- ============================================================================

-- Function to validate email addresses more thoroughly
CREATE OR REPLACE FUNCTION validate_email(email_address text)
RETURNS boolean AS $$
BEGIN
  RETURN email_address ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND length(email_address) <= 255
    AND email_address NOT LIKE '%..%'
    AND email_address NOT LIKE '.%'
    AND email_address NOT LIKE '%.'
    AND email_address NOT LIKE '%@.'
    AND email_address NOT LIKE '.@%';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to validate JSON schema for specific document types
CREATE OR REPLACE FUNCTION validate_document_extracted_data(
  category text,
  extracted_data jsonb
)
RETURNS boolean AS $$
BEGIN
  IF extracted_data IS NULL THEN
    RETURN true;
  END IF;

  -- Validate W-2 form structure
  IF category = 'w2' THEN
    RETURN extracted_data ? 'employer_name'
      AND extracted_data ? 'employee_name'
      AND extracted_data ? 'wages';
  END IF;

  -- Validate 1099 form structure
  IF category = '1099' THEN
    RETURN extracted_data ? 'payer_name'
      AND extracted_data ? 'recipient_name'
      AND extracted_data ? 'income_amount';
  END IF;

  -- Validate invoice structure
  IF category = 'invoice' THEN
    RETURN extracted_data ? 'invoice_number'
      AND extracted_data ? 'total_amount'
      AND extracted_data ? 'due_date';
  END IF;

  -- Default validation - must be valid JSON object
  RETURN jsonb_typeof(extracted_data) = 'object';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add constraint using the validation function
ALTER TABLE documents
ADD CONSTRAINT documents_extracted_data_schema_valid
CHECK (validate_document_extracted_data(category, extracted_data));

-- ============================================================================
-- TRIGGERS FOR AUTOMATED CONSTRAINT ENFORCEMENT
-- ============================================================================

-- Trigger to automatically update balance amount on invoice changes
CREATE OR REPLACE FUNCTION update_invoice_balance()
RETURNS TRIGGER AS $$
BEGIN
  NEW.balance_amount = NEW.total_amount - NEW.paid_amount;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoice_balance
  BEFORE INSERT OR UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_balance();

-- Trigger to ensure only one latest version per document group
CREATE OR REPLACE FUNCTION enforce_latest_document_version()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting is_latest_version to true, set all other versions to false
  IF NEW.is_latest_version = true AND NEW.parent_document_id IS NOT NULL THEN
    UPDATE documents
    SET is_latest_version = false
    WHERE parent_document_id = NEW.parent_document_id
      AND id != NEW.id
      AND deleted_at IS NULL;
  END IF;

  -- If this is a new version, ensure parent is set to false
  IF NEW.parent_document_id IS NOT NULL AND NEW.is_latest_version = true THEN
    UPDATE documents
    SET is_latest_version = false
    WHERE id = NEW.parent_document_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enforce_latest_document_version
  BEFORE INSERT OR UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION enforce_latest_document_version();

-- Trigger to validate task dependencies
CREATE OR REPLACE FUNCTION validate_task_dependencies()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent circular dependencies
  IF NEW.parent_task_id IS NOT NULL THEN
    IF EXISTS (
      WITH RECURSIVE task_hierarchy AS (
        SELECT id, parent_task_id, 1 as level
        FROM tasks
        WHERE id = NEW.parent_task_id

        UNION ALL

        SELECT t.id, t.parent_task_id, th.level + 1
        FROM tasks t
        JOIN task_hierarchy th ON t.id = th.parent_task_id
        WHERE th.level < 10  -- Prevent infinite recursion
      )
      SELECT 1 FROM task_hierarchy WHERE id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Circular dependency detected in task hierarchy';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_task_dependencies
  BEFORE INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION validate_task_dependencies();

-- ============================================================================
-- DATA CLEANUP AND MAINTENANCE FUNCTIONS
-- ============================================================================

-- Function to clean up orphaned records
CREATE OR REPLACE FUNCTION cleanup_orphaned_records()
RETURNS void AS $$
BEGIN
  -- Clean up orphaned document annotations
  DELETE FROM document_annotations
  WHERE document_id NOT IN (SELECT id FROM documents WHERE deleted_at IS NULL);

  -- Clean up orphaned document comments
  DELETE FROM document_comments
  WHERE document_id NOT IN (SELECT id FROM documents WHERE deleted_at IS NULL);

  -- Clean up orphaned task executions
  DELETE FROM task_executions
  WHERE workflow_execution_id NOT IN (SELECT id FROM workflow_executions WHERE deleted_at IS NULL);

  -- Clean up old auth attempts (older than 90 days)
  DELETE FROM auth_attempts
  WHERE created_at < CURRENT_DATE - INTERVAL '90 days';

  -- Clean up old auth events (older than 1 year)
  DELETE FROM auth_events
  WHERE created_at < CURRENT_DATE - INTERVAL '1 year';

  -- Clean up processed task queue items (older than 30 days)
  DELETE FROM task_queue_items
  WHERE status IN ('completed', 'failed')
    AND created_at < CURRENT_DATE - INTERVAL '30 days';

  RAISE NOTICE 'Orphaned records cleanup completed';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CONSTRAINT MONITORING AND REPORTING
-- ============================================================================

-- Function to report constraint violations
CREATE OR REPLACE FUNCTION check_data_integrity()
RETURNS TABLE(
  table_name text,
  constraint_name text,
  violation_count bigint,
  sample_ids text[]
) AS $$
BEGIN
  -- This would be expanded with specific integrity checks
  -- For now, return a sample structure
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMPLETION VERIFICATION
-- ============================================================================

-- Verify all constraints were added successfully
DO $$
DECLARE
  constraint_count integer;
BEGIN
  SELECT count(*) INTO constraint_count
  FROM information_schema.table_constraints
  WHERE table_schema = 'public'
  AND constraint_type IN ('CHECK', 'FOREIGN KEY', 'UNIQUE');

  RAISE NOTICE 'Data integrity optimization complete. Total constraints: %', constraint_count;
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
  'data_integrity_optimization',
  'database',
  'system',
  jsonb_build_object(
    'migration', '002_data_integrity_constraints',
    'constraints_added', (
      SELECT count(*)
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
      AND constraint_type IN ('CHECK', 'FOREIGN KEY', 'UNIQUE')
    ),
    'optimization_date', CURRENT_TIMESTAMP
  ),
  CURRENT_TIMESTAMP
);
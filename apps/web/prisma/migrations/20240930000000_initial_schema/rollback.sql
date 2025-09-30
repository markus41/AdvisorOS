-- Rollback Script for Initial Schema Migration
-- Generated: 2024-09-30
-- Purpose: Safely rollback all tables created in initial migration
-- WARNING: This will DROP ALL TABLES and their data. Use with extreme caution.

-- ============================================================================
-- ROLLBACK ORDER: Reverse of creation order (child tables first)
-- ============================================================================

-- Phase 11: Marketplace & Advisor Models
DROP TABLE IF EXISTS "revenue_shares" CASCADE;
DROP TABLE IF EXISTS "client_satisfaction_metrics" CASCADE;
DROP TABLE IF EXISTS "advisor_marketplace_matches" CASCADE;
DROP TABLE IF EXISTS "service_offerings" CASCADE;
DROP TABLE IF EXISTS "client_portal_access" CASCADE;
DROP TABLE IF EXISTS "advisor_profiles" CASCADE;
DROP TABLE IF EXISTS "engagement_rate_cards" CASCADE;

-- Phase 10: Advanced Workflow Execution
DROP TABLE IF EXISTS "task_queue_items" CASCADE;
DROP TABLE IF EXISTS "task_executions" CASCADE;
DROP TABLE IF EXISTS "workflow_executions" CASCADE;
DROP TABLE IF EXISTS "workflow_templates" CASCADE;

-- Phase 9: QuickBooks Integration
DROP TABLE IF EXISTS "quickbooks_webhook_events" CASCADE;
DROP TABLE IF EXISTS "quickbooks_syncs" CASCADE;
DROP TABLE IF EXISTS "quickbooks_tokens" CASCADE;

-- Phase 8: Team & Permissions
DROP TABLE IF EXISTS "team_member_permissions" CASCADE;
DROP TABLE IF EXISTS "permissions" CASCADE;
DROP TABLE IF EXISTS "team_members" CASCADE;

-- Phase 7: Audit & Security
DROP TABLE IF EXISTS "auth_events" CASCADE;
DROP TABLE IF EXISTS "auth_attempts" CASCADE;
DROP TABLE IF EXISTS "audit_logs" CASCADE;

-- Phase 6: Reporting
DROP TABLE IF EXISTS "report_schedules" CASCADE;
DROP TABLE IF EXISTS "reports" CASCADE;
DROP TABLE IF EXISTS "report_templates" CASCADE;

-- Phase 5: Billing & Invoicing
DROP TABLE IF EXISTS "subscriptions" CASCADE;
DROP TABLE IF EXISTS "invoices" CASCADE;

-- Phase 4: Workflow & Task Management
DROP TABLE IF EXISTS "notes" CASCADE;
DROP TABLE IF EXISTS "tasks" CASCADE;
DROP TABLE IF EXISTS "engagements" CASCADE;
DROP TABLE IF EXISTS "workflows" CASCADE;

-- Phase 3: Document Management
DROP TABLE IF EXISTS "document_shares" CASCADE;
DROP TABLE IF EXISTS "document_comments" CASCADE;
DROP TABLE IF EXISTS "document_annotations" CASCADE;
DROP TABLE IF EXISTS "documents" CASCADE;

-- Phase 2: Core Tenant & User Tables
DROP TABLE IF EXISTS "clients" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "organizations" CASCADE;

-- Phase 1: Extensions (optional - keep if other databases use them)
-- DROP EXTENSION IF EXISTS "citext";
-- DROP EXTENSION IF EXISTS "uuid-ossp";

-- ============================================================================
-- ROLLBACK COMPLETE
-- ============================================================================
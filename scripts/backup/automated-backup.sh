#!/bin/bash

# ================================================================
# AdvisorOS Automated Backup Script
# Enterprise-grade backup solution for production CPA platform
# Supports multiple backup types, encryption, and compliance requirements
# ================================================================

set -euo pipefail

# ================================================================
# Configuration
# ================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="/var/log/advisoros"
BACKUP_DIR="/var/backups/advisoros"
TEMP_DIR="/tmp/advisoros-backup"

# Azure Configuration
RESOURCE_GROUP="advisoros-prod-primary-rg"
STORAGE_ACCOUNT="advisorosprodbackup"
CONTAINER_NAME="database-backups"
KEY_VAULT_NAME="advisoros-prod-kv"

# Database Configuration
DB_SERVER="advisoros-prod-pgserver.postgres.database.azure.com"
DB_NAME="advisoros_prod"
DB_USER="advisoros_backup"

# Backup Configuration
BACKUP_RETENTION_DAYS=90
INCREMENTAL_BACKUP_HOURS=6
FULL_BACKUP_DAYS=7
MAX_PARALLEL_JOBS=4

# Encryption Configuration
ENCRYPTION_KEY_NAME="backup-encryption-key"
GPG_RECIPIENT="backup@advisoros.com"

# Monitoring Configuration
WEBHOOK_URL="${MONITORING_WEBHOOK_URL:-}"
TEAMS_WEBHOOK="${TEAMS_WEBHOOK_URL:-}"

# ================================================================
# Logging Functions
# ================================================================

setup_logging() {
    mkdir -p "$LOG_DIR"
    exec 1> >(tee -a "$LOG_DIR/backup-$(date +%Y%m%d).log")
    exec 2> >(tee -a "$LOG_DIR/backup-$(date +%Y%m%d).error.log" >&2)
}

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2
}

log_warning() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $*"
}

# ================================================================
# Utility Functions
# ================================================================

check_dependencies() {
    local deps=("az" "pg_dump" "pg_basebackup" "gpg" "jq" "curl")

    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            log_error "Required dependency '$dep' is not installed"
            exit 1
        fi
    done

    log "All dependencies verified"
}

authenticate_azure() {
    if ! az account show &> /dev/null; then
        log "Authenticating with Azure using managed identity..."
        az login --identity
    fi

    log "Azure authentication verified"
}

get_db_password() {
    local password
    password=$(az keyvault secret show \
        --vault-name "$KEY_VAULT_NAME" \
        --name "database-backup-password" \
        --query value -o tsv)

    echo "$password"
}

get_encryption_key() {
    local key
    key=$(az keyvault secret show \
        --vault-name "$KEY_VAULT_NAME" \
        --name "$ENCRYPTION_KEY_NAME" \
        --query value -o tsv)

    echo "$key"
}

create_backup_directories() {
    mkdir -p "$BACKUP_DIR"/{full,incremental,logs,archive}
    mkdir -p "$TEMP_DIR"

    log "Backup directories created"
}

# ================================================================
# Database Backup Functions
# ================================================================

backup_database_full() {
    local backup_date=$(date +%Y%m%d_%H%M%S)
    local backup_file="$TEMP_DIR/advisoros_full_backup_$backup_date.sql"
    local compressed_file="$backup_file.gz"
    local encrypted_file="$compressed_file.gpg"

    log "Starting full database backup..."

    # Set database password
    export PGPASSWORD=$(get_db_password)

    # Create full backup with custom format for better compression and parallel restore
    pg_dump \
        --host="$DB_SERVER" \
        --port=5432 \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --format=custom \
        --compress=9 \
        --verbose \
        --file="$backup_file.custom" \
        --exclude-table-data="audit.access_log" \
        --exclude-table-data="analytics.query_performance" \
        --exclude-table-data="analytics.application_metrics"

    # Also create SQL format for easier inspection
    pg_dump \
        --host="$DB_SERVER" \
        --port=5432 \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --format=plain \
        --verbose \
        --file="$backup_file" \
        --exclude-table-data="audit.access_log" \
        --exclude-table-data="analytics.query_performance" \
        --exclude-table-data="analytics.application_metrics"

    unset PGPASSWORD

    # Compress the SQL backup
    gzip "$backup_file"

    # Encrypt both backups
    local encryption_key=$(get_encryption_key)
    echo "$encryption_key" | gpg --batch --yes --passphrase-fd 0 --symmetric --cipher-algo AES256 --output "$encrypted_file" "$compressed_file"
    echo "$encryption_key" | gpg --batch --yes --passphrase-fd 0 --symmetric --cipher-algo AES256 --output "$backup_file.custom.gpg" "$backup_file.custom"

    # Calculate checksums
    sha256sum "$encrypted_file" > "$encrypted_file.sha256"
    sha256sum "$backup_file.custom.gpg" > "$backup_file.custom.gpg.sha256"

    # Upload to Azure Storage
    upload_to_azure_storage "$encrypted_file" "full/"
    upload_to_azure_storage "$encrypted_file.sha256" "full/"
    upload_to_azure_storage "$backup_file.custom.gpg" "full/"
    upload_to_azure_storage "$backup_file.custom.gpg.sha256" "full/"

    # Move to local backup directory
    mv "$encrypted_file" "$encrypted_file.sha256" "$backup_file.custom.gpg" "$backup_file.custom.gpg.sha256" "$BACKUP_DIR/full/"

    # Cleanup temporary files
    rm -f "$compressed_file" "$backup_file.custom"

    # Record backup metadata
    record_backup_metadata "full" "$backup_date" "$(stat -c%s "$BACKUP_DIR/full/$(basename "$encrypted_file")")"

    log "Full database backup completed: $(basename "$encrypted_file")"
}

backup_database_incremental() {
    local backup_date=$(date +%Y%m%d_%H%M%S)
    local backup_file="$TEMP_DIR/advisoros_incremental_backup_$backup_date.sql"
    local compressed_file="$backup_file.gz"
    local encrypted_file="$compressed_file.gpg"

    log "Starting incremental database backup..."

    # Get last backup timestamp
    local last_backup_time=$(get_last_backup_time)

    export PGPASSWORD=$(get_db_password)

    # Create incremental backup using WAL files or timestamp-based approach
    pg_dump \
        --host="$DB_SERVER" \
        --port=5432 \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --format=plain \
        --verbose \
        --file="$backup_file" \
        --where="updated_at >= '$last_backup_time'" \
        --exclude-table-data="audit.access_log" \
        --exclude-table-data="analytics.query_performance"

    unset PGPASSWORD

    # Only proceed if backup file has meaningful content
    if [[ $(wc -l < "$backup_file") -gt 10 ]]; then
        gzip "$backup_file"

        local encryption_key=$(get_encryption_key)
        echo "$encryption_key" | gpg --batch --yes --passphrase-fd 0 --symmetric --cipher-algo AES256 --output "$encrypted_file" "$compressed_file"

        sha256sum "$encrypted_file" > "$encrypted_file.sha256"

        upload_to_azure_storage "$encrypted_file" "incremental/"
        upload_to_azure_storage "$encrypted_file.sha256" "incremental/"

        mv "$encrypted_file" "$encrypted_file.sha256" "$BACKUP_DIR/incremental/"
        rm -f "$compressed_file"

        record_backup_metadata "incremental" "$backup_date" "$(stat -c%s "$BACKUP_DIR/incremental/$(basename "$encrypted_file")")"

        log "Incremental database backup completed: $(basename "$encrypted_file")"
    else
        log "No changes detected since last backup, skipping incremental backup"
        rm -f "$backup_file"
    fi
}

backup_application_data() {
    local backup_date=$(date +%Y%m%d_%H%M%S)
    local backup_file="$TEMP_DIR/advisoros_app_data_$backup_date.tar.gz"
    local encrypted_file="$backup_file.gpg"

    log "Starting application data backup..."

    # Backup application configuration and logs
    tar -czf "$backup_file" \
        --exclude="*.log" \
        --exclude="node_modules" \
        --exclude=".git" \
        --exclude="temp" \
        -C /home/site/wwwroot . || log_warning "Some files may have been skipped"

    # Encrypt the backup
    local encryption_key=$(get_encryption_key)
    echo "$encryption_key" | gpg --batch --yes --passphrase-fd 0 --symmetric --cipher-algo AES256 --output "$encrypted_file" "$backup_file"

    sha256sum "$encrypted_file" > "$encrypted_file.sha256"

    upload_to_azure_storage "$encrypted_file" "application/"
    upload_to_azure_storage "$encrypted_file.sha256" "application/"

    mv "$encrypted_file" "$encrypted_file.sha256" "$BACKUP_DIR/archive/"
    rm -f "$backup_file"

    log "Application data backup completed: $(basename "$encrypted_file")"
}

backup_storage_account() {
    local backup_date=$(date +%Y%m%d_%H%M%S)
    local storage_backup_dir="$TEMP_DIR/storage_backup_$backup_date"

    log "Starting storage account backup..."

    mkdir -p "$storage_backup_dir"

    # Sync all blobs to local directory
    az storage blob download-batch \
        --source "documents" \
        --destination "$storage_backup_dir" \
        --account-name "$STORAGE_ACCOUNT" \
        --auth-mode login

    # Create archive
    local archive_file="$TEMP_DIR/storage_backup_$backup_date.tar.gz"
    tar -czf "$archive_file" -C "$storage_backup_dir" .

    # Encrypt
    local encrypted_file="$archive_file.gpg"
    local encryption_key=$(get_encryption_key)
    echo "$encryption_key" | gpg --batch --yes --passphrase-fd 0 --symmetric --cipher-algo AES256 --output "$encrypted_file" "$archive_file"

    sha256sum "$encrypted_file" > "$encrypted_file.sha256"

    # Upload to backup storage account
    upload_to_azure_storage "$encrypted_file" "storage/"
    upload_to_azure_storage "$encrypted_file.sha256" "storage/"

    mv "$encrypted_file" "$encrypted_file.sha256" "$BACKUP_DIR/archive/"
    rm -rf "$storage_backup_dir" "$archive_file"

    log "Storage account backup completed: $(basename "$encrypted_file")"
}

# ================================================================
# Azure Storage Functions
# ================================================================

upload_to_azure_storage() {
    local file_path="$1"
    local blob_prefix="$2"
    local blob_name="$blob_prefix$(basename "$file_path")"

    log "Uploading $(basename "$file_path") to Azure Storage..."

    az storage blob upload \
        --file "$file_path" \
        --name "$blob_name" \
        --container-name "$CONTAINER_NAME" \
        --account-name "$STORAGE_ACCOUNT" \
        --auth-mode login \
        --overwrite \
        --tier Hot

    # Set metadata
    az storage blob metadata update \
        --name "$blob_name" \
        --container-name "$CONTAINER_NAME" \
        --account-name "$STORAGE_ACCOUNT" \
        --auth-mode login \
        --metadata \
            backup_date="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
            backup_type="automated" \
            retention_days="$BACKUP_RETENTION_DAYS" \
            checksum="$(sha256sum "$file_path" | cut -d' ' -f1)"
}

# ================================================================
# Monitoring and Alerting
# ================================================================

record_backup_metadata() {
    local backup_type="$1"
    local backup_date="$2"
    local file_size="$3"

    local metadata_file="$BACKUP_DIR/logs/backup_metadata.json"

    jq -n \
        --arg type "$backup_type" \
        --arg date "$backup_date" \
        --arg size "$file_size" \
        --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        '{
            backup_type: $type,
            backup_date: $date,
            file_size_bytes: ($size | tonumber),
            timestamp: $timestamp,
            success: true
        }' >> "$metadata_file"
}

get_last_backup_time() {
    local last_time
    last_time=$(jq -r 'select(.backup_type == "incremental" or .backup_type == "full") | .timestamp' "$BACKUP_DIR/logs/backup_metadata.json" 2>/dev/null | tail -1)

    if [[ -z "$last_time" || "$last_time" == "null" ]]; then
        # Default to 6 hours ago if no previous backup found
        date -u -d '6 hours ago' +%Y-%m-%dT%H:%M:%SZ
    else
        echo "$last_time"
    fi
}

send_notification() {
    local status="$1"
    local message="$2"

    if [[ -n "$WEBHOOK_URL" ]]; then
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"status\": \"$status\", \"message\": \"$message\", \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
            || log_warning "Failed to send webhook notification"
    fi

    if [[ -n "$TEAMS_WEBHOOK" ]]; then
        local color
        case "$status" in
            "success") color="00FF00" ;;
            "warning") color="FFA500" ;;
            "error") color="FF0000" ;;
            *) color="0078D4" ;;
        esac

        curl -X POST "$TEAMS_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{
                \"@type\": \"MessageCard\",
                \"@context\": \"http://schema.org/extensions\",
                \"themeColor\": \"$color\",
                \"summary\": \"AdvisorOS Backup $status\",
                \"sections\": [{
                    \"activityTitle\": \"AdvisorOS Backup Notification\",
                    \"activitySubtitle\": \"$(date)\",
                    \"text\": \"$message\",
                    \"facts\": [{
                        \"name\": \"Status\",
                        \"value\": \"$status\"
                    }, {
                        \"name\": \"Environment\",
                        \"value\": \"Production\"
                    }]
                }]
            }" \
            || log_warning "Failed to send Teams notification"
    fi
}

# ================================================================
# Cleanup Functions
# ================================================================

cleanup_old_backups() {
    log "Cleaning up old backups..."

    # Clean local backups older than retention period
    find "$BACKUP_DIR/full" -type f -mtime +$BACKUP_RETENTION_DAYS -delete
    find "$BACKUP_DIR/incremental" -type f -mtime +$BACKUP_RETENTION_DAYS -delete
    find "$BACKUP_DIR/archive" -type f -mtime +$BACKUP_RETENTION_DAYS -delete

    # Clean Azure Storage backups
    local cutoff_date=$(date -u -d "$BACKUP_RETENTION_DAYS days ago" +%Y-%m-%dT%H:%M:%SZ)

    az storage blob list \
        --container-name "$CONTAINER_NAME" \
        --account-name "$STORAGE_ACCOUNT" \
        --auth-mode login \
        --query "[?properties.lastModified < '$cutoff_date'].name" \
        --output tsv | while read -r blob_name; do
            if [[ -n "$blob_name" ]]; then
                log "Deleting old backup: $blob_name"
                az storage blob delete \
                    --name "$blob_name" \
                    --container-name "$CONTAINER_NAME" \
                    --account-name "$STORAGE_ACCOUNT" \
                    --auth-mode login
            fi
        done

    log "Cleanup completed"
}

cleanup_temp_files() {
    rm -rf "$TEMP_DIR"
    log "Temporary files cleaned up"
}

# ================================================================
# Health Checks
# ================================================================

verify_backup_integrity() {
    local backup_file="$1"

    if [[ ! -f "$backup_file" ]]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi

    # Verify checksum
    local checksum_file="$backup_file.sha256"
    if [[ -f "$checksum_file" ]]; then
        if sha256sum -c "$checksum_file"; then
            log "Backup integrity verified: $(basename "$backup_file")"
            return 0
        else
            log_error "Backup integrity check failed: $(basename "$backup_file")"
            return 1
        fi
    else
        log_warning "No checksum file found for: $(basename "$backup_file")"
        return 1
    fi
}

test_backup_restore() {
    log "Testing backup restore capability..."

    # This would be implemented to test restoration to a test database
    # For now, just verify we can decrypt and read the backup
    local latest_backup=$(ls -t "$BACKUP_DIR/full/"*.gpg 2>/dev/null | head -1)

    if [[ -n "$latest_backup" ]]; then
        local test_file="$TEMP_DIR/restore_test.sql"
        local encryption_key=$(get_encryption_key)

        if echo "$encryption_key" | gpg --batch --yes --passphrase-fd 0 --decrypt "$latest_backup" | head -100 > "$test_file"; then
            if grep -q "PostgreSQL database dump" "$test_file"; then
                log "Backup restore test passed"
                rm -f "$test_file"
                return 0
            fi
        fi

        log_error "Backup restore test failed"
        rm -f "$test_file"
        return 1
    else
        log_warning "No backup files found for restore test"
        return 1
    fi
}

# ================================================================
# Main Execution
# ================================================================

main() {
    local backup_type="${1:-full}"

    setup_logging
    log "Starting AdvisorOS backup process - Type: $backup_type"

    # Pre-flight checks
    check_dependencies
    authenticate_azure
    create_backup_directories

    local start_time=$(date +%s)
    local success=true

    case "$backup_type" in
        "full")
            backup_database_full || success=false
            backup_application_data || success=false
            backup_storage_account || success=false
            ;;
        "incremental")
            backup_database_incremental || success=false
            ;;
        "app-only")
            backup_application_data || success=false
            ;;
        "storage-only")
            backup_storage_account || success=false
            ;;
        *)
            log_error "Unknown backup type: $backup_type"
            exit 1
            ;;
    esac

    # Post-backup operations
    if [[ "$success" == true ]]; then
        # Test backup integrity
        test_backup_restore || log_warning "Backup restore test failed"

        # Cleanup old backups (only on successful backup)
        cleanup_old_backups

        local end_time=$(date +%s)
        local duration=$((end_time - start_time))

        local message="✅ AdvisorOS $backup_type backup completed successfully in ${duration}s"
        log "$message"
        send_notification "success" "$message"
    else
        local message="❌ AdvisorOS $backup_type backup failed - check logs for details"
        log_error "$message"
        send_notification "error" "$message"
        exit 1
    fi

    # Always cleanup temp files
    cleanup_temp_files

    log "Backup process completed"
}

# ================================================================
# Signal Handlers
# ================================================================

cleanup_on_exit() {
    log "Cleaning up on exit..."
    cleanup_temp_files
}

trap cleanup_on_exit EXIT
trap 'log_error "Backup interrupted"; exit 1' INT TERM

# ================================================================
# Script Entry Point
# ================================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
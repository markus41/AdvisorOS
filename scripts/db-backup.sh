#!/bin/bash
# Backup CPA Platform Database

set -e

timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
backup_file="backups/cpa_platform_backup_${timestamp}.sql"

echo "Creating database backup..."

# Create backups directory if it doesn't exist
mkdir -p backups

# Create backup
docker-compose exec -T postgres pg_dump -U cpa_user -d cpa_platform > "$backup_file"

echo "Backup created successfully: $backup_file"
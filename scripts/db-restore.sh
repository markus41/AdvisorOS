#!/bin/bash
# Restore CPA Platform Database from backup

set -e

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 [backup_file]"
    echo "Example: $0 backups/cpa_platform_backup_2024-01-15_10-30-00.sql"
    exit 1
fi

backup_file="$1"

if [ ! -f "$backup_file" ]; then
    echo "Error: Backup file '$backup_file' not found"
    exit 1
fi

echo "WARNING: This will replace all data in the database!"
read -p "Are you sure? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "Operation cancelled."
    exit 0
fi

echo "Restoring database from $backup_file..."

# Drop and recreate database
docker-compose exec -T postgres dropdb -U cpa_user --if-exists cpa_platform
docker-compose exec -T postgres createdb -U cpa_user cpa_platform

# Restore from backup
docker-compose exec -T postgres psql -U cpa_user -d cpa_platform < "$backup_file"

echo "Database restored successfully from $backup_file"
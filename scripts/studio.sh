#!/bin/bash
# Start Prisma Studio for database inspection

echo "Starting Prisma Studio..."

# Check if database is running
if ! docker-compose ps postgres | grep -q "Up"; then
    echo "Database is not running. Starting database..."
    docker-compose up -d postgres

    # Wait for PostgreSQL to be ready
    echo "Waiting for PostgreSQL to be ready..."
    while ! docker-compose exec -T postgres pg_isready -U cpa_user -d cpa_platform >/dev/null 2>&1; do
        echo "Waiting for PostgreSQL..."
        sleep 2
    done
fi

npm run db:studio
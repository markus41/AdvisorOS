#!/bin/bash
# Reset CPA Platform Development Environment

set -e

echo "Resetting CPA Platform Development Environment..."

echo "WARNING: This will delete all data in the database!"
read -p "Are you sure? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "Operation cancelled."
    exit 0
fi

# Stop all services
echo "Stopping services..."
docker-compose down

# Remove volumes (this deletes all data)
echo "Removing database volumes..."
docker-compose down -v

# Rebuild and start services
echo "Starting fresh services..."
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
while ! docker-compose exec -T postgres pg_isready -U cpa_user -d cpa_platform >/dev/null 2>&1; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done

echo "PostgreSQL is ready!"

# Run database migrations
echo "Running database migrations..."
npm run db:push

# Seed database with initial data
echo "Seeding database..."
npm run db:seed

echo "Development environment reset complete!"
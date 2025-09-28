#!/bin/bash
# Test database connection and setup

set -e

echo "Testing CPA Platform database connection..."

# Check if Docker is running
if ! docker version >/dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    exit 1
fi
echo "✅ Docker is running"

# Start database if not running
if ! docker-compose ps postgres | grep -q "Up"; then
    echo "Starting database..."
    docker-compose up -d postgres

    echo "Waiting for PostgreSQL to be ready..."
    while ! docker-compose exec -T postgres pg_isready -U cpa_user -d cpa_platform >/dev/null 2>&1; do
        echo "Waiting for PostgreSQL..."
        sleep 2
    done
fi
echo "✅ PostgreSQL is running"

# Test database connection
if docker-compose exec -T postgres psql -U cpa_user -d cpa_platform -c "SELECT version();" >/dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    exit 1
fi

# Check if Prisma client is generated
if [ -d "apps/web/node_modules/.prisma/client" ]; then
    echo "✅ Prisma client is generated"
else
    echo "⚠️  Prisma client not found, generating..."
    npm run db:generate
    echo "✅ Prisma client generated successfully"
fi

# Test DATABASE_URL from .env
if [ -f ".env" ]; then
    echo "✅ .env file found"
else
    echo "⚠️  .env file not found, please create one from .env.example"
    exit 1
fi

echo ""
echo "🎉 All tests passed! Development environment is ready."
echo ""
echo "Available commands:"
echo "  scripts/dev-start.sh     - Start development environment"
echo "  scripts/studio.sh        - Open Prisma Studio"
echo "  scripts/db-connect.sh    - Connect to database via psql"
echo "  scripts/db-backup.sh     - Create database backup"
echo ""
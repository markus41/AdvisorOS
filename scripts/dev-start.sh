#!/bin/bash
# Start CPA Platform Development Environment (Unix/Linux/Mac)

set -e

echo "Starting CPA Platform Development Environment..."

# Check if Docker is running
if ! docker version >/dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start database services
echo "Starting database services..."
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

# Start the development server
echo "Starting Next.js development server..."
npm run dev
#!/bin/bash
# Connect to PostgreSQL database using psql

echo "Connecting to CPA Platform database..."

# Check if database is running
if ! docker-compose ps postgres | grep -q "Up"; then
    echo "Database is not running. Please start it first with: npm run dev:start"
    exit 1
fi

echo "Connected to PostgreSQL. Type \q to exit."
docker-compose exec postgres psql -U cpa_user -d cpa_platform
#!/bin/bash
# Stop CPA Platform Development Environment

echo "Stopping CPA Platform Development Environment..."

# Stop all services
docker-compose down

echo "Development environment stopped."
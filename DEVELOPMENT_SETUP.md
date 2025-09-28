# CPA Platform - Local Development Setup Guide

This guide provides multiple options for setting up your local development environment for the CPA platform.

## Prerequisites

- Node.js 18.17.0 or higher
- npm 10.0.0 or higher
- Git

## Database Setup Options

### Option A: Docker Setup (Recommended)

**Requirements:**
- Docker Desktop for Windows

**Setup:**
1. Install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/)
2. Start Docker Desktop
3. Run the development environment:
   ```bash
   npm run dev:start
   ```

**Benefits:**
- Isolated environment
- Easy to reset and clean up
- Includes Redis for queue management
- Includes pgAdmin for database management

### Option B: Local PostgreSQL Installation

**Requirements:**
- PostgreSQL 15+ installed locally

**Setup:**
1. Download and install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. During installation, remember your postgres user password
3. Create the development database:
   ```sql
   -- Connect to PostgreSQL as postgres user
   psql -U postgres

   -- Create user and database
   CREATE USER cpa_user WITH PASSWORD 'secure_dev_password';
   CREATE DATABASE cpa_platform OWNER cpa_user;
   CREATE DATABASE cpa_platform_test OWNER cpa_user;
   GRANT ALL PRIVILEGES ON DATABASE cpa_platform TO cpa_user;
   GRANT ALL PRIVILEGES ON DATABASE cpa_platform_test TO cpa_user;

   -- Connect to the database and create extensions
   \c cpa_platform
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
   ```

4. Update your `.env` file:
   ```
   DATABASE_URL="postgresql://cpa_user:secure_dev_password@localhost:5432/cpa_platform"
   ```

5. Run database migrations:
   ```bash
   npm run db:push
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

### Option C: Cloud Database Setup

For cloud-based development, you can use services like:

#### Supabase (Recommended for Development)
1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Get your database URL from Settings > Database
4. Update your `.env` file:
   ```
   DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"
   ```

#### Azure Database for PostgreSQL
1. Create Azure Database for PostgreSQL in Azure Portal
2. Configure firewall rules to allow your IP
3. Update your `.env` file with the connection string

#### Railway / Render / Neon
Similar cloud PostgreSQL providers that offer free tiers for development.

## Environment Configuration

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your database connection and other settings.

## Development Commands

### Quick Start
```bash
# Test your environment setup
npm run dev:test

# Start development environment (Docker)
npm run dev:start

# Start development server only (if using local/cloud DB)
npm run dev

# Open Prisma Studio for database inspection
npm run dev:studio
```

### Database Management
```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push

# Run database migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

### Docker Commands (if using Docker)
```bash
# Start database services only
docker-compose up -d postgres redis

# Stop all services
npm run dev:stop

# Reset database (deletes all data)
npm run dev:reset

# Create database backup
npm run dev:backup

# Connect to database via psql
npm run dev:connect
```

## Troubleshooting

### Common Issues

1. **Docker not found**
   - Install Docker Desktop
   - Ensure Docker Desktop is running
   - Add Docker to your PATH

2. **PostgreSQL connection errors**
   - Check if PostgreSQL service is running
   - Verify connection credentials in `.env`
   - Check firewall settings

3. **Prisma client not generated**
   ```bash
   npm run db:generate
   ```

4. **Port conflicts**
   - PostgreSQL: Default port 5432
   - Redis: Default port 6379
   - pgAdmin: Default port 5050
   - Next.js: Default port 3000
   - Prisma Studio: Default port 5555

### Windows-Specific Notes

1. **PowerShell Execution Policy**
   If you encounter script execution errors:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **WSL2 (Windows Subsystem for Linux)**
   For better Docker performance on Windows, consider using WSL2:
   - Install WSL2
   - Use Docker Desktop with WSL2 backend
   - Run development commands from WSL2 terminal

## Development Workflow

1. **Start Development Session:**
   ```bash
   npm run dev:test    # Verify environment
   npm run dev:start   # Start everything
   ```

2. **Database Changes:**
   ```bash
   # Edit schema.prisma
   npm run db:push     # Apply changes
   npm run db:studio   # Inspect changes
   ```

3. **Code Changes:**
   - Edit files in `apps/web/` or `packages/`
   - Hot reload is enabled for Next.js
   - TypeScript will be checked automatically

4. **Testing:**
   ```bash
   npm run test        # Run all tests
   npm run test:watch  # Run tests in watch mode
   ```

## Available Services

When running the full Docker setup:

- **Main Application:** http://localhost:3000
- **Prisma Studio:** http://localhost:5555
- **pgAdmin:** http://localhost:5050
  - Email: admin@cpa-platform.local
  - Password: admin123
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

## Next Steps

1. Set up your preferred database option
2. Run `npm run dev:test` to verify setup
3. Start development with `npm run dev:start`
4. Begin developing features!

For additional help, check the troubleshooting section or create an issue in the repository.
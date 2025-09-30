# AdvisorOS Database Setup Guide

**Status**: Critical - Required for Development
**Priority**: P0 - BLOCKER
**Time Required**: 15-30 minutes

---

## Current Situation

✅ **Completed**:
- `.env` file created with DATABASE_URL placeholder
- Prisma schema ready (38 models, 850+ fields, 180+ indexes)
- Migration files prepared

❌ **Blocked**:
- PostgreSQL not installed/accessible
- Docker not available
- Cannot execute migrations until database is configured

---

## Option 1: Install PostgreSQL Locally (Recommended for Development)

### Windows Installation

**Download & Install**:
```powershell
# Option A: Using Chocolatey (if installed)
choco install postgresql15

# Option B: Manual Download
# Visit: https://www.postgresql.org/download/windows/
# Download: PostgreSQL 15.x installer
# Run installer with default options
```

**Configuration**:
```powershell
# After installation, PostgreSQL should be running on port 5432

# Create development database
psql -U postgres
CREATE DATABASE advisoros_dev;
CREATE USER advisoros WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE advisoros_dev TO advisoros;
\q
```

**Update .env**:
```bash
# Edit C:\Users\MarkusAhling\AdvisorOS\AdvisorOS\.env
DATABASE_URL="postgresql://advisoros:your_secure_password@localhost:5432/advisoros_dev"
```

**Verify Connection**:
```bash
cd C:\Users\MarkusAhling\AdvisorOS\AdvisorOS
npm run dev:test
```

---

## Option 2: Docker Compose (Recommended if Docker available)

### Prerequisites
- Install Docker Desktop for Windows
- Ensure Docker is running

### Start Services
```bash
cd C:\Users\MarkusAhling\AdvisorOS\AdvisorOS

# Start PostgreSQL + Redis + pgAdmin
docker-compose up -d

# Verify containers are running
docker ps

# Expected output:
# - cpa-platform-postgres (port 5432)
# - cpa-platform-redis (port 6379)
# - cpa-platform-pgadmin (port 5050)
```

### Update .env
```bash
# Edit .env - use Docker credentials from docker-compose.yml
DATABASE_URL="postgresql://cpa_user:secure_dev_password@localhost:5432/cpa_platform"
REDIS_URL="redis://localhost:6379"
```

### Access pgAdmin (Optional)
- URL: http://localhost:5050
- Email: admin@cpa-platform.local
- Password: admin123

### Stop Services
```bash
docker-compose down
```

---

## Option 3: Azure PostgreSQL (Production-Like Testing)

### Prerequisites
- Azure account with active subscription
- Azure CLI installed

### Create Azure PostgreSQL
```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "Your-Subscription-Name"

# Create resource group
az group create \
  --name advisoros-dev-rg \
  --location eastus

# Create PostgreSQL Flexible Server
az postgres flexible-server create \
  --resource-group advisoros-dev-rg \
  --name advisoros-dev-db \
  --location eastus \
  --admin-user advisoros \
  --admin-password "YourSecurePassword123!" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 15 \
  --public-access 0.0.0.0 \
  --yes

# Create database
az postgres flexible-server db create \
  --resource-group advisoros-dev-rg \
  --server-name advisoros-dev-db \
  --database-name advisoros_dev
```

### Update .env
```bash
DATABASE_URL="postgresql://advisoros:YourSecurePassword123!@advisoros-dev-db.postgres.database.azure.com:5432/advisoros_dev?sslmode=require"
```

### Firewall Rules
```bash
# Allow your IP
az postgres flexible-server firewall-rule create \
  --resource-group advisoros-dev-rg \
  --name advisoros-dev-db \
  --rule-name AllowMyIP \
  --start-ip-address YOUR_IP \
  --end-ip-address YOUR_IP

# Or allow all IPs (development only, NOT for production)
az postgres flexible-server firewall-rule create \
  --resource-group advisoros-dev-rg \
  --name advisoros-dev-db \
  --rule-name AllowAll \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 255.255.255.255
```

---

## Next Steps After Database Setup

### 1. Test Database Connection
```bash
cd C:\Users\MarkusAhling\AdvisorOS\AdvisorOS
npm run dev:test

# Expected output:
# ✅ Database connection successful
```

### 2. Execute Prisma Migration
```bash
cd apps/web

# Create and apply migration
npx prisma migrate dev --name add_fractional_cfo_marketplace_models

# Expected output:
# ✅ Migration `20250930_add_fractional_cfo_marketplace_models` applied
# ✅ 8 new marketplace tables created
# ✅ 38 total models in database
```

### 3. Generate Prisma Client
```bash
cd apps/web
npx prisma generate

# Expected output:
# ✅ Generated Prisma Client
# ✅ Marketplace types available
```

### 4. Verify Schema
```bash
# Open Prisma Studio to inspect database
cd apps/web
npx prisma studio

# Opens browser at http://localhost:5555
# Verify tables exist:
# - organizations
# - users
# - clients
# - advisor_profiles (NEW)
# - client_portal_access (NEW)
# - engagement_rate_cards (NEW)
# - service_offerings (NEW)
# - advisor_marketplace_matches (NEW)
# - client_satisfaction_metrics (NEW)
# - revenue_shares (NEW)
# - subscriptions (NEW)
# + 27 more existing tables
```

### 5. Seed Development Data (Optional)
```bash
cd apps/web
npm run db:seed

# Seeds:
# - 3 organizations
# - 10 users across organizations
# - 15 clients
# - 5 advisor profiles
# - Sample marketplace data
```

---

## Troubleshooting

### Error: "Connection refused"
**Problem**: PostgreSQL not running or wrong port

**Solution**:
```bash
# Check if PostgreSQL is running (Windows)
sc query postgresql-x64-15

# Start PostgreSQL service
net start postgresql-x64-15

# Or restart Docker container
docker-compose restart postgres
```

### Error: "Authentication failed"
**Problem**: Wrong username/password in DATABASE_URL

**Solution**:
1. Verify credentials match database setup
2. Check .env file for typos
3. Reset PostgreSQL password if needed:
```bash
psql -U postgres
ALTER USER advisoros WITH PASSWORD 'new_password';
```

### Error: "Database does not exist"
**Problem**: Database not created

**Solution**:
```bash
# Connect as superuser
psql -U postgres

# Create database
CREATE DATABASE advisoros_dev;
GRANT ALL PRIVILEGES ON DATABASE advisoros_dev TO advisoros;
```

### Error: "Migration failed"
**Problem**: Schema conflicts or permissions issues

**Solution**:
```bash
# Reset database (CAUTION: Deletes all data)
cd apps/web
npx prisma migrate reset

# Or manually drop and recreate
psql -U postgres
DROP DATABASE IF EXISTS advisoros_dev;
CREATE DATABASE advisoros_dev;
GRANT ALL PRIVILEGES ON DATABASE advisoros_dev TO advisoros;
```

### Error: "Prisma Client not found"
**Problem**: Prisma Client not generated after migration

**Solution**:
```bash
cd apps/web
npx prisma generate
```

---

## Database Connection String Format

### Local PostgreSQL
```
postgresql://[user]:[password]@[host]:[port]/[database]
postgresql://advisoros:password@localhost:5432/advisoros_dev
```

### Docker PostgreSQL
```
postgresql://cpa_user:secure_dev_password@localhost:5432/cpa_platform
```

### Azure PostgreSQL
```
postgresql://[user]:[password]@[server].postgres.database.azure.com:[port]/[database]?sslmode=require
postgresql://advisoros:Password123!@advisoros-dev.postgres.database.azure.com:5432/advisoros_dev?sslmode=require
```

---

## Verification Checklist

After completing setup, verify:

- ✅ PostgreSQL installed and running
- ✅ `.env` file configured with correct DATABASE_URL
- ✅ Database connection test passes (`npm run dev:test`)
- ✅ Migration executed successfully
- ✅ Prisma Client generated
- ✅ Prisma Studio accessible (38 tables visible)
- ✅ Can query database from application

---

## Quick Command Reference

```bash
# Test connection
npm run dev:test

# Run migration
cd apps/web && npx prisma migrate dev

# Generate Prisma Client
cd apps/web && npx prisma generate

# Open Prisma Studio
cd apps/web && npx prisma studio

# Reset database (CAUTION)
cd apps/web && npx prisma migrate reset

# Create new migration
cd apps/web && npx prisma migrate dev --name your_migration_name

# Push schema without migration (dev only)
cd apps/web && npx prisma db push

# View migration status
cd apps/web && npx prisma migrate status
```

---

## Support Resources

**PostgreSQL Installation**:
- Windows: https://www.postgresql.org/download/windows/
- Documentation: https://www.postgresql.org/docs/15/

**Docker Desktop**:
- Windows: https://www.docker.com/products/docker-desktop/

**Azure PostgreSQL**:
- Docs: https://learn.microsoft.com/en-us/azure/postgresql/

**Prisma**:
- Docs: https://www.prisma.io/docs/
- Migrations: https://www.prisma.io/docs/concepts/components/prisma-migrate

---

## Cost Estimates

### Local PostgreSQL
- **Cost**: Free
- **Performance**: Best for development (no network latency)
- **Setup Time**: 15 minutes

### Docker Compose
- **Cost**: Free
- **Performance**: Excellent (local containers)
- **Setup Time**: 10 minutes (if Docker installed)

### Azure PostgreSQL (Burstable B1ms)
- **Cost**: ~$15-20/month
- **Performance**: Production-like testing
- **Setup Time**: 20 minutes
- **Benefits**: Cloud-native, automatic backups, scaling

---

**Next Action**: Choose one option above and complete database setup to unblock development.

**Priority**: P0 - All subsequent work blocked until complete.

**Status**: Ready for execution once database option selected.
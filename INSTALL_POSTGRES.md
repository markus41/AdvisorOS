# 🚀 Quick PostgreSQL Installation for AdvisorOS

**Time Required**: 10-15 minutes
**Difficulty**: Easy (automated)

---

## Option 1: Automated Installation (Recommended)

### Using PowerShell Script

**Step 1**: Open PowerShell as Administrator
```powershell
# Right-click PowerShell icon → "Run as Administrator"
```

**Step 2**: Navigate to project directory
```powershell
cd C:\Users\MarkusAhling\AdvisorOS\AdvisorOS
```

**Step 3**: Run installation script
```powershell
.\scripts\install-postgres-windows.ps1
```

**What this script does**:
- ✅ Installs Chocolatey (if needed)
- ✅ Installs PostgreSQL 15
- ✅ Creates `advisoros_dev` database
- ✅ Creates `advisoros` user with password
- ✅ Configures permissions
- ✅ Updates `.env` file automatically
- ✅ Tests database connection
- ✅ Adds PostgreSQL to system PATH

**Expected Output**:
```
=== AdvisorOS PostgreSQL Setup ===
Checking for Chocolatey package manager...
Installing PostgreSQL 15...
PostgreSQL 15 installed successfully!
PostgreSQL service is running
Database configured successfully!
.env file updated with database connection string
✅ Database connection successful!

=== Installation Complete ===
Database Configuration:
  Host:     localhost
  Port:     5432
  Database: advisoros_dev
  User:     advisoros
  Password: advisoros_dev_password

✅ PostgreSQL setup complete!
```

**Time**: 10-15 minutes (including download)

---

## Option 2: Manual Installation

### Download & Install

**Step 1**: Download PostgreSQL
- Visit: https://www.postgresql.org/download/windows/
- Download: PostgreSQL 15.x installer for Windows
- File size: ~250 MB

**Step 2**: Run Installer
- Double-click installer
- Click "Next" through prompts
- Set password: `AdvisorOS_Dev_2024!` (remember this!)
- Port: `5432` (default)
- Locale: Default
- Complete installation (5-10 minutes)

**Step 3**: Configure Database

Open Command Prompt or PowerShell:
```powershell
# Connect as postgres superuser
psql -U postgres

# Enter password when prompted: AdvisorOS_Dev_2024!
```

In the PostgreSQL prompt:
```sql
-- Create database
CREATE DATABASE advisoros_dev;

-- Create user
CREATE USER advisoros WITH PASSWORD 'advisoros_dev_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE advisoros_dev TO advisoros;

-- Connect to database
\c advisoros_dev

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO advisoros;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO advisoros;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO advisoros;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO advisoros;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO advisoros;

-- Exit
\q
```

**Step 4**: Update .env File

Edit `C:\Users\MarkusAhling\AdvisorOS\AdvisorOS\.env`:
```bash
DATABASE_URL="postgresql://advisoros:advisoros_dev_password@localhost:5432/advisoros_dev"
```

**Step 5**: Test Connection
```bash
cd C:\Users\MarkusAhling\AdvisorOS\AdvisorOS
npm run dev:test
```

**Expected Output**:
```
✅ Database connection successful
```

---

## After Installation: Run Migrations

Once PostgreSQL is installed and running:

```bash
# 1. Navigate to project
cd C:\Users\MarkusAhling\AdvisorOS\AdvisorOS

# 2. Test connection
npm run dev:test

# 3. Navigate to web app
cd apps\web

# 4. Run migration (creates 38 tables)
npx prisma migrate dev --name add_fractional_cfo_marketplace_models

# Expected output:
# ✅ Migration applied successfully
# ✅ 8 new marketplace tables created
# ✅ 38 total models in database

# 5. Generate Prisma Client
npx prisma generate

# Expected output:
# ✅ Generated Prisma Client
# ✅ TypeScript types available

# 6. Verify with Prisma Studio
npx prisma studio

# Opens browser at http://localhost:5555
# You should see 38 tables in left sidebar
```

---

## Verification Checklist

After installation, verify:

- [ ] PostgreSQL service running (check Services app or `sc query postgresql-x64-15`)
- [ ] Can connect via psql: `psql -U advisoros -d advisoros_dev`
- [ ] `.env` file updated with correct DATABASE_URL
- [ ] `npm run dev:test` passes
- [ ] Migration executed successfully (38 tables created)
- [ ] Prisma Client generated
- [ ] Prisma Studio accessible at http://localhost:5555

---

## Troubleshooting

### Issue: "psql is not recognized"

**Solution**: Add PostgreSQL to PATH
```powershell
# Add to system PATH (as Administrator)
$env:Path += ";C:\Program Files\PostgreSQL\15\bin"
[Environment]::SetEnvironmentVariable("Path", $env:Path, "Machine")
```

### Issue: "Connection refused"

**Solution**: Start PostgreSQL service
```powershell
# Check service status
sc query postgresql-x64-15

# Start service
net start postgresql-x64-15
```

### Issue: "Authentication failed for user"

**Solution**: Reset password
```bash
# Connect as postgres
psql -U postgres

# Reset password
ALTER USER advisoros WITH PASSWORD 'advisoros_dev_password';
```

### Issue: "Database does not exist"

**Solution**: Create database manually
```bash
psql -U postgres
CREATE DATABASE advisoros_dev;
GRANT ALL PRIVILEGES ON DATABASE advisoros_dev TO advisoros;
```

### Issue: "Migration failed"

**Solution**: Reset and retry
```bash
cd apps\web
npx prisma migrate reset
npx prisma migrate dev --name add_fractional_cfo_marketplace_models
```

---

## Alternative: Using Docker (If Available)

If you have Docker Desktop installed:

```bash
# Start PostgreSQL + Redis
docker-compose up -d

# Update .env
DATABASE_URL="postgresql://cpa_user:secure_dev_password@localhost:5432/cpa_platform"

# Test connection
npm run dev:test

# Run migrations
cd apps\web
npx prisma migrate dev
```

---

## What's Next?

Once PostgreSQL is installed and migrations complete:

1. ✅ Continue with [IMMEDIATE_NEXT_STEPS.md](./IMMEDIATE_NEXT_STEPS.md)
2. ✅ Begin Week 1 Day 1 tasks (Authentication & Security)
3. ✅ Follow [ADVISOROS_MASTER_PROJECT_PLAN.md](./ADVISOROS_MASTER_PROJECT_PLAN.md)

---

## Quick Reference

**Connection String**:
```
postgresql://advisoros:advisoros_dev_password@localhost:5432/advisoros_dev
```

**Connect via psql**:
```bash
psql -U advisoros -d advisoros_dev
```

**Start PostgreSQL Service**:
```bash
net start postgresql-x64-15
```

**Stop PostgreSQL Service**:
```bash
net stop postgresql-x64-15
```

**Check Service Status**:
```bash
sc query postgresql-x64-15
```

---

**Status**: Ready for execution
**Time**: 10-15 minutes
**Difficulty**: Easy (automated script available)

🚀 **Choose Option 1 (automated) for fastest setup!**
# CPA Platform - Quick Start Guide

Get up and running with the CPA platform in minutes!

## 🚀 Quick Setup

### Prerequisites
- Node.js 18.17.0+
- npm 10.0.0+

### Option 1: Docker Setup (Recommended)

```bash
# Install Docker Desktop first, then:
git clone <repository>
cd AdvisorOS
npm install
cp .env.example .env
npm run dev:start
```

Access your application at:
- **App:** http://localhost:3000
- **Database UI:** http://localhost:5555 (Prisma Studio)
- **Admin Panel:** http://localhost:5050 (pgAdmin)

### Option 2: Local PostgreSQL

```bash
# Install PostgreSQL 15+, then:
git clone <repository>
cd AdvisorOS
npm install

# Set up database (run as postgres user):
psql -U postgres -f scripts/setup-local-db.sql

# Configure environment:
cp .env.example .env
# Edit .env and set: DATABASE_URL="postgresql://cpa_user:secure_dev_password@localhost:5432/cpa_platform"

# Start development:
npm run db:push
npm run dev
```

### Option 3: Cloud Database

```bash
# Create cloud PostgreSQL instance (Supabase, Railway, etc.), then:
git clone <repository>
cd AdvisorOS
npm install
cp .env.example .env
# Edit .env and set your cloud DATABASE_URL

npm run dev:test-local  # Test connection
npm run db:push         # Set up schema
npm run dev            # Start development
```

## ✅ Verify Setup

```bash
# Test your environment
npm run dev:test-local

# Should show:
# ✅ Environment file found
# ✅ Database connection successful
# ✅ Prisma client is generated
```

## 📋 Development Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run dev:studio` | Open database browser |
| `npm run dev:test-local` | Test database connection |
| `npm run db:push` | Apply schema changes |
| `npm run db:studio` | Open Prisma Studio |

## 🔧 Development Workflow

1. **Make database changes:**
   ```bash
   # Edit apps/web/prisma/schema.prisma
   npm run db:push
   npm run dev:studio  # View changes
   ```

2. **Add new features:**
   ```bash
   # Edit files in apps/web/
   # Hot reload is enabled
   ```

3. **Run tests:**
   ```bash
   npm run test
   ```

## 🆘 Troubleshooting

### Database Connection Issues
```bash
npm run dev:test-local  # Diagnose issues
```

### Reset Everything
```bash
# Docker:
npm run dev:reset

# Local PostgreSQL:
dropdb -U postgres cpa_platform
createdb -U postgres cpa_platform -O cpa_user
npm run db:push
```

### Common Fixes
- **Docker not found:** Install Docker Desktop
- **Connection refused:** Start PostgreSQL service
- **Permission denied:** Check database user permissions
- **Port in use:** Change ports in docker-compose.yml

## 📚 Next Steps

1. Check out [DEVELOPMENT_SETUP.md](./DEVELOPMENT_SETUP.md) for detailed setup options
2. Explore the application structure in `apps/web/`
3. Review the database schema in `apps/web/prisma/schema.prisma`
4. Start building features!

## 🎯 Key Features Ready to Use

- ✅ Next.js 15 with TypeScript
- ✅ PostgreSQL database with Prisma ORM
- ✅ Authentication with NextAuth.js
- ✅ tRPC for type-safe APIs
- ✅ Tailwind CSS for styling
- ✅ Complete CI/CD setup
- ✅ Azure cloud integration ready
- ✅ Testing framework configured

Happy coding! 🎉
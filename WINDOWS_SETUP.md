# Windows Development Setup Guide

Complete guide for setting up the CPA platform on Windows.

## Option 1: Docker Desktop (Recommended)

### Prerequisites
- Windows 10/11 (64-bit)
- WSL2 enabled (for better performance)

### Step 1: Install Docker Desktop
1. Download from [docker.com](https://www.docker.com/products/docker-desktop/)
2. Run installer and follow setup wizard
3. Enable WSL2 backend during setup
4. Restart computer if prompted

### Step 2: Setup Application
```powershell
# Clone repository
git clone <repository-url>
cd AdvisorOS

# Install dependencies
npm install

# Setup environment
copy .env.example .env

# Start development environment
npm run dev:start
```

### Step 3: Access Services
- **Application:** http://localhost:3000
- **Prisma Studio:** http://localhost:5555
- **pgAdmin:** http://localhost:5050
  - Email: admin@cpa-platform.local
  - Password: admin123

## Option 2: Local PostgreSQL Installation

### Step 1: Install PostgreSQL
1. Download PostgreSQL 15+ from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run installer with these settings:
   - Port: 5432
   - Remember the postgres password
   - Install pgAdmin (optional but recommended)

### Step 2: Create Database
Open **Command Prompt** or **PowerShell** as Administrator:

```powershell
# Connect to PostgreSQL
psql -U postgres

# In psql, run:
CREATE USER cpa_user WITH PASSWORD 'secure_dev_password';
CREATE DATABASE cpa_platform OWNER cpa_user;
GRANT ALL PRIVILEGES ON DATABASE cpa_platform TO cpa_user;

# Exit psql
\q
```

### Step 3: Setup Application
```powershell
# Clone and setup
git clone <repository-url>
cd AdvisorOS
npm install

# Create environment file
copy .env.example .env

# Edit .env file and ensure DATABASE_URL is:
# DATABASE_URL="postgresql://cpa_user:secure_dev_password@localhost:5432/cpa_platform"

# Test connection
npm run dev:test-local

# Setup database schema
npm run db:push

# Start development
npm run dev
```

## Option 3: Cloud Database (Supabase)

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up and create new project
3. Wait for setup to complete (2-3 minutes)

### Step 2: Get Connection Details
1. Go to Settings > Database
2. Copy the connection string
3. Note: Use the "nodejs" connection string

### Step 3: Setup Application
```powershell
git clone <repository-url>
cd AdvisorOS
npm install

# Create environment file
copy .env.example .env

# Edit .env and set DATABASE_URL to your Supabase connection string
# Example: postgresql://postgres:[password]@[host]:5432/postgres

# Test connection
npm run dev:test-local

# Setup database schema
npm run db:push

# Start development
npm run dev
```

## Development Tools

### PowerShell Scripts
All scripts work in both Command Prompt and PowerShell:

```powershell
# Start development (Docker)
npm run dev:start

# Test environment
npm run dev:test-local

# Open database browser
npm run dev:studio

# Database management
npm run db:push      # Apply schema changes
npm run db:studio    # Open Prisma Studio
npm run db:generate  # Generate Prisma client
```

### Windows-Specific Notes

#### PowerShell Execution Policy
If you get script execution errors:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Path Issues
If npm commands don't work:
1. Restart your terminal
2. Or use full paths: `C:\Users\[username]\AppData\Roaming\npm\npm.cmd`

#### Docker Issues
- Ensure Hyper-V is enabled
- Use WSL2 backend for better performance
- If Docker fails to start, try restarting Docker Desktop

#### Port Conflicts
Default ports used:
- 3000: Next.js application
- 5432: PostgreSQL
- 5555: Prisma Studio
- 6379: Redis
- 5050: pgAdmin

If ports are in use, modify `docker-compose.yml`.

## Troubleshooting

### Common Issues

#### "Docker command not found"
- Install Docker Desktop
- Restart terminal after installation
- Add Docker to PATH if needed

#### "psql command not found"
- Install PostgreSQL
- Add PostgreSQL bin folder to PATH:
  - Default: `C:\Program Files\PostgreSQL\15\bin`

#### "Permission denied" (PostgreSQL)
- Run Command Prompt as Administrator
- Check pg_hba.conf configuration
- Verify user has correct permissions

#### "Port already in use"
```powershell
# Find what's using the port
netstat -ano | findstr :5432

# Kill the process (replace PID)
taskkill /PID [process-id] /F
```

#### "npm install fails"
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and package-lock.json
- Run `npm install` again

### Getting Help

1. **Check logs:**
   ```powershell
   # Docker logs
   docker-compose logs postgres

   # Application logs
   npm run dev
   ```

2. **Test connection:**
   ```powershell
   npm run dev:test-local
   ```

3. **Reset everything:**
   ```powershell
   # Docker setup
   npm run dev:reset

   # Local PostgreSQL
   dropdb -U postgres cpa_platform
   createdb -U postgres cpa_platform -O cpa_user
   npm run db:push
   ```

## VS Code Setup (Recommended)

### Extensions
Install these VS Code extensions:
- **Prisma** - Database schema support
- **PostgreSQL** - Database management
- **Docker** - Container management
- **GitLens** - Git integration
- **Thunder Client** - API testing
- **Tailwind CSS IntelliSense** - CSS support

### Settings
Add to VS Code settings.json:
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Performance Tips

### WSL2 (Recommended)
1. Install WSL2
2. Use WSL2 backend in Docker Desktop
3. Consider developing inside WSL2 for better performance

### Docker Performance
- Allocate more memory to Docker (4GB+)
- Use WSL2 backend
- Place code in WSL2 filesystem when using WSL2

### Node.js Performance
- Use Node.js 18 LTS
- Clear npm cache periodically
- Use `npm ci` instead of `npm install` for faster installs

Ready to code! 🚀
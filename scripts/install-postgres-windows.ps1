# AdvisorOS - PostgreSQL Installation Script for Windows
# This script automates PostgreSQL 15 installation and database setup

param(
    [string]$PostgresPassword = "AdvisorOS_Dev_2024!",
    [string]$DatabaseName = "advisoros_dev",
    [string]$Username = "advisoros",
    [string]$UserPassword = "advisoros_dev_password"
)

Write-Host "`n=== AdvisorOS PostgreSQL Setup ===" -ForegroundColor Cyan
Write-Host "This script will install PostgreSQL 15 and configure the database`n" -ForegroundColor Yellow

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script requires Administrator privileges" -ForegroundColor Red
    Write-Host "Please right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Check if Chocolatey is installed
Write-Host "Checking for Chocolatey package manager..." -ForegroundColor Cyan
$chocoInstalled = Get-Command choco -ErrorAction SilentlyContinue

if (-not $chocoInstalled) {
    Write-Host "Chocolatey not found. Installing Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

    # Refresh environment variables
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

    Write-Host "Chocolatey installed successfully!" -ForegroundColor Green
} else {
    Write-Host "Chocolatey already installed" -ForegroundColor Green
}

# Check if PostgreSQL is already installed
Write-Host "`nChecking for existing PostgreSQL installation..." -ForegroundColor Cyan
$postgresService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue

if ($postgresService) {
    Write-Host "PostgreSQL service found: $($postgresService.Name)" -ForegroundColor Yellow
    Write-Host "Status: $($postgresService.Status)" -ForegroundColor Yellow

    $continue = Read-Host "`nPostgreSQL appears to be installed. Continue anyway? (y/n)"
    if ($continue -ne "y") {
        Write-Host "Installation cancelled." -ForegroundColor Yellow
        exit 0
    }
} else {
    Write-Host "No existing PostgreSQL installation found" -ForegroundColor Green
}

# Install PostgreSQL
Write-Host "`nInstalling PostgreSQL 15..." -ForegroundColor Cyan
Write-Host "This may take 5-10 minutes. Please wait..." -ForegroundColor Yellow

try {
    choco install postgresql15 --params "/Password:$PostgresPassword" -y --no-progress

    if ($LASTEXITCODE -eq 0) {
        Write-Host "PostgreSQL 15 installed successfully!" -ForegroundColor Green
    } else {
        throw "Chocolatey installation failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "ERROR: Failed to install PostgreSQL" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`nPlease install manually from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

# Wait for PostgreSQL service to start
Write-Host "`nWaiting for PostgreSQL service to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Find PostgreSQL service
$postgresService = Get-Service -Name "postgresql*" | Select-Object -First 1

if ($postgresService) {
    if ($postgresService.Status -ne "Running") {
        Write-Host "Starting PostgreSQL service..." -ForegroundColor Yellow
        Start-Service $postgresService.Name
        Start-Sleep -Seconds 5
    }
    Write-Host "PostgreSQL service is running: $($postgresService.Name)" -ForegroundColor Green
} else {
    Write-Host "WARNING: Could not find PostgreSQL service" -ForegroundColor Yellow
    Write-Host "You may need to start it manually" -ForegroundColor Yellow
}

# Add PostgreSQL to PATH if not already there
Write-Host "`nConfiguring environment variables..." -ForegroundColor Cyan
$pgPath = "C:\Program Files\PostgreSQL\15\bin"
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")

if ($currentPath -notlike "*$pgPath*") {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$pgPath", "Machine")
    $env:Path += ";$pgPath"
    Write-Host "Added PostgreSQL to system PATH" -ForegroundColor Green
} else {
    Write-Host "PostgreSQL already in system PATH" -ForegroundColor Green
}

# Configure database
Write-Host "`nConfiguring AdvisorOS database..." -ForegroundColor Cyan

# Set PGPASSWORD environment variable for this session
$env:PGPASSWORD = $PostgresPassword

# Create SQL script
$sqlScript = @"
-- Create database
CREATE DATABASE $DatabaseName;

-- Create user
CREATE USER $Username WITH PASSWORD '$UserPassword';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DatabaseName TO $Username;

-- Connect to new database
\c $DatabaseName

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO $Username;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $Username;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $Username;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $Username;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $Username;
"@

$sqlScript | Out-File -FilePath "$env:TEMP\advisoros_setup.sql" -Encoding UTF8

# Execute SQL script
Write-Host "Creating database and user..." -ForegroundColor Yellow

try {
    $psqlPath = "C:\Program Files\PostgreSQL\15\bin\psql.exe"

    if (Test-Path $psqlPath) {
        & $psqlPath -U postgres -f "$env:TEMP\advisoros_setup.sql" 2>&1

        if ($LASTEXITCODE -eq 0) {
            Write-Host "Database configured successfully!" -ForegroundColor Green
        } else {
            Write-Host "Warning: Database configuration may have encountered issues" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Warning: Could not find psql.exe at expected location" -ForegroundColor Yellow
        Write-Host "You may need to configure the database manually" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Warning: Error during database configuration" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Yellow
} finally {
    # Clean up
    Remove-Item "$env:TEMP\advisoros_setup.sql" -ErrorAction SilentlyContinue
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

# Update .env file
Write-Host "`nUpdating .env file..." -ForegroundColor Cyan
$envPath = Join-Path $PSScriptRoot "..\..\.env"

if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    $databaseUrl = "postgresql://${Username}:${UserPassword}@localhost:5432/${DatabaseName}"

    # Update DATABASE_URL
    $envContent = $envContent -replace 'DATABASE_URL="postgresql://[^"]*"', "DATABASE_URL=`"$databaseUrl`""

    $envContent | Out-File -FilePath $envPath -Encoding UTF8 -NoNewline
    Write-Host ".env file updated with database connection string" -ForegroundColor Green
} else {
    Write-Host "Warning: .env file not found at $envPath" -ForegroundColor Yellow
    Write-Host "Please update DATABASE_URL manually:" -ForegroundColor Yellow
    Write-Host "DATABASE_URL=`"postgresql://${Username}:${UserPassword}@localhost:5432/${DatabaseName}`"" -ForegroundColor White
}

# Test connection
Write-Host "`nTesting database connection..." -ForegroundColor Cyan
$env:PGPASSWORD = $UserPassword

try {
    $psqlPath = "C:\Program Files\PostgreSQL\15\bin\psql.exe"

    if (Test-Path $psqlPath) {
        $testQuery = "SELECT version();"
        $result = & $psqlPath -U $Username -d $DatabaseName -c $testQuery -t 2>&1

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database connection successful!" -ForegroundColor Green
            Write-Host "PostgreSQL version: $result" -ForegroundColor Cyan
        } else {
            throw "Connection test failed"
        }
    }
} catch {
    Write-Host "⚠️  Could not verify database connection" -ForegroundColor Yellow
    Write-Host "Please test manually: psql -U $Username -d $DatabaseName" -ForegroundColor Yellow
} finally {
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

# Summary
Write-Host "`n=== Installation Complete ===" -ForegroundColor Cyan
Write-Host "`nDatabase Configuration:" -ForegroundColor Yellow
Write-Host "  Host:     localhost" -ForegroundColor White
Write-Host "  Port:     5432" -ForegroundColor White
Write-Host "  Database: $DatabaseName" -ForegroundColor White
Write-Host "  User:     $Username" -ForegroundColor White
Write-Host "  Password: $UserPassword" -ForegroundColor White
Write-Host "`nConnection String:" -ForegroundColor Yellow
Write-Host "  postgresql://${Username}:${UserPassword}@localhost:5432/${DatabaseName}" -ForegroundColor White

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "1. Close and reopen your terminal to refresh PATH" -ForegroundColor White
Write-Host "2. Navigate to your project: cd C:\Users\MarkusAhling\AdvisorOS\AdvisorOS" -ForegroundColor White
Write-Host "3. Test connection: npm run dev:test" -ForegroundColor White
Write-Host "4. Run migrations: cd apps\web && npx prisma migrate dev" -ForegroundColor White
Write-Host "5. Generate client: npx prisma generate" -ForegroundColor White
Write-Host "6. Open Prisma Studio: npx prisma studio" -ForegroundColor White

Write-Host "`n✅ PostgreSQL setup complete!" -ForegroundColor Green
Write-Host ""
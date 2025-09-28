@echo off
REM Test database connection and setup
echo Testing CPA Platform database connection...

REM Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Docker is not running
    pause
    exit /b 1
)
echo ✅ Docker is running

REM Start database if not running
docker-compose ps postgres | findstr "Up" >nul
if %errorlevel% neq 0 (
    echo Starting database...
    docker-compose up -d postgres

    echo Waiting for PostgreSQL to be ready...
    :waitloop
    docker-compose exec -T postgres pg_isready -U cpa_user -d cpa_platform >nul 2>&1
    if %errorlevel% neq 0 (
        timeout /t 2 >nul
        goto waitloop
    )
)
echo ✅ PostgreSQL is running

REM Test database connection
docker-compose exec -T postgres psql -U cpa_user -d cpa_platform -c "SELECT version();" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Database connection successful
) else (
    echo ❌ Database connection failed
    pause
    exit /b 1
)

REM Check if Prisma client is generated
cd /d "%~dp0\.."
if exist "apps\web\node_modules\.prisma\client" (
    echo ✅ Prisma client is generated
) else (
    echo ⚠️  Prisma client not found, generating...
    npm run db:generate
    if %errorlevel% equ 0 (
        echo ✅ Prisma client generated successfully
    ) else (
        echo ❌ Failed to generate Prisma client
        pause
        exit /b 1
    )
)

REM Test DATABASE_URL from .env
if exist ".env" (
    echo ✅ .env file found
) else (
    echo ⚠️  .env file not found, please create one from .env.example
    pause
    exit /b 1
)

echo.
echo 🎉 All tests passed! Development environment is ready.
echo.
echo Available commands:
echo   scripts\dev-start.bat     - Start development environment
echo   scripts\studio.bat        - Open Prisma Studio
echo   scripts\db-connect.bat    - Connect to database via psql
echo   scripts\db-backup.bat     - Create database backup
echo.
pause
@echo off
REM Start Prisma Studio for database inspection
echo Starting Prisma Studio...

REM Check if database is running
docker-compose ps postgres | findstr "Up" >nul
if %errorlevel% neq 0 (
    echo Database is not running. Starting database...
    docker-compose up -d postgres

    REM Wait for PostgreSQL to be ready
    echo Waiting for PostgreSQL to be ready...
    :waitloop
    docker-compose exec -T postgres pg_isready -U cpa_user -d cpa_platform >nul 2>&1
    if %errorlevel% neq 0 (
        timeout /t 2 >nul
        goto waitloop
    )
)

cd /d "%~dp0\.."
npm run db:studio
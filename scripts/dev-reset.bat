@echo off
REM Reset CPA Platform Development Environment
echo Resetting CPA Platform Development Environment...

echo WARNING: This will delete all data in the database!
set /p confirm=Are you sure? (y/N):
if /i not "%confirm%"=="y" (
    echo Operation cancelled.
    pause
    exit /b 0
)

REM Stop all services
echo Stopping services...
docker-compose down

REM Remove volumes (this deletes all data)
echo Removing database volumes...
docker-compose down -v

REM Rebuild and start services
echo Starting fresh services...
docker-compose up -d postgres redis

REM Wait for PostgreSQL to be ready
echo Waiting for PostgreSQL to be ready...
:waitloop
docker-compose exec -T postgres pg_isready -U cpa_user -d cpa_platform >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 2 >nul
    goto waitloop
)

echo PostgreSQL is ready!

REM Run database migrations
echo Running database migrations...
cd /d "%~dp0\.."
npm run db:push

REM Seed database with initial data
echo Seeding database...
npm run db:seed

echo Development environment reset complete!
pause
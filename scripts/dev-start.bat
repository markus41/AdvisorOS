@echo off
REM Start CPA Platform Development Environment
echo Starting CPA Platform Development Environment...

REM Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Start database services
echo Starting database services...
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

REM Start the development server
echo Starting Next.js development server...
npm run dev

pause
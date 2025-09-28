@echo off
REM Connect to PostgreSQL database using psql
echo Connecting to CPA Platform database...

REM Check if database is running
docker-compose ps postgres | findstr "Up" >nul
if %errorlevel% neq 0 (
    echo Database is not running. Please start it first with: npm run dev:start
    pause
    exit /b 1
)

echo Connected to PostgreSQL. Type \q to exit.
docker-compose exec postgres psql -U cpa_user -d cpa_platform
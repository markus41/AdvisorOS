@echo off
REM Restore CPA Platform Database from backup
setlocal

if "%~1"=="" (
    echo Usage: db-restore.bat [backup_file]
    echo Example: db-restore.bat backups\cpa_platform_backup_2024-01-15_10-30-00.sql
    pause
    exit /b 1
)

set "backup_file=%~1"

if not exist "%backup_file%" (
    echo Error: Backup file "%backup_file%" not found
    pause
    exit /b 1
)

echo WARNING: This will replace all data in the database!
set /p confirm=Are you sure? (y/N):
if /i not "%confirm%"=="y" (
    echo Operation cancelled.
    pause
    exit /b 0
)

echo Restoring database from %backup_file%...

REM Drop and recreate database
docker-compose exec -T postgres dropdb -U cpa_user --if-exists cpa_platform
docker-compose exec -T postgres createdb -U cpa_user cpa_platform

REM Restore from backup
docker-compose exec -T postgres psql -U cpa_user -d cpa_platform < "%backup_file%"

if %errorlevel% equ 0 (
    echo Database restored successfully from %backup_file%
) else (
    echo Error: Failed to restore database
    pause
    exit /b 1
)

pause
@echo off
REM Backup CPA Platform Database
setlocal enabledelayedexpansion

set "timestamp=%date:~10,4%-%date:~4,2%-%date:~7,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%"
set "timestamp=!timestamp: =0!"
set "backup_file=backups\cpa_platform_backup_!timestamp!.sql"

echo Creating database backup...

REM Create backups directory if it doesn't exist
if not exist "backups" mkdir "backups"

REM Create backup
docker-compose exec -T postgres pg_dump -U cpa_user -d cpa_platform > "%backup_file%"

if %errorlevel% equ 0 (
    echo Backup created successfully: %backup_file%
) else (
    echo Error: Failed to create backup
    pause
    exit /b 1
)

pause
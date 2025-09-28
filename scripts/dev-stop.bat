@echo off
REM Stop CPA Platform Development Environment
echo Stopping CPA Platform Development Environment...

REM Stop all services
docker-compose down

echo Development environment stopped.
pause
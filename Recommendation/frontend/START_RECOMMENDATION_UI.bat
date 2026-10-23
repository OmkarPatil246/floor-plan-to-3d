@echo off
REM ============================================================================
REM Recommendation System Frontend - Startup Script
REM Starts the Recommendation UI (React + Vite) on Port 5175
REM ============================================================================
cd /d "%~dp0"

title Recommendation UI (Port 5175)
color 0E

echo.
echo ========================================
echo  Recommendation System Frontend
echo  Starting on Port 5175
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [WARNING] node_modules not found!
    echo [INFO] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed!
    echo.
)

echo [INFO] Starting Vite dev server on port 5175...
echo.
echo ========================================
echo  Recommendation UI Access:
echo ========================================
echo.
echo  Local:   http://localhost:5175
echo  Network: Check output below
echo.
echo ========================================
echo.

npm run dev

pause

@echo off
REM ============================================================================
REM ArchGen 3D UI - Startup Script
REM Starts the ArchGen 3D Frontend (React + Vite) on Port 5173
REM ============================================================================
cd /d "%~dp0"

echo.
echo ========================================
echo  ArchGen 3D UI - Starting Frontend
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

echo [INFO] Starting Vite dev server on port 5173...
echo.
echo ========================================
echo  ArchGen 3D UI Access:
echo ========================================
echo.
echo  Local:  http://localhost:5173
echo  Network: Check output below for network URL
echo.
echo ========================================
echo.

npm run dev

pause

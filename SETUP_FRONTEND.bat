@echo off
echo ========================================
echo Frontend Setup
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js is installed
echo.

REM Install frontend dependencies
echo Installing frontend dependencies...
cd /d "%~dp0Recommendation\frontend"

if exist "node_modules" (
    echo [INFO] node_modules already exists, skipping...
) else (
    echo Running npm install (this may take a few minutes)...
    call npm install
    
    if errorlevel 1 (
        echo [ERROR] Failed to install frontend dependencies
        pause
        exit /b 1
    )
)

cd /d "%~dp0"

echo.
echo ========================================
echo Frontend Setup Complete!
echo ========================================
echo.
echo Frontend dependencies installed in:
echo   Recommendation\frontend\node_modules\
echo.
echo Ready to start the system!
echo Run: START_AI_SYSTEM.bat
echo.
pause

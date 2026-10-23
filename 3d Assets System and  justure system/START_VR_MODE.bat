@echo off
echo ========================================
echo  VR Box Mode System - Quick Start
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [1/3] Checking dependencies...
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
) else (
    echo [OK] Dependencies already installed
)

echo.
echo [2/3] Starting VR signaling server...
echo.

start "VR Signaling Server" cmd /k "node vr-server.js"

timeout /t 3 /nobreak >nul

echo.
echo [3/3] Opening primary device interface...
echo.

timeout /t 2 /nobreak >nul
start http://localhost:3000/vr-primary.html

echo.
echo ========================================
echo  VR MODE SYSTEM STARTED!
echo ========================================
echo.
echo  Primary Device: http://localhost:3000/vr-primary.html
echo  Server Console: Check the new window
echo.
echo  NEXT STEPS:
echo  1. Allow camera access on primary device
echo  2. Scan QR code with your phone
echo  3. Put phone in VR box
echo  4. Enjoy the VR experience!
echo.
echo  To stop: Close the server window or press Ctrl+C
echo.
echo ========================================
echo.

pause

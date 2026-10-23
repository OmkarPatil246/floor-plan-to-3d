@echo off
echo.
echo ================================================================
echo    Floor Plan VR Sharing Server
echo ================================================================
echo.
echo Starting VR signaling server with ngrok tunnel...
echo.
echo Prerequisites:
echo   1. Node.js installed
echo   2. Ngrok installed (optional, for remote access)
echo.
echo Press Ctrl+C to stop the server
echo ================================================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

:: Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
    echo.
)

:: Start the server
echo [INFO] Starting VR server...
echo.
node vr-signaling-server.js

pause

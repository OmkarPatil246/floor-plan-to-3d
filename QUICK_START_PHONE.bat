@echo off
REM ============================================================================
REM QUICK START - For Phone Access with NGROK
REM ============================================================================
title ArchGen 3D - Phone Access Setup

echo.
echo ========================================================================
echo  ArchGen 3D - QUICK START FOR PHONE ACCESS
echo ========================================================================
echo.
echo This will:
echo   1. Check if ngrok is installed
echo   2. Start all services (Main Server, UI, Recommendations)
echo   3. Create public URLs you can use on your phone
echo.
echo ========================================================================
echo.

REM Check ngrok
where ngrok >nul 2>&1
if errorlevel 1 (
    echo ❌ NGROK NOT FOUND!
    echo.
    echo Please install ngrok first:
    echo   1. Visit: https://ngrok.com/download
    echo   2. Download and extract ngrok.exe
    echo   3. Place it in this folder OR add to PATH
    echo   4. Get authtoken: https://dashboard.ngrok.com
    echo   5. Run: ngrok config add-authtoken YOUR_TOKEN
    echo.
    echo Then run this script again!
    echo.
    pause
    exit /b 1
)

echo ✅ ngrok found!
echo.
echo Starting services...
echo.

REM Start main startup script with ngrok
call START_WITH_NGROK.bat


@echo off
title Create Public URL - Floor Plan VR
color 0E
cls

echo ========================================
echo   CREATE PUBLIC URL
echo ========================================
echo.
echo This will create a PUBLIC URL that works
echo from ANY device, ANY network, ANYWHERE!
echo.
echo Using: LocalTunnel (Free, No signup needed)
echo.
echo ========================================
echo.

cd /d "%~dp0"

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Node.js is required for creating public URLs.
    echo.
    echo INSTALL STEPS:
    echo 1. Go to: https://nodejs.org/
    echo 2. Download and install LTS version
    echo 3. Restart this script
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js found
echo.

REM Check if localtunnel is installed
where lt >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing localtunnel (one-time setup)...
    echo This may take a minute...
    echo.
    call npm install -g localtunnel
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Failed to install localtunnel
        echo.
        echo Try manually: npm install -g localtunnel
        echo.
        pause
        exit /b 1
    )
    echo.
    echo [OK] localtunnel installed
)

echo [OK] localtunnel ready
echo.

REM Check if server is running
netstat -ano | findstr :8000 >nul 2>&1
if %errorlevel% neq 0 (
    echo Starting Python HTTP server...
    start "Python Server" /min cmd /c "cd /d "%~dp0" && python -m http.server 8000 --bind 0.0.0.0"
    timeout /t 3 >nul
    echo [OK] Server started on port 8000
) else (
    echo [OK] Server already running on port 8000
)

echo.
echo ========================================
echo   CREATING PUBLIC TUNNEL...
echo ========================================
echo.
echo Please wait...
echo.

REM Create a custom subdomain (you can change "floorplanvr" to anything)
set SUBDOMAIN=floorplanvr-%random%

echo Starting tunnel with subdomain: %SUBDOMAIN%
echo.

REM Start localtunnel
start "LocalTunnel" cmd /c "lt --port 8000 --subdomain %SUBDOMAIN% && pause"

timeout /t 3 >nul

echo.
echo ========================================
echo   YOUR PUBLIC URL:
echo ========================================
echo.
echo Main URL (check the LocalTunnel window):
echo   https://%SUBDOMAIN%.loca.lt/mobile.html
echo.
echo Alternative: Check the "LocalTunnel" window
echo              for your actual public URL
echo.
echo ========================================
echo.
echo IMPORTANT:
echo - First visit may show security page
echo - Click "Continue" or enter the IP shown
echo - Share this URL with anyone!
echo - Tunnel stays active while this runs
echo.
echo ========================================
echo.

timeout /t 2 >nul

echo Opening test page...
start http://localhost:8000/mobile.html

echo.
echo Server and tunnel are running.
echo.
echo Keep ALL windows open for tunnel to work!
echo Press Ctrl+C here to stop everything.
echo.
pause

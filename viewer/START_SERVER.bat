@echo off
title Floor Plan Viewer Server
color 0A
cls
echo ========================================
echo   FLOOR PLAN VIEWER SERVER
echo ========================================
echo.

cd /d "%~dp0"

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed!
    echo.
    echo Please install Python from:
    echo https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo [OK] Python found
echo.
echo Detecting network information...
echo.

REM Get WiFi IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4" ^| findstr /v "172.17"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP:~1%

REM Check if firewall rule exists
netsh advfirewall firewall show rule name="Python HTTP Server Port 8000" >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo   FIREWALL WARNING
    echo ========================================
    echo.
    echo Windows Firewall may block network access!
    echo.
    echo TO FIX: Right-click ADD_FIREWALL_RULE.bat
    echo         and select "Run as administrator"
    echo.
    echo OR: Manually allow port 8000 in Windows Firewall
    echo.
    echo ========================================
    echo.
    timeout /t 3 >nul
)

echo ========================================
echo   SERVER STARTED SUCCESSFULLY!
echo ========================================
echo.
echo YOUR WIFI IP ADDRESS: %IP%
echo.
echo ========================================
echo   COPY THESE LINKS TO YOUR PHONE:
echo ========================================
echo.
echo Mobile Landing Page (START HERE):
echo   http://%IP%:8000/mobile.html
echo.
echo VR Walk Mode (Direct):
echo   http://%IP%:8000/vr-walk-mode.html
echo.
echo Main Viewer:
echo   http://%IP%:8000/index.html
echo.
echo ========================================
echo   TEST ON THIS COMPUTER FIRST:
echo ========================================
echo.
echo   http://localhost:8000/mobile.html
echo.
echo If this works, the server is running!
echo.
echo ========================================
echo   PHONE SETUP:
echo ========================================
echo.
echo 1. Connect phone to SAME WiFi network
echo 2. Open Chrome browser
echo 3. Type (or scan QR below):
echo    http://%IP%:8000/mobile.html
echo 4. Bookmark it for easy access!
echo.
echo ========================================
echo.
echo Server running on 0.0.0.0:8000
echo Accessible from ANY device on network
echo.
echo Press Ctrl+C to stop server
echo.
echo ========================================
echo.

REM Start Python HTTP server on all interfaces (0.0.0.0)
python -m http.server 8000 --bind 0.0.0.0

pause

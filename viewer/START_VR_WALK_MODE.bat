@echo off
title VR Walk Mode Server
color 0A
echo ========================================
echo   VR WALK MODE SERVER
echo ========================================
echo.
echo Starting HTTP server for VR Walk Mode...
echo.

cd /d "%~dp0"

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)

REM Get the local IP address
echo Detecting your computer's IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP:~1%
echo.
echo ========================================
echo   SERVER IS RUNNING!
echo ========================================
echo.
echo ON YOUR ANDROID PHONE:
echo.
echo 1. Connect to the SAME WiFi network
echo 2. Open Chrome browser
echo 3. Go to one of these URLs:
echo.
echo    LOCAL ACCESS:
echo    http://localhost:8000/vr-walk-mode.html
echo.
echo    NETWORK ACCESS (Use this on phone):
echo    http://%IP%:8000/vr-walk-mode.html
echo.
echo    FROM MAIN VIEWER (Network):
echo    http://%IP%:8000/index.html
echo    (Then click "Enter VR Walk Mode" button)
echo.
echo ========================================
echo.
echo Server is running...
echo Press Ctrl+C to stop
echo.

REM Start the server
python -m http.server 8000

pause

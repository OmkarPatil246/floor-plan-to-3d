@echo off
title Public URL Setup - Floor Plan VR
color 0B
cls

echo ========================================
echo   PUBLIC URL SETUP - NGROK
echo ========================================
echo.
echo This will create a PUBLIC URL accessible
echo from ANYWHERE in the world!
echo.
echo ========================================
echo.

cd /d "%~dp0"

REM Check if ngrok is installed
where ngrok >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] ngrok is not installed. Installing now...
    echo.
    echo Downloading ngrok...
    
    REM Download ngrok using PowerShell
    powershell -Command "& {Invoke-WebRequest -Uri 'https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip' -OutFile 'ngrok.zip'}"
    
    if exist ngrok.zip (
        echo Extracting ngrok...
        powershell -Command "Expand-Archive -Path 'ngrok.zip' -DestinationPath '.' -Force"
        del ngrok.zip
        echo [OK] ngrok installed successfully!
    ) else (
        echo [ERROR] Failed to download ngrok
        echo.
        echo Please download manually from: https://ngrok.com/download
        echo Extract ngrok.exe to: %~dp0
        echo Then run this script again.
        echo.
        pause
        exit /b 1
    )
)

echo [OK] ngrok is ready
echo.

REM Check if Python server is already running
netstat -ano | findstr :8000 >nul 2>&1
if %errorlevel% neq 0 (
    echo Starting Python HTTP server on port 8000...
    start /min cmd /c "python -m http.server 8000 --bind 0.0.0.0"
    timeout /t 3 >nul
    echo [OK] Server started
) else (
    echo [OK] Server already running on port 8000
)

echo.
echo ========================================
echo   CREATING PUBLIC URL...
echo ========================================
echo.
echo Please wait while ngrok creates a tunnel...
echo.

REM Start ngrok in background and capture URL
start "ngrok tunnel" ngrok http 8000 --log=stdout

echo.
echo ========================================
echo   WAITING FOR NGROK TO START...
echo ========================================
echo.
timeout /t 5 >nul

REM Get ngrok URL from API
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:4040/api/tunnels' -ErrorAction Stop; $url = $response.tunnels[0].public_url; Write-Host ''; Write-Host '========================================'; Write-Host '  PUBLIC URL IS READY!'; Write-Host '========================================'; Write-Host ''; Write-Host 'YOUR PUBLIC URLS (Copy these):'; Write-Host ''; Write-Host 'Mobile Landing Page:'; Write-Host \"$url/mobile.html\" -ForegroundColor Green; Write-Host ''; Write-Host 'VR Walk Mode:'; Write-Host \"$url/vr-walk-mode.html\" -ForegroundColor Green; Write-Host ''; Write-Host 'Main Viewer:'; Write-Host \"$url/index.html\" -ForegroundColor Green; Write-Host ''; Write-Host '========================================'; Write-Host ''; Write-Host 'Share these links with ANYONE!'; Write-Host 'Works from ANY device, ANY network, ANYWHERE!'; Write-Host ''; Write-Host 'Ngrok Dashboard: http://localhost:4040'; Write-Host ''; Write-Host '========================================'; } catch { Write-Host 'Waiting for ngrok to fully start...'; Write-Host 'Check the ngrok window for the URL'; Write-Host 'Or open: http://localhost:4040'; }"

echo.
echo.
echo IMPORTANT NOTES:
echo - Keep this window and the ngrok window open
echo - Free ngrok URLs expire after session ends
echo - For permanent URL, sign up at ngrok.com
echo.
echo Press any key to open ngrok dashboard...
pause >nul

start http://localhost:4040

echo.
echo Server is running. Press Ctrl+C to stop.
echo.
pause

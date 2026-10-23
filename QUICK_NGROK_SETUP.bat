@echo off
color 0B
cls
echo.
echo ════════════════════════════════════════════════════════════
echo   QUICK NGROK SETUP - Get Your Public URLs!
echo ════════════════════════════════════════════════════════════
echo.
echo STEP 1: Get your FREE ngrok authtoken
echo ────────────────────────────────────────────────────────────
echo.
echo Opening ngrok signup page...
echo.
start https://dashboard.ngrok.com/signup
echo.
echo After signing up:
echo   1. You'll see your dashboard
echo   2. Copy your "Authtoken" (starts with "2...")
echo   3. Come back here
echo.
echo ════════════════════════════════════════════════════════════
echo.
pause
echo.
echo ════════════════════════════════════════════════════════════
echo   STEP 2: Paste Your Authtoken
echo ════════════════════════════════════════════════════════════
echo.
set /p TOKEN="Paste authtoken here: "
echo.
echo Configuring ngrok...
cd /d "%~dp0viewer"
ngrok.exe config add-authtoken %TOKEN%
echo.
if %errorlevel% equ 0 (
    echo ✅ SUCCESS! Ngrok is ready!
    echo.
    echo Now running your project with PUBLIC URLs...
    echo.
    timeout /t 3 /nobreak >nul
    cd /d "%~dp0"
    call RUN_WITH_PUBLIC_ACCESS.bat
) else (
    echo ❌ ERROR! Please check your authtoken and try again.
    pause
)

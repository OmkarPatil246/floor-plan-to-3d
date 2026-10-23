@echo off
color 0B
cls
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║          NGROK SETUP - ONE-TIME AUTHENTICATION                ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo This will set up ngrok for PUBLIC access from ANY network!
echo.
echo ══════════════════════════════════════════════════════════════
echo   STEP 1: CREATE FREE NGROK ACCOUNT (2 minutes)
echo ══════════════════════════════════════════════════════════════
echo.
echo Opening ngrok signup page...
echo.
timeout /t 2 /nobreak >nul
start https://dashboard.ngrok.com/signup
echo.
echo Instructions:
echo   1. Sign up using Google/GitHub OR email (it's FREE!)
echo   2. After signing in, you'll see your dashboard
echo   3. Look for "Your Authtoken" or click "Get Started"
echo.
echo ══════════════════════════════════════════════════════════════
echo.
pause
echo.
echo ══════════════════════════════════════════════════════════════
echo   STEP 2: GET YOUR AUTHTOKEN
echo ══════════════════════════════════════════════════════════════
echo.
echo Opening authtoken page...
timeout /t 2 /nobreak >nul
start https://dashboard.ngrok.com/get-started/your-authtoken
echo.
echo Your authtoken looks like this:
echo   2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
echo.
echo It's a long string starting with "2"
echo.
echo ══════════════════════════════════════════════════════════════
echo.
pause
echo.
echo ══════════════════════════════════════════════════════════════
echo   STEP 3: PASTE YOUR AUTHTOKEN
echo ══════════════════════════════════════════════════════════════
echo.
set /p AUTHTOKEN="Paste your authtoken here and press Enter: "
echo.

if "%AUTHTOKEN%"=="" (
    echo.
    echo ❌ ERROR: No authtoken provided!
    echo.
    echo Please run this script again and paste your authtoken.
    echo.
    pause
    exit /b 1
)

echo.
echo Setting up ngrok with your authtoken...
cd /d "%~dp0viewer"

if not exist "ngrok.exe" (
    echo.
    echo Ngrok not found. Downloading...
    powershell -Command "Invoke-WebRequest -Uri 'https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip' -OutFile 'ngrok.zip'"
    powershell -Command "Expand-Archive -Path 'ngrok.zip' -DestinationPath '.' -Force"
    del ngrok.zip
    echo Downloaded ngrok successfully!
    echo.
)

ngrok.exe config add-authtoken %AUTHTOKEN%

if %errorlevel% equ 0 (
    echo.
    echo ╔═══════════════════════════════════════════════════════════════╗
    echo ║                                                               ║
    echo ║               ✅ SUCCESS! NGROK IS READY! ✅                 ║
    echo ║                                                               ║
    echo ╚═══════════════════════════════════════════════════════════════╝
    echo.
    echo Your authtoken has been saved!
    echo.
    echo ══════════════════════════════════════════════════════════════
    echo   NEXT STEP: RUN YOUR PROJECT WITH PUBLIC URLS
    echo ══════════════════════════════════════════════════════════════
    echo.
    echo Option 1: Run complete system with public access
    echo   ^> Double-click: RUN_WITH_PUBLIC_ACCESS.bat
    echo.
    echo Option 2: Quick start just the viewer
    echo   ^> Double-click: START_PUBLIC_VIEWER.bat
    echo.
    echo ══════════════════════════════════════════════════════════════
    echo.
    echo Creating quick-start batch file...
    
    REM Create quick start batch file
    cd /d "%~dp0"
    (
        echo @echo off
        echo title FloorPlan Public Access
        echo color 0B
        echo cls
        echo.
        echo Starting services with PUBLIC URLs...
        echo.
        echo Starting Main Server ^(Port 8080^)...
        echo.
        echo Checking virtual environment...
        if exist ".venv\Scripts\python.exe" ^(
            start "Main Server" cmd /k "cd /d "%~dp0" && .venv\Scripts\activate && python server\main.py"
        ^) else if exist "venv\Scripts\python.exe" ^(
            start "Main Server" cmd /k "cd /d "%~dp0" && venv\Scripts\activate && python server\main.py"
        ^) else ^(
            echo ERROR: No virtual environment found!
            pause
            exit /b 1
        ^)
        echo.
        timeout /t 5 /nobreak ^>nul
        echo.
        echo Starting VR Viewer Server ^(Port 8888^)...
        start "VR Viewer Server" cmd /k "cd /d "%~dp0viewer" && python -m http.server 8888 --bind 0.0.0.0"
        echo.
        timeout /t 3 /nobreak ^>nul
        echo.
        echo Creating PUBLIC tunnels with ngrok...
        echo.
        start "Ngrok Main ^(8080^)" cmd /k "cd /d "%~dp0viewer" && ngrok.exe http 8080"
        timeout /t 5 /nobreak ^>nul
        echo.
        start "Ngrok VR ^(8888^)" cmd /k "cd /d "%~dp0viewer" && ngrok.exe http 8888"
        timeout /t 5 /nobreak ^>nul
        echo.
        cls
        echo.
        echo ╔═══════════════════════════════════════════════════════════════╗
        echo ║          ✅ PUBLIC URLs READY! ✅                            ║
        echo ╚═══════════════════════════════════════════════════════════════╝
        echo.
        echo Getting your public URLs...
        timeout /t 3 /nobreak ^>nul
        echo.
        powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:4040/api/tunnels'; Write-Host ''; Write-Host '════════════════════════════════════════════════'; Write-Host '  YOUR PUBLIC URLs ^(Copy to phone^):' -ForegroundColor Green; Write-Host '════════════════════════════════════════════════'; Write-Host ''; foreach ^($tunnel in $response.tunnels^) { $port = $tunnel.config.addr.Split^(':'^)[-1]; $name = if^($port -eq '8080'^){'Main Viewer'}elseif^($port -eq '8888'^){'VR Viewer'}else{'Service'}; Write-Host \"$name ^(Port $port^):\" -ForegroundColor Yellow; Write-Host \"  $^($tunnel.public_url^)\" -ForegroundColor Cyan; Write-Host ''; } Write-Host '════════════════════════════════════════════════'; Write-Host 'VR Walk Mode: Add /vr-walk-mode.html to VR URL' -ForegroundColor Gray; Write-Host '════════════════════════════════════════════════'; } catch { Write-Host 'Opening ngrok dashboard for URLs...' -ForegroundColor Yellow; Start-Process 'http://localhost:4040'; }"
        echo.
        echo Opening ngrok dashboard...
        start http://localhost:4040
        echo.
        echo ══════════════════════════════════════════════════════════════
        echo  Keep all windows open! Close to stop all services.
        echo ══════════════════════════════════════════════════════════════
        echo.
        pause
    ) > START_PUBLIC_VIEWER.bat
    
    echo.
    echo ✅ Created START_PUBLIC_VIEWER.bat
    echo.
    echo You can now run your project with public URLs!
    echo.
) else (
    echo.
    echo ╔═══════════════════════════════════════════════════════════════╗
    echo ║                                                               ║
    echo ║                    ❌ ERROR ❌                               ║
    echo ║                                                               ║
    echo ╚═══════════════════════════════════════════════════════════════╝
    echo.
    echo Failed to configure ngrok with the provided authtoken.
    echo.
    echo Possible issues:
    echo   • Authtoken was incorrect or incomplete
    echo   • Copy-paste error ^(extra spaces or missing characters^)
    echo.
    echo Please try again:
    echo   1. Go to: https://dashboard.ngrok.com/get-started/your-authtoken
    echo   2. Copy the ENTIRE authtoken
    echo   3. Run this script again
    echo.
)

echo.
pause

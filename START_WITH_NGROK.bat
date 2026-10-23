@echo off
setlocal enabledelayedexpansion
REM ============================================================================
REM FloorPlan-to-3D COMPLETE SYSTEM with NGROK
REM Starts All Services + Creates Public URLs for Phone Access
REM ============================================================================
cd /d "%~dp0"

title ArchGen 3D - Starting All Services + NGROK

echo.
echo ========================================================================
echo  ArchGen 3D - COMPLETE SYSTEM with PUBLIC ACCESS
echo  Starting All Services + NGROK Tunnels...
echo ========================================================================
echo.

REM ============================================================================
REM Step 0: Check if ngrok is installed
REM ============================================================================
echo [0/8] Checking ngrok installation...
where ngrok >nul 2>&1
if errorlevel 1 (
    echo.
    echo ========================================
    echo ERROR: ngrok not found!
    echo ========================================
    echo.
    echo ngrok is required to create public URLs for phone access.
    echo.
    echo To install ngrok:
    echo   1. Download from: https://ngrok.com/download
    echo   2. Extract ngrok.exe to this folder OR add to PATH
    echo   3. Sign up at ngrok.com and get your auth token
    echo   4. Run: ngrok config add-authtoken YOUR_TOKEN
    echo.
    echo Quick install ^(if you have winget^):
    echo   winget install ngrok
    echo.
    pause
    exit /b 1
) else (
    echo [OK] ngrok is installed
)
echo.

REM ============================================================================
REM Step 1: Check AI Model
REM ============================================================================
echo [1/8] Checking AI model...
if not exist "weights\recommendation_model\Qwen2.5-0.5B-Instruct\model.safetensors" (
    echo [SKIPPED] AI model not found - using rule-based recommendations only
) else (
    echo [OK] AI model found: Qwen2.5-0.5B-Instruct
)
echo.

REM ============================================================================
REM Step 2: Detect Python Environment
REM ============================================================================
set "VENV1_PYTHON=%~dp0.venv\Scripts\python.exe"
set "VENV2_PYTHON=%~dp0venv\Scripts\python.exe"
set "PYTHON_CMD="
set "VENV_ACTIVATE="

echo [2/8] Detecting Python environment with TensorFlow...

if exist "%VENV1_PYTHON%" (
    "%VENV1_PYTHON%" -c "import tensorflow" >nul 2>&1
    if not errorlevel 1 (
        set "PYTHON_CMD=%VENV1_PYTHON%"
        set "VENV_ACTIVATE=%~dp0.venv\Scripts\activate.bat"
        echo [OK] Using .venv environment
        goto :venv_found
    )
)

if exist "%VENV2_PYTHON%" (
    "%VENV2_PYTHON%" -c "import tensorflow" >nul 2>&1
    if not errorlevel 1 (
        set "PYTHON_CMD=%VENV2_PYTHON%"
        set "VENV_ACTIVATE=%~dp0venv\Scripts\activate.bat"
        echo [OK] Using venv environment
        goto :venv_found
    )
)

echo [ERROR] No virtual environment with TensorFlow found!
pause
exit /b 1

:venv_found
echo.

REM ============================================================================
REM Step 3: Detect Network IP
REM ============================================================================
set "LOCAL_IP=127.0.0.1"
echo [3/8] Detecting network IP address...

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "TEMP_IP=%%a"
    for /f "tokens=* delims= " %%b in ("!TEMP_IP!") do set "TEMP_IP=%%b"
    echo !TEMP_IP! | findstr /B "192.168" >nul
    if not errorlevel 1 (
        set "LOCAL_IP=!TEMP_IP!"
        echo [OK] Network IP: !LOCAL_IP!
        goto :ip_found
    )
)
:ip_found
echo.

REM ============================================================================
REM Step 4: Start Main Server (Port 8080)
REM ============================================================================
echo [4/8] Starting Main Server (Port 8080)...
start "Main Server - Port 8080" cmd /k "title Main Server (8080) && cd /d "%~dp0" && call "%VENV_ACTIVATE%" && python server\main.py"
timeout /t 5 /nobreak >nul
echo [OK] Main server started
echo.

REM ============================================================================
REM Step 5: Start Recommendation Backend (Port 8000)
REM ============================================================================
echo [5/8] Starting Recommendation Backend (Port 8000)...
start "Recommendation Backend - Port 8000" cmd /k "title Recommendation Backend (8000) && cd /d "%~dp0Recommendation\backend" && call venv\Scripts\activate.bat && python app.py"
timeout /t 4 /nobreak >nul
echo [OK] Recommendation backend started
echo.

REM ============================================================================
REM Step 6: Start Recommendation Frontend (Port 5173)
REM ============================================================================
echo [6/8] Starting Recommendation Frontend (Port 5173)...
start "Recommendation Frontend - Port 5173" cmd /k "title Recommendation Frontend (5173) && cd /d "%~dp0Recommendation\frontend" && npm run dev"
timeout /t 4 /nobreak >nul
echo [OK] Recommendation frontend started
echo.

REM ============================================================================
REM Step 7: Start ArchGen UI (Port 5174)
REM ============================================================================
echo [7/8] Starting ArchGen 3D UI (Port 5174)...
start "ArchGen UI - Port 5174" cmd /k "title ArchGen UI (5174) && cd /d "%~dp0archgenui" && npm run dev"
timeout /t 4 /nobreak >nul
echo [OK] ArchGen UI started
echo.

REM ============================================================================
REM Step 8: Start NGROK Tunnels
REM ============================================================================
echo [8/8] Starting NGROK tunnels for public access...
echo.
echo Creating public URLs - this may take 10-15 seconds...
echo.

REM Start ngrok for main server (8080)
start "NGROK - Main Server (8080)" cmd /k "title NGROK Main Server && ngrok http 8080 --log stdout"
timeout /t 3 /nobreak >nul

REM Start ngrok for ArchGen UI (5174)
start "NGROK - ArchGen UI (5174)" cmd /k "title NGROK ArchGen UI && ngrok http 5174 --log stdout"
timeout /t 3 /nobreak >nul

REM Start ngrok for Recommendation Backend (8000)
start "NGROK - Recommendation API (8000)" cmd /k "title NGROK Recommendation && ngrok http 8000 --log stdout"
timeout /t 3 /nobreak >nul

echo [OK] NGROK tunnels started
echo.
echo Waiting for ngrok to initialize (10 seconds)...
timeout /t 10 /nobreak >nul

REM ============================================================================
REM Get NGROK URLs from API
REM ============================================================================
echo.
echo ========================================================================
echo  FETCHING PUBLIC URLS FROM NGROK...
echo ========================================================================
echo.

REM Use PowerShell to get ngrok URLs
powershell -Command "$tunnels = try { (Invoke-WebRequest -Uri 'http://localhost:4040/api/tunnels' -UseBasicParsing).Content | ConvertFrom-Json } catch { $null }; if ($tunnels) { Write-Host ''; Write-Host '========================================================================' -ForegroundColor Green; Write-Host ' PUBLIC URLS READY - USE THESE ON YOUR PHONE!' -ForegroundColor Green; Write-Host '========================================================================' -ForegroundColor Green; Write-Host ''; foreach ($t in $tunnels.tunnels) { if ($t.config.addr -like '*8080*') { Write-Host ' Main Server (3D Viewer):' -ForegroundColor Cyan; Write-Host '  ' $t.public_url -ForegroundColor Yellow; Write-Host ''; } elseif ($t.config.addr -like '*5174*') { Write-Host ' ArchGen 3D UI (Main Interface):' -ForegroundColor Cyan; Write-Host '  ' $t.public_url -ForegroundColor Yellow; Write-Host ''; } elseif ($t.config.addr -like '*8000*') { Write-Host ' Recommendation API:' -ForegroundColor Cyan; Write-Host '  ' $t.public_url -ForegroundColor Yellow; Write-Host ''; } }; Write-Host '========================================================================' -ForegroundColor Green; Write-Host ''; } else { Write-Host 'ERROR: Could not fetch ngrok URLs!' -ForegroundColor Red; Write-Host 'Open http://localhost:4040 in browser to see URLs manually.' -ForegroundColor Yellow; }"

echo.
echo ========================================================================
echo  LOCAL ACCESS (Same WiFi):
echo ========================================================================
echo.
echo  ArchGen 3D UI:     http://!LOCAL_IP!:5174
echo  Main Server:       http://!LOCAL_IP!:8080
echo  Recommendation:    http://!LOCAL_IP!:8000
echo.
echo ========================================================================
echo  HOW TO USE ON YOUR PHONE:
echo ========================================================================
echo.
echo  1. Open the PUBLIC URL (ngrok URL) in your phone's browser
echo  2. Login/Register on ArchGen 3D UI
echo  3. Navigate to "AI Parse" to access 3D viewer
echo  4. For VR mode: Open the viewer URL and click "Enter VR Walk Mode"
echo.
echo ========================================================================
echo  NGROK DASHBOARD:
echo ========================================================================
echo.
echo  View all tunnels and traffic: http://localhost:4040
echo.
echo ========================================================================
echo  IMPORTANT NOTES:
echo ========================================================================
echo.
echo  - HTTPS URLs (https://...) work on all devices
echo  - HTTP URLs (http://...) work but prefer HTTPS for VR
echo  - Free ngrok tunnels expire after 2 hours
echo  - Keep this window open to maintain tunnels
echo  - Close all windows to stop all services
echo.
echo ========================================================================
echo.

REM Create HTML access page with ngrok URLs
echo ^<!DOCTYPE html^> > ngrok_access.html
echo ^<html^>^<head^>^<meta charset="UTF-8"^>^<meta name="viewport" content="width=device-width,initial-scale=1"^>^<title^>ArchGen 3D - Public Access^</title^>^<style^>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;padding:20px;background:linear-gradient(135deg,#1E3A5F 0%%,#3457FF 100%%);min-height:100vh}.container{background:white;padding:30px;border-radius:20px;max-width:800px;margin:0 auto;box-shadow:0 20px 60px rgba(0,0,0,0.3)}h1{color:#1E3A5F;margin-bottom:20px;font-size:32px;text-align:center}h2{color:#1E3A5F;margin:25px 0 15px;font-size:20px}.service{background:#f8f9fa;padding:20px;border-radius:12px;margin:15px 0;border-left:4px solid #1E3A5F}.service h3{color:#1E3A5F;margin-bottom:10px;font-size:16px}.service .url{color:#3457FF;font-weight:bold;font-size:14px;word-break:break-all;margin:10px 0}.service p{color:#666;margin-top:8px;font-size:13px}.badge{display:inline-block;background:#FFD700;color:#1E3A5F;padding:4px 10px;border-radius:20px;font-size:10px;font-weight:bold;margin-left:8px}.status{text-align:center;padding:15px;background:#d4edda;border-radius:10px;color:#155724;margin-bottom:25px;font-weight:bold;font-size:14px}.button{display:inline-block;background:#1E3A5F;color:white;padding:12px 25px;border-radius:8px;text-decoration:none;font-weight:bold;margin:8px 8px 8px 0;text-align:center;transition:background 0.3s;font-size:14px;cursor:pointer;border:none}.button:hover{background:#2B4F7E}.info{background:#E3F2FD;padding:20px;border-radius:10px;margin:20px 0;border-left:4px solid #2196F3;font-size:13px;line-height:1.6}.info h3{color:#1565C0;margin-bottom:10px;font-size:16px}.refresh{text-align:center;margin:20px 0}.qr{text-align:center;margin:20px 0;padding:20px;background:#f8f9fa;border-radius:10px}@media(max-width:600px){body{padding:10px}.container{padding:20px}h1{font-size:24px}.service .url{font-size:12px}}^</style^>^</head^>^<body^>^<div class="container"^>^<h1^>🏗️ ArchGen 3D - Public Access^</h1^>^<div class="status"^>✅ All Services Running with Public URLs^</div^>^<div class="info"^>^<h3^>📱 Access from Your Phone^</h3^>^<p^>Use the HTTPS URLs below to access ArchGen 3D from your phone. These URLs work from anywhere with internet!^</p^>^</div^>^<div class="refresh"^>^<button class="button" onclick="location.href='http://localhost:4040'"^>🌐 Open NGROK Dashboard^</button^>^<button class="button" onclick="fetchUrls()"^>🔄 Refresh URLs^</button^>^</div^>^<div id="urls"^>^<p style="text-align:center;color:#666;padding:20px"^>Loading public URLs...^</p^>^</div^>^<div class="info"^>^<h3^>🎯 Quick Start^</h3^>^<ol style="margin-left:20px;color:#666"^>^<li^>Open the "ArchGen 3D UI" URL on your phone^</li^>^<li^>Login or Register^</li^>^<li^>Click "AI Parse" to access 3D viewer^</li^>^<li^>Upload floor plan and view in 3D^</li^>^<li^>For VR: Click "Enter VR Walk Mode"^</li^>^</ol^>^</div^>^</div^>^<script^>async function fetchUrls(){const r=document.getElementById('urls');r.innerHTML='^<p style="text-align:center;color:#666"^>Fetching URLs...^</p^>';try{const t=await fetch('http://localhost:4040/api/tunnels');const d=await t.json();let h='';d.tunnels.forEach(x=^>{let n='Unknown';let b='';if(x.config.addr.includes('8080')){n='Main Server (3D Viewer)';b='^<span class="badge"^>3D VIEWER^</span^>'}else if(x.config.addr.includes('5174')){n='ArchGen 3D UI';b='^<span class="badge"^>MAIN APP^</span^>'}else if(x.config.addr.includes('8000')){n='Recommendation API';b=''}h+=`^<div class="service"^>^<h3^>${n}${b}^</h3^>^<div class="url"^>${x.public_url}^</div^>^<p^>Protocol: ${x.proto.toUpperCase()} • Region: ${x.region}^</p^>^</div^>`});r.innerHTML=h||'^<p style="text-align:center;color:#999"^>No tunnels found^</p^>'}catch(e){r.innerHTML='^<p style="text-align:center;color:#dc3545"^>Error: '+e.message+'^<br^>^<br^>Make sure ngrok is running. ^<a href="http://localhost:4040" target="_blank"^>Open Dashboard^</a^>^</p^>'}}fetchUrls();setInterval(fetchUrls,30000);^</script^>^</body^>^</html^> >> ngrok_access.html

echo [CREATED] ngrok_access.html
echo.
echo Opening access page in browser...
timeout /t 2 >nul
start ngrok_access.html
start http://localhost:4040

echo.
echo ========================================================================
echo.
echo  ✅ ALL SERVICES ARE RUNNING!
echo.
echo  Keep this window open to maintain all services and tunnels.
echo  Press CTRL+C or close this window to stop everything.
echo.
echo ========================================================================
echo.
pause >nul

endlocal

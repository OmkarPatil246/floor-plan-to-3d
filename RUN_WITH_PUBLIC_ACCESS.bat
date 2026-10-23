@echo off
setlocal enabledelayedexpansion
REM ============================================================================
REM FloorPlan-to-3D COMPLETE SYSTEM WITH PUBLIC ACCESS
REM Starts All Services + Creates Public URLs for Phone Access
REM ============================================================================
cd /d "%~dp0"
color 0B
cls

echo.
echo ========================================
echo  FloorPlan-to-3D COMPLETE SYSTEM
echo  WITH PUBLIC ACCESS
echo ========================================
echo.
echo This will:
echo  1. Start Main Server (Port 8080)
echo  2. Start Recommendation Backend (Port 8000)
echo  3. Start Recommendation Frontend (Port 5173)
echo  4. Create PUBLIC URLs for phone access
echo.
echo ========================================
echo.

REM ============================================================================
REM Step 1: Check AI Model
REM ============================================================================
echo [STEP 1/7] Checking AI model...
if not exist "weights\recommendation_model\Qwen2.5-0.5B-Instruct\model.safetensors" (
    echo.
    echo ========================================
    echo WARNING: AI Model Not Found
    echo ========================================
    echo.
    echo The Qwen2.5-0.5B-Instruct model is required for AI recommendations.
    echo.
    echo Options:
    echo   1. Download now ^(~500 MB, requires internet^)
    echo   2. Skip and use rule-based system only ^(no AI^)
    echo.
    choice /c 12 /n /m "Choose option (1 or 2): "
    if errorlevel 2 (
        echo.
        echo [SKIPPED] AI model download. Using rule-based recommendations only.
        echo.
    ) else (
        echo.
        echo [DOWNLOADING] Starting model download...
        echo.
        python download_recommendation_model.py
        if errorlevel 1 (
            echo.
            echo [ERROR] Model download failed!
            echo [FALLBACK] Will use rule-based recommendations only.
            echo.
            timeout /t 3 /nobreak >nul
        ) else (
            echo.
            echo [SUCCESS] Model downloaded successfully!
            echo.
            timeout /t 2 /nobreak >nul
        )
    )
) else (
    echo [OK] AI model found
)
echo.

REM ============================================================================
REM Step 2: Detect Python Environment
REM ============================================================================
set "VENV1_PYTHON=%~dp0.venv\Scripts\python.exe"
set "VENV2_PYTHON=%~dp0venv\Scripts\python.exe"
set "PYTHON_CMD="
set "VENV_ACTIVATE="

echo [STEP 2/7] Detecting Python environment...

REM Try .venv first
if exist "%VENV1_PYTHON%" (
    "%VENV1_PYTHON%" -c "import tensorflow" >nul 2>&1
    if not errorlevel 1 (
        set "PYTHON_CMD=%VENV1_PYTHON%"
        set "VENV_ACTIVATE=%~dp0.venv\Scripts\activate.bat"
        echo [OK] Using .venv environment
        goto :venv_found
    ) else (
        echo [SKIP] .venv found but missing TensorFlow
    )
)

REM Try venv second
if exist "%VENV2_PYTHON%" (
    "%VENV2_PYTHON%" -c "import tensorflow" >nul 2>&1
    if not errorlevel 1 (
        set "PYTHON_CMD=%VENV2_PYTHON%"
        set "VENV_ACTIVATE=%~dp0venv\Scripts\activate.bat"
        echo [OK] Using venv environment
        goto :venv_found
    ) else (
        echo [SKIP] venv found but missing TensorFlow
    )
)

echo [ERROR] No virtual environment with TensorFlow found!
echo Please run COMPLETE_INSTALL.bat first.
pause
exit /b 1

:venv_found
set "MAIN_MODEL=%~dp0weights\maskrcnn_15_epochs.h5"
if not exist "!MAIN_MODEL!" (
    echo [ERROR] Main model weights file not found!
    echo         Expected: weights\maskrcnn_15_epochs.h5
    pause
    exit /b 1
)
echo [OK] Main model found
echo.

REM ============================================================================
REM Step 3: Detect Network IP
REM ============================================================================
set "LOCAL_IP=127.0.0.1"
echo [STEP 3/7] Detecting network IP address...

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "TEMP_IP=%%a"
    for /f "tokens=* delims= " %%b in ("!TEMP_IP!") do set "TEMP_IP=%%b"
    
    echo !TEMP_IP! | findstr /B "192.168" >nul
    if not errorlevel 1 (
        set "LOCAL_IP=!TEMP_IP!"
        echo [OK] Found network IP: !LOCAL_IP!
        goto :ip_found
    )
)
:ip_found
echo.

REM ============================================================================
REM Step 4: Start Main Server (Port 8080)
REM ============================================================================
echo [STEP 4/7] Starting Main Floorplan Server ^(Port 8080^)...
start "Main Server (Port 8080)" cmd /k "cd /d "%~dp0" && call "%VENV_ACTIVATE%" && python server\main.py"
timeout /t 4 /nobreak >nul

REM ============================================================================
REM Step 5: Start Recommendation Backend (Port 8000)
REM ============================================================================
echo [STEP 5/7] Starting Recommendation Backend ^(Port 8000^)...
start "Recommendation Backend (Port 8000)" cmd /k "cd /d "%~dp0Recommendation\backend" && call venv\Scripts\activate.bat && python app.py"
timeout /t 4 /nobreak >nul

REM ============================================================================
REM Step 6: Start Recommendation Frontend (Port 5173)
REM ============================================================================
echo [STEP 6/7] Starting Recommendation Frontend ^(Port 5173^)...
start "Recommendation Frontend (Port 5173)" cmd /k "cd /d "%~dp0Recommendation\frontend" && npm run dev"
timeout /t 5 /nobreak >nul

REM ============================================================================
REM Step 7: Setup Public Access with Ngrok
REM ============================================================================
echo [STEP 7/7] Setting up PUBLIC ACCESS for phone...
echo.
echo ========================================
echo   CREATING PUBLIC URLS
echo ========================================
echo.

REM Check if ngrok exists in viewer folder
cd /d "%~dp0viewer"
if not exist "ngrok.exe" (
    echo [INFO] ngrok not found. Installing...
    echo.
    echo Downloading ngrok...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip' -OutFile 'ngrok.zip'}"
    
    if exist ngrok.zip (
        echo Extracting ngrok...
        powershell -Command "Expand-Archive -Path 'ngrok.zip' -DestinationPath '.' -Force"
        del ngrok.zip
        echo [OK] ngrok installed successfully!
    ) else (
        echo [ERROR] Failed to download ngrok
        echo.
        echo You can still access locally using:
        echo http://!LOCAL_IP!:8080
        echo.
        goto :skip_ngrok
    )
)

echo [OK] ngrok ready
echo.

REM Start ngrok for main server (Port 8080)
echo Starting public tunnel for Main Server (Port 8080)...
start "Ngrok - Main Server (8080)" cmd /k "cd /d "%~dp0viewer" && ngrok.exe http 8080"

timeout /t 6 /nobreak >nul

REM Start ngrok for recommendation frontend (Port 5173)
echo Starting public tunnel for Recommendation UI (Port 5173)...
start "Ngrok - Recommendations (5173)" cmd /k "cd /d "%~dp0viewer" && ngrok.exe http 5173"

timeout /t 6 /nobreak >nul

:skip_ngrok
cd /d "%~dp0"

REM ============================================================================
REM Display Access Information
REM ============================================================================
cls
echo.
echo ========================================
echo  ALL SERVICES RUNNING!
echo ========================================
echo.
echo ========================================
echo  LOCAL ACCESS (Same WiFi):
echo ========================================
echo.
echo  Main Viewer:       http://localhost:8080
echo  Recommendation UI: http://localhost:5173
echo  Backend API:       http://localhost:8000
echo.
echo  Network Access:    http://!LOCAL_IP!:8080
echo  Network Recommendations: http://!LOCAL_IP!:5173
echo.
echo ========================================
echo  PUBLIC ACCESS (Any Network/Phone):
echo ========================================
echo.

if exist "viewer\ngrok.exe" (
    echo Getting public URLs from ngrok...
    timeout /t 2 /nobreak >nul
    echo.
    
    powershell -Command "try { $tunnels = Invoke-RestMethod -Uri 'http://localhost:4040/api/tunnels' -ErrorAction Stop; if ($tunnels.tunnels.Count -ge 1) { $mainUrl = $tunnels.tunnels[0].public_url; Write-Host ' Main Viewer (Port 8080):' -NoNewline; Write-Host \" $mainUrl\" -ForegroundColor Green; Write-Host ' Copy this link to access from your phone!'; Write-Host ''; } else { Write-Host ' Ngrok starting... Check ngrok windows for URLs'; } } catch { Write-Host ' Ngrok starting... Open http://localhost:4040 for URLs'; }"
    
    echo.
    echo To see ALL public URLs, open: http://localhost:4040
    echo ^(This is the ngrok dashboard^)
    echo.
    echo.
    echo COPY THE GREEN LINKS ABOVE TO YOUR PHONE!
    echo They work from ANYWHERE in the world!
    echo.
) else (
    echo Could not install ngrok.
    echo Use local network access instead: http://!LOCAL_IP!:8080
    echo.
)

echo ========================================
echo  HOW TO USE:
echo ========================================
echo.
echo  FOR PHONE ACCESS:
echo  1. Copy the PUBLIC URL (green link above)
echo  2. Open it in your phone's browser
echo  3. Works from ANY network, ANYWHERE!
echo.
echo  FOR LOCAL TESTING:
echo  1. Open http://localhost:8080 in browser
echo  2. Upload a floor plan image
echo  3. Click "Get AI Recommendations"
echo  4. View 3D model and recommendations
echo.
echo ========================================
echo  IMPORTANT NOTES:
echo ========================================
echo.
echo  - Keep ALL windows open (don't close them)
echo  - Free ngrok URLs change each time
echo  - For permanent URL, sign up at ngrok.com
echo  - Ngrok dashboard: http://localhost:4040
echo.
echo ========================================
echo.

REM Create access HTML file
echo ^<!DOCTYPE html^> > phone_access.html
echo ^<html^>^<head^>^<meta charset="UTF-8"^>^<title^>Phone Access Links^</title^>^<style^>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;padding:20px;background:linear-gradient^(135deg,#667eea 0%%,#764ba2 100%%^);min-height:100vh}.container{background:white;padding:30px;border-radius:20px;max-width:900px;margin:0 auto;box-shadow:0 20px 60px rgba^(0,0,0,0.3^)}h1{color:#333;margin-bottom:20px;font-size:28px;text-align:center}.section{background:#f8f9fa;padding:20px;border-radius:12px;margin:20px 0;border-left:4px solid #667eea}.section h2{color:#667eea;margin-bottom:15px;font-size:20px}.section a{color:#667eea;text-decoration:none;font-weight:bold;font-size:16px;word-break:break-all;display:block;margin:10px 0;padding:10px;background:white;border-radius:8px}.section a:hover{background:#e9ecef}.section p{color:#666;margin-top:10px;font-size:14px}.status{text-align:center;padding:15px;background:#d4edda;border-radius:10px;color:#155724;margin-bottom:20px;font-weight:bold;font-size:18px}.important{background:#fff3cd;padding:20px;border-radius:10px;margin:20px 0;border-left:4px solid #ffc107;color:#856404}.button{display:inline-block;background:#667eea;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:10px 10px 0 0;transition:background 0.3s}.button:hover{background:#5568d3}^</style^>^</head^>^<body^>^<div class="container"^>^<h1^>📱 FloorPlan-to-3D - Phone Access^</h1^>^<div class="status"^>✅ All Services Running with Public Access^</div^>^<div class="section"^>^<h2^>🌐 LOCAL Network Access ^(Same WiFi^)^</h2^>^<a href="http://!LOCAL_IP!:8080" target="_blank"^>http://!LOCAL_IP!:8080^</a^>^<p^>Use this link on devices connected to the same WiFi network^</p^>^</div^>^<div class="section"^>^<h2^>🌍 PUBLIC Access ^(Any Network^)^</h2^>^<p^>Get your public URLs from the ngrok dashboard:^</p^>^<a href="http://localhost:4040" target="_blank"^>http://localhost:4040 - Ngrok Dashboard^</a^>^<p^>Copy the ngrok URL from the dashboard and send it to your phone!^</p^>^<p^>The URL will look like: https://xxxx-xx-xx-xxx-xxx.ngrok-free.app^</p^>^</div^>^<div class="section"^>^<h2^>💡 Recommendation Interface^</h2^>^<a href="http://localhost:5173" target="_blank"^>http://localhost:5173^</a^>^<p^>View AI recommendations and floor plan analysis^</p^>^</div^>^<div class="important"^>^<h3 style="margin-bottom:10px"^>⚠️ Important Notes:^</h3^>^<p^>• Keep all terminal windows open^</p^>^<p^>• Free ngrok URLs are temporary and change each restart^</p^>^<p^>• For permanent URLs, create a free ngrok account at ngrok.com^</p^>^<p^>• Check ngrok dashboard for active public URLs^</p^>^</div^>^<div style="text-align:center;margin-top:30px"^>^<a href="http://localhost:8080" class="button"^>🚀 Open Main Viewer^</a^>^<a href="http://localhost:4040" class="button"^>🌐 Ngrok Dashboard^</a^>^<a href="http://localhost:5173" class="button"^>💡 Recommendations^</a^>^</div^>^</div^>^</body^>^</html^> >> phone_access.html

echo [CREATED] phone_access.html with all access links
echo.
echo Opening access page...
timeout /t 2 >nul
start phone_access.html
start http://localhost:4040

echo.
echo ========================================
echo  Press any key to keep running...
echo  ^(Close this window to stop everything^)
echo ========================================
echo.
pause >nul

endlocal

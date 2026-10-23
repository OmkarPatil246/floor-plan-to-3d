@echo off
setlocal enabledelayedexpansion
REM ============================================================================
REM Complete Setup and Restart - FloorPlan-to-3D
REM ============================================================================
cd /d "%~dp0"

echo.
echo ========================================
echo  Complete System Setup and Restart
echo ========================================
echo.

REM ============================================================================
REM Step 1: Stop any running services
REM ============================================================================
echo [1/5] Stopping any existing services...
taskkill /FI "WINDOWTITLE eq Main Server*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Recommendation Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Recommendation Frontend*" /F >nul 2>&1
echo [OK] Cleared existing services
timeout /t 2 /nobreak >nul
echo.

REM ============================================================================
REM Step 2: Setup Backend
REM ============================================================================
echo [2/5] Setting up Recommendation Backend...
cd Recommendation\backend

if not exist "venv\Scripts\python.exe" (
    echo [CREATING] Backend virtual environment...
    python -m venv venv
)

echo [INSTALLING] Backend dependencies (FastAPI, Uvicorn)...
call venv\Scripts\activate.bat
pip install --upgrade pip >nul 2>&1
pip install --default-timeout=200 fastapi uvicorn pydantic

echo [OPTIONAL] Installing AI support (transformers, torch)...
pip install --default-timeout=300 transformers torch accelerate sentencepiece
if errorlevel 1 (
    echo [NOTE] AI packages skipped - will use rule-based system
)

call deactivate
cd ..\..
echo [OK] Backend ready
echo.

REM ============================================================================
REM Step 3: Setup Frontend
REM ============================================================================
echo [3/5] Setting up Recommendation Frontend...
cd Recommendation\frontend

if not exist "node_modules" (
    echo [INSTALLING] Frontend packages (this may take 5-10 minutes)...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Frontend setup failed!
        cd ..\..
        pause
        exit /b 1
    )
) else (
    echo [OK] Frontend packages already installed
)

cd ..\..
echo [OK] Frontend ready
echo.

REM ============================================================================
REM Step 4: Detect Network IP
REM ============================================================================
echo [4/5] Detecting network configuration...
set "LOCAL_IP=127.0.0.1"
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "TEMP_IP=%%a"
    for /f "tokens=* delims= " %%b in ("!TEMP_IP!") do set "TEMP_IP=%%b"
    echo !TEMP_IP! | findstr /B "192.168" >nul
    if not errorlevel 1 (
        set "LOCAL_IP=!TEMP_IP!"
        goto :ip_found
    )
    echo !TEMP_IP! | findstr /B "10." >nul
    if not errorlevel 1 (
        set "LOCAL_IP=!TEMP_IP!"
        goto :ip_found
    )
)
:ip_found
echo [OK] Network IP: !LOCAL_IP!
echo.

REM ============================================================================
REM Step 5: Start All Services
REM ============================================================================
echo [5/5] Starting all services...
echo.
echo ========================================
echo  STARTING SERVICES
echo ========================================
echo.

echo [1/3] Starting Main Server (Port 8080)...
start "Main Server (8080)" cmd /k "cd /d "%~dp0" && call .venv\Scripts\activate.bat && python server\main.py"
timeout /t 5 /nobreak >nul

echo [2/3] Starting Recommendation Backend (Port 8000)...
start "Recommendation Backend (8000)" cmd /k "cd /d "%~dp0Recommendation\backend" && call venv\Scripts\activate.bat && python app.py"
timeout /t 5 /nobreak >nul

echo [3/3] Starting Recommendation Frontend (Port 5173)...
start "Recommendation Frontend (5173)" cmd /k "cd /d "%~dp0Recommendation\frontend" && npm run dev"
timeout /t 4 /nobreak >nul

echo.
echo ========================================
echo  ALL SERVICES STARTED!
echo ========================================
echo.
echo  Main Viewer:       http://localhost:8080
echo  Backend API:       http://localhost:8000  
echo  Recommendation UI: http://localhost:5173
echo.
echo  Network Access:    http://!LOCAL_IP!:8080
echo.
echo ========================================
echo  WAITING FOR SERVICES TO BE READY
echo ========================================
echo.
echo  Please wait 15-20 seconds for all services to fully initialize...
echo.

REM Create access page
echo ^<!DOCTYPE html^> > system_access.html
echo ^<html^>^<head^>^<meta charset="UTF-8"^>^<title^>FloorPlan System^</title^>^<style^>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;padding:40px;background:linear-gradient(135deg,#667eea 0%%,#764ba2 100%%);min-height:100vh}.container{background:white;padding:40px;border-radius:20px;max-width:900px;margin:0 auto;box-shadow:0 20px 60px rgba(0,0,0,0.3)}h1{color:#333;margin-bottom:30px;font-size:32px;text-align:center}.service{background:#f8f9fa;padding:20px;border-radius:12px;margin:15px 0;border-left:4px solid #667eea;transition:transform 0.2s}.service:hover{transform:translateX(5px)}.service h3{color:#333;margin-bottom:10px;font-size:18px}.service a{color:#667eea;text-decoration:none;font-weight:bold;font-size:16px}.service a:hover{text-decoration:underline}.service p{color:#666;margin-top:8px;font-size:14px}.status{text-align:center;padding:20px;background:#d4edda;border-radius:10px;color:#155724;margin-bottom:30px;font-weight:bold;font-size:18px}.button{display:inline-block;background:#667eea;color:white;padding:15px 30px;border-radius:8px;text-decoration:none;font-weight:bold;margin:10px 10px 10px 0;transition:background 0.3s}.button:hover{background:#5568d3}.network{background:#fff3cd;padding:20px;border-radius:10px;margin:25px 0;border-left:4px solid #ffc107}.network h3{color:#856404;margin-bottom:10px}.network p{color:#856404;margin:5px 0}.instructions{background:#e7f3ff;padding:20px;border-radius:10px;margin:25px 0;border-left:4px solid #2196F3}.instructions h3{color:#1976D2;margin-bottom:15px}.instructions ol{margin-left:20px;color:#555}.instructions li{margin:10px 0;line-height:1.6}^</style^>^</head^>^<body^>^<div class="container"^>^<h1^>🏗️ FloorPlan-to-3D System^</h1^>^<div class="status"^>✅ All Services Running^</div^>^<div class="service"^>^<h3^>🎨 Main Viewer - Upload ^& View 3D^</h3^>^<a href="http://localhost:8080" target="_blank"^>http://localhost:8080^</a^>^<p^>Upload floor plans, process them, and view in 3D^</p^>^</div^>^<div class="service"^>^<h3^>🔧 Backend API - Recommendation Engine^</h3^>^<a href="http://localhost:8000/docs" target="_blank"^>http://localhost:8000/docs^</a^>^<p^>Backend API for AI recommendations (check /docs for API documentation)^</p^>^</div^>^<div class="service"^>^<h3^>💡 Recommendation Interface^</h3^>^<a href="http://localhost:5173" target="_blank"^>http://localhost:5173^</a^>^<p^>View AI recommendations and floor plan analysis^</p^>^</div^>^<div class="network"^>^<h3^>🌐 Network Access^</h3^>^<p^>Share with other devices: ^<strong^>http://!LOCAL_IP!:8080^</strong^>^</p^>^<p^>Make sure devices are on the same WiFi network^</p^>^</div^>^<div class="instructions"^>^<h3^>📋 How to Use AI Recommendations^</h3^>^<ol^>^<li^>Open the ^<strong^>Main Viewer^</strong^> (http://localhost:8080)^</li^>^<li^>Upload a floor plan image using the upload button^</li^>^<li^>Click ^<strong^>"Process"^</strong^> to detect rooms, walls, doors, and windows^</li^>^<li^>Wait for 3D model to generate^</li^>^<li^>Click ^<strong^>"Get AI Recommendations"^</strong^> button^</li^>^<li^>View recommendations in the recommendation interface^</li^>^</ol^>^</div^>^<div style="text-align:center;margin-top:30px"^>^<a href="http://localhost:8080" class="button"^>🚀 Open Main Viewer^</a^>^<a href="http://localhost:5173" class="button"^>💡 Open Recommendations^</a^>^<a href="http://localhost:8000/docs" class="button"^>📚 API Docs^</a^>^</div^>^</div^>^</body^>^</html^> >> system_access.html

timeout /t 15 /nobreak >nul

echo Opening system access page...
start system_access.html
timeout /t 2 >nul
start http://localhost:8080

echo.
echo ========================================
echo  TROUBLESHOOTING
echo ========================================
echo.
echo  If AI Recommendations don't work:
echo  1. Check that all 3 terminal windows are running
echo  2. Visit http://localhost:8000/docs to verify backend is up
echo  3. Visit http://localhost:5173 to verify frontend is up
echo  4. Wait 20 seconds after startup
echo  5. Look for errors in the terminal windows
echo.
echo  Press any key to keep this window open...
pause >nul

@echo off
setlocal enabledelayedexpansion
REM ============================================================================
REM FloorPlan-to-3D - Quick Start (Use Existing Environment)
REM This script assumes dependencies are already installed
REM ============================================================================
cd /d "%~dp0"

echo.
echo ========================================
echo  FloorPlan-to-3D Quick Start
echo ========================================
echo.

REM Check if virtual environment exists
if not exist ".venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment not found!
    echo Please run SETUP_ROBUST.bat first to install dependencies.
    echo.
    pause
    exit /b 1
)

REM Check main model
if not exist "weights\maskrcnn_15_epochs.h5" (
    echo [ERROR] Main model weights not found!
    echo Expected: weights\maskrcnn_15_epochs.h5
    echo.
    pause
    exit /b 1
)

echo [OK] Environment found
echo.

REM Detect Network IP
set "LOCAL_IP=127.0.0.1"
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "TEMP_IP=%%a"
    for /f "tokens=* delims= " %%b in ("!TEMP_IP!") do set "TEMP_IP=%%b"
    echo !TEMP_IP! | findstr /B "192.168" >nul
    if not errorlevel 1 (
        set "LOCAL_IP=!TEMP_IP!"
        goto :ip_found
    )
)
:ip_found

echo ========================================
echo  Starting All Services
echo ========================================
echo.

REM Start Main Server (Port 8080)
echo [1/3] Starting Main Server (Port 8080)...
start "Main Server (8080)" cmd /k "cd /d "%~dp0" && call .venv\Scripts\activate.bat && python server\main.py"
timeout /t 4 /nobreak >nul

REM Start Recommendation Backend (Port 8000)
echo [2/3] Starting Recommendation Backend (Port 8000)...
if exist "Recommendation\backend\venv\Scripts\python.exe" (
    start "Recommendation Backend (8000)" cmd /k "cd /d "%~dp0Recommendation\backend" && call venv\Scripts\activate.bat && python app.py"
    timeout /t 4 /nobreak >nul
) else (
    echo [SKIPPED] Backend environment not found
)

REM Start Recommendation Frontend (Port 5173)
echo [3/3] Starting Recommendation Frontend (Port 5173)...
if exist "Recommendation\frontend\node_modules" (
    start "Recommendation Frontend (5173)" cmd /k "cd /d "%~dp0Recommendation\frontend" && npm run dev"
    timeout /t 3 /nobreak >nul
) else (
    echo [SKIPPED] Frontend dependencies not found
)

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
echo.

REM Create quick access HTML
echo ^<!DOCTYPE html^> > system_access.html
echo ^<html^>^<head^>^<meta charset="UTF-8"^>^<title^>FloorPlan System^</title^>^<style^>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;padding:40px;background:linear-gradient(135deg,#667eea 0%%,#764ba2 100%%);min-height:100vh}.container{background:white;padding:40px;border-radius:20px;max-width:800px;margin:0 auto;box-shadow:0 20px 60px rgba(0,0,0,0.3)}h1{color:#333;margin-bottom:30px;font-size:32px;text-align:center}.service{background:#f8f9fa;padding:20px;border-radius:12px;margin:15px 0;border-left:4px solid #667eea}.service h3{color:#333;margin-bottom:10px}.service a{color:#667eea;text-decoration:none;font-weight:bold;font-size:18px}.service a:hover{text-decoration:underline}.service p{color:#666;margin-top:8px;font-size:14px}.status{text-align:center;padding:15px;background:#d4edda;border-radius:10px;color:#155724;margin-bottom:30px;font-weight:bold}.button{display:inline-block;background:#667eea;color:white;padding:15px 30px;border-radius:8px;text-decoration:none;font-weight:bold;margin:10px 10px 10px 0;transition:background 0.3s}.button:hover{background:#5568d3}^</style^>^</head^>^<body^>^<div class="container"^>^<h1^>🏗️ FloorPlan-to-3D^</h1^>^<div class="status"^>✅ Services Running^</div^>^<div class="service"^>^<h3^>🎨 Main Viewer^</h3^>^<a href="http://localhost:8080" target="_blank"^>http://localhost:8080^</a^>^<p^>Upload floor plans and view in 3D^</p^>^</div^>^<div class="service"^>^<h3^>🔧 Backend API^</h3^>^<a href="http://localhost:8000" target="_blank"^>http://localhost:8000^</a^>^</div^>^<div class="service"^>^<h3^>💡 Recommendations^</h3^>^<a href="http://localhost:5173" target="_blank"^>http://localhost:5173^</a^>^</div^>^<div style="text-align:center;margin-top:30px"^>^<a href="http://localhost:8080" class="button"^>🚀 Open Viewer^</a^>^</div^>^</div^>^</body^>^</html^> >> system_access.html

start system_access.html
timeout /t 2 >nul
start http://localhost:8080

echo.
echo Press any key to exit...
pause >nul

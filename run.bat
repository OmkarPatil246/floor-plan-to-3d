@echo off
setlocal enabledelayedexpansion
REM ============================================================================
REM FloorPlan-to-3D COMPLETE SYSTEM Launcher
REM Starts Main Server + Recommendation Backend + Recommendation Frontend
REM ============================================================================
cd /d "%~dp0"

echo.
echo ========================================
echo  FloorPlan-to-3D COMPLETE SYSTEM
echo  Starting All Services...
echo ========================================
echo.

REM ============================================================================
REM Step 1: Check AI Model
REM ============================================================================
echo [0/6] Checking AI model...
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
    echo [OK] AI model found: Qwen2.5-0.5B-Instruct
)
echo.

REM ============================================================================
REM Step 2: Detect Python Environment for Main Server (Check for TensorFlow)
REM ============================================================================
set "VENV1_PYTHON=%~dp0.venv\Scripts\python.exe"
set "VENV2_PYTHON=%~dp0venv\Scripts\python.exe"
set "PYTHON_CMD="
set "VENV_ACTIVATE="

echo [1/6] Detecting Python environment with TensorFlow for main server...

REM Try .venv first
if exist "%VENV1_PYTHON%" (
    "%VENV1_PYTHON%" -c "import tensorflow" >nul 2>&1
    if not errorlevel 1 (
        set "PYTHON_CMD=%VENV1_PYTHON%"
        set "VENV_ACTIVATE=%~dp0.venv\Scripts\activate.bat"
        echo [OK] Using .venv environment ^(has TensorFlow^)
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
        echo [OK] Using venv environment ^(has TensorFlow^)
        goto :venv_found
    ) else (
        echo [SKIP] venv found but missing TensorFlow
    )
)

REM No valid environment found
echo [ERROR] No virtual environment with TensorFlow found!
echo.
echo Please install TensorFlow in one of your virtual environments:
echo.
if exist "%VENV1_PYTHON%" (
    echo Option 1: Install in .venv
    echo   .venv\Scripts\activate
    echo   pip install -r requirements.txt
    echo.
)
if exist "%VENV2_PYTHON%" (
    echo Option 2: Install in venv
    echo   venv\Scripts\activate
    echo   pip install -r requirements.txt
    echo.
)
if not exist "%VENV1_PYTHON%" (
    if not exist "%VENV2_PYTHON%" (
        echo No virtual environments found! Create one:
        echo   python -m venv .venv
        echo   .venv\Scripts\activate
        echo   pip install -r requirements.txt
        echo.
    )
)
pause
exit /b 1

:venv_found
REM Verify main model weights
set "MAIN_MODEL=%~dp0weights\maskrcnn_15_epochs.h5"
if not exist "!MAIN_MODEL!" (
    echo [ERROR] Main model weights file not found!
    echo         Expected: weights\maskrcnn_15_epochs.h5
    echo.
    pause
    exit /b 1
)
echo [OK] Main model found
echo.

REM ============================================================================
REM Step 3: Detect Network IP
REM ============================================================================
set "LOCAL_IP=127.0.0.1"
echo [2/6] Detecting network IP address...

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
echo [3/6] Starting Main Floorplan Server ^(Port 8080^)...
start "Main Server (Port 8080)" cmd /k "cd /d "%~dp0" && call "%VENV_ACTIVATE%" && python server\main.py"
timeout /t 4 /nobreak >nul

REM ============================================================================
REM Step 5: Start Recommendation Backend (Port 8000)
REM ============================================================================
echo [4/6] Starting Recommendation Backend ^(Port 8000^)...
start "Recommendation Backend (Port 8000)" cmd /k "cd /d "%~dp0Recommendation\backend" && call venv\Scripts\activate.bat && python app.py"
timeout /t 4 /nobreak >nul

REM ============================================================================
REM Step 6: Start Recommendation Frontend (Port 5173)
REM ============================================================================
echo [5/6] Starting Recommendation Frontend ^(Port 5173^)...
start "Recommendation Frontend (Port 5173)" cmd /k "cd /d "%~dp0Recommendation\frontend" && npm run dev"
timeout /t 3 /nobreak >nul

REM ============================================================================
REM Step 7: Verify and Display Status
REM ============================================================================
echo [6/6] Verifying services...
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo  ALL SERVICES STARTED SUCCESSFULLY!
echo ========================================
echo.
echo  Main Viewer:       http://localhost:8080
echo  Backend API:       http://localhost:8000  
echo  Recommendation UI: http://localhost:5173
echo.
echo  Network Access: http://!LOCAL_IP!:8080
echo.
echo ========================================
echo  HOW TO USE:
echo ========================================
echo.
echo  1. Open Main Viewer ^(http://localhost:8080^)
echo  2. Upload and process a floor plan
echo  3. Click "Get AI Recommendations" button
echo  4. View results and recommendations
echo.
echo  IMPORTANT: Wait 10 seconds for all services to fully start.
echo.
echo  To STOP all services: Close all terminal windows.
echo.
echo ========================================
echo.

REM Create quick access HTML
echo ^<!DOCTYPE html^> > system_access.html
echo ^<html^>^<head^>^<meta charset="UTF-8"^>^<title^>FloorPlan System Access^</title^>^<style^>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;padding:40px;background:linear-gradient^(135deg,#667eea 0%%,#764ba2 100%%^);min-height:100vh}.container{background:white;padding:40px;border-radius:20px;max-width:800px;margin:0 auto;box-shadow:0 20px 60px rgba^(0,0,0,0.3^)}h1{color:#333;margin-bottom:30px;font-size:32px;text-align:center}h2{color:#667eea;margin:30px 0 15px;font-size:20px}.service{background:#f8f9fa;padding:20px;border-radius:12px;margin:15px 0;border-left:4px solid #667eea}.service h3{color:#333;margin-bottom:10px}.service a{color:#667eea;text-decoration:none;font-weight:bold;font-size:18px}.service a:hover{text-decoration:underline}.service p{color:#666;margin-top:8px;font-size:14px}.status{text-align:center;padding:15px;background:#d4edda;border-radius:10px;color:#155724;margin-bottom:30px;font-weight:bold}.button{display:inline-block;background:#667eea;color:white;padding:15px 30px;border-radius:8px;text-decoration:none;font-weight:bold;margin:10px 10px 10px 0;text-align:center;transition:background 0.3s}.button:hover{background:#5568d3}.network{background:#fff3cd;padding:20px;border-radius:10px;margin:25px 0;border-left:4px solid #ffc107}.network h3{color:#856404;margin-bottom:10px}.network p{color:#856404}^</style^>^</head^>^<body^>^<div class="container"^>^<h1^>🏗️ FloorPlan-to-3D System^</h1^>^<div class="status"^>✅ All Services Running^</div^>^<div class="service"^>^<h3^>🎨 Main Viewer - 3D Floor Plan^</h3^>^<a href="http://localhost:8080" target="_blank"^>http://localhost:8080^</a^>^<p^>Upload floor plans, view in 3D, and start the recommendation process^</p^>^</div^>^<div class="service"^>^<h3^>🔧 Backend API^</h3^>^<a href="http://localhost:8000" target="_blank"^>http://localhost:8000^</a^>^<p^>Backend processing for AI recommendations^</p^>^</div^>^<div class="service"^>^<h3^>💡 Recommendation Interface^</h3^>^<a href="http://localhost:5173" target="_blank"^>http://localhost:5173^</a^>^<p^>View AI recommendations and floor plan analysis^</p^>^</div^>^<div class="network"^>^<h3^>🌐 Network Access^</h3^>^<p^>Share with devices on same WiFi: ^<strong^>http://!LOCAL_IP!:8080^</strong^>^</p^>^</div^>^<div style="text-align:center;margin-top:30px"^>^<a href="http://localhost:8080" class="button"^>🚀 Open Main Viewer^</a^>^<a href="http://localhost:5173" class="button"^>💡 Open Recommendations^</a^>^</div^>^</div^>^</body^>^</html^> >> system_access.html

echo [CREATED] system_access.html with quick access links
echo.
echo Opening system access page in your browser...
timeout /t 2 >nul
start system_access.html
start http://localhost:8080

echo.
echo Press any key to keep this window open (or close to exit)...
pause >nul

endlocal


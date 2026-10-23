@echo off
setlocal enabledelayedexpansion
REM ============================================================================
REM FloorPlan-to-3D - Complete Setup and Run Script
REM ============================================================================
cd /d "%~dp0"

echo.
echo ========================================
echo  FloorPlan-to-3D Setup and Run
echo ========================================
echo.

REM ============================================================================
REM Step 1: Check Python
REM ============================================================================
echo [1/8] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found! Please install Python 3.10 or 3.11
    pause
    exit /b 1
)
for /f "tokens=2" %%v in ('python --version 2^>^&1') do set PYTHON_VERSION=%%v
echo [OK] Python %PYTHON_VERSION% found
echo.

REM ============================================================================
REM Step 2: Setup Main Server Virtual Environment
REM ============================================================================
echo [2/8] Setting up main server virtual environment...
if not exist ".venv\Scripts\python.exe" (
    echo [CREATING] Creating .venv virtual environment...
    python -m venv .venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment!
        pause
        exit /b 1
    )
    echo [OK] Virtual environment created
) else (
    echo [OK] Virtual environment already exists
)

echo [INSTALLING] Installing main server dependencies...
call .venv\Scripts\activate.bat
pip install --upgrade pip >nul 2>&1
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies!
    echo Please check your internet connection and try again.
    pause
    exit /b 1
)
call deactivate
echo [OK] Main server dependencies installed
echo.

REM ============================================================================
REM Step 3: Check Main Model Weights
REM ============================================================================
echo [3/8] Checking main model weights...
if not exist "weights\maskrcnn_15_epochs.h5" (
    echo [ERROR] Main model weights not found!
    echo Expected: weights\maskrcnn_15_epochs.h5
    echo.
    echo Please download the model weights and place them in the weights folder.
    pause
    exit /b 1
)
echo [OK] Main model weights found
echo.

REM ============================================================================
REM Step 4: Setup Recommendation Backend Environment
REM ============================================================================
echo [4/8] Setting up recommendation backend environment...
cd Recommendation\backend
if not exist "venv\Scripts\python.exe" (
    echo [CREATING] Creating backend virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create backend virtual environment!
        cd ..\..
        pause
        exit /b 1
    )
    echo [OK] Backend virtual environment created
) else (
    echo [OK] Backend virtual environment already exists
)

echo [INSTALLING] Installing backend dependencies...
call venv\Scripts\activate.bat
pip install --upgrade pip >nul 2>&1
pip install -r requirements.txt
if errorlevel 1 (
    echo [WARNING] Some backend dependencies may have failed
    echo The system will try to run anyway
)
call deactivate
cd ..\..
echo [OK] Backend setup complete
echo.

REM ============================================================================
REM Step 5: Check Qwen Model (Optional but Recommended)
REM ============================================================================
echo [5/8] Checking Qwen AI model...
set "QWEN_PATH=weights\recommendation_model\Qwen2.5-0.5B-Instruct"
if not exist "%QWEN_PATH%\model.safetensors" (
    echo.
    echo ========================================
    echo WARNING: Qwen AI Model Not Found
    echo ========================================
    echo.
    echo The Qwen2.5-0.5B-Instruct model provides enhanced AI recommendations.
    echo.
    echo Expected location: %QWEN_PATH%\
    echo.
    echo If you have the model files, please place them in:
    echo   %CD%\%QWEN_PATH%\
    echo.
    echo Required files:
    echo   - model.safetensors
    echo   - config.json
    echo   - tokenizer.json
    echo   - tokenizer_config.json
    echo.
    echo The system will still work using rule-based recommendations.
    echo.
    choice /c YN /n /m "Continue without AI model? (Y/N): "
    if errorlevel 2 (
        echo.
        echo Please add the Qwen model files and run this script again.
        pause
        exit /b 1
    )
    echo.
    echo [SKIPPED] Continuing without AI model (using rule-based system)
) else (
    echo [OK] Qwen AI model found
)
echo.

REM ============================================================================
REM Step 6: Check Node.js for Frontend
REM ============================================================================
echo [6/8] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found!
    echo.
    echo Please install Node.js from https://nodejs.org/
    echo Recommended version: 18.x or higher
    pause
    exit /b 1
)
for /f "tokens=1" %%v in ('node --version 2^>^&1') do set NODE_VERSION=%%v
echo [OK] Node.js %NODE_VERSION% found
echo.

REM ============================================================================
REM Step 7: Setup Frontend Dependencies
REM ============================================================================
echo [7/8] Setting up frontend dependencies...
cd Recommendation\frontend
if not exist "node_modules" (
    echo [INSTALLING] Installing frontend packages...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install frontend dependencies!
        cd ..\..
        pause
        exit /b 1
    )
    echo [OK] Frontend dependencies installed
) else (
    echo [OK] Frontend dependencies already installed
)
cd ..\..
echo.

REM ============================================================================
REM Step 8: All Setup Complete - Starting Services
REM ============================================================================
echo [8/8] Setup complete! Starting all services...
echo.
echo ========================================
echo  STARTING ALL SERVICES
echo ========================================
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

REM Start Main Server (Port 8080)
echo [STARTING] Main Floorplan Server (Port 8080)...
start "Main Server (8080)" cmd /k "cd /d "%~dp0" && call .venv\Scripts\activate.bat && python server\main.py"
timeout /t 4 /nobreak >nul

REM Start Recommendation Backend (Port 8000)
echo [STARTING] Recommendation Backend (Port 8000)...
start "Recommendation Backend (8000)" cmd /k "cd /d "%~dp0Recommendation\backend" && call venv\Scripts\activate.bat && python app.py"
timeout /t 4 /nobreak >nul

REM Start Recommendation Frontend (Port 5173)
echo [STARTING] Recommendation Frontend (Port 5173)...
start "Recommendation Frontend (5173)" cmd /k "cd /d "%~dp0Recommendation\frontend" && npm run dev"
timeout /t 3 /nobreak >nul

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
echo  HOW TO USE:
echo ========================================
echo.
echo  1. Open Main Viewer (http://localhost:8080)
echo  2. Upload and process a floor plan
echo  3. Click "Get AI Recommendations" button
echo  4. View results in the recommendation interface
echo.
echo  Wait 10-15 seconds for all services to fully start.
echo.
echo  To STOP: Close all terminal windows or press Ctrl+C in each.
echo.
echo ========================================
echo.

REM Create quick access HTML
echo ^<!DOCTYPE html^> > system_access.html
echo ^<html^>^<head^>^<meta charset="UTF-8"^>^<title^>FloorPlan System^</title^>^<style^>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;padding:40px;background:linear-gradient(135deg,#667eea 0%%,#764ba2 100%%);min-height:100vh}.container{background:white;padding:40px;border-radius:20px;max-width:800px;margin:0 auto;box-shadow:0 20px 60px rgba(0,0,0,0.3)}h1{color:#333;margin-bottom:30px;font-size:32px;text-align:center}h2{color:#667eea;margin:30px 0 15px;font-size:20px}.service{background:#f8f9fa;padding:20px;border-radius:12px;margin:15px 0;border-left:4px solid #667eea}.service h3{color:#333;margin-bottom:10px}.service a{color:#667eea;text-decoration:none;font-weight:bold;font-size:18px}.service a:hover{text-decoration:underline}.service p{color:#666;margin-top:8px;font-size:14px}.status{text-align:center;padding:15px;background:#d4edda;border-radius:10px;color:#155724;margin-bottom:30px;font-weight:bold}.button{display:inline-block;background:#667eea;color:white;padding:15px 30px;border-radius:8px;text-decoration:none;font-weight:bold;margin:10px 10px 10px 0;text-align:center;transition:background 0.3s}.button:hover{background:#5568d3}.network{background:#fff3cd;padding:20px;border-radius:10px;margin:25px 0;border-left:4px solid #ffc107}.network h3{color:#856404;margin-bottom:10px}.network p{color:#856404}^</style^>^</head^>^<body^>^<div class="container"^>^<h1^>🏗️ FloorPlan-to-3D System^</h1^>^<div class="status"^>✅ All Services Running^</div^>^<div class="service"^>^<h3^>🎨 Main Viewer^</h3^>^<a href="http://localhost:8080" target="_blank"^>http://localhost:8080^</a^>^<p^>Upload floor plans and view in 3D^</p^>^</div^>^<div class="service"^>^<h3^>🔧 Backend API^</h3^>^<a href="http://localhost:8000" target="_blank"^>http://localhost:8000^</a^>^<p^>AI recommendation processing^</p^>^</div^>^<div class="service"^>^<h3^>💡 Recommendations^</h3^>^<a href="http://localhost:5173" target="_blank"^>http://localhost:5173^</a^>^<p^>View recommendations and analysis^</p^>^</div^>^<div class="network"^>^<h3^>🌐 Network Access^</h3^>^<p^>^<strong^>http://!LOCAL_IP!:8080^</strong^>^</p^>^</div^>^<div style="text-align:center;margin-top:30px"^>^<a href="http://localhost:8080" class="button"^>🚀 Open Main Viewer^</a^>^<a href="http://localhost:5173" class="button"^>💡 Open Recommendations^</a^>^</div^>^</div^>^</body^>^</html^> >> system_access.html

echo [CREATED] Quick access page: system_access.html
echo.
echo Opening system access page...
timeout /t 2 >nul
start system_access.html

echo.
echo Press any key to keep this window open...
pause >nul

endlocal

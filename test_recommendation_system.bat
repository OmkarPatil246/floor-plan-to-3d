@echo off
setlocal enabledelayedexpansion
echo ========================================
echo Recommendation System Diagnostic Tool
echo ========================================
echo.

cd /d "%~dp0"

REM ============================================================================
REM Step 1: Check Model Files
REM ============================================================================
echo [1/6] Checking AI model files...
echo.

set "MODEL_DIR=%~dp0weights\recommendation_model\Qwen2.5-0.5B-Instruct"
set "MODEL_OK=0"

if exist "%MODEL_DIR%\model.safetensors" (
    echo [OK] AI model found: Qwen2.5-0.5B-Instruct
    echo      Location: %MODEL_DIR%
    
    set "TOTAL_SIZE=0"
    for %%F in ("%MODEL_DIR%\*") do (
        set /a "TOTAL_SIZE+=%%~zF"
    )
    set /a "TOTAL_MB=!TOTAL_SIZE! / 1048576"
    echo      Total size: !TOTAL_MB! MB
    
    set "MODEL_OK=1"
) else (
    echo [ERROR] AI model not found!
    echo         Expected: %MODEL_DIR%\model.safetensors
    echo.
    echo This is required for AI-powered recommendations.
    echo.
    echo To download the model:
    echo   python download_recommendation_model.py
    echo.
    set "MODEL_OK=0"
)
echo.

REM ============================================================================
REM Step 2: Check Recommendation Backend Environment
REM ============================================================================
echo [2/6] Checking recommendation backend environment...
echo.

set "REC_VENV=%~dp0Recommendation\backend\venv\Scripts\python.exe"
set "REC_VENV_OK=0"

if exist "%REC_VENV%" (
    echo [OK] Backend virtual environment found
    
    REM Check Python version
    for /f "delims=" %%v in ('"%REC_VENV%" --version 2^>^&1') do set "PY_VERSION=%%v"
    echo      !PY_VERSION!
    
    REM Check critical packages
    echo.
    echo      Checking packages...
    "%REC_VENV%" -c "import fastapi; print('      [OK] FastAPI:', fastapi.__version__)" 2>nul || echo       [ERROR] FastAPI not found!
    "%REC_VENV%" -c "import uvicorn; print('      [OK] Uvicorn:', uvicorn.__version__)" 2>nul || echo       [ERROR] Uvicorn not found!
    "%REC_VENV%" -c "import pydantic; print('      [OK] Pydantic:', pydantic.__version__)" 2>nul || echo       [ERROR] Pydantic not found!
    
    REM Check optional AI packages
    "%REC_VENV%" -c "import torch; print('      [OK] PyTorch:', torch.__version__)" 2>nul || echo       [WARN] PyTorch not found ^(AI features disabled^)
    "%REC_VENV%" -c "import transformers; print('      [OK] Transformers:', transformers.__version__)" 2>nul || echo       [WARN] Transformers not found ^(AI features disabled^)
    
    set "REC_VENV_OK=1"
) else (
    echo [ERROR] Backend virtual environment not found!
    echo         Expected: %REC_VENV%
    echo.
    echo To create the environment:
    echo   cd Recommendation\backend
    echo   python -m venv venv
    echo   venv\Scripts\activate
    echo   pip install -r requirements.txt
    echo.
    set "REC_VENV_OK=0"
)
echo.

REM ============================================================================
REM Step 3: Check Recommendation Frontend
REM ============================================================================
echo [3/6] Checking recommendation frontend...
echo.

set "FRONTEND_DIR=%~dp0Recommendation\frontend"
set "FRONTEND_OK=0"

if exist "%FRONTEND_DIR%\package.json" (
    echo [OK] Frontend package.json found
    
    if exist "%FRONTEND_DIR%\node_modules" (
        echo [OK] Node modules installed
        set "FRONTEND_OK=1"
    ) else (
        echo [WARN] Node modules not installed
        echo.
        echo To install:
        echo   cd Recommendation\frontend
        echo   npm install
        echo.
        set "FRONTEND_OK=0"
    )
) else (
    echo [ERROR] Frontend not found at %FRONTEND_DIR%
    set "FRONTEND_OK=0"
)
echo.

REM ============================================================================
REM Step 4: Check Port Availability
REM ============================================================================
echo [4/6] Checking port availability...
echo.

netstat -ano | findstr ":8000" >nul
if errorlevel 1 (
    echo [OK] Port 8000 available ^(recommendation backend^)
) else (
    echo [WARN] Port 8000 is in use
    echo        The recommendation backend may fail to start.
    echo        Kill the process or change the port in app.py
)

netstat -ano | findstr ":5173" >nul
if errorlevel 1 (
    echo [OK] Port 5173 available ^(recommendation frontend^)
) else (
    echo [WARN] Port 5173 is in use
    echo        The recommendation frontend may fail to start.
)
echo.

REM ============================================================================
REM Step 5: Test Backend API
REM ============================================================================
echo [5/6] Testing recommendation backend API...
echo.

REM Check if backend is running
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8000' -TimeoutSec 2 -UseBasicParsing; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
    echo [WARN] Recommendation backend is NOT running
    echo        Start it with: START_AI_SYSTEM.bat
    echo        Or manually: cd Recommendation\backend ^&^& venv\Scripts\activate ^&^& python app.py
) else (
    echo [OK] Recommendation backend is running on http://localhost:8000
    
    REM Test health endpoint
    powershell -Command "$response = Invoke-RestMethod -Uri 'http://localhost:8000' -Method Get; Write-Output \"      Status: $($response.status)\"" 2>nul
)
echo.

REM ============================================================================
REM Step 6: Generate Summary and Recommendations
REM ============================================================================
echo [6/6] System Status Summary
echo.
echo ========================================
echo COMPONENT STATUS
echo ========================================
echo.

if "!MODEL_OK!"=="1" (
    echo [✓] AI Model: READY
) else (
    echo [✗] AI Model: NOT FOUND
)

if "!REC_VENV_OK!"=="1" (
    echo [✓] Backend Environment: READY
) else (
    echo [✗] Backend Environment: NOT READY
)

if "!FRONTEND_OK!"=="1" (
    echo [✓] Frontend: READY
) else (
    echo [✗] Frontend: NOT READY
)

echo.
echo ========================================
echo RECOMMENDATIONS
echo ========================================
echo.

set "ALL_OK=1"

if "!MODEL_OK!"=="0" (
    echo [ACTION REQUIRED] Download AI model:
    echo   python download_recommendation_model.py
    echo.
    set "ALL_OK=0"
)

if "!REC_VENV_OK!"=="0" (
    echo [ACTION REQUIRED] Setup backend environment:
    echo   cd Recommendation\backend
    echo   python -m venv venv
    echo   venv\Scripts\activate
    echo   pip install -r requirements.txt
    echo.
    set "ALL_OK=0"
)

if "!FRONTEND_OK!"=="0" (
    echo [ACTION REQUIRED] Install frontend dependencies:
    echo   cd Recommendation\frontend
    echo   npm install
    echo.
    set "ALL_OK=0"
)

if "!ALL_OK!"=="1" (
    echo [SUCCESS] All components are ready!
    echo.
    echo To start the system:
    echo   START_AI_SYSTEM.bat
    echo.
    echo To test:
    echo   1. Open http://localhost:8080
    echo   2. Upload a floor plan
    echo   3. Click "Get AI Recommendations"
    echo   4. View results in new window
) else (
    echo [WARNING] Some components need attention.
    echo           Please follow the actions above.
    echo.
    echo The system will still work but may have limited functionality.
    echo ^(Rule-based recommendations will work without AI model^)
)

echo.
echo ========================================
echo.
pause
endlocal

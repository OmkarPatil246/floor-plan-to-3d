@echo off
REM ============================================================================
REM Setup Backend and Frontend Only
REM ============================================================================
cd /d "%~dp0"

echo.
echo ========================================
echo  Setting Up Backend and Frontend
echo ========================================
echo.

REM ============================================================================
REM Setup Backend
REM ============================================================================
echo [1/2] Setting up recommendation backend...
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
)

echo [INSTALLING] Installing backend dependencies...
call venv\Scripts\activate.bat
pip install --upgrade pip --default-timeout=100
pip install --default-timeout=200 fastapi uvicorn pydantic

echo [OPTIONAL] Installing AI model support...
pip install --default-timeout=300 transformers torch accelerate sentencepiece
if errorlevel 1 (
    echo [SKIPPED] AI model support (will use rule-based only)
)

call deactivate
cd ..\..
echo [OK] Backend setup complete!
echo.

REM ============================================================================
REM Setup Frontend
REM ============================================================================
echo [2/2] Setting up frontend...
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
) else (
    echo [OK] Frontend dependencies already installed
)

cd ..\..
echo [OK] Frontend setup complete!
echo.

echo ========================================
echo  Setup Complete!
echo ========================================
echo.
echo Now starting backend and frontend...
echo.

REM ============================================================================
REM Start Services
REM ============================================================================
echo Starting Recommendation Backend (Port 8000)...
start "Recommendation Backend (8000)" cmd /k "cd /d "%~dp0Recommendation\backend" && call venv\Scripts\activate.bat && python app.py"
timeout /t 3 /nobreak >nul

echo Starting Recommendation Frontend (Port 5173)...
start "Recommendation Frontend (5173)" cmd /k "cd /d "%~dp0Recommendation\frontend" && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo  Services Started!
echo ========================================
echo.
echo  Backend API:       http://localhost:8000
echo  Recommendation UI: http://localhost:5173
echo.
echo Services should be ready in 10-15 seconds.
echo Check the opened terminal windows for status.
echo.
pause

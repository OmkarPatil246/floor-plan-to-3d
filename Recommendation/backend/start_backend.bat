@echo off
echo ========================================
echo Recommendation Backend Server
echo ========================================
echo.

cd /d "%~dp0"

REM Check if venv exists
if not exist "venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment not found!
    echo.
    echo Please create it first:
    echo   python -m venv venv
    echo   venv\Scripts\activate
    echo   pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

REM Activate venv
echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

REM Check dependencies
echo [INFO] Checking dependencies...
python -c "import fastapi, uvicorn, pydantic" 2>nul
if errorlevel 1 (
    echo [ERROR] Required packages not found!
    echo.
    echo Installing dependencies...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
)

REM Check AI packages (optional)
python -c "import torch, transformers" 2>nul
if errorlevel 1 (
    echo [WARN] AI packages not installed. Using rule-based recommendations only.
    echo       To enable AI: pip install torch transformers
    echo.
) else (
    echo [OK] AI packages found
)

REM Start the server
echo.
echo ========================================
echo Starting Recommendation Backend
echo ========================================
echo.
echo Server URL: http://localhost:8000
echo API Docs:   http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop
echo.

python app.py

if errorlevel 1 (
    echo.
    echo [ERROR] Server failed to start!
    echo.
    pause
)

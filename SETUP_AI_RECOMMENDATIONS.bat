@echo off
echo ========================================
echo AI Recommendations Setup Script
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [OK] Python is installed
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js is installed
echo.

REM Check if Ollama is installed
ollama --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Ollama is not installed
    echo.
    echo Ollama is required for AI recommendations
    echo.
    echo Please install Ollama:
    echo 1. Visit: https://ollama.ai/download
    echo 2. Download and install Ollama for Windows
    echo 3. Run this script again
    echo.
    pause
    exit /b 1
)

echo [OK] Ollama is installed
echo.

REM Check if Ollama is running
ollama list >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Ollama service is not running
    echo Starting Ollama...
    start "" ollama serve
    timeout /t 3 /nobreak >nul
)

echo [OK] Ollama service is running
echo.

REM Check if qwen2.5:0.5b model is installed
echo Checking if AI model qwen2.5:0.5b is installed...
ollama list | findstr "qwen2.5:0.5b" >nul 2>&1
if errorlevel 1 (
    echo.
    echo [INFO] AI model qwen2.5:0.5b not found
    echo Downloading AI model (this will take a few minutes)...
    echo.
    ollama pull qwen2.5:0.5b
    if errorlevel 1 (
        echo [ERROR] Failed to download AI model
        pause
        exit /b 1
    )
    echo [OK] AI model downloaded successfully
) else (
    echo [OK] AI model qwen2.5:0.5b is already installed
)

echo.
echo ========================================
echo Installing Backend Dependencies
echo ========================================
echo.

cd /d "%~dp0Recommendation\backend"
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing Python packages...
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)

echo [OK] Backend dependencies installed
echo.

cd /d "%~dp0"

echo ========================================
echo Installing Frontend Dependencies
echo ========================================
echo.

cd /d "%~dp0Recommendation\frontend"
if not exist "node_modules" (
    echo Installing npm packages...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install frontend dependencies
        pause
        exit /b 1
    )
) else (
    echo [OK] Frontend dependencies already installed
)

cd /d "%~dp0"

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo All AI recommendation components are ready.
echo.
echo To start the system, run:
echo   START_AI_SYSTEM.bat
echo.
pause

@echo off
echo ========================================
echo AI Model Setup (Hugging Face)
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed
    pause
    exit /b 1
)

echo [OK] Python is installed
echo.

REM Install Recommendation backend dependencies
echo Installing backend dependencies...
cd /d "%~dp0Recommendation\backend"

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing required packages (this may take several minutes)...
pip install --upgrade pip
pip install fastapi uvicorn pydantic transformers torch accelerate sentencepiece --extra-index-url https://download.pytorch.org/whl/cpu

if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [OK] Dependencies installed
echo.

REM Download the model
echo ========================================
echo Downloading AI Model from Hugging Face
echo ========================================
echo.
echo Model: Qwen/Qwen2.5-0.5B-Instruct
echo Size: ~500MB
echo Location: weights/recommendation_model/
echo.
echo This will take a few minutes depending on your internet speed...
echo.

python -c "from transformers import AutoTokenizer, AutoModelForCausalLM; import os; from pathlib import Path; cache_dir = Path(__file__).resolve().parent.parent.parent / 'weights' / 'recommendation_model'; cache_dir.mkdir(parents=True, exist_ok=True); print('Downloading tokenizer...'); tokenizer = AutoTokenizer.from_pretrained('Qwen/Qwen2.5-0.5B-Instruct', cache_dir=str(cache_dir), trust_remote_code=True); print('Downloading model...'); model = AutoModelForCausalLM.from_pretrained('Qwen/Qwen2.5-0.5B-Instruct', cache_dir=str(cache_dir), trust_remote_code=True); print('✅ Model downloaded successfully!')"

if errorlevel 1 (
    echo [ERROR] Failed to download model
    pause
    exit /b 1
)

cd /d "%~dp0"

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo AI Model has been downloaded to:
echo   weights\recommendation_model\
echo.
echo Backend dependencies installed in:
echo   Recommendation\backend\venv\
echo.
echo Next steps:
echo   1. Run: SETUP_FRONTEND.bat (to setup frontend)
echo   2. Run: START_AI_SYSTEM.bat (to start all services)
echo.
pause

@echo off
REM ============================================================================
REM Check Installation Status
REM ============================================================================
cd /d "%~dp0"

echo.
echo ========================================
echo  Installation Status Check
echo ========================================
echo.

REM Check Python
echo [1/6] Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [X] NOT FOUND
) else (
    for /f "tokens=2" %%v in ('python --version 2^>^&1') do echo [OK] Python %%v
)

REM Check Node.js
echo [2/6] Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [X] NOT FOUND
) else (
    for /f "tokens=1" %%v in ('node --version 2^>^&1') do echo [OK] Node.js %%v
)

REM Check Virtual Environment
echo [3/6] Main Virtual Environment...
if exist ".venv\Scripts\python.exe" (
    echo [OK] .venv exists
    
    REM Check TensorFlow
    .venv\Scripts\python.exe -c "import tensorflow" >nul 2>&1
    if errorlevel 1 (
        echo     [X] TensorFlow NOT installed
    ) else (
        for /f "tokens=*" %%v in ('.venv\Scripts\python.exe -c "import tensorflow; print(tensorflow.__version__)" 2^>^&1') do echo     [OK] TensorFlow %%v
    )
    
    REM Check Flask
    .venv\Scripts\python.exe -c "import flask" >nul 2>&1
    if errorlevel 1 (
        echo     [X] Flask NOT installed
    ) else (
        echo     [OK] Flask installed
    )
    
    REM Check OpenCV
    .venv\Scripts\python.exe -c "import cv2" >nul 2>&1
    if errorlevel 1 (
        echo     [X] OpenCV NOT installed
    ) else (
        echo     [OK] OpenCV installed
    )
) else (
    echo [X] NOT FOUND
)

REM Check Model Weights
echo [4/6] Main Model Weights...
if exist "weights\maskrcnn_15_epochs.h5" (
    echo [OK] maskrcnn_15_epochs.h5 found
) else (
    echo [X] maskrcnn_15_epochs.h5 NOT FOUND
)

REM Check Backend
echo [5/6] Recommendation Backend...
if exist "Recommendation\backend\venv\Scripts\python.exe" (
    echo [OK] Backend venv exists
    Recommendation\backend\venv\Scripts\python.exe -c "import fastapi" >nul 2>&1
    if errorlevel 1 (
        echo     [X] FastAPI NOT installed
    ) else (
        echo     [OK] FastAPI installed
    )
) else (
    echo [X] Backend venv NOT FOUND
)

REM Check Frontend
echo [6/6] Recommendation Frontend...
if exist "Recommendation\frontend\node_modules" (
    echo [OK] Frontend dependencies installed
) else (
    echo [X] Frontend dependencies NOT installed
)

echo.
echo ========================================
echo  Qwen AI Model (Optional)
echo ========================================
if exist "weights\recommendation_model\Qwen2.5-0.5B-Instruct\model.safetensors" (
    echo [OK] Qwen model found
) else (
    echo [SKIP] Qwen model not found (system works without it)
)

echo.
echo ========================================
echo  Summary
echo ========================================
echo.

if exist ".venv\Scripts\python.exe" (
    .venv\Scripts\python.exe -c "import tensorflow; import flask; import cv2" >nul 2>&1
    if not errorlevel 1 (
        if exist "weights\maskrcnn_15_epochs.h5" (
            echo [READY] Main server is ready to run!
            echo.
            echo Run: run.bat or QUICK_START.bat
        ) else (
            echo [MISSING] Model weights file needed
        )
    ) else (
        echo [INCOMPLETE] Main server dependencies missing
        echo.
        echo Run: COMPLETE_INSTALL.bat to finish installation
    )
) else (
    echo [NOT STARTED] Virtual environment not created
    echo.
    echo Run: SETUP_ROBUST.bat to start fresh installation
)

echo.
pause

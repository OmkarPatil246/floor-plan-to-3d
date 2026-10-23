@echo off
REM ============================================================================
REM Complete the interrupted installation
REM ============================================================================
cd /d "%~dp0"

echo.
echo ========================================
echo  Completing Installation
echo ========================================
echo.

if not exist ".venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment not found!
    echo Please run SETUP_ROBUST.bat first.
    pause
    exit /b 1
)

echo Activating virtual environment...
call .venv\Scripts\activate.bat

echo.
echo Installing remaining packages with extended timeout...
echo This may take 10-15 minutes depending on your internet speed.
echo.

REM Install with very long timeout and retries
pip install --default-timeout=300 --retries 10 -r requirements.txt

if errorlevel 1 (
    echo.
    echo [WARNING] Some packages may have failed.
    echo.
    echo Let's try to verify TensorFlow installation...
    python -c "import tensorflow; print('TensorFlow version:', tensorflow.__version__)"
    if errorlevel 1 (
        echo.
        echo [ERROR] TensorFlow is not installed!
        echo.
        echo Try these solutions:
        echo 1. Check your internet connection
        echo 2. Run this script again
        echo 3. Install TensorFlow manually:
        echo    .venv\Scripts\activate
        echo    pip install tensorflow==2.13.0 --default-timeout=300
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo  Verifying Installation
echo ========================================
echo.

python -c "import tensorflow; import cv2; import flask; print('Core packages OK!')"
if errorlevel 1 (
    echo [WARNING] Some core packages may be missing
) else (
    echo [OK] All core packages verified!
)

call deactivate

echo.
echo Installation complete! You can now run:
echo   QUICK_START.bat
echo.
pause

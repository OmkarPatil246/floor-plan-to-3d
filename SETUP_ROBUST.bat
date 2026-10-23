@echo off
setlocal enabledelayedexpansion
REM ============================================================================
REM FloorPlan-to-3D - Robust Setup with Retry Logic
REM ============================================================================
cd /d "%~dp0"

echo.
echo ========================================
echo  FloorPlan-to-3D Robust Setup
echo ========================================
echo.

REM ============================================================================
REM Step 1: Check Python
REM ============================================================================
echo [1/5] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found!
    pause
    exit /b 1
)
for /f "tokens=2" %%v in ('python --version 2^>^&1') do set PYTHON_VERSION=%%v
echo [OK] Python %PYTHON_VERSION% found
echo.

REM ============================================================================
REM Step 2: Setup or Use Existing Virtual Environment
REM ============================================================================
echo [2/5] Setting up main server virtual environment...
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
echo.

REM ============================================================================
REM Step 3: Upgrade pip and Install Dependencies in Batches
REM ============================================================================
echo [3/5] Installing dependencies (this may take 10-15 minutes)...
call .venv\Scripts\activate.bat

echo [STEP 1/5] Upgrading pip...
python -m pip install --upgrade pip --default-timeout=100
if errorlevel 1 (
    echo [WARNING] pip upgrade failed, continuing anyway...
)

echo.
echo [STEP 2/5] Installing core ML dependencies (TensorFlow, Keras)...
echo This is the largest package and may take several minutes...
pip install --default-timeout=200 tensorflow==2.13.0 keras==2.13.1
if errorlevel 1 (
    echo [ERROR] Failed to install TensorFlow. Retrying with longer timeout...
    pip install --default-timeout=300 --retries 5 tensorflow==2.13.0 keras==2.13.1
    if errorlevel 1 (
        echo [ERROR] TensorFlow installation failed!
        echo.
        echo Troubleshooting suggestions:
        echo 1. Check your internet connection
        echo 2. Try running the script again
        echo 3. Consider using a wired connection instead of WiFi
        echo 4. Try installing manually: pip install tensorflow==2.13.0
        pause
        exit /b 1
    )
)

echo.
echo [STEP 3/5] Installing computer vision libraries...
pip install --default-timeout=200 opencv-python==4.8.1.78 scikit-image==0.21.0 Pillow==10.0.1 imageio==2.31.5
if errorlevel 1 (
    echo [WARNING] Some packages failed, retrying...
    pip install --default-timeout=200 --retries 5 opencv-python==4.8.1.78 scikit-image==0.21.0 Pillow==10.0.1 imageio==2.31.5
)

echo.
echo [STEP 4/5] Installing scientific computing libraries...
pip install --default-timeout=150 numpy==1.24.3 scipy==1.11.3 matplotlib==3.7.2
if errorlevel 1 (
    echo [WARNING] Some packages failed, retrying...
    pip install --default-timeout=150 --retries 5 numpy==1.24.3 scipy==1.11.3 matplotlib==3.7.2
)

echo.
echo [STEP 5/5] Installing remaining dependencies...
pip install --default-timeout=150 Flask==2.3.3 Flask-Cors==4.0.0 Werkzeug==2.3.7 imgaug==0.4.0 h5py==3.9.0 PyYAML==6.0.1 requests==2.31.0 Cython==3.0.2 python-dateutil==2.8.2 easyocr==1.7.0
if errorlevel 1 (
    echo [WARNING] Some packages failed, retrying...
    pip install --default-timeout=150 --retries 5 Flask==2.3.3 Flask-Cors==4.0.0 Werkzeug==2.3.7 imgaug==0.4.0 h5py==3.9.0 PyYAML==6.0.1 requests==2.31.0 Cython==3.0.2 python-dateutil==2.8.2 easyocr==1.7.0
)

echo.
echo [OPTIONAL] Installing cairosvg for SVG support...
pip install --default-timeout=100 cairosvg
if errorlevel 1 (
    echo [SKIPPED] cairosvg installation failed (optional package)
)

call deactivate
echo.
echo [OK] Main server dependencies installed!
echo.

REM ============================================================================
REM Step 4: Setup Backend
REM ============================================================================
echo [4/5] Setting up recommendation backend...
cd Recommendation\backend
if not exist "venv\Scripts\python.exe" (
    echo [CREATING] Creating backend virtual environment...
    python -m venv venv
)

echo [INSTALLING] Installing backend dependencies...
call venv\Scripts\activate.bat
pip install --upgrade pip --default-timeout=100 >nul 2>&1
pip install --default-timeout=200 fastapi uvicorn pydantic
if errorlevel 1 (
    echo [WARNING] Basic backend packages failed, retrying...
    pip install --default-timeout=200 --retries 5 fastapi uvicorn pydantic
)

echo [OPTIONAL] Installing AI model support (transformers, torch)...
echo This may take a while...
pip install --default-timeout=300 transformers torch accelerate sentencepiece
if errorlevel 1 (
    echo [SKIPPED] AI model support installation failed
    echo The backend will work with rule-based recommendations only
)

call deactivate
cd ..\..
echo [OK] Backend setup complete
echo.

REM ============================================================================
REM Step 5: Setup Frontend
REM ============================================================================
echo [5/5] Setting up frontend...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

cd Recommendation\frontend
if not exist "node_modules" (
    echo [INSTALLING] Installing frontend packages...
    call npm install --prefer-offline
    if errorlevel 1 (
        echo [WARNING] npm install failed, retrying...
        call npm install
    )
) else (
    echo [OK] Frontend dependencies already installed
)
cd ..\..
echo.

echo ========================================
echo  SETUP COMPLETE!
echo ========================================
echo.
echo You can now run the project using:
echo   run.bat
echo.
echo Or use the existing SETUP_AND_RUN.bat to setup and run in one step.
echo.
pause

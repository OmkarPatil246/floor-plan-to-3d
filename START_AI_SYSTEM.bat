@echo off
echo ========================================
echo Starting AI Recommendation System
echo ========================================
echo.

REM Check if recommendation model exists
echo [0/4] Checking AI model...
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

echo [1/4] Starting Main Floorplan Server...
start "Main Server" cmd /k "cd /d "%~dp0" && python server\main.py"
timeout /t 3 /nobreak >nul

echo [2/4] Starting Recommendation Backend...
start "Recommendation Backend" cmd /k "cd /d "%~dp0Recommendation\backend" && call venv\Scripts\activate.bat && python app.py"
timeout /t 3 /nobreak >nul

echo [3/4] Starting Recommendation Frontend...
start "Recommendation Frontend" cmd /k "cd /d "%~dp0Recommendation\frontend" && npm run dev"
timeout /t 2 /nobreak >nul

echo [4/4] Verifying services...
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo All Services Started!
echo ========================================
echo.
echo Main Viewer:       http://localhost:8080
echo Backend API:       http://localhost:8000  
echo Recommendation UI: http://localhost:5173
echo.
echo IMPORTANT: Wait 5-10 seconds for all services to fully start.
echo.
echo To use recommendations:
echo   1. Open Main Viewer ^(http://localhost:8080^)
echo   2. Upload and process a floor plan
echo   3. Click "Get AI Recommendations" button
echo   4. View results in new window
echo.
echo Close all terminal windows to stop the services.
echo.
echo Press any key to open the main viewer in your browser...
pause >nul
start http://localhost:8080


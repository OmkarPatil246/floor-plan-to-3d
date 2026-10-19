@echo off
echo ========================================
echo System Requirements Check
echo ========================================
echo.

set ERRORS=0

REM Check Python
echo [CHECK] Python...
python --version 2>nul
if errorlevel 1 (
    echo [FAIL] Python not found
    set /a ERRORS+=1
) else (
    echo [OK]
)
echo.

REM Check Node.js
echo [CHECK] Node.js...
node --version 2>nul
if errorlevel 1 (
    echo [FAIL] Node.js not found
    set /a ERRORS+=1
) else (
    echo [OK]
)
echo.

REM Check npm
echo [CHECK] npm...
npm --version 2>nul
if errorlevel 1 (
    echo [FAIL] npm not found
    set /a ERRORS+=1
) else (
    echo [OK]
)
echo.

REM Check Ollama
echo [CHECK] Ollama...
ollama --version 2>nul
if errorlevel 1 (
    echo [FAIL] Ollama not found
    echo        Download from: https://ollama.ai/download
    set /a ERRORS+=1
) else (
    echo [OK]
)
echo.

REM Check if Ollama is running
echo [CHECK] Ollama service...
ollama list >nul 2>&1
if errorlevel 1 (
    echo [WARN] Ollama service not running
    echo        Run: ollama serve
) else (
    echo [OK]
)
echo.

REM Check AI model
echo [CHECK] AI Model (qwen2.5:0.5b)...
ollama list 2>nul | findstr "qwen2.5:0.5b" >nul
if errorlevel 1 (
    echo [FAIL] Model not installed
    echo        Run: ollama pull qwen2.5:0.5b
    set /a ERRORS+=1
) else (
    echo [OK]
)
echo.

REM Check backend dependencies
echo [CHECK] Backend dependencies...
if exist "Recommendation\backend\venv" (
    echo [OK] Virtual environment exists
) else (
    echo [WARN] Virtual environment not found
    echo        Run: SETUP_AI_RECOMMENDATIONS.bat
)
echo.

REM Check frontend dependencies
echo [CHECK] Frontend dependencies...
if exist "Recommendation\frontend\node_modules" (
    echo [OK] Node modules installed
) else (
    echo [WARN] Node modules not found
    echo        Run: SETUP_AI_RECOMMENDATIONS.bat
)
echo.

REM Check if ports are available
echo [CHECK] Port availability...
netstat -ano | findstr ":8080" >nul
if not errorlevel 1 (
    echo [WARN] Port 8080 is in use
)

netstat -ano | findstr ":8000" >nul
if not errorlevel 1 (
    echo [WARN] Port 8000 is in use
)

netstat -ano | findstr ":5173" >nul
if not errorlevel 1 (
    echo [WARN] Port 5173 is in use
)
echo.

echo ========================================
echo Summary
echo ========================================
if %ERRORS%==0 (
    echo [OK] All checks passed!
    echo.
    echo System is ready to run.
    echo Run: START_AI_SYSTEM.bat
) else (
    echo [ERROR] %ERRORS% requirement(s) failed
    echo.
    echo Please fix the errors above and run this check again.
)
echo.
pause

@echo off
REM ============================================================================
REM ArchGen 3D - STOP ALL SERVICES
REM Cleanly stops all running services
REM ============================================================================

title ArchGen 3D - Stopping All Services

color 0C
cls

echo.
echo ========================================================================
echo                   STOPPING ALL ARCHGEN 3D SERVICES
echo ========================================================================
echo.
echo   This will stop:
echo   - Main Server (Port 8080)
echo   - ArchGen UI (Port 5173)
echo   - Recommendation Backend (Port 8000)
echo   - Recommendation Frontend (Port 5176)
echo   - Ngrok tunnels
echo.
echo ========================================================================
echo.

timeout /t 2 /nobreak >nul

REM Kill Python processes (Main Server + Recommendation Backend)
echo [1/4] Stopping Python services...
taskkill /F /FI "WINDOWTITLE eq Main Server 8080" 2>nul
taskkill /F /FI "WINDOWTITLE eq Recommendation API 8000" 2>nul
timeout /t 1 /nobreak >nul
echo [OK] Python services stopped
echo.

REM Kill Node processes (ArchGen UI + Recommendation Frontend)
echo [2/4] Stopping Node.js services...
taskkill /F /FI "WINDOWTITLE eq ArchGen UI 5173" 2>nul
taskkill /F /FI "WINDOWTITLE eq Recommendation UI 5176" 2>nul
timeout /t 1 /nobreak >nul
echo [OK] Node.js services stopped
echo.

REM Kill Ngrok processes
echo [3/4] Stopping Ngrok tunnels...
taskkill /F /IM ngrok.exe 2>nul
timeout /t 1 /nobreak >nul
echo [OK] Ngrok tunnels stopped
echo.

REM Additional cleanup - kill by port if windows method fails
echo [4/4] Final cleanup...

REM Find and kill processes on specific ports
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080') do (
    taskkill /F /PID %%a 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
    taskkill /F /PID %%a 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5176') do (
    taskkill /F /PID %%a 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    taskkill /F /PID %%a 2>nul
)

echo [OK] Cleanup complete
echo.

echo ========================================================================
echo  ALL SERVICES STOPPED!
echo ========================================================================
echo.
echo  All services have been terminated.
echo  You can now close all terminal windows.
echo.
echo  To restart: Run START_ALL_SERVICES.bat
echo.
echo ========================================================================
echo.

timeout /t 3

exit

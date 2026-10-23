@echo off
:menu
cls
echo ====================================================
echo   FloorPlan-to-3D System - Main Menu
echo ====================================================
echo.
echo   1. Complete Installation (First Time Setup)
echo   2. Start All Services
echo   3. Stop All Services
echo   4. Check Installation Status
echo   5. Full Restart (Stop + Start)
echo   6. View System Info
echo   7. Exit
echo.
echo ====================================================
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto install
if "%choice%"=="2" goto start
if "%choice%"=="3" goto stop
if "%choice%"=="4" goto check
if "%choice%"=="5" goto restart
if "%choice%"=="6" goto info
if "%choice%"=="7" goto exit

echo Invalid choice! Please try again.
timeout /t 2 /nobreak >nul
goto menu

:install
cls
call COMPLETE_INSTALL.bat
pause
goto menu

:start
cls
call START_ALL_SERVICES.bat
goto menu

:stop
cls
call STOP_ALL_SERVICES.bat
goto menu

:check
cls
call CHECK_INSTALL.bat
pause
goto menu

:restart
cls
echo Stopping services...
call STOP_ALL_SERVICES.bat
timeout /t 2 /nobreak >nul
echo.
echo Starting services...
call START_ALL_SERVICES.bat
goto menu

:info
cls
echo ====================================================
echo   System Information
echo ====================================================
echo.
echo   Project: FloorPlan-to-3D with AI Recommendations
echo.
echo   Components:
echo   - Main Server (Flask): Floor plan detection and 3D viewing
echo   - Backend API (FastAPI): AI recommendation engine
echo   - Frontend UI (Vue/Vite): Recommendation display
echo.
echo   Ports:
echo   - 8080: Main Server (3D Viewer)
echo   - 8000: Backend API (Recommendations)
echo   - 5173: Frontend UI (Development)
echo.
echo   Main URL: http://localhost:8080
echo.
echo ====================================================
pause
goto menu

:exit
echo.
echo Thank you for using FloorPlan-to-3D!
timeout /t 2 /nobreak >nul
exit

@echo off
cls
echo.
echo ========================================================================
echo                    FloorPlan-to-3D System Launcher
echo ========================================================================
echo.
echo  Choose what you want to start:
echo.
echo  [1] Start EVERYTHING (Main System + VR Mode + All Services)
echo  [2] Start MAIN SYSTEM ONLY (FloorPlan + Recommendations)
echo  [3] Start VR MODE ONLY (Both VR Servers)
echo  [4] Exit
echo.
echo ========================================================================
echo.
choice /c 1234 /n /m "Enter your choice (1-4): "

if errorlevel 4 goto :exit
if errorlevel 3 goto :vr_only
if errorlevel 2 goto :main_only
if errorlevel 1 goto :everything

:everything
echo.
echo Starting ALL services...
call START_ALL_SERVICES.bat
goto :end

:main_only
echo.
echo Starting MAIN SYSTEM only...
call run.bat
goto :end

:vr_only
echo.
echo Starting VR MODE only...
call START_VR_ONLY.bat
goto :end

:exit
echo.
echo Exiting launcher...
exit /b 0

:end

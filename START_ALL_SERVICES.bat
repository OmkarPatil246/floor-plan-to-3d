@echo off
setlocal enabledelayedexpansion
REM ============================================================================
REM ArchGen 3D - SIMPLE ALL-IN-ONE STARTUP SCRIPT
REM Starts ALL services with proper ports + NGROK for phone access
REM ============================================================================
cd /d "%~dp0"

title ArchGen 3D - Starting All Services

color 0B
cls

echo.
echo ========================================================================
echo                    ARCHGEN 3D - COMPLETE SYSTEM
echo                   Starting All Services + Public URL
echo ========================================================================
echo.
echo   This will start:
echo   1. Main Server (Port 8080) - 3D Viewer
echo   2. ArchGen UI (Port 5173) - Main Interface  
echo   3. Recommendation Backend (Port 8000) - AI API
echo   4. Recommendation Frontend (Port 5176) - AI UI
echo   5. Ngrok Tunnel (Port 8080) - Public Phone Access
echo.
echo ========================================================================
echo.

timeout /t 3 /nobreak >nul

REM ============================================================================
REM Step 1: Start Main Server (Port 8080)
REM ============================================================================
echo [1/5] Starting Main Server on Port 8080...
start "Main Server 8080" cmd /k "title Main Server 8080 && cd /d "%~dp0" && call .venv\Scripts\activate.bat && python server\main.py"
timeout /t 6 /nobreak >nul
echo [OK] Main Server started
echo.

REM ============================================================================
REM Step 2: Start ArchGen UI (Port 5173)
REM ============================================================================
echo [2/5] Starting ArchGen UI on Port 5173...
start "ArchGen UI 5173" cmd /k "title ArchGen UI 5173 && cd /d "%~dp0archgenui" && npm run dev"
timeout /t 5 /nobreak >nul
echo [OK] ArchGen UI started
echo.

REM ============================================================================
REM Step 3: Start Recommendation Backend (Port 8000)
REM ============================================================================
echo [3/5] Starting Recommendation Backend on Port 8000...
start "Recommendation API 8000" cmd /k "title Recommendation API 8000 && cd /d "%~dp0Recommendation\backend" && call venv\Scripts\activate.bat && python app.py"
timeout /t 4 /nobreak >nul
echo [OK] Recommendation Backend started
echo.

REM ============================================================================
REM Step 4: Start Recommendation Frontend (Port 5176)
REM ============================================================================
echo [4/5] Starting Recommendation Frontend on Port 5176...
start "Recommendation UI 5176" cmd /k "title Recommendation UI 5176 && cd /d "%~dp0Recommendation\frontend" && npm run dev"
timeout /t 5 /nobreak >nul
echo [OK] Recommendation Frontend started
echo.

REM ============================================================================
REM Step 5: Start Ngrok for Public Access (Port 8080)
REM ============================================================================
echo [5/5] Starting Ngrok tunnel for phone access...
echo.
echo Checking if ngrok exists...

if exist "viewer\ngrok.exe" (
    echo [OK] Found ngrok.exe
    start "Ngrok Public URL" cmd /k "title Ngrok Public Tunnel && cd /d "%~dp0" && viewer\ngrok.exe http 8080"
    timeout /t 10 /nobreak >nul
    echo [OK] Ngrok tunnel started
) else (
    echo [WARNING] ngrok.exe not found in viewer folder
    echo [INFO] Public URL will not be available
    echo [INFO] You can still use local network access
)
echo.

REM ============================================================================
REM Wait for services to initialize
REM ============================================================================
echo ========================================================================
echo  WAITING FOR SERVICES TO INITIALIZE...
echo ========================================================================
echo.
echo Please wait while all services start up (15 seconds)...
timeout /t 15 /nobreak >nul

REM ============================================================================
REM Display Service URLs
REM ============================================================================
cls
color 0A
echo.
echo ========================================================================
echo                   ALL SERVICES ARE NOW RUNNING!
echo ========================================================================
echo.

REM Detect network IP
set "LOCAL_IP=127.0.0.1"
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "TEMP_IP=%%a"
    for /f "tokens=* delims= " %%b in ("!TEMP_IP!") do set "TEMP_IP=%%b"
    echo !TEMP_IP! | findstr /B "192.168" >nul
    if not errorlevel 1 (
        set "LOCAL_IP=!TEMP_IP!"
        goto :ip_found
    )
    echo !TEMP_IP! | findstr /B "10." >nul
    if not errorlevel 1 (
        set "LOCAL_IP=!TEMP_IP!"
        goto :ip_found
    )
)
:ip_found

REM Try to get ngrok public URL
echo ========================================================================
echo  PUBLIC URL FOR PHONE ACCESS (Works from anywhere!)
echo ========================================================================
echo.

if exist "viewer\ngrok.exe" (
    powershell -Command "$tunnels = try { Invoke-RestMethod -Uri 'http://localhost:4040/api/tunnels' -ErrorAction Stop } catch { $null }; if ($tunnels -and $tunnels.tunnels.Count -gt 0) { $url = $tunnels.tunnels[0].public_url; Write-Host ' Main Server: ' -NoNewline; Write-Host $url -ForegroundColor Green; Write-Host ''; Write-Host ' Copy this URL to your phone for access from anywhere!'; } else { Write-Host ' Ngrok is starting... Check dashboard: http://localhost:4040' -ForegroundColor Yellow; }"
) else (
    echo  Ngrok not available - use local network URLs below
)

echo.
echo ========================================================================
echo  LOCAL NETWORK URLS (Same WiFi Only)
echo ========================================================================
echo.
echo  ArchGen UI:          http://localhost:5173
echo                       http://!LOCAL_IP!:5173
echo.
echo  Main Server:         http://localhost:8080
echo                       http://!LOCAL_IP!:8080
echo.
echo  Recommendation UI:   http://localhost:5176
echo                       http://!LOCAL_IP!:5176
echo.
echo  Recommendation API:  http://localhost:8000
echo                       http://!LOCAL_IP!:8000
echo.
echo ========================================================================
echo  PORT ASSIGNMENTS (No Conflicts!)
echo ========================================================================
echo.
echo  Port 5173 = ArchGen UI (Main Interface)
echo  Port 5176 = Recommendation UI (AI Suggestions)
echo  Port 8080 = Main Server (3D Viewer)
echo  Port 8000 = Recommendation API (Backend)
echo.
echo ========================================================================
echo  QUICK ACCESS LINKS
echo ========================================================================
echo.
echo  - Ngrok Dashboard:  http://localhost:4040
echo  - Main Viewer:      http://localhost:8080
echo  - ArchGen UI:       http://localhost:5173
echo.
echo ========================================================================
echo  HOW TO USE
echo ========================================================================
echo.
echo  1. Open the PUBLIC URL (from above) on your phone
echo  2. Or use local network URL if on same WiFi
echo  3. Upload floor plan and view 3D model
echo  4. Click "Get AI Recommendations" for suggestions
echo  5. Click "Enter VR Walk Mode" for VR experience
echo.
echo ========================================================================
echo  IMPORTANT
echo ========================================================================
echo.
echo  - Keep ALL terminal windows OPEN
echo  - Closing any window stops that service
echo  - Press CTRL+C in each window to stop services
echo  - Close this window last to see this information
echo.
echo ========================================================================
echo.

REM Open helpful pages
echo Opening helpful pages...
timeout /t 2 /nobreak >nul

if exist "PHONE_ACCESS.html" (
    start "" "PHONE_ACCESS.html"
)

if exist "viewer\ngrok.exe" (
    start http://localhost:4040
)

echo.
echo ========================================================================
echo.
echo  ALL DONE! Services are running in separate windows.
echo  
echo  Check the terminal windows for any errors.
echo  
echo  Press any key to exit this window (services will keep running)
echo.
echo ========================================================================
echo.

pause >nul

endlocal

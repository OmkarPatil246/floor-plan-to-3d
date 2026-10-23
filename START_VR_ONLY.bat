@echo off
setlocal enabledelayedexpansion
REM ============================================================================
REM VR MODE ONLY Launcher
REM Starts both VR servers without the main FloorPlan system
REM ============================================================================
cd /d "%~dp0"

echo.
echo ========================================================================
echo  🥽 VR MODE - Starting VR Servers Only
echo ========================================================================
echo.

REM ============================================================================
REM Detect Network IP
REM ============================================================================
set "LOCAL_IP=127.0.0.1"
echo [1/3] Detecting network IP address...

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "TEMP_IP=%%a"
    for /f "tokens=* delims= " %%b in ("!TEMP_IP!") do set "TEMP_IP=%%b"
    
    echo !TEMP_IP! | findstr /B "192.168" >nul
    if not errorlevel 1 (
        set "LOCAL_IP=!TEMP_IP!"
        echo [OK] Found network IP: !LOCAL_IP!
        goto :ip_found
    )
)
:ip_found
echo.

REM ============================================================================
REM Start VR Viewer Signaling Server (Port 3001)
REM ============================================================================
echo [2/3] Starting VR Viewer Signaling Server ^(Port 3001^)...
if exist "%~dp0viewer\vr-signaling-server.js" (
    REM Check for node_modules
    if not exist "%~dp0viewer\node_modules" (
        echo [INFO] Installing viewer dependencies...
        cd /d "%~dp0viewer"
        call npm install
        cd /d "%~dp0"
    )
    start "VR Viewer Server (Port 3001)" cmd /k "cd /d "%~dp0viewer" && node vr-signaling-server.js"
    timeout /t 3 /nobreak >nul
    echo [OK] VR Viewer Server started
) else (
    echo [ERROR] VR viewer server not found!
)
echo.

REM ============================================================================
REM Start 3D Assets VR Mode Server (Port 3000)
REM ============================================================================
echo [3/3] Starting 3D Assets VR Mode Server ^(Port 3000^)...
set "VR_DIR=%~dp03d Assets System and  justure system"
if exist "%VR_DIR%\vr-server.js" (
    REM Check if node_modules exists in VR directory
    if not exist "%VR_DIR%\node_modules" (
        echo [INFO] Installing VR server dependencies...
        cd /d "%VR_DIR%"
        call npm install
        cd /d "%~dp0"
    )
    start "3D Assets VR Server (Port 3000)" cmd /k "cd /d "%VR_DIR%" && node vr-server.js"
    timeout /t 3 /nobreak >nul
    echo [OK] 3D Assets VR Server started
) else (
    echo [ERROR] 3D Assets VR server not found!
)
echo.

REM ============================================================================
REM Display Status
REM ============================================================================
echo.
echo ========================================================================
echo  ✅ VR MODE SERVERS STARTED!
echo ========================================================================
echo.
echo  🥽 VR SERVICES:
echo    3D Assets VR Box:     http://localhost:3000/vr-primary.html
echo    VR Viewer Desktop:    http://localhost:3001/vr-viewer.html
echo    VR Viewer Mobile:     http://localhost:3001/vr-mobile.html
echo.
echo  🌐 NETWORK ACCESS (Share on WiFi):
echo    3D Assets VR:         http://!LOCAL_IP!:3000
echo    VR Viewer:            http://!LOCAL_IP!:3001
echo.
echo ========================================================================
echo  🎯 VR MODE USAGE GUIDE:
echo ========================================================================
echo.
echo  📱 METHOD 1: VR Box Mode (Google Cardboard Style)
echo    1. Open http://localhost:3000/vr-primary.html on your PC
echo    2. Allow camera access when prompted
echo    3. A QR code will appear on screen
echo    4. Scan QR code with your phone camera
echo    5. Open the link on your phone
echo    6. Put phone in VR box
echo    7. Move your head to look around the 3D environment!
echo.
echo  🖥️ METHOD 2: VR Viewer Sharing (Any 3D Model)
echo    1. Open http://localhost:3001/vr-viewer.html on your PC
echo    2. Load a 3D model in the viewer
echo    3. On your phone, open http://!LOCAL_IP!:3001/vr-mobile.html
echo    4. Enter the session code shown on PC
echo    5. Put phone in VR box to view the same model
echo.
echo ========================================================================
echo.
echo  ⚠️ REQUIREMENTS:
echo    • Both devices must be on the same WiFi network
echo    • Phone needs a VR box/headset (Google Cardboard compatible)
echo    • Modern browser with WebRTC support
echo.
echo  🛑 TO STOP: Close both terminal windows
echo.
echo ========================================================================
echo.

REM Create VR-specific access page
echo ^<!DOCTYPE html^> > vr_access.html
echo ^<html^>^<head^>^<meta charset="UTF-8"^>^<title^>VR Mode Access^</title^>^<style^>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;padding:30px;background:linear-gradient^(135deg,#e74c3c 0%%,#c0392b 100%%^);min-height:100vh}.container{background:white;padding:40px;border-radius:20px;max-width:900px;margin:0 auto;box-shadow:0 20px 60px rgba^(0,0,0,0.3^)}h1{color:#333;margin-bottom:20px;font-size:36px;text-align:center}.emoji{font-size:48px}h2{color:#e74c3c;margin:30px 0 15px;font-size:24px;border-bottom:3px solid #e74c3c;padding-bottom:10px}.service{background:#f8f9fa;padding:25px;border-radius:12px;margin:15px 0;border-left:5px solid #e74c3c;transition:transform 0.3s,box-shadow 0.3s}.service:hover{transform:translateY^(-5px^);box-shadow:0 10px 30px rgba^(231,76,60,0.3^)}.service h3{color:#333;margin-bottom:10px;font-size:20px}.service a{color:#e74c3c;text-decoration:none;font-weight:bold;font-size:18px;display:block;margin:10px 0}.service a:hover{text-decoration:underline}.service p{color:#666;margin-top:8px;font-size:14px;line-height:1.6}.status{text-align:center;padding:20px;background:#d4edda;border-radius:10px;color:#155724;margin-bottom:30px;font-weight:bold;font-size:18px}.button{display:inline-block;background:#e74c3c;color:white;padding:18px 30px;border-radius:8px;text-decoration:none;font-weight:bold;margin:10px 10px 10px 0;text-align:center;transition:all 0.3s;font-size:16px;box-shadow:0 4px 15px rgba^(231,76,60,0.3^)}.button:hover{background:#c0392b;transform:translateY^(-2px^);box-shadow:0 6px 20px rgba^(231,76,60,0.5^)}.network{background:#fff3cd;padding:25px;border-radius:10px;margin:25px 0;border-left:5px solid #ffc107}.network h3{color:#856404;margin-bottom:15px;font-size:20px}.network p{color:#856404;margin:8px 0;font-size:16px}.steps{background:#e8f4f8;padding:25px;border-radius:10px;margin:20px 0;border-left:5px solid #3498db}.steps h3{color:#2c3e50;margin-bottom:15px}.steps ol{margin-left:20px;color:#34495e}.steps li{margin:10px 0;line-height:1.6}^</style^>^</head^>^<body^>^<div class="container"^>^<h1^>^<span class="emoji"^>🥽^</span^> VR Mode Access^</h1^>^<div class="status"^>✅ VR Servers Running^</div^>^<h2^>🎮 VR Services^</h2^>^<div class="service"^>^<h3^>📱 VR Box Mode - Primary Device^</h3^>^<a href="http://localhost:3000/vr-primary.html" target="_blank"^>http://localhost:3000/vr-primary.html^</a^>^<p^>^<strong^>Start here!^</strong^> Open on your PC to generate QR code for phone. This is the main VR box experience with pre-loaded 3D house models.^</p^>^</div^>^<div class="service"^>^<h3^>🖥️ VR Viewer - Desktop Interface^</h3^>^<a href="http://localhost:3001/vr-viewer.html" target="_blank"^>http://localhost:3001/vr-viewer.html^</a^>^<p^>Desktop interface for loading any 3D model and sharing it in VR mode.^</p^>^</div^>^<div class="service"^>^<h3^>📱 VR Viewer - Mobile Interface^</h3^>^<a href="http://localhost:3001/vr-mobile.html" target="_blank"^>http://localhost:3001/vr-mobile.html^</a^>^<p^>Open on your phone to view shared 3D models in VR box mode.^</p^>^</div^>^<div class="network"^>^<h3^>🌐 Network Access (WiFi Sharing)^</h3^>^<p^>Share with phone on same WiFi:^</p^>^<p^>^<strong^>VR Box Mode:^</strong^> http://!LOCAL_IP!:3000^</p^>^<p^>^<strong^>VR Viewer:^</strong^> http://!LOCAL_IP!:3001^</p^>^</div^>^<div class="steps"^>^<h3^>📋 Quick Start Guide - VR Box Mode^</h3^>^<ol^>^<li^>Click the button below to open VR primary device^</li^>^<li^>Allow camera access on your PC^</li^>^<li^>A QR code will appear on screen^</li^>^<li^>Scan the QR code with your phone camera^</li^>^<li^>Open the link that appears on your phone^</li^>^<li^>Put your phone in a VR box/headset^</li^>^<li^>Look around by moving your head!^</li^>^</ol^>^</div^>^<div style="text-align:center;margin-top:40px"^>^<a href="http://localhost:3000/vr-primary.html" class="button"^>🚀 Start VR Box Mode^</a^>^<a href="http://localhost:3001/vr-viewer.html" class="button"^>🖥️ Open VR Viewer^</a^>^</div^>^</div^>^</body^>^</html^> >> vr_access.html

echo [CREATED] vr_access.html for easy VR access
echo.
echo Opening VR access page...
timeout /t 2 >nul
start vr_access.html

echo.
echo Press any key to keep this window open (or close to exit)...
pause >nul

endlocal

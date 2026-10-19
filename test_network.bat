@echo off
setlocal enabledelayedexpansion
echo ========================================
echo  NETWORK DIAGNOSTICS FOR FLOORPLAN-TO-3D
echo ========================================
echo.

REM Get all network information
echo [STEP 1] Checking Network Adapters...
echo.
ipconfig /all | findstr /C:"Wireless LAN adapter" /C:"Ethernet adapter" /C:"IPv4 Address" /C:"Default Gateway" /C:"DHCP Enabled"
echo.

REM ============================================================================
REM Step 2: Detecting IP Addresses...
REM ============================================================================
echo [STEP 2] Detecting IP Addresses...
echo.
set "HAS_VALID_IP=0"
set "VALID_IP="

REM Try to find valid network IPs (prioritize 192.168, then 10.x, then 172.16-31)
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "IP=%%a"
    REM Trim spaces
    for /f "tokens=* delims= " %%b in ("!IP!") do set "IP=%%b"
    
    echo Found IP: !IP!
    
    REM Skip localhost
    echo !IP! | findstr /B "127.0.0.1" >nul
    if errorlevel 1 (
        REM Skip APIPA (169.254.x.x)
        echo !IP! | findstr /B "169.254" >nul
        if errorlevel 1 (
            REM Check for 192.168.x.x (most common home/office)
            echo !IP! | findstr /B "192.168" >nul
            if not errorlevel 1 (
                set "HAS_VALID_IP=1"
                set "VALID_IP=!IP!"
                echo   [OK] Valid network IP: !IP! ^(WiFi/LAN^)
                goto :valid_ip_found
            )
            
            REM Check for 10.x.x.x (corporate networks)
            echo !IP! | findstr /B "10\." >nul
            if not errorlevel 1 (
                if "!HAS_VALID_IP!"=="0" (
                    set "HAS_VALID_IP=1"
                    set "VALID_IP=!IP!"
                    echo   [OK] Valid network IP: !IP! ^(Corporate/VPN^)
                )
            )
            
            REM Check for 172.16-31.x.x (private networks)
            echo !IP! | findstr /B "172\." >nul
            if not errorlevel 1 (
                if "!HAS_VALID_IP!"=="0" (
                    set "HAS_VALID_IP=1"
                    set "VALID_IP=!IP!"
                    echo   [OK] Valid network IP: !IP! ^(Private network^)
                )
            )
        ) else (
            echo   [WARNING] APIPA address detected ^(169.254.x.x^) - Network not configured properly
        )
    )
    echo.
)
:valid_ip_found

if "!HAS_VALID_IP!"=="0" (
    echo ========================================
    echo  [ERROR] NO VALID IP ADDRESS FOUND!
    echo ========================================
    echo.
    echo Your computer is NOT properly connected to the network.
    echo.
    echo PROBLEMS DETECTED:
    echo   - 169.254.x.x = APIPA ^(Automatic Private IP^)
    echo   - This means: No DHCP server responded
    echo   - Result: Cannot access from other devices
    echo.
    echo SOLUTIONS:
    echo.
    echo 1. CHECK WIFI CONNECTION:
    echo    - Open Settings ^> Network ^& Internet ^> WiFi
    echo    - Make sure you are connected to a WiFi network
    echo    - Try disconnecting and reconnecting
    echo.
    echo 2. RESTART YOUR ROUTER:
    echo    - Unplug router for 10 seconds
    echo    - Plug back in and wait 1-2 minutes
    echo    - Reconnect to WiFi
    echo.
    echo 3. RESET NETWORK ADAPTER:
    echo    - Open Command Prompt as Administrator
    echo    - Run: ipconfig /release
    echo    - Run: ipconfig /renew
    echo.
    echo 4. USE ETHERNET CABLE:
    echo    - If WiFi is not working
    echo    - Connect with Ethernet cable
    echo.
    echo 5. CHECK NETWORK SETTINGS:
    echo    - Settings ^> Network ^& Internet ^> Status
    echo    - Click "Network troubleshooter"
    echo.
    pause
    exit /b 1
)

echo ========================================
echo  [SUCCESS] VALID IP FOUND!
echo ========================================
echo.
echo Your Network IP: !VALID_IP!
echo.

REM Test if port 8080 is available
echo [STEP 3] Checking Port 8080...
netstat -an | findstr ":8080" >nul
if errorlevel 1 (
    echo [OK] Port 8080 is available
) else (
    echo [WARNING] Port 8080 is already in use
    echo Currently using port 8080:
    netstat -ano | findstr ":8080"
)
echo.

REM Check Windows Firewall status
echo [STEP 4] Checking Windows Firewall...
netsh advfirewall show allprofiles state | findstr "State"
echo.
echo NOTE: If firewall is ON, you need to allow Python through it.
echo.

REM Test network connectivity
echo [STEP 5] Testing Network Connectivity...
ping -n 1 8.8.8.8 >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Cannot reach internet ^(Google DNS^)
    echo This might indicate network problems
) else (
    echo [OK] Internet connectivity works
)
echo.

echo ========================================
echo  SUMMARY
echo ========================================
echo.
echo Your Server Access URLs:
echo.
echo   LOCAL ACCESS ^(This Computer^):
echo     http://localhost:8080
echo     http://127.0.0.1:8080
echo.
echo   NETWORK ACCESS ^(Other Devices^):
echo     http://!VALID_IP!:8080
echo.
echo.
echo INSTRUCTIONS FOR YOUR FRIEND'S PC:
echo ========================================
echo.
echo 1. Make sure their PC is on the SAME WiFi network
echo    ^(WiFi name must be exactly the same^)
echo.
echo 2. Tell them to open a browser and type:
echo    http://!VALID_IP!:8080
echo.
echo 3. If it doesn't work, check:
echo    - Both computers on same WiFi? ^(not guest network^)
echo    - Windows Firewall allowed Python?
echo    - Server is running? ^(run.bat still open^)
echo.
echo ========================================
echo  FIREWALL RULE CREATION
echo ========================================
echo.
echo If connection fails, create firewall rule:
echo.
echo 1. Press Windows + R
echo 2. Type: wf.msc
echo 3. Click "Inbound Rules" ^> "New Rule"
echo 4. Select "Port" ^> Next
echo 5. TCP, Specific ports: 8080 ^> Next
echo 6. Allow the connection ^> Next
echo 7. Check all profiles ^> Next
echo 8. Name: FloorPlan-to-3D ^> Finish
echo.
echo ========================================
echo.

REM Create a clickable HTML file with the URL
echo ^<!DOCTYPE html^> > network_access.html
echo ^<html^> >> network_access.html
echo ^<head^> >> network_access.html
echo ^<meta charset="UTF-8"^> >> network_access.html
echo ^<title^>FloorPlan-to-3D Access^</title^> >> network_access.html
echo ^<style^> >> network_access.html
echo body { font-family: Arial; padding: 50px; background: #f5f5f5; } >> network_access.html
echo .container { background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); } >> network_access.html
echo h1 { color: #333; } >> network_access.html
echo .url { background: #e8f5e9; padding: 20px; border-radius: 5px; font-size: 24px; text-align: center; margin: 20px 0; } >> network_access.html
echo a { color: #2196F3; text-decoration: none; font-weight: bold; font-size: 28px; } >> network_access.html
echo a:hover { text-decoration: underline; } >> network_access.html
echo .info { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; } >> network_access.html
echo .qr { text-align: center; margin: 20px 0; } >> network_access.html
echo ^</style^> >> network_access.html
echo ^</head^> >> network_access.html
echo ^<body^> >> network_access.html
echo ^<div class="container"^> >> network_access.html
echo ^<h1^>🌐 FloorPlan-to-3D Server Access^</h1^> >> network_access.html
echo ^<div class="url"^> >> network_access.html
echo ^<a href="http://!VALID_IP!:8080" target="_blank"^>http://!VALID_IP!:8080^</a^> >> network_access.html
echo ^</div^> >> network_access.html
echo ^<div class="info"^> >> network_access.html
echo ^<h3^>📱 For Mobile Devices:^</h3^> >> network_access.html
echo ^<ol^> >> network_access.html
echo ^<li^>Connect to the same WiFi network^</li^> >> network_access.html
echo ^<li^>Open browser on your phone/tablet^</li^> >> network_access.html
echo ^<li^>Type or scan: ^<strong^>http://!VALID_IP!:8080^</strong^>^</li^> >> network_access.html
echo ^</ol^> >> network_access.html
echo ^</div^> >> network_access.html
echo ^<div class="qr"^> >> network_access.html
echo ^<p^>^<strong^>Or scan this QR code:^</strong^>^</p^> >> network_access.html
echo ^<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://!VALID_IP!:8080" alt="QR Code"^> >> network_access.html
echo ^</div^> >> network_access.html
echo ^<p style="text-align: center; color: #666;"^>Click the link above or use the QR code to access from any device^</p^> >> network_access.html
echo ^</div^> >> network_access.html
echo ^</body^> >> network_access.html
echo ^</html^> >> network_access.html

echo [CREATED] network_access.html
echo.
echo This HTML file has been created with:
echo   - Clickable link to your server
echo   - QR code for mobile devices
echo   - Instructions for access
echo.
echo Opening the file now...
echo.
timeout /t 2 >nul
start network_access.html

pause
endlocal

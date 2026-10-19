@echo off
REM ============================================================================
REM Windows Firewall Fix for FloorPlan-to-3D Network Access
REM This script adds firewall rules to allow network access to the server
REM ============================================================================

echo.
echo ========================================
echo  Windows Firewall Configuration
echo ========================================
echo.
echo This script will configure Windows Firewall
echo to allow network access to the FloorPlan-to-3D server.
echo.
echo **ADMINISTRATOR RIGHTS REQUIRED**
echo.
pause

REM Check for administrator rights
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Administrator rights required!
    echo.
    echo Right-click this file and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo.
echo [INFO] Running with administrator privileges...
echo.

REM Get Python path from virtual environment
set "PYTHON_PATH="
if exist ".venv\Scripts\python.exe" (
    set "PYTHON_PATH=%CD%\.venv\Scripts\python.exe"
) else if exist "venv\Scripts\python.exe" (
    set "PYTHON_PATH=%CD%\venv\Scripts\python.exe"
)

if "%PYTHON_PATH%"=="" (
    echo [ERROR] No Python virtual environment found!
    echo Please run run.bat first to create the environment.
    pause
    exit /b 1
)

echo [INFO] Python path: %PYTHON_PATH%
echo.

REM ============================================================================
REM Step 1: Remove old rules if they exist
REM ============================================================================
echo [STEP 1] Removing old firewall rules (if any)...
netsh advfirewall firewall delete rule name="FloorPlan-to-3D Server (TCP)" >nul 2>&1
netsh advfirewall firewall delete rule name="FloorPlan-to-3D Server (HTTP)" >nul 2>&1
netsh advfirewall firewall delete rule name="Python - FloorPlan-to-3D" >nul 2>&1
echo [OK] Old rules removed
echo.

REM ============================================================================
REM Step 2: Add new firewall rules
REM ============================================================================
echo [STEP 2] Adding firewall rules...
echo.

REM Rule 1: Allow Python.exe
echo [RULE 1] Allowing Python executable...
netsh advfirewall firewall add rule name="Python - FloorPlan-to-3D" dir=in action=allow program="%PYTHON_PATH%" enable=yes profile=private,public description="Allow FloorPlan-to-3D Python server to accept network connections"
if %errorlevel% equ 0 (
    echo [SUCCESS] Python rule added
) else (
    echo [ERROR] Failed to add Python rule
)
echo.

REM Rule 2: Allow Port 8080
echo [RULE 2] Opening port 8080...
netsh advfirewall firewall add rule name="FloorPlan-to-3D Server (TCP)" dir=in action=allow protocol=TCP localport=8080 profile=private,public description="Allow incoming HTTP connections to FloorPlan-to-3D server on port 8080"
if %errorlevel% equ 0 (
    echo [SUCCESS] Port 8080 rule added
) else (
    echo [ERROR] Failed to add port rule
)
echo.

REM ============================================================================
REM Step 3: Check network profile
REM ============================================================================
echo [STEP 3] Checking network profile...
powershell -Command "Get-NetConnectionProfile | Select-Object Name, NetworkCategory, InterfaceAlias | Format-Table"
echo.
echo [INFO] If your network shows 'Public', consider changing to 'Private'
echo       for better local network access.
echo.
echo To change network profile:
echo   1. Open Settings
echo   2. Network ^& Internet
echo   3. Click your WiFi/Ethernet
echo   4. Change Network profile to "Private"
echo.

REM ============================================================================
REM Step 4: Verify rules
REM ============================================================================
echo [STEP 4] Verifying firewall rules...
netsh advfirewall firewall show rule name="Python - FloorPlan-to-3D" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Python firewall rule exists
) else (
    echo [WARNING] Python rule not found
)

netsh advfirewall firewall show rule name="FloorPlan-to-3D Server (TCP)" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Port 8080 rule exists
) else (
    echo [WARNING] Port rule not found
)
echo.

REM ============================================================================
REM Step 5: Test port availability
REM ============================================================================
echo [STEP 5] Checking if port 8080 is available...
netstat -an | findstr ":8080" >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Port 8080 is currently in use
    echo.
    echo To see what's using it:
    echo   netstat -ano ^| findstr :8080
    echo.
    echo To kill the process:
    echo   taskkill /PID [process_id] /F
) else (
    echo [OK] Port 8080 is available
)
echo.

REM ============================================================================
REM Done!
REM ============================================================================
echo ========================================
echo  FIREWALL CONFIGURATION COMPLETE!
echo ========================================
echo.
echo Next steps:
echo  1. Start the server: run.bat
echo  2. Try accessing from another device
echo  3. Make sure devices are on SAME WiFi
echo.
echo If still not working:
echo  1. Temporarily disable Windows Firewall
echo  2. Check if antivirus is blocking
echo  3. Verify WiFi is not using isolation mode
echo  4. Try a mobile hotspot instead
echo.
pause

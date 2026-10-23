@echo off
REM Run this file as Administrator to allow network access

echo ========================================
echo   Adding Firewall Rule
echo ========================================
echo.
echo This will allow port 8000 through Windows Firewall
echo so other devices can access the server.
echo.

REM Check for admin rights
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: This script requires Administrator privileges!
    echo.
    echo Right-click this file and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo Adding firewall rule for Python HTTP Server...
netsh advfirewall firewall delete rule name="Python HTTP Server Port 8000" >nul 2>&1
netsh advfirewall firewall add rule name="Python HTTP Server Port 8000" dir=in action=allow protocol=TCP localport=8000 enable=yes

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Firewall rule added successfully!
    echo Port 8000 is now accessible from other devices.
    echo.
) else (
    echo.
    echo [ERROR] Failed to add firewall rule.
    echo.
)

pause

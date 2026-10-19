@echo off
setlocal enabledelayedexpansion
echo ========================================
echo  SERVER CONNECTION TEST
echo ========================================
echo.

REM Get IP address
set "LOCAL_IP="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "TEMP_IP=%%a"
    for /f "tokens=* delims= " %%b in ("!TEMP_IP!") do set "TEMP_IP=%%b"
    
    echo !TEMP_IP! | findstr /B "127.0.0.1" >nul
    if errorlevel 1 (
        echo !TEMP_IP! | findstr /B "169.254" >nul
        if errorlevel 1 (
            echo !TEMP_IP! | findstr /B "192.168\|10\.\|172\." >nul
            if not errorlevel 1 (
                set "LOCAL_IP=!TEMP_IP!"
                goto :ip_done
            )
        )
    )
)
:ip_done

if "!LOCAL_IP!"=="" (
    echo [ERROR] No valid IP found
    pause
    exit /b 1
)

echo [OK] Your IP: !LOCAL_IP!
echo.

echo Testing server connectivity...
echo.

REM Test 1: Localhost
echo [TEST 1] Checking http://localhost:8080
curl -s -o nul -w "HTTP Status: %%{http_code}\n" --connect-timeout 5 http://localhost:8080 2>nul
if errorlevel 1 (
    echo [FAIL] Cannot connect to localhost:8080
    echo Server might not be running!
) else (
    echo [OK] Localhost connection works!
)
echo.

REM Test 2: Local IP
echo [TEST 2] Checking http://!LOCAL_IP!:8080
curl -s -o nul -w "HTTP Status: %%{http_code}\n" --connect-timeout 5 http://!LOCAL_IP!:8080 2>nul
if errorlevel 1 (
    echo [FAIL] Cannot connect to !LOCAL_IP!:8080
    echo Firewall might be blocking the connection!
) else (
    echo [OK] Network IP connection works!
)
echo.

REM Test 3: Port check
echo [TEST 3] Checking if port 8080 is listening...
netstat -an | findstr ":8080.*LISTENING" >nul
if errorlevel 1 (
    echo [FAIL] Port 8080 is not listening
    echo Server is NOT running!
    echo.
    echo Run: run.bat to start the server
) else (
    echo [OK] Port 8080 is listening
    netstat -ano | findstr ":8080.*LISTENING"
)
echo.

echo ========================================
echo  SUMMARY
echo ========================================
echo.
echo If all tests passed:
echo   - Server is running correctly
echo   - Access from this PC: http://localhost:8080
echo   - Access from other devices: http://!LOCAL_IP!:8080
echo.
echo If tests failed:
echo   1. Make sure run.bat is running
echo   2. Check Windows Firewall settings
echo   3. Verify port 8080 is not used by another app
echo.

pause
endlocal

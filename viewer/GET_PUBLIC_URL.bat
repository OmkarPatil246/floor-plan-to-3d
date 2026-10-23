@echo off
echo.
echo ========================================
echo   CHECKING PUBLIC URL...
echo ========================================
echo.

timeout /t 3 /nobreak >nul

curl -s http://localhost:4040/api/tunnels 2>nul | findstr "public_url"

if %errorlevel% neq 0 (
    echo [INFO] Ngrok not running yet or still starting...
    echo.
    echo Please:
    echo 1. Check if SETUP_PUBLIC_ACCESS.bat is running
    echo 2. Wait 10-15 seconds for ngrok to start
    echo 3. Open http://localhost:4040 in browser
    echo.
) else (
    echo.
    echo [OK] URL found above!
    echo.
)

echo.
echo Open ngrok dashboard: http://localhost:4040
echo.
pause

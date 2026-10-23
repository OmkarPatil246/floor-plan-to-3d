@echo off
color 0B
cls
title Public URLs - ArchGen 3D
echo.
echo ════════════════════════════════════════════════════════════════
echo   FETCHING YOUR PUBLIC URLs FROM NGROK...
echo ════════════════════════════════════════════════════════════════
echo.
echo Please wait...
echo.

REM Open ngrok dashboard
start http://localhost:4040

timeout /t 3 /nobreak >nul

REM Fetch and display URLs using PowerShell
powershell -Command "try { $tunnels = Invoke-RestMethod -Uri 'http://localhost:4040/api/tunnels' -ErrorAction Stop; Write-Host ''; Write-Host '════════════════════════════════════════════════════════════════' -ForegroundColor Green; Write-Host '   YOUR PUBLIC URLs - COPY TO YOUR PHONE!' -ForegroundColor Green; Write-Host '════════════════════════════════════════════════════════════════' -ForegroundColor Green; Write-Host ''; foreach ($t in $tunnels.tunnels) { $port = $t.config.addr.Split(':')[-1]; $name = ''; if ($port -eq '8080') { $name = 'Main Server (3D Viewer)'; } elseif ($port -eq '5174') { $name = 'ArchGen 3D UI (Main Interface)'; } elseif ($port -eq '5173') { $name = 'Recommendation UI'; } elseif ($port -eq '8000') { $name = 'Recommendation API'; } else { $name = \"Service (Port $port)\"; } Write-Host \" $name\" -ForegroundColor Cyan; Write-Host \"  📱 $($t.public_url)\" -ForegroundColor Yellow; Write-Host ''; } Write-Host '════════════════════════════════════════════════════════════════' -ForegroundColor Green; Write-Host ''; Write-Host '📋 For VR Mode:' -ForegroundColor White; Write-Host '   Copy the Main Server URL and add /vr-walk-mode.html' -ForegroundColor Gray; Write-Host '   Example: https://abc.ngrok.app/viewer/vr-walk-mode.html' -ForegroundColor Gray; Write-Host ''; Write-Host '💡 For Best Experience:' -ForegroundColor White; Write-Host '   • Use HTTPS URLs (not HTTP)' -ForegroundColor Gray; Write-Host '   • Keep all terminal windows open' -ForegroundColor Gray; Write-Host '   • Free ngrok tunnels last 2 hours' -ForegroundColor Gray; Write-Host ''; } catch { Write-Host ''; Write-Host '════════════════════════════════════════════════════════════════' -ForegroundColor Red; Write-Host '   ERROR: Cannot fetch ngrok URLs' -ForegroundColor Red; Write-Host '════════════════════════════════════════════════════════════════' -ForegroundColor Red; Write-Host ''; Write-Host 'Possible reasons:' -ForegroundColor Yellow; Write-Host '  • Ngrok is not running yet (wait 20 seconds after starting)' -ForegroundColor White; Write-Host '  • Services not started (run RUN_WITH_PUBLIC_ACCESS.bat first)' -ForegroundColor White; Write-Host ''; Write-Host 'Opening ngrok dashboard instead...' -ForegroundColor Yellow; Write-Host 'Check the dashboard for your public URLs.' -ForegroundColor White; Write-Host ''; }"

echo.
echo ════════════════════════════════════════════════════════════════
echo   View full details at: http://localhost:4040
echo ════════════════════════════════════════════════════════════════
echo.
echo Press any key to close...
pause >nul

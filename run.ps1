# PowerShell script to start FloorPlan-to-3D server with network access
# Alternative to run.bat with enhanced network detection

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " FloorPlan-to-3D Server Starting..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to script directory
Set-Location $PSScriptRoot

# Find Python executable
$pythonCmd = "python"
if (Test-Path "$PSScriptRoot\.venv\Scripts\python.exe") {
    $pythonCmd = "$PSScriptRoot\.venv\Scripts\python.exe"
    Write-Host "[INFO] Using virtual environment Python" -ForegroundColor Green
} elseif (Test-Path "$PSScriptRoot\venv\Scripts\python.exe") {
    $pythonCmd = "$PSScriptRoot\venv\Scripts\python.exe"
    Write-Host "[INFO] Using virtual environment Python" -ForegroundColor Green
} else {
    Write-Host "[INFO] Using system Python" -ForegroundColor Yellow
}

# Get all IPv4 addresses
$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | 
    Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } | 
    Select-Object -ExpandProperty IPAddress

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " SERVER ACCESS URLS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Local Access (This Computer):" -ForegroundColor White
Write-Host "  http://localhost:8080" -ForegroundColor Green
Write-Host "  http://127.0.0.1:8080" -ForegroundColor Green
Write-Host ""

if ($ipAddresses.Count -gt 0) {
    Write-Host "Network Access (Other Devices):" -ForegroundColor White
    foreach ($ip in $ipAddresses) {
        Write-Host "  http://${ip}:8080" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "To access from phone/tablet:" -ForegroundColor White
    Write-Host "  1. Connect device to same WiFi network" -ForegroundColor Gray
    Write-Host "  2. Open browser and navigate to one of the URLs above" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "Warning: Could not detect network IP address" -ForegroundColor Red
    Write-Host "Server will still be accessible on localhost" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Press Ctrl+C to stop the server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Generate QR code URL (first network IP if available)
if ($ipAddresses.Count -gt 0) {
    $firstIP = $ipAddresses[0]
    $qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://${firstIP}:8080"
    Write-Host "QR Code for mobile access:" -ForegroundColor Cyan
    Write-Host "  $qrUrl" -ForegroundColor Blue
    Write-Host "  (Open this URL on desktop to get QR code for mobile scanning)" -ForegroundColor Gray
    Write-Host ""
}

# Start the server
& $pythonCmd server/main.py

# Pause at the end
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Maharah Roof System - Windows Startup Script

Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "     Maharah Roof System - Starting     " -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Database: maharah_roof" -ForegroundColor Yellow
Write-Host "Backend:  http://localhost:6000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:3001 (dev)" -ForegroundColor Yellow
Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "backend")) {
    Write-Host "Error: Please run this script from the maharah_roof_system directory" -ForegroundColor Red
    exit 1
}

# Start Backend
Write-Host "Starting Backend on port 6000..." -ForegroundColor Green
Set-Location backend
Start-Process -NoNewWindow npm -ArgumentList "start"
Set-Location ..

Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host "System is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Open: http://localhost:6000" -ForegroundColor White
Write-Host ""
Write-Host "Login: admin / 123456" -ForegroundColor White
Write-Host "════════════════════════════════════════" -ForegroundColor Green

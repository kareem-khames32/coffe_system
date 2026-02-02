# Cafe Management System - Windows Installation Script
# Run as Administrator: Right-click PowerShell -> Run as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Installing Cafe Management System Requirements" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin)
{
    Write-Host "ERROR: This script must be run as Administrator" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    pause
    exit
}

# Install Chocolatey if not installed
Write-Host "Checking Chocolatey..." -ForegroundColor Green
if (!(Get-Command choco -ErrorAction SilentlyContinue))
{
    Write-Host "Installing Chocolatey..." -ForegroundColor Green
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

    # Refresh environment variables
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

Write-Host "Chocolatey is ready" -ForegroundColor Green
Write-Host ""

# Install Node.js
Write-Host "Installing Node.js..." -ForegroundColor Green
if (!(Get-Command node -ErrorAction SilentlyContinue))
{
    choco install nodejs-lts -y
    # Refresh environment variables
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}
else
{
    Write-Host "Node.js is already installed" -ForegroundColor Cyan
}

# Verify Node.js installation
$nodeVersion = node -v
$npmVersion = npm -v
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host "NPM version: $npmVersion" -ForegroundColor Green
Write-Host ""

# Install MySQL
Write-Host "Installing MySQL..." -ForegroundColor Green
if (!(Get-Service MySQL* -ErrorAction SilentlyContinue))
{
    choco install mysql -y

    # Start MySQL service
    Write-Host "Starting MySQL service..." -ForegroundColor Green
    Start-Service MySQL*
    Set-Service -Name MySQL* -StartupType Automatic
}
else
{
    Write-Host "MySQL is already installed" -ForegroundColor Cyan
}

Write-Host "MySQL installed successfully" -ForegroundColor Green
Write-Host ""

# Install PM2
Write-Host "Installing PM2..." -ForegroundColor Green
npm install -g pm2
npm install -g pm2-windows-startup

Write-Host "PM2 installed successfully" -ForegroundColor Green
Write-Host ""

# Configure PM2 for Windows startup
Write-Host "Configuring PM2 for auto-startup..." -ForegroundColor Green
pm2-startup install

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installation completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Setup database: .\setup-database.ps1" -ForegroundColor White
Write-Host "2. Setup system: .\setup-system.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Note: You may need to restart PowerShell after installation" -ForegroundColor Yellow
Write-Host ""
pause

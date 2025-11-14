# Cafe Management System - Windows Installation Script
# Run as Administrator: Right-click PowerShell -> Run as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  تثبيت متطلبات نظام إدارة المقهى" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  يجب تشغيل هذا السكريبت كمسؤول (Administrator)" -ForegroundColor Red
    Write-Host "انقر بيمين الفأرة على PowerShell واختر 'Run as Administrator'" -ForegroundColor Yellow
    pause
    exit
}

# Install Chocolatey if not installed
Write-Host "📦 التحقق من Chocolatey..." -ForegroundColor Green
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "📦 تثبيت Chocolatey..." -ForegroundColor Green
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

    # Refresh environment variables
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

Write-Host "✓ Chocolatey جاهز" -ForegroundColor Green
Write-Host ""

# Install Node.js
Write-Host "📦 تثبيت Node.js..." -ForegroundColor Green
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    choco install nodejs-lts -y
    # Refresh environment variables
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
} else {
    Write-Host "✓ Node.js مثبت بالفعل" -ForegroundColor Cyan
}

# Verify Node.js installation
$nodeVersion = node -v
$npmVersion = npm -v
Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host "✓ NPM version: $npmVersion" -ForegroundColor Green
Write-Host ""

# Install MySQL
Write-Host "📦 تثبيت MySQL..." -ForegroundColor Green
if (!(Get-Service MySQL* -ErrorAction SilentlyContinue)) {
    choco install mysql -y

    # Start MySQL service
    Write-Host "🔄 بدء خدمة MySQL..." -ForegroundColor Green
    Start-Service MySQL*
    Set-Service -Name MySQL* -StartupType Automatic
} else {
    Write-Host "✓ MySQL مثبت بالفعل" -ForegroundColor Cyan
}

Write-Host "✓ MySQL تم التثبيت بنجاح" -ForegroundColor Green
Write-Host ""

# Install PM2
Write-Host "📦 تثبيت PM2..." -ForegroundColor Green
npm install -g pm2
npm install -g pm2-windows-startup

Write-Host "✓ PM2 تم التثبيت بنجاح" -ForegroundColor Green
Write-Host ""

# Configure PM2 for Windows startup
Write-Host "📦 إعداد PM2 للبدء التلقائي..." -ForegroundColor Green
pm2-startup install

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ تم التثبيت بنجاح!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "الخطوة التالية:" -ForegroundColor Yellow
Write-Host "1. قم بإعداد قاعدة البيانات: .\setup-database.ps1" -ForegroundColor White
Write-Host "2. قم بإعداد النظام: .\setup-system.ps1" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  ملاحظة: قد تحتاج لإعادة فتح PowerShell بعد التثبيت" -ForegroundColor Yellow
Write-Host ""
pause

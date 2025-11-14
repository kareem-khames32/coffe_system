# Cafe Management System - System Setup Script for Windows

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  إعداد النظام" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get server IP address
$SERVER_IP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*" -and $_.InterfaceAlias -notlike "*VirtualBox*"} | Select-Object -First 1).IPAddress

Write-Host "📦 إعداد ملفات البيئة..." -ForegroundColor Green
Write-Host "عنوان IP للسيرفر: $SERVER_IP" -ForegroundColor Cyan
Write-Host ""

# Generate JWT secret
$JWT_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Backend .env
$backendEnv = @"
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=cafe_user
DB_PASSWORD=cafe_password_2024
DB_NAME=cafe_db

# JWT Configuration
JWT_SECRET=$JWT_SECRET

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
"@

$backendEnv | Out-File -FilePath "backend\.env" -Encoding UTF8
Write-Host "✓ تم إنشاء ملف backend\.env" -ForegroundColor Green

# Frontend .env
$frontendEnv = @"
# API Configuration
VITE_API_URL=http://${SERVER_IP}:5000
"@

$frontendEnv | Out-File -FilePath "frontend\.env" -Encoding UTF8
Write-Host "✓ تم إنشاء ملف frontend\.env" -ForegroundColor Green
Write-Host ""

# Install backend dependencies
Write-Host "📦 تثبيت مكتبات Backend..." -ForegroundColor Green
Set-Location backend
npm install --production
Set-Location ..
Write-Host ""

# Install frontend dependencies
Write-Host "📦 تثبيت مكتبات Frontend..." -ForegroundColor Green
Set-Location frontend
npm install
Write-Host ""

# Build frontend
Write-Host "📦 بناء Frontend..." -ForegroundColor Green
npm run build
Set-Location ..
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ تم إعداد النظام بنجاح!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "عنوان IP للسيرفر: $SERVER_IP" -ForegroundColor Yellow
Write-Host "رابط الدخول للنظام: http://${SERVER_IP}:5000" -ForegroundColor Yellow
Write-Host ""
Write-Host "الخطوة التالية:" -ForegroundColor Yellow
Write-Host "قم بتشغيل النظام: .\start.ps1" -ForegroundColor White
Write-Host ""
pause

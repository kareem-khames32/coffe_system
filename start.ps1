# Cafe Management System - Start Script for Windows

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  تشغيل نظام إدارة المقهى" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get server IP
$SERVER_IP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*" -and $_.InterfaceAlias -notlike "*VirtualBox*"} | Select-Object -First 1).IPAddress

# Stop any existing instances
Write-Host "📦 إيقاف النسخ القديمة..." -ForegroundColor Green
pm2 delete cafe-backend 2>$null

# Start backend with PM2
Write-Host ""
Write-Host "📦 تشغيل Backend..." -ForegroundColor Green
Set-Location backend
pm2 start src\server.js --name cafe-backend --watch
pm2 save
Set-Location ..
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ تم تشغيل النظام بنجاح!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 عنوان النظام: http://${SERVER_IP}:5000" -ForegroundColor Yellow
Write-Host ""
Write-Host "📊 لعرض حالة Backend:" -ForegroundColor Cyan
Write-Host "   pm2 status" -ForegroundColor White
Write-Host ""
Write-Host "📊 لعرض سجلات Backend:" -ForegroundColor Cyan
Write-Host "   pm2 logs cafe-backend" -ForegroundColor White
Write-Host ""
Write-Host "🔄 لإعادة تشغيل Backend:" -ForegroundColor Cyan
Write-Host "   pm2 restart cafe-backend" -ForegroundColor White
Write-Host ""
Write-Host "⛔ لإيقاف Backend:" -ForegroundColor Cyan
Write-Host "   pm2 stop cafe-backend" -ForegroundColor White
Write-Host ""
Write-Host "💡 النظام سيعمل تلقائياً عند إعادة تشغيل Windows" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "بيانات الدخول التجريبية:" -ForegroundColor Yellow
Write-Host "اسم المستخدم: admin" -ForegroundColor White
Write-Host "كلمة المرور: admin123" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Open browser
$openBrowser = Read-Host "هل تريد فتح المتصفح الآن؟ (Y/N)"
if ($openBrowser -eq "Y" -or $openBrowser -eq "y") {
    Start-Process "http://${SERVER_IP}:5000"
}

Write-Host ""
pause

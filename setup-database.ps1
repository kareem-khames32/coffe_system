# Cafe Management System - Database Setup Script for Windows
# Run as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  إعداد قاعدة البيانات" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Database credentials
$DB_NAME = "cafe_db"
$DB_USER = "cafe_user"
$DB_PASSWORD = "cafe_password_2024"

Write-Host "📦 إنشاء قاعدة البيانات والمستخدم..." -ForegroundColor Green

# Create SQL commands file
$sqlCommands = @"
CREATE DATABASE IF NOT EXISTS $DB_NAME;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
"@

$sqlFile = "setup_db_temp.sql"
$sqlCommands | Out-File -FilePath $sqlFile -Encoding UTF8

# Execute SQL commands
Write-Host "🔄 تنفيذ أوامر SQL..." -ForegroundColor Green
mysql -u root -e "source $sqlFile"

# Clean up temp file
Remove-Item $sqlFile

Write-Host "✓ تم إنشاء قاعدة البيانات: $DB_NAME" -ForegroundColor Green
Write-Host "✓ تم إنشاء المستخدم: $DB_USER" -ForegroundColor Green
Write-Host ""

# Import database schema
Write-Host "📦 استيراد الجداول والبيانات الأساسية..." -ForegroundColor Green

# Run all migrations
$migrationFiles = Get-ChildItem -Path "backend\migrations\*.sql" | Sort-Object Name

foreach ($migrationFile in $migrationFiles) {
    Write-Host "تنفيذ: $($migrationFile.Name)" -ForegroundColor Cyan
    mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME -e "source $($migrationFile.FullName)"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ تم إعداد قاعدة البيانات بنجاح!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "بيانات الاتصال بقاعدة البيانات:" -ForegroundColor Yellow
Write-Host "اسم قاعدة البيانات: $DB_NAME" -ForegroundColor White
Write-Host "اسم المستخدم: $DB_USER" -ForegroundColor White
Write-Host "كلمة المرور: $DB_PASSWORD" -ForegroundColor White
Write-Host ""
Write-Host "الخطوة التالية:" -ForegroundColor Yellow
Write-Host "قم بإعداد النظام: .\setup-system.ps1" -ForegroundColor White
Write-Host ""
pause

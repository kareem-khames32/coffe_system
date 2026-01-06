@echo off
echo ====================================
echo   Quick Database Setup
echo ====================================
echo.

echo Creating database and importing schema...
echo.

mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS cafe_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p cafe_management < database.sql
mysql -u root -p cafe_management < database/SETUP_ALL.sql

echo.
echo ====================================
echo   Database setup completed!
echo ====================================
echo.
echo Default users created:
echo - admin / admin123
echo - kareem / 123456
echo - manager / 123456
echo.
pause

@echo off
echo ====================================
echo   Creating Cafe Management Database
echo ====================================
echo.

echo Enter your MySQL root password when prompted...
echo.

mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS cafe_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo.
echo Database created! Now importing tables...
echo.

mysql -u root -p cafe_management < database.sql

echo.
echo Importing initial data...
echo.

mysql -u root -p cafe_management < database/SETUP_ALL.sql

echo.
echo ====================================
echo   Database setup completed!
echo ====================================
echo.
echo Default users:
echo - admin / admin123
echo - kareem / 123456
echo - manager / 123456
echo.
pause

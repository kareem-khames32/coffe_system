#!/bin/bash

# Script to install all requirements on Ubuntu/Debian
# Run: chmod +x install.sh && sudo ./install.sh

echo "════════════════════════════════════════"
echo "  تثبيت متطلبات نظام إدارة المقهى"
echo "════════════════════════════════════════"

# Update system
echo "📦 تحديث النظام..."
apt update && apt upgrade -y

# Install Node.js 18
echo "📦 تثبيت Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify Node.js installation
echo "✓ Node.js version: $(node -v)"
echo "✓ NPM version: $(npm -v)"

# Install MySQL
echo "📦 تثبيت MySQL..."
apt install -y mysql-server

# Start MySQL
systemctl start mysql
systemctl enable mysql

echo "✓ MySQL installed successfully"

# Install PM2
echo "📦 تثبيت PM2..."
npm install -g pm2

echo ""
echo "════════════════════════════════════════"
echo "✅ تم التثبيت بنجاح!"
echo "════════════════════════════════════════"
echo ""
echo "الخطوة التالية:"
echo "1. قم بإعداد قاعدة البيانات بتشغيل: sudo ./setup-database.sh"
echo "2. قم بإعداد النظام بتشغيل: ./setup-system.sh"

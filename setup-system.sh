#!/bin/bash

echo "════════════════════════════════════════"
echo "  إعداد النظام"
echo "════════════════════════════════════════"

# Get server IP address
SERVER_IP=$(hostname -I | awk '{print $1}')

echo "📦 إعداد ملفات البيئة..."

# Backend .env
cat > backend/.env <<EOF
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
JWT_SECRET=$(openssl rand -base64 32)

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
EOF

echo "✓ تم إنشاء ملف backend/.env"

# Frontend .env
cat > frontend/.env <<EOF
# API Configuration
VITE_API_URL=http://${SERVER_IP}:5000
EOF

echo "✓ تم إنشاء ملف frontend/.env"

# Install backend dependencies
echo ""
echo "📦 تثبيت مكتبات Backend..."
cd backend
npm install --production

# Install frontend dependencies
echo ""
echo "📦 تثبيت مكتبات Frontend..."
cd ../frontend
npm install

# Build frontend
echo ""
echo "📦 بناء Frontend..."
npm run build

cd ..

echo ""
echo "════════════════════════════════════════"
echo "✅ تم إعداد النظام بنجاح!"
echo "════════════════════════════════════════"
echo ""
echo "عنوان IP للسيرفر: ${SERVER_IP}"
echo "رابط الدخول للنظام: http://${SERVER_IP}:5000"
echo ""
echo "الخطوة التالية:"
echo "قم بتشغيل النظام: ./start.sh"

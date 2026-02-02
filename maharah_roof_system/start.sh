#!/bin/bash

echo "════════════════════════════════════════"
echo "  تشغيل نظام إدارة المقهى"
echo "════════════════════════════════════════"

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

# Stop any existing instances
echo "📦 إيقاف النسخ القديمة..."
pm2 delete cafe-backend 2>/dev/null || true

# Start backend with PM2
echo ""
echo "📦 تشغيل Backend..."
cd backend
pm2 start src/server.js --name cafe-backend --watch
pm2 save
cd ..

# Make PM2 start on system boot
pm2 startup systemd -u $USER --hp $HOME
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

echo ""
echo "════════════════════════════════════════"
echo "✅ تم تشغيل النظام بنجاح!"
echo "════════════════════════════════════════"
echo ""
echo "🌐 عنوان النظام: http://${SERVER_IP}:5000"
echo ""
echo "📊 لعرض حالة Backend:"
echo "   pm2 status"
echo ""
echo "📊 لعرض سجلات Backend:"
echo "   pm2 logs cafe-backend"
echo ""
echo "🔄 لإعادة تشغيل Backend:"
echo "   pm2 restart cafe-backend"
echo ""
echo "⛔ لإيقاف Backend:"
echo "   pm2 stop cafe-backend"
echo ""
echo "💡 النظام سيعمل تلقائياً عند إعادة تشغيل السيرفر"
echo ""
echo "════════════════════════════════════════"
echo "بيانات الدخول التجريبية:"
echo "اسم المستخدم: admin"
echo "كلمة المرور: admin123"
echo "════════════════════════════════════════"

#!/bin/bash

echo "════════════════════════════════════════"
echo "  إعداد قاعدة البيانات"
echo "════════════════════════════════════════"

# Database credentials
DB_NAME="cafe_db"
DB_USER="cafe_user"
DB_PASSWORD="cafe_password_2024"

echo "📦 إنشاء قاعدة البيانات والمستخدم..."

# Create database and user
sudo mysql <<EOF
CREATE DATABASE IF NOT EXISTS ${DB_NAME};
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF

echo "✓ تم إنشاء قاعدة البيانات: ${DB_NAME}"
echo "✓ تم إنشاء المستخدم: ${DB_USER}"

# Import database schema
echo ""
echo "📦 استيراد الجداول والبيانات الأساسية..."

# Run all migrations
for migration_file in backend/migrations/*.sql; do
    if [ -f "$migration_file" ]; then
        echo "تنفيذ: $(basename $migration_file)"
        mysql -u${DB_USER} -p${DB_PASSWORD} ${DB_NAME} < "$migration_file"
    fi
done

echo ""
echo "════════════════════════════════════════"
echo "✅ تم إعداد قاعدة البيانات بنجاح!"
echo "════════════════════════════════════════"
echo ""
echo "بيانات الاتصال بقاعدة البيانات:"
echo "اسم قاعدة البيانات: ${DB_NAME}"
echo "اسم المستخدم: ${DB_USER}"
echo "كلمة المرور: ${DB_PASSWORD}"
echo ""
echo "الخطوة التالية:"
echo "قم بإعداد النظام بتشغيل: ./setup-system.sh"

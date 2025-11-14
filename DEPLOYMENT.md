# دليل نشر نظام إدارة المقهى على سيرفر محلي

## المتطلبات

- جهاز سيرفر يعمل بنظام Ubuntu/Debian
- اتصال بالإنترنت لتحميل المتطلبات
- صلاحيات sudo/root

---

## خطوات النشر

### 1️⃣ نقل المشروع للسيرفر

انقل مجلد المشروع كاملاً للسيرفر باستخدام أحد الطرق:

**عن طريق USB:**
```bash
cp -r /path/to/coffe_system /home/user/
```

**عن طريق Git:**
```bash
cd /home/user
git clone <repository-url> coffe_system
```

---

### 2️⃣ الدخول لمجلد المشروع

```bash
cd /home/user/coffe_system
```

---

### 3️⃣ منح صلاحيات التنفيذ للسكريبتات

```bash
chmod +x install.sh
chmod +x setup-database.sh
chmod +x setup-system.sh
chmod +x start.sh
```

---

### 4️⃣ تثبيت المتطلبات الأساسية

قم بتشغيل سكريبت التثبيت (يتطلب صلاحيات sudo):

```bash
sudo ./install.sh
```

هذا السكريبت سيقوم بـ:
- تحديث النظام
- تثبيت Node.js 18
- تثبيت MySQL Server
- تثبيت PM2

⏱️ **الوقت المتوقع:** 5-10 دقائق

---

### 5️⃣ إعداد قاعدة البيانات

قم بتشغيل سكريبت إعداد قاعدة البيانات:

```bash
sudo ./setup-database.sh
```

هذا السكريبت سيقوم بـ:
- إنشاء قاعدة بيانات اسمها `cafe_db`
- إنشاء مستخدم اسمه `cafe_user`
- إنشاء جميع الجداول
- إدراج البيانات الأساسية

⏱️ **الوقت المتوقع:** 1-2 دقيقة

**بيانات الاتصال بقاعدة البيانات:**
- اسم قاعدة البيانات: `cafe_db`
- اسم المستخدم: `cafe_user`
- كلمة المرور: `cafe_password_2024`

---

### 6️⃣ إعداد النظام

قم بتشغيل سكريبت إعداد النظام:

```bash
./setup-system.sh
```

هذا السكريبت سيقوم بـ:
- إنشاء ملفات البيئة (.env)
- تثبيت مكتبات Backend
- تثبيت مكتبات Frontend
- بناء Frontend للإنتاج

⏱️ **الوقت المتوقع:** 5-10 دقائق

---

### 7️⃣ تشغيل النظام

قم بتشغيل سكريبت بدء النظام:

```bash
./start.sh
```

هذا السكريبت سيقوم بـ:
- تشغيل Backend باستخدام PM2
- إعداد النظام للتشغيل التلقائي عند إعادة تشغيل السيرفر

⏱️ **الوقت المتوقع:** أقل من دقيقة

---

## 🎉 النظام جاهز!

بعد تنفيذ جميع الخطوات، النظام سيكون جاهزاً للاستخدام.

### 🌐 الوصول للنظام

من أي جهاز على نفس الشبكة المحلية، افتح المتصفح واكتب:

```
http://[عنوان-IP-للسيرفر]:5000
```

**لمعرفة عنوان IP للسيرفر:**
```bash
hostname -I
```

### 🔐 بيانات الدخول التجريبية

- **اسم المستخدم:** `admin`
- **كلمة المرور:** `admin123`

---

## 📊 إدارة النظام

### عرض حالة Backend
```bash
pm2 status
```

### عرض السجلات
```bash
pm2 logs cafe-backend
```

### إعادة تشغيل النظام
```bash
pm2 restart cafe-backend
```

### إيقاف النظام
```bash
pm2 stop cafe-backend
```

### بدء النظام بعد الإيقاف
```bash
pm2 start cafe-backend
```

---

## 🔧 إعدادات إضافية

### تغيير كلمة مرور قاعدة البيانات

إذا أردت تغيير كلمة مرور قاعدة البيانات:

1. غير كلمة المرور في MySQL:
```bash
sudo mysql
ALTER USER 'cafe_user'@'localhost' IDENTIFIED BY 'كلمة_المرور_الجديدة';
FLUSH PRIVILEGES;
exit;
```

2. عدل ملف `backend/.env`:
```bash
nano backend/.env
```
غير قيمة `DB_PASSWORD`

3. أعد تشغيل Backend:
```bash
pm2 restart cafe-backend
```

### السماح بالوصول من خارج الشبكة المحلية

**تحذير:** هذا غير منصوح به لأسباب أمنية.

إذا أردت فتح النظام للإنترنت:

1. افتح البورت 5000 في جدار الحماية:
```bash
sudo ufw allow 5000
```

2. اضبط router للسماح بـ Port Forwarding على البورت 5000

---

## 🔄 تحديث النظام

عند وجود تحديثات للنظام:

1. احصل على آخر نسخة من الكود
2. قم بتشغيل:
```bash
./setup-system.sh
pm2 restart cafe-backend
```

---

## 🛡️ النسخ الاحتياطي

### نسخ احتياطي لقاعدة البيانات

لعمل نسخة احتياطية:
```bash
mysqldump -u cafe_user -p cafe_db > backup_$(date +%Y%m%d).sql
```

لاستعادة نسخة احتياطية:
```bash
mysql -u cafe_user -p cafe_db < backup_20251114.sql
```

### نسخ احتياطي للصور المرفوعة

```bash
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz backend/uploads
```

---

## ❓ حل المشاكل الشائعة

### المنفذ 5000 مستخدم

إذا كان المنفذ 5000 مستخدماً بالفعل:

1. عدل ملف `backend/.env` وغير `PORT=5000` لرقم آخر
2. أعد تشغيل Backend

### MySQL لا يعمل

```bash
sudo systemctl status mysql
sudo systemctl start mysql
```

### PM2 لا يعمل

```bash
npm install -g pm2
```

### لا يمكن الوصول للنظام من أجهزة أخرى

1. تأكد من أن الجدار الناري يسمح بالاتصالات:
```bash
sudo ufw allow 5000
```

2. تأكد من أن جميع الأجهزة على نفس الشبكة

---

## 📞 الدعم

إذا واجهت أي مشاكل، تحقق من:
- سجلات PM2: `pm2 logs cafe-backend`
- سجلات MySQL: `sudo tail -f /var/log/mysql/error.log`
- حالة الخدمات: `pm2 status` و `sudo systemctl status mysql`

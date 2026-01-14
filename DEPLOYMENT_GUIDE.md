# 🚀 دليل النشر والتشغيل الكامل - Coffee System

## 📋 المحتويات
1. [متطلبات النظام](#متطلبات-النظام)
2. [إعداد قاعدة البيانات](#إعداد-قاعدة-البيانات)
3. [إعداد الـ Backend](#إعداد-الـ-backend)
4. [إعداد الـ Frontend](#إعداد-الـ-frontend)
5. [الاختبار والتحقق](#الاختبار-والتحقق)
6. [حل المشاكل الشائعة](#حل-المشاكل-الشائعة)

---

## 🔧 متطلبات النظام

### برامج مطلوبة:

1. **XAMPP** (أو WAMP/MAMP)
   - تحميل من: https://www.apachefriends.org
   - الإصدار: 7.4 أو أحدث
   - يتضمن: Apache + MySQL + PHP + phpMyAdmin

2. **Node.js**
   - تحميل من: https://nodejs.org
   - الإصدار: 16.x أو أحدث
   - يتضمن: npm (مدير الحزم)

3. **محرر نصوص** (اختياري)
   - VS Code (مستحسن)
   - Sublime Text
   - Notepad++

### التحقق من التثبيت:

```bash
# تحقق من Node.js
node --version
# يجب أن يظهر: v16.x.x أو أحدث

# تحقق من npm
npm --version
# يجب أن يظهر: 8.x.x أو أحدث

# تحقق من XAMPP - افتح Control Panel
# يجب أن ترى: Apache و MySQL
```

---

## 💾 إعداد قاعدة البيانات

### الخطوة 1: تشغيل XAMPP

1. افتح **XAMPP Control Panel**
2. اضغط **Start** بجانب **Apache**
3. اضغط **Start** بجانب **MySQL**
4. تأكد من أن الحالة أصبحت **Running** (خضراء)

### الخطوة 2: إنشاء قاعدة البيانات

1. افتح المتصفح واذهب إلى: `http://localhost/phpmyadmin`
2. اضغط على **"New"** (جديد) من القائمة اليسرى
3. اسم قاعدة البيانات: **`cafe_management`**
4. Collation: **utf8mb4_general_ci**
5. اضغط **Create** (إنشاء)

⚠️ **مهم جداً:** اسم قاعدة البيانات يجب أن يكون `cafe_management` بالضبط!

### الخطوة 3: التحقق من إعدادات الاتصال

تحقق من ملف `.env` في مجلد `backend`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=kareem123    # أو فارغ إذا لم تضع كلمة مرور
DB_NAME=cafe_management
DB_PORT=3306
```

**ملاحظة:** إذا كنت تستخدم XAMPP الافتراضي:
- `DB_USER=root`
- `DB_PASSWORD=` (فارغ - احذف "kareem123" تماماً)

### الخطوة 4: السماح بالاتصالات

في بعض الأحيان تحتاج لإنشاء مستخدم MySQL:

```sql
-- في phpMyAdmin، اذهب إلى تبويب SQL وشغّل:

CREATE USER 'root'@'localhost' IDENTIFIED BY 'kareem123';
GRANT ALL PRIVILEGES ON cafe_management.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

**أو إذا كنت تريد بدون كلمة مرور:**

```sql
GRANT ALL PRIVILEGES ON cafe_management.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

---

## ⚙️ إعداد الـ Backend

### الخطوة 1: تثبيت الحزم المطلوبة

```bash
# اذهب إلى مجلد المشروع
cd /path/to/coffe_system/backend

# ثبت الحزم (قد يستغرق بضع دقائق)
npm install

# تأكد من تثبيت axios للاختبار
npm install axios
```

### الخطوة 2: التحقق من ملف .env

تأكد من وجود ملف `.env` في مجلد `backend` مع الإعدادات الصحيحة:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=kareem123
DB_NAME=cafe_management
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Upload Configuration
UPLOAD_PATH=./uploads
```

### الخطوة 3: تشغيل الـ Backend

```bash
# من مجلد backend
node server.js

# أو باستخدام nodemon (للتطوير)
npm run dev
```

### الخطوة 4: التحقق من التشغيل الناجح

يجب أن ترى:

```
╔════════════════════════════════════════╗
║   Cafe Management System Backend      ║
╠════════════════════════════════════════╣
║   Server running on port: 5000        ║
║   Environment: development        ║
╚════════════════════════════════════════╝

🔧 Setting up inventory tables...
   ✅ Table 'suppliers' created
   ✅ Table 'warehouses' created
   ✅ Table 'raw_materials' created
   ✅ Table 'inventory_purchases' created
   ✅ Table 'inventory_purchase_items' created

💰 Setting up Phase 1 tables...
   ✅ Table 'supplier_payments' created
   ✅ Table 'material_batches' created
   ✅ Table 'stock_transfers' created
   ✅ Table 'stock_transfer_items' created

🚀 Setting up Phase 2 tables...
   ✅ Table 'batch_consumption' created
   ✅ Table 'inventory_counts' created
   ✅ Table 'inventory_count_items' created
   ✅ Table 'inventory_adjustments' created
   ✅ Table 'system_alerts' created
   ✅ Table 'alert_thresholds' created
```

⚠️ **إذا رأيت أخطاء:**

```
❌ Database connection failed:
Error Code: ECONNREFUSED
```

**الحل:**
1. تأكد من تشغيل MySQL في XAMPP
2. تحقق من معلومات الاتصال في .env
3. تحقق من اسم قاعدة البيانات (`cafe_management`)

---

## 🎨 إعداد الـ Frontend

### الخطوة 1: تثبيت الحزم

```bash
# في terminal جديد (اترك الـ backend يعمل)
cd /path/to/coffe_system/frontend

# ثبت الحزم
npm install
```

### الخطوة 2: التحقق من إعدادات الاتصال

تحقق من ملف `src/api/config.js`:

```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

### الخطوة 3: تشغيل الـ Frontend

```bash
# من مجلد frontend
npm run dev
```

### الخطوة 4: فتح التطبيق

1. افتح المتصفح
2. اذهب إلى: `http://localhost:5173` (أو المنفذ الذي يظهر لك)
3. يجب أن تظهر صفحة تسجيل الدخول

---

## ✅ الاختبار والتحقق

### 1. اختبار تسجيل الدخول

**معلومات الدخول الافتراضية:**

| اسم المستخدم | كلمة المرور |
|--------------|-------------|
| admin        | admin123    |

**الخطوات:**
1. افتح: `http://localhost:5173/login`
2. ادخل: admin / admin123
3. اضغط تسجيل الدخول

⚠️ **إذا لم ينجح الدخول:**

```bash
# شغّل هذا السكريبت لإنشاء مستخدم admin
cd backend
node scripts/quick-create-admin.js admin admin123 "المدير العام"
```

### 2. اختبار Backend APIs (تلقائي)

```bash
# من مجلد backend (وتأكد أن server.js يعمل في terminal آخر)
node test-apis.js
```

**النتيجة المتوقعة:**
```
🔍 Testing Coffee System APIs...

==================================================
✅ Health Check
✅ Login
✅ Get Suppliers
✅ Get Warehouses
✅ Get Raw Materials
✅ Get Supplier Payments
✅ Get Material Batches
✅ Get Available Batches (FIFO)
✅ Get Inventory Counts
✅ Get Alerts
```

### 3. اختبار Frontend (يدوي)

اتبع ملف `TEST_PLAN.md` للاختبار الشامل.

**الاختبارات الأساسية:**
- ✅ تسجيل الدخول
- ✅ فتح صفحة Dashboard
- ✅ فتح صفحة Raw Materials
- ✅ إضافة مورد جديد
- ✅ إضافة مادة خام
- ✅ إضافة مشتريات (زر السلة 🛒 بجانب كل مادة)

---

## 🔥 حل المشاكل الشائعة

### المشكلة 1: "ECONNREFUSED" عند تشغيل Backend

**السبب:** MySQL لا يعمل أو معلومات الاتصال خاطئة

**الحل:**
```bash
# 1. تحقق من XAMPP - MySQL يجب أن يكون Running
# 2. جرّب هذا الأمر في terminal:
mysql -u root -p

# 3. إذا طلب كلمة مرور وأنت لا تعرفها:
# - افتح XAMPP Control Panel
# - اضغط Shell
# - شغّل: mysql -u root
# - ثم: ALTER USER 'root'@'localhost' IDENTIFIED BY 'kareem123';
```

### المشكلة 2: "Cannot find module"

**السبب:** الحزم غير مثبتة بشكل صحيح

**الحل:**
```bash
# احذف node_modules وأعد التثبيت
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

### المشكلة 3: "Port 5000 already in use"

**السبب:** برنامج آخر يستخدم المنفذ 5000

**الحل:**
```bash
# على Windows:
netstat -ano | findstr :5000
taskkill /PID <رقم_العملية> /F

# على Mac/Linux:
lsof -i :5000
kill -9 <PID>

# أو غيّر المنفذ في .env:
PORT=5001
```

### المشكلة 4: "Invalid credentials" عند تسجيل الدخول

**السبب:** لا يوجد مستخدم admin في قاعدة البيانات

**الحل:**
```bash
# أنشئ مستخدم admin
cd backend
node scripts/quick-create-admin.js admin admin123 "المدير العام"
```

### المشكلة 5: واجهة Frontend لا تعرض البيانات

**السبب:** Backend لا يعمل أو مشكلة في CORS

**الحل:**
```bash
# 1. تحقق من أن Backend يعمل:
# افتح: http://localhost:5000/api/health

# 2. يجب أن ترى:
# {"status":"success","message":"Server is running"}

# 3. إذا لم يظهر شيء:
# - تحقق من أن Backend يعمل (node server.js)
# - تحقق من إعدادات CORS في server.js
```

### المشكلة 6: جداول Phase 1 أو Phase 2 غير موجودة

**السبب:** Migration لم يعمل بشكل صحيح

**الحل:**
```bash
# أعد تشغيل Backend مرة أخرى
# سيتحقق من الجداول ويعيد إنشاءها

cd backend
node server.js
```

---

## 📊 التحقق النهائي - Checklist

قبل البدء في الاختبار، تأكد من:

- [ ] XAMPP يعمل (Apache ✅ + MySQL ✅)
- [ ] قاعدة البيانات `cafe_management` موجودة
- [ ] Backend يعمل على `http://localhost:5000`
- [ ] Frontend يعمل على `http://localhost:5173`
- [ ] يمكنك تسجيل الدخول بـ admin/admin123
- [ ] Dashboard يظهر بدون أخطاء
- [ ] test-apis.js يعطي ✅ على معظم الاختبارات

---

## 🎯 الخطوات الكاملة من الصفر (ملخص سريع)

```bash
# 1. تشغيل XAMPP
# افتح XAMPP Control Panel → Start Apache & MySQL

# 2. إنشاء قاعدة البيانات
# افتح http://localhost/phpmyadmin
# أنشئ قاعدة بيانات: cafe_management

# 3. Backend
cd backend
npm install
node server.js

# 4. Frontend (terminal جديد)
cd frontend
npm install
npm run dev

# 5. إنشاء مستخدم admin (terminal جديد)
cd backend
node scripts/quick-create-admin.js admin admin123 "المدير العام"

# 6. فتح التطبيق
# افتح: http://localhost:5173
# سجل دخول: admin / admin123

# 7. اختبار APIs
cd backend
node test-apis.js
```

---

## 📞 الدعم والمساعدة

إذا واجهت أي مشكلة:

1. **تحقق من الـ Console** - اضغط F12 في المتصفح وانظر الأخطاء
2. **تحقق من Backend Logs** - انظر terminal حيث يعمل `node server.js`
3. **راجع هذا الدليل** - معظم المشاكل مذكورة في قسم "حل المشاكل"
4. **شغّل test-apis.js** - سيخبرك أي API لا يعمل

---

## 🚀 بعد النشر الناجح

الآن يمكنك:

1. ✅ إضافة الموردين (Suppliers)
2. ✅ إضافة المستودعات (Warehouses)
3. ✅ إضافة المواد الخام (Raw Materials)
4. ✅ إضافة المشتريات (زر 🛒 بجانب كل مادة)
5. ✅ تتبع الدفعات (Material Batches)
6. ✅ نقل المخزون (Stock Transfers)
7. ✅ استهلاك FIFO (FIFO Management)
8. ✅ الجرد الفعلي (Inventory Counts)
9. ✅ التنبيهات التلقائية (Alerts Dashboard)

اتبع ملف `TEST_PLAN.md` لاختبار كل ميزة بالتفصيل!

---

تم إنشاؤه بواسطة Claude Code ❤️

آخر تحديث: 2026-01-14

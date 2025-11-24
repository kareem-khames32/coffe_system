# 🚀 دليل النشر السريع - نظام إدارة المقهى

## نظرة عامة

هذا الدليل يوضح كيفية نشر نظام إدارة المقهى على سيرفر محلي بخطوات بسيطة.

---

## 📋 المتطلبات الأساسية

- **سيرفر** يعمل بنظام Ubuntu/Debian أو Windows Server
- **اتصال بالإنترنت** لتحميل المتطلبات
- **صلاحيات المدير** (sudo/Administrator)

---

## 🎯 خطوات النشر (Linux/Ubuntu)

### الطريقة السريعة - 4 أوامر فقط! ⚡

```bash
# 1️⃣ منح صلاحيات التنفيذ
chmod +x install.sh setup-database.sh setup-system.sh start.sh

# 2️⃣ تثبيت المتطلبات (Node.js, MySQL, PM2)
sudo ./install.sh

# 3️⃣ إعداد قاعدة البيانات
sudo ./setup-database.sh

# 4️⃣ إعداد وتشغيل النظام
./setup-system.sh && ./start.sh
```

### شرح مفصل للخطوات

#### 1️⃣ نقل المشروع للسيرفر

**باستخدام USB:**
```bash
cp -r /path/to/coffe_system /home/user/
cd /home/user/coffe_system
```

**باستخدام Git:**
```bash
cd /home/user
git clone <repository-url> coffe_system
cd coffe_system
```

#### 2️⃣ تثبيت المتطلبات الأساسية

```bash
sudo ./install.sh
```

**سيتم تثبيت:**
- ✅ Node.js 18
- ✅ MySQL Server
- ✅ PM2 (لإدارة العمليات)

⏱️ **الوقت المتوقع:** 5-10 دقائق

#### 3️⃣ إعداد قاعدة البيانات

```bash
sudo ./setup-database.sh
```

**سيتم:**
- ✅ إنشاء قاعدة بيانات `cafe_db`
- ✅ إنشاء مستخدم `cafe_user`
- ✅ إنشاء جميع الجداول
- ✅ إضافة بيانات المدير الأساسية

⏱️ **الوقت المتوقع:** 1-2 دقيقة

**معلومات الاتصال بقاعدة البيانات:**
```
Database: cafe_db
User: cafe_user
Password: cafe_password_2024
```

#### 4️⃣ إعداد وتشغيل النظام

```bash
./setup-system.sh
./start.sh
```

**سيتم:**
- ✅ إنشاء ملفات الإعدادات (.env)
- ✅ تثبيت مكتبات Backend و Frontend
- ✅ بناء Frontend للإنتاج
- ✅ تشغيل Backend باستخدام PM2

⏱️ **الوقت المتوقع:** 5-10 دقائق

---

## 🎉 النظام جاهز للاستخدام!

### 🌐 الوصول للنظام

**من نفس السيرفر:**
```
http://localhost:5000
```

**من أي جهاز على نفس الشبكة:**
```
http://[IP-السيرفر]:5000
```

**لمعرفة IP السيرفر:**
```bash
hostname -I
```

### 🔐 بيانات الدخول الافتراضية

بعد النشر، استخدم أحد الحسابات التالية:

| اسم المستخدم | كلمة المرور | الصلاحيات |
|--------------|-------------|-----------|
| `admin` | `admin123` | مدير كامل |
| `kareem` | `123456` | مدير كامل |
| `manager` | `123456` | مدير |

---

## 🔧 إدارة النظام

### عرض حالة النظام
```bash
pm2 status
```

### عرض السجلات (Logs)
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

### تشغيل النظام بعد الإيقاف
```bash
pm2 start cafe-backend
```

### حذف النظام من PM2
```bash
pm2 delete cafe-backend
```

---

## 🗑️ تنظيف قاعدة البيانات

إذا أردت حذف جميع البيانات (المنتجات، الطلبات، المصروفات) مع الاحتفاظ بحسابات المستخدمين:

### الطريقة الأولى: باستخدام Node.js
```bash
cd backend
node scripts/clean-system.js
```

### الطريقة الثانية: باستخدام MySQL
```bash
mysql -u cafe_user -p cafe_db < backend/database/clean_system.sql
```

**تحذير:** هذا الأمر سيحذف:
- ❌ جميع المنتجات
- ❌ جميع الطلبات
- ❌ جميع المصروفات والمشتريات
- ❌ جميع العروض والخصومات

**سيتم الاحتفاظ بـ:**
- ✅ حسابات المستخدمين
- ✅ إعدادات النظام
- ✅ الفئات (Categories)

---

## 🛡️ النسخ الاحتياطي

### نسخ احتياطي لقاعدة البيانات

**إنشاء نسخة احتياطية:**
```bash
mysqldump -u cafe_user -pcafe_password_2024 cafe_db > backup_$(date +%Y%m%d).sql
```

**استعادة نسخة احتياطية:**
```bash
mysql -u cafe_user -pcafe_password_2024 cafe_db < backup_20251124.sql
```

### نسخ احتياطي للصور والملفات

```bash
cd /home/user/coffe_system
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz backend/uploads
```

**استعادة الصور:**
```bash
tar -xzf uploads_backup_20251124.tar.gz -C backend/
```

---

## 🔄 تحديث النظام

عند وجود نسخة جديدة من النظام:

```bash
cd /home/user/coffe_system

# جلب آخر التحديثات
git pull

# إعادة بناء وتشغيل النظام
./setup-system.sh
pm2 restart cafe-backend
```

---

## 🌐 الوصول من خارج الشبكة المحلية

### الخطوة 1: فتح المنفذ في جدار الحماية

```bash
sudo ufw allow 5000
```

### الخطوة 2: إعداد Port Forwarding في الراوتر

1. افتح إعدادات الراوتر (عادة: 192.168.1.1)
2. ابحث عن Port Forwarding
3. أضف قاعدة جديدة:
   - **External Port:** 5000
   - **Internal IP:** [IP السيرفر المحلي]
   - **Internal Port:** 5000
   - **Protocol:** TCP

**⚠️ تحذير أمني:**
- لا تستخدم هذا الخيار إلا للضرورة
- غيّر كلمات المرور الافتراضية
- استخدم HTTPS في بيئة الإنتاج

---

## ❓ حل المشاكل الشائعة

### المشكلة: المنفذ 5000 مستخدم بالفعل

**الحل:**
```bash
# تغيير المنفذ في ملف الإعدادات
nano backend/.env
# غيّر PORT=5000 إلى رقم آخر (مثل 3000)

# أعد تشغيل النظام
pm2 restart cafe-backend
```

### المشكلة: MySQL لا يعمل

**الحل:**
```bash
# التحقق من حالة MySQL
sudo systemctl status mysql

# تشغيل MySQL
sudo systemctl start mysql

# تفعيل التشغيل التلقائي
sudo systemctl enable mysql
```

### المشكلة: لا يمكن الوصول للنظام من أجهزة أخرى

**الحل:**
```bash
# 1. التأكد من أن Backend يعمل
pm2 status

# 2. فتح المنفذ في جدار الحماية
sudo ufw allow 5000

# 3. التأكد من IP السيرفر
hostname -I

# 4. التأكد من أن الأجهزة على نفس الشبكة
ping [IP-السيرفر]
```

### المشكلة: Backend يعمل لكن لا يظهر شيء

**الحل:**
```bash
# عرض السجلات للبحث عن الأخطاء
pm2 logs cafe-backend

# التأكد من اتصال قاعدة البيانات
mysql -u cafe_user -pcafe_password_2024 cafe_db -e "SELECT 1;"

# إعادة بناء Frontend
cd frontend
npm run build
cd ..

# إعادة تشغيل Backend
pm2 restart cafe-backend
```

### المشكلة: "Cannot connect to database"

**الحل:**
```bash
# 1. التحقق من أن MySQL يعمل
sudo systemctl status mysql

# 2. التحقق من بيانات الاتصال في backend/.env
cat backend/.env | grep DB_

# 3. اختبار الاتصال يدوياً
mysql -u cafe_user -pcafe_password_2024 cafe_db

# 4. إذا فشل الاتصال، أعد إنشاء المستخدم
sudo mysql
CREATE USER 'cafe_user'@'localhost' IDENTIFIED BY 'cafe_password_2024';
GRANT ALL PRIVILEGES ON cafe_db.* TO 'cafe_user'@'localhost';
FLUSH PRIVILEGES;
exit;
```

---

## 📱 الوصول عبر الهاتف المحمول

بعد النشر، يمكن للمستخدمين الوصول للنظام من هواتفهم:

1. تأكد من أن الهاتف متصل بنفس شبكة الواي فاي
2. افتح المتصفح في الهاتف
3. اكتب عنوان السيرفر: `http://[IP-السيرفر]:5000`

**مثال:**
```
http://192.168.1.100:5000
```

---

## 🔒 نصائح الأمان

### 1. تغيير كلمات المرور الافتراضية

بعد النشر مباشرة، قم بتغيير كلمات المرور:

1. سجل دخول بحساب admin
2. اذهب إلى "المستخدمون"
3. غيّر كلمات مرور جميع الحسابات

### 2. تغيير كلمة مرور قاعدة البيانات

```bash
sudo mysql
ALTER USER 'cafe_user'@'localhost' IDENTIFIED BY 'كلمة-مرور-قوية-جديدة';
FLUSH PRIVILEGES;
exit;

# عدل ملف .env
nano backend/.env
# غيّر DB_PASSWORD

# أعد تشغيل Backend
pm2 restart cafe-backend
```

### 3. تفعيل جدار الحماية

```bash
sudo ufw enable
sudo ufw allow 22    # SSH
sudo ufw allow 5000  # النظام
```

### 4. إنشاء نسخ احتياطية دورية

أنشئ cron job للنسخ الاحتياطي التلقائي:

```bash
crontab -e
```

أضف السطر التالي للنسخ الاحتياطي كل يوم الساعة 2 صباحاً:
```
0 2 * * * mysqldump -u cafe_user -pcafe_password_2024 cafe_db > /home/user/backups/cafe_$(date +\%Y\%m\%d).sql
```

---

## 📞 الدعم والمساعدة

### التحقق من السجلات

**سجلات Backend:**
```bash
pm2 logs cafe-backend --lines 100
```

**سجلات MySQL:**
```bash
sudo tail -f /var/log/mysql/error.log
```

**حالة جميع الخدمات:**
```bash
pm2 status
sudo systemctl status mysql
```

### معلومات مفيدة للدعم

عند طلب المساعدة، قدم هذه المعلومات:

```bash
# نسخة Node.js
node -v

# نسخة MySQL
mysql --version

# حالة PM2
pm2 status

# آخر 50 سطر من السجلات
pm2 logs cafe-backend --lines 50 --nostream
```

---

## 🎓 الخطوات التالية

بعد نشر النظام بنجاح:

1. ✅ **غيّر كلمات المرور الافتراضية**
2. ✅ **أضف الفئات والمنتجات**
3. ✅ **أنشئ حسابات المستخدمين** (كاشير، مدير، إلخ)
4. ✅ **اضبط إعدادات المقهى** (الاسم، الشعار، إلخ)
5. ✅ **جرّب البيع من نقطة البيع (POS)**
6. ✅ **أنشئ نسخة احتياطية أولية**

---

## 📝 ملاحظات مهمة

- 🔴 **النظام يعمل على المنفذ 5000** (يمكن تغييره من .env)
- 🔴 **Backend و Frontend معاً** (Frontend مدمج في Backend)
- 🔴 **PM2 يدير Backend فقط** (Frontend ثابت)
- 🔴 **الصور تُحفظ في** `backend/uploads`
- 🔴 **قاعدة البيانات** `cafe_db` على MySQL

---

## 🎯 خلاصة سريعة

| الخطوة | الأمر | الوقت |
|--------|-------|-------|
| 1. التثبيت | `sudo ./install.sh` | 5-10 دقائق |
| 2. قاعدة البيانات | `sudo ./setup-database.sh` | 1-2 دقيقة |
| 3. الإعداد | `./setup-system.sh` | 5-10 دقائق |
| 4. التشغيل | `./start.sh` | < دقيقة |
| **المجموع** | | **10-25 دقيقة** |

---

✅ **مبروك! نظامك جاهز للعمل** 🎉

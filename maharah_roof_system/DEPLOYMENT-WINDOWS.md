# دليل نشر نظام إدارة المقهى على سيرفر ويندوز

## المتطلبات

- جهاز سيرفر يعمل بنظام Windows 10/11 أو Windows Server 2016+
- اتصال بالإنترنت لتحميل المتطلبات
- صلاحيات Administrator

---

## خطوات النشر السريع ⚡

### 1️⃣ نقل المشروع للسيرفر

انقل مجلد المشروع كاملاً للسيرفر باستخدام أحد الطرق:
- USB/External Drive
- شبكة محلية (Network Share)
- Git Clone

**مثال:**
```
C:\Users\YourName\coffe_system
```

---

### 2️⃣ فتح PowerShell كمسؤول (Administrator)

1. اضغط `Windows + X`
2. اختر **"Windows PowerShell (Admin)"** أو **"Terminal (Admin)"**
3. وافق على رسالة UAC

---

### 3️⃣ الانتقال لمجلد المشروع

```powershell
cd C:\Users\YourName\coffe_system
```

---

### 4️⃣ السماح بتشغيل السكريبتات

لمرة واحدة فقط، قم بتشغيل:

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

اضغط `Y` ثم `Enter`

---

### 5️⃣ تثبيت المتطلبات الأساسية

```powershell
.\install.ps1
```

هذا السكريبت سيقوم بـ:
- ✅ تثبيت Chocolatey (مدير الحزم)
- ✅ تثبيت Node.js LTS
- ✅ تثبيت MySQL Server
- ✅ تثبيت PM2
- ✅ إعداد PM2 للبدء التلقائي

⏱️ **الوقت المتوقع:** 10-15 دقيقة

**ملاحظة:** قد تحتاج لإغلاق وإعادة فتح PowerShell بعد التثبيت

---

### 6️⃣ إعداد قاعدة البيانات

```powershell
.\setup-database.ps1
```

هذا السكريبت سيقوم بـ:
- ✅ إنشاء قاعدة بيانات `cafe_db`
- ✅ إنشاء مستخدم `cafe_user`
- ✅ استيراد جميع الجداول
- ✅ إدراج البيانات الأساسية

⏱️ **الوقت المتوقع:** 1-2 دقيقة

**بيانات قاعدة البيانات:**
- Database: `cafe_db`
- User: `cafe_user`
- Password: `cafe_password_2024`

---

### 7️⃣ إعداد النظام

```powershell
.\setup-system.ps1
```

هذا السكريبت سيقوم بـ:
- ✅ إنشاء ملفات `.env` تلقائياً
- ✅ تثبيت مكتبات Backend
- ✅ تثبيت مكتبات Frontend
- ✅ بناء Frontend للإنتاج

⏱️ **الوقت المتوقع:** 5-10 دقائق

---

### 8️⃣ تشغيل النظام

```powershell
.\start.ps1
```

هذا السكريبت سيقوم بـ:
- ✅ تشغيل Backend مع PM2
- ✅ حفظ التكوين للبدء التلقائي
- ✅ عرض رابط الدخول للنظام

⏱️ **الوقت المتوقع:** أقل من دقيقة

---

## 🎉 النظام جاهز!

### 🌐 الوصول للنظام

من أي جهاز على نفس الشبكة المحلية، افتح المتصفح:

```
http://[عنوان-IP]:5000
```

**لمعرفة عنوان IP:**
```powershell
ipconfig
```
ابحث عن **"IPv4 Address"**

### 🔐 بيانات الدخول التجريبية

- **اسم المستخدم:** `admin`
- **كلمة المرور:** `admin123`

---

## 📊 إدارة النظام

### عرض حالة Backend
```powershell
pm2 status
```

### عرض السجلات (Logs)
```powershell
pm2 logs cafe-backend
```

### إعادة تشغيل النظام
```powershell
pm2 restart cafe-backend
```

### إيقاف النظام
```powershell
pm2 stop cafe-backend
```

### بدء النظام بعد الإيقاف
```powershell
pm2 start cafe-backend
```

### حذف النظام من PM2
```powershell
pm2 delete cafe-backend
```

---

## 🔧 إعدادات Windows المهمة

### فتح Firewall للوصول من الشبكة المحلية

افتح PowerShell كمسؤول:

```powershell
New-NetFirewallRule -DisplayName "Cafe System" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
```

### إلغاء القاعدة:
```powershell
Remove-NetFirewallRule -DisplayName "Cafe System"
```

---

## 🔄 تحديث النظام

عند وجود تحديثات:

1. احصل على آخر نسخة من الكود
2. قم بتشغيل:
```powershell
.\setup-system.ps1
pm2 restart cafe-backend
```

---

## 🛡️ النسخ الاحتياطي

### نسخ احتياطي لقاعدة البيانات

**إنشاء نسخة احتياطية:**
```powershell
$date = Get-Date -Format "yyyyMMdd"
mysqldump -u cafe_user -p cafe_db > "backup_$date.sql"
```

**استعادة نسخة احتياطية:**
```powershell
mysql -u cafe_user -p cafe_db < backup_20251114.sql
```

### نسخ احتياطي للصور المرفوعة

```powershell
$date = Get-Date -Format "yyyyMMdd"
Compress-Archive -Path backend\uploads -DestinationPath "uploads_backup_$date.zip"
```

---

## ⚙️ إعدادات متقدمة

### تغيير منفذ (Port) النظام

1. عدل `backend\.env`:
```
PORT=8080
```

2. أعد تشغيل:
```powershell
pm2 restart cafe-backend
```

3. عدل قاعدة Firewall:
```powershell
New-NetFirewallRule -DisplayName "Cafe System" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
```

### تغيير كلمة مرور قاعدة البيانات

1. غير كلمة المرور في MySQL:
```powershell
mysql -u root -p
```
```sql
ALTER USER 'cafe_user'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
exit;
```

2. عدل `backend\.env`:
```
DB_PASSWORD=new_password
```

3. أعد التشغيل:
```powershell
pm2 restart cafe-backend
```

---

## ❓ حل المشاكل الشائعة

### المشكلة: "execution of scripts is disabled"

**الحل:**
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### المشكلة: المنفذ 5000 مستخدم

**الحل:** غير المنفذ في `backend\.env` إلى رقم آخر (مثل 8080)

### المشكلة: MySQL لا يعمل

**التحقق من الخدمة:**
```powershell
Get-Service MySQL*
```

**بدء الخدمة:**
```powershell
Start-Service MySQL*
```

**جعلها تبدأ تلقائياً:**
```powershell
Set-Service -Name MySQL* -StartupType Automatic
```

### المشكلة: PM2 لا يعمل بعد إعادة التشغيل

**الحل:**
```powershell
pm2 save
pm2-startup install
```

### المشكلة: لا يمكن الوصول من أجهزة أخرى

**تحقق من:**
1. ✅ Firewall يسمح بالمنفذ 5000
2. ✅ جميع الأجهزة على نفس الشبكة
3. ✅ استخدم عنوان IP الصحيح (وليس localhost)

**اختبر الاتصال:**
```powershell
Test-NetConnection -ComputerName localhost -Port 5000
```

---

## 🚀 نصائح الأداء

### تحسين أداء Node.js

عدل `start.ps1` وأضف:
```powershell
pm2 start src\server.js --name cafe-backend --watch --max-memory-restart 500M
```

### مراقبة الموارد

```powershell
pm2 monit
```

---

## 🔒 الأمان

### ⚠️ نصائح أمنية مهمة:

1. **غير بيانات الدخول الافتراضية** من لوحة التحكم
2. **غير كلمة مرور قاعدة البيانات** في الإنتاج
3. **لا تفتح النظام للإنترنت** بدون SSL/HTTPS
4. **قم بعمل نسخ احتياطية دورية** للبيانات
5. **حدّث Windows والبرامج** بانتظام

---

## 📱 الوصول من الموبايل

1. تأكد أن الموبايل على نفس الشبكة (WiFi)
2. افتح المتصفح واكتب:
```
http://[عنوان-IP-للسيرفر]:5000
```

---

## 💾 متطلبات النظام الموصى بها

| المكون | الحد الأدنى | الموصى به |
|--------|-------------|-----------|
| المعالج | Dual Core 2GHz | Quad Core 2.5GHz+ |
| الذاكرة | 4 GB RAM | 8 GB+ RAM |
| التخزين | 10 GB | 20 GB+ SSD |
| الشبكة | 100 Mbps | 1 Gbps |
| النظام | Windows 10 | Windows 11 / Server 2019+ |

---

## 📞 الدعم

إذا واجهت أي مشاكل:

1. **تحقق من السجلات:**
   ```powershell
   pm2 logs cafe-backend --lines 100
   ```

2. **تحقق من حالة الخدمات:**
   ```powershell
   pm2 status
   Get-Service MySQL*
   ```

3. **أعد تشغيل الخدمات:**
   ```powershell
   pm2 restart cafe-backend
   Restart-Service MySQL*
   ```

---

## 🌟 ملاحظات إضافية

### التثبيت اليدوي (إذا فشل Chocolatey)

**Node.js:**
- حمل من: https://nodejs.org
- اختر LTS version

**MySQL:**
- حمل من: https://dev.mysql.com/downloads/installer/
- اختر MySQL Community Server

**PM2:**
```powershell
npm install -g pm2
npm install -g pm2-windows-startup
```

### استخدام MySQL Workbench

لإدارة قاعدة البيانات بشكل مرئي:
- حمل من: https://dev.mysql.com/downloads/workbench/
- اتصل باستخدام بيانات `cafe_user`

---

## ✅ Checklist للنشر

- [ ] تثبيت المتطلبات (`install.ps1`)
- [ ] إعداد قاعدة البيانات (`setup-database.ps1`)
- [ ] إعداد النظام (`setup-system.ps1`)
- [ ] تشغيل النظام (`start.ps1`)
- [ ] فتح Firewall للمنفذ 5000
- [ ] تجربة الدخول من جهاز آخر
- [ ] تغيير بيانات الدخول الافتراضية
- [ ] إعداد النسخ الاحتياطي التلقائي

---

## 🎯 الخلاصة

بعد اتباع جميع الخطوات:
- ✅ النظام يعمل 24/7
- ✅ يبدأ تلقائياً مع Windows
- ✅ يمكن الوصول إليه من الشبكة المحلية
- ✅ جاهز للاستخدام في المقهى

**استمتع بنظام إدارة المقهى! ☕🎉**

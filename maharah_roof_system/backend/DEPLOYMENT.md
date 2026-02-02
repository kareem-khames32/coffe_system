# 🚀 دليل نقل النظام إلى السيرفر الجديد

## المتطلبات

قبل البدء، تأكد من وجود:
- **Node.js** (v16 أو أعلى)
- **MySQL** (v5.7 أو أعلى)
- **npm** أو **yarn**

---

## خطوات النقل

### 1️⃣ نقل الملفات

انقل مجلد `backend` إلى السيرفر الجديد:

```bash
# أو استخدم FTP/SCP
scp -r ./backend user@server:/path/to/app
```

### 2️⃣ تثبيت المكتبات

```bash
cd backend
npm install
```

### 3️⃣ إعداد ملف البيئة

```bash
# انسخ ملف الإعدادات
cp .env.example .env

# عدّل الملف بإعدادات السيرفر الخاص بك
nano .env   # أو استخدم أي محرر نصوص
```

**إعدادات مهمة يجب تغييرها:**

| المتغير | الوصف | مثال |
|---------|-------|------|
| `DB_HOST` | عنوان MySQL | `localhost` |
| `DB_USER` | اسم المستخدم | `root` |
| `DB_PASSWORD` | كلمة المرور | `your_password` |
| `DB_NAME` | اسم قاعدة البيانات | `cafe_management` |
| `JWT_SECRET` | مفتاح التشفير | قيمة عشوائية طويلة |

### 4️⃣ إعداد قاعدة البيانات

شغّل سكريبت الإعداد التلقائي:

```bash
node deploy-setup.js
```

هذا السكريبت سيقوم بـ:
- إنشاء قاعدة البيانات
- إنشاء جميع الجداول
- إنشاء المستخدم admin (كلمة المرور: `123456`)

### 5️⃣ التحقق من الإعداد

```bash
# شغّل السيرفر أولاً
npm start &

# ثم شغّل سكريبت التحقق
node deploy-verify.js
```

### 6️⃣ تشغيل السيرفر

**للتطوير:**
```bash
npm run dev
```

**للإنتاج (مع PM2):**
```bash
# تثبيت PM2
npm install -g pm2

# تشغيل السيرفر
pm2 start server.js --name "cafe-api"

# التشغيل التلقائي عند إعادة التشغيل
pm2 startup
pm2 save
```

---

## 📁 هيكل الملفات المهمة

```
backend/
├── .env                    # إعدادات البيئة (لا ترفعها على Git!)
├── .env.example            # مثال للإعدادات
├── server.js               # نقطة الدخول الرئيسية
├── deploy-setup.js         # سكريبت إعداد قاعدة البيانات
├── deploy-verify.js        # سكريبت التحقق من الإعداد
├── clean-all-data.js       # مسح جميع البيانات (ماعدا المستخدمين)
├── system-test.js          # اختبار شامل للنظام
├── complete-database-setup.sql  # ملف SQL كامل للجداول
└── src/
    ├── config/
    │   └── database.js     # إعدادات الاتصال بقاعدة البيانات
    ├── controllers/        # معالجات API
    ├── routes/             # مسارات API
    └── middleware/         # وسطاء (auth, etc.)
```

---

## 🔐 بيانات الدخول الافتراضية

| الحقل | القيمة |
|-------|--------|
| اسم المستخدم | `admin` |
| كلمة المرور | `123456` |

⚠️ **مهم:** غيّر كلمة المرور فوراً بعد أول تسجيل دخول!

---

## 🧪 اختبار النظام

بعد الإعداد، يمكنك تشغيل الاختبار الشامل:

```bash
# تأكد أن السيرفر شغال أولاً
node system-test.js
```

---

## 🔧 حل المشاكل الشائعة

### مشكلة: ECONNREFUSED
```
❌ خطأ: connect ECONNREFUSED 127.0.0.1:3306
```
**الحل:** تأكد أن MySQL يعمل:
```bash
# على Windows
net start mysql

# على Linux
sudo systemctl start mysql
```

### مشكلة: Access denied
```
❌ خطأ: Access denied for user 'root'@'localhost'
```
**الحل:** تأكد من صحة كلمة المرور في `.env`

### مشكلة: Database doesn't exist
```
❌ خطأ: Unknown database 'cafe_management'
```
**الحل:** شغّل سكريبت الإعداد:
```bash
node deploy-setup.js
```

---

## 📞 الدعم

إذا واجهت أي مشكلة:
1. راجع ملف `.env` وتأكد من صحة الإعدادات
2. شغّل `node deploy-verify.js` لفحص النظام
3. راجع سجلات الأخطاء في console

---

## ✅ قائمة التحقق قبل الإطلاق

- [ ] تم تثبيت Node.js و npm
- [ ] تم تثبيت MySQL وهو يعمل
- [ ] تم إنشاء ملف `.env` بالإعدادات الصحيحة
- [ ] تم تشغيل `node deploy-setup.js` بنجاح
- [ ] تم تشغيل `node deploy-verify.js` وكل شيء أخضر
- [ ] تم تغيير كلمة مرور admin
- [ ] تم إعداد PM2 للتشغيل التلقائي (للإنتاج)

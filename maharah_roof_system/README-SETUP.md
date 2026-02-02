# نظام Maharah Roof - دليل الإعداد السريع

## معلومات النظام
- **اسم قاعدة البيانات:** maharah_roof
- **Backend Port:** 6000
- **Frontend Dev Port:** 3001
- **API URL:** http://localhost:6000/api

---

## الخطوة 1: إعداد قاعدة البيانات

### باستخدام phpMyAdmin:
1. افتح phpMyAdmin
2. اضغط على "SQL" من القائمة العلوية
3. انسخ محتوى الملف: `backend/database/maharah_roof_setup.sql`
4. اضغط "Go" أو "تنفيذ"

### باستخدام MySQL Command Line:
```bash
mysql -u root -p < backend/database/maharah_roof_setup.sql
```

---

## الخطوة 2: تثبيت الحزم

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

## الخطوة 3: تشغيل النظام

### تشغيل سريع (الطريقة السهلة):
```bash
./start-maharah.sh
```

### تشغيل يدوي:
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend (للتطوير فقط)
cd frontend
npm run dev
```

---

## الخطوة 4: الوصول للنظام

- **Development:** http://localhost:3001
- **Production:** http://localhost:6000

### بيانات تسجيل الدخول:
| المستخدم | كلمة المرور | الصلاحية |
|----------|-------------|----------|
| admin    | 123456      | مدير     |
| kareem   | 123456      | مدير     |
| manager  | 123456      | مدير     |

---

## ملاحظات مهمة

1. تأكد من أن MySQL يعمل قبل تشغيل النظام
2. إذا كنت تستخدم كلمة مرور لـ MySQL، عدّل ملف `backend/.env`
3. للـ Production، قم ببناء الـ Frontend:
   ```bash
   cd frontend
   npm run build
   ```
   ثم شغّل الـ Backend فقط على Port 6000

---

## الفرق عن النظام الأصلي

| الإعداد | النظام الأصلي | Maharah Roof |
|---------|---------------|--------------|
| Database | cafe_management | maharah_roof |
| Backend Port | 5000 | 6000 |
| Frontend Port | 3000 | 3001 |

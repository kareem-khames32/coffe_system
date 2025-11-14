# سكريبتات إنشاء المستخدمين

هذا المجلد يحتوي على سكريبتات لإنشاء وإدارة مستخدمي النظام.

## السكريبتات المتاحة

### 1. create-admin-user.js (تفاعلي - مستحسن)
سكريبت تفاعلي يطلب منك إدخال معلومات المستخدم.

**الاستخدام:**
```bash
cd backend
node scripts/create-admin-user.js
```

سيطلب منك:
- اسم المستخدم (username)
- الاسم الكامل
- كلمة المرور (أو اضغط Enter لاستخدام "Admin@123")

**مميزات:**
- ✓ آمن - لا تظهر كلمة المرور في سجل الأوامر
- ✓ سهل الاستخدام
- ✓ يتحقق من صحة المدخلات
- ✓ يمكنك اختيار أي اسم مستخدم

---

### 2. quick-create-admin.js (سريع)
سكريبت سريع لإنشاء مستخدم بدون أسئلة.

**الاستخدام:**

```bash
# استخدام القيم الافتراضية (username=manager, password=Admin@123)
node scripts/quick-create-admin.js

# تحديد اسم المستخدم فقط
node scripts/quick-create-admin.js kareem

# تحديد اسم المستخدم وكلمة المرور
node scripts/quick-create-admin.js kareem MyPass123

# تحديد كل المعلومات
node scripts/quick-create-admin.js kareem MyPass123 "كريم خميس"
```

**عرض المساعدة:**
```bash
node scripts/quick-create-admin.js --help
```

---

### 3. create-admin.js (قديم - للمستخدم admin فقط)
سكريبت قديم ينشئ مستخدم اسمه "admin" فقط.

**الاستخدام:**
```bash
node scripts/create-admin.js
```

**معلومات تسجيل الدخول:**
- اسم المستخدم: admin
- كلمة المرور: Admin@123

---

## الصلاحيات الممنوحة

جميع السكريبتات تمنح المستخدم **جميع الصلاحيات**:

- ✓ إجراء المبيعات (can_make_sales)
- ✓ تعديل الطلبات (can_edit_orders)
- ✓ إلغاء الطلبات (can_cancel_orders)
- ✓ عرض تفاصيل الطلبات (can_view_order_details)
- ✓ إدارة المنتجات (can_manage_products)
- ✓ إدارة المخزون (can_manage_inventory)
- ✓ عرض التقارير (can_view_reports)
- ✓ إدارة المستخدمين (can_manage_users)
- ✓ إدارة الإعدادات (can_manage_settings)
- ✓ إضافة المصروفات والمشتريات (can_add_expenses)

---

## متطلبات التشغيل

1. **تأكد من وجود ملف .env** في مجلد backend:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=coffee_shop
```

2. **تأكد من تشغيل MySQL**

3. **تأكد من تثبيت المكتبات:**
```bash
npm install
```

---

## حل المشاكل

### خطأ: ECONNREFUSED
- تأكد من أن MySQL يعمل
- تحقق من معلومات الاتصال في ملف .env

### خطأ: bcrypt is not defined
```bash
npm install bcryptjs
```

### خطأ: Cannot find module 'mysql2'
```bash
npm install mysql2
```

---

## أمثلة الاستخدام

### مثال 1: إنشاء مستخدم مدير جديد
```bash
# الطريقة التفاعلية (مستحسن)
node scripts/create-admin-user.js
# أدخل: kareem_admin
# أدخل: كريم خميس
# أدخل: MySecurePass123

# أو الطريقة السريعة
node scripts/quick-create-admin.js kareem_admin MySecurePass123 "كريم خميس"
```

### مثال 2: إنشاء عدة مستخدمين
```bash
node scripts/quick-create-admin.js user1 Pass123 "مستخدم 1"
node scripts/quick-create-admin.js user2 Pass456 "مستخدم 2"
node scripts/quick-create-admin.js user3 Pass789 "مستخدم 3"
```

### مثال 3: تحديث كلمة مرور مستخدم موجود
```bash
# إذا كان المستخدم موجود، السكريبت سيحدث كلمة المرور
node scripts/quick-create-admin.js existing_user NewPassword123
```

---

## ملاحظات أمان

1. **لا تشارك كلمات المرور** في الأكواد أو على GitHub
2. **استخدم كلمات مرور قوية** للحسابات الإدارية
3. **غيّر كلمات المرور الافتراضية** بعد أول تسجيل دخول
4. **احذف المستخدمين غير المستخدمين** من قاعدة البيانات

---

## الدعم

إذا واجهت أي مشاكل:
1. تحقق من أن MySQL يعمل
2. تحقق من ملف .env
3. تحقق من أن الجداول موجودة في قاعدة البيانات
4. راجع رسائل الخطأ في Console

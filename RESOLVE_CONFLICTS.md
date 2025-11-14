# حل مشاكل Git Merge Conflicts

## المشكلة:
عندك git merge conflicts في الملفات المحلية على جهازك.

## الحل السريع:

### 1. في مجلد المشروع على جهازك (D:\coffe_system):

```bash
# احفظ أي تغييرات محلية
git stash

# اسحب آخر نسخة من GitHub
git pull origin claude/cafe-management-system-011CV5k5HEryzKhwFZakepVA --force

# أو لو مش شغال، اعمل reset كامل:
git fetch origin
git reset --hard origin/claude/cafe-management-system-011CV5k5HEryzKhwFZakepVA
```

### 2. بعد كده شغل الـ frontend:

```bash
cd frontend
npm install
npm run dev
```

### 3. وشغل الـ backend:

```bash
cd backend
npm install
npm run dev
```

## لو لسه فيه مشاكل:

### حل بديل - احذف المجلد وارجع clone:

```bash
# احذف المجلد القديم
cd D:\
rmdir /s /q coffe_system

# clone من جديد
git clone <your-repo-url>
cd coffe_system
git checkout claude/cafe-management-system-011CV5k5HEryzKhwFZakepVA

# نصب الـ dependencies
cd frontend
npm install

cd ..\backend
npm install
```

## ملاحظة مهمة:
لازم تشغل الـ migration للـ database:

1. افتح phpMyAdmin
2. اختر قاعدة البيانات cafe_db
3. اضغط SQL
4. انسخ محتوى الملف: `backend/migrations/fix_purchases_table.sql`
5. اضغط Execute

بعد كده شغل الـ frontend والـ backend وكل حاجة هتشتغل!

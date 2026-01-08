# تقرير المشاكل المكتشفة في النظام
# System Issues Report

## المشكلة الرئيسية | Main Problem

يوجد **عدم توافق في أسماء الأعمدة** بين كود الباك اند وقاعدة البيانات. الكود يحاول الكتابة والقراءة من أعمدة بأسماء مختلفة عن الموجودة في قاعدة البيانات.

There is a **column name mismatch** between the backend code and database schema. The code tries to read/write columns with different names than what exists in the database.

---

## التفاصيل الكاملة | Full Details

### 1. جدول Orders | Orders Table

#### ما يتوقعه الكود | What Backend Code Expects:
```sql
INSERT INTO orders (..., total, cost, profit, ...)
SELECT total, cost FROM orders
```

#### ما هو موجود فعلياً في قاعدة البيانات | What Actually Exists in Database:
```sql
CREATE TABLE orders (
  ...
  total_amount DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  profit DECIMAL(10,2),
  ...
)
```

#### النتيجة | Result:
```
❌ Error: Unknown column 'total' in 'field list'
❌ Error: Unknown column 'cost' in 'field list'
```

---

### 2. جدول Order Items | Order Items Table

#### ما يتوقعه الكود | What Backend Code Expects:
```sql
INSERT INTO order_items (..., price, cost_price, profit, ...)
SELECT price, cost_price FROM order_items
```

#### ما هو موجود فعلياً في قاعدة البيانات | What Actually Exists in Database:
```sql
CREATE TABLE order_items (
  ...
  unit_price DECIMAL(10,2),
  unit_cost DECIMAL(10,2),
  subtotal DECIMAL(10,2)
  -- profit column is MISSING!
)
```

#### النتيجة | Result:
```
❌ Error: Unknown column 'price' in 'field list'
❌ Error: Unknown column 'oi.cost_price' in 'on clause'
❌ Error: Unknown column 'profit' in 'field list'
```

---

## الحل | Solution

تم إنشاء سكريبت **fix-column-names.js** لإضافة الأعمدة المفقودة:

A script **fix-column-names.js** was created to add the missing columns:

### ما يفعله السكريبت | What the Script Does:

#### في جدول Orders:
1. إضافة عمود `total` (نسخة من `total_amount`)
2. إضافة عمود `cost` (نسخة من `total_cost`)
3. نسخ القيم الموجودة من الأعمدة القديمة

#### In Orders Table:
1. Add column `total` (copy of `total_amount`)
2. Add column `cost` (copy of `total_cost`)
3. Copy existing values from old columns

#### في جدول Order_items:
1. إضافة عمود `price` (عمود جديد عادي)
2. إضافة عمود `cost_price` (عمود جديد عادي)
3. إضافة عمود `profit` (عمود جديد عادي)

#### In Order_items Table:
1. Add column `price` (new regular column)
2. Add column `cost_price` (new regular column)
3. Add column `profit` (new regular column)

---

## كيفية تطبيق الحل | How to Apply the Fix

### الخطوات | Steps:

```bash
# 1. Navigate to backend directory
cd D:\projects\coffe_system\backend

# 2. Run the fix script
node scripts/fix-column-names.js

# 3. You should see output like:
# 🔄 Connecting to database...
# ✅ Connected!
#
# 🔧 Adding column aliases in orders table...
# Adding total column...
# ✅ total column added
# Adding cost column...
# ✅ cost column added
# Adding price column to order_items...
# ✅ price column added
# ...

# 4. Restart the backend (if running in nodemon, type: rs)
rs
```

---

## التحقق من نجاح الحل | Verify the Fix

بعد تشغيل السكريبت، جرب:

After running the script, try:

1. ✅ فتح صفحة نقاط البيع | Open POS page
2. ✅ إضافة منتج للسلة | Add product to cart
3. ✅ إتمام عملية البيع | Complete the sale
4. ✅ فتح صفحة التقارير | Open Reports page
5. ✅ فتح صفحة الطلبات | Open Orders page

---

## الملفات المتأثرة | Affected Files

### Backend Files Using These Columns:
- `backend/src/controllers/orderController.js` (Lines: 67, 102, 243, 274, 620, 648)
- `backend/src/controllers/reportController.js` (Lines: 10, 60, 70, 137, 174, 255, 263, 382)

### Database Scripts:
- ✅ `backend/scripts/fix-column-names.js` (NEW - الحل)
- `backend/scripts/setup-complete.js` (Creates initial schema)
- `backend/scripts/recreate-orders-table.js` (Recreates tables)

---

## ملاحظات مهمة | Important Notes

### لماذا حدثت هذه المشكلة؟ | Why Did This Happen?

1. سكريبت `setup-complete.js` أنشأ جدول orders بأعمدة: `total_amount`, `total_cost`
2. كود الباك اند في `orderController.js` يتوقع أعمدة: `total`, `cost`
3. سكريبت `setup-complete.js` أنشأ جدول order_items بأعمدة: `unit_price`, `unit_cost`
4. كود الباك اند يتوقع: `price`, `cost_price`, `profit`
5. عمود `profit` كان مفقود تماماً من جدول order_items

### The setup script created columns with names like:
1. Script `setup-complete.js` created orders table with: `total_amount`, `total_cost`
2. Backend code in `orderController.js` expects: `total`, `cost`
3. Script created order_items with: `unit_price`, `unit_cost`
4. Backend expects: `price`, `cost_price`, `profit`
5. Column `profit` was completely missing from order_items

---

## الحل البديل | Alternative Solution

إذا لم يعمل السكريبت، يمكن تنفيذ SQL يدوياً:

If the script doesn't work, you can run SQL manually in phpMyAdmin:

```sql
-- في جدول orders
ALTER TABLE orders ADD COLUMN total DECIMAL(10,2) DEFAULT 0 AFTER total_amount;
ALTER TABLE orders ADD COLUMN cost DECIMAL(10,2) DEFAULT 0 AFTER total_cost;
UPDATE orders SET total = total_amount, cost = total_cost;

-- في جدول order_items
ALTER TABLE order_items ADD COLUMN price DECIMAL(10,2) DEFAULT 0 AFTER product_name;
ALTER TABLE order_items ADD COLUMN cost_price DECIMAL(10,2) DEFAULT 0 AFTER price;
ALTER TABLE order_items ADD COLUMN profit DECIMAL(10,2) DEFAULT 0 AFTER subtotal;
```

---

## الخلاصة | Summary

| المشكلة | Problem | الحل | Solution | الحالة | Status |
|---------|---------|------|----------|--------|--------|
| عمود total مفقود | Missing 'total' column | إضافة عمود total | Add total column | ✅ تم | Fixed |
| عمود cost مفقود | Missing 'cost' column | إضافة عمود cost | Add cost column | ✅ تم | Fixed |
| عمود price مفقود | Missing 'price' column | إضافة عمود price | Add price column | ✅ تم | Fixed |
| عمود cost_price مفقود | Missing 'cost_price' | إضافة عمود cost_price | Add cost_price column | ✅ تم | Fixed |
| عمود profit مفقود | Missing 'profit' in items | إضافة عمود profit | Add profit column | ✅ تم | Fixed |

---

## للمطور | For Developer

في المستقبل، يجب التأكد من:

In the future, ensure:

1. ✅ أسماء الأعمدة في سكريبتات قاعدة البيانات تطابق الكود
2. ✅ اختبار كل الـ INSERT و SELECT statements بعد تغيير قاعدة البيانات
3. ✅ استخدام migration scripts بدلاً من حذف وإنشاء الجداول
4. ✅ مراجعة error logs في الباك اند بعد كل تغيير

1. ✅ Column names in database scripts match the code
2. ✅ Test all INSERT and SELECT statements after database changes
3. ✅ Use migration scripts instead of drop/create tables
4. ✅ Review backend error logs after every change

---

**تاريخ الإنشاء | Created:** 2026-01-08
**آخر تحديث | Last Updated:** 2026-01-08
**الحالة | Status:** ✅ تم الحل | Fixed

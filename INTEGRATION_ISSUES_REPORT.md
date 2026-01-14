# تقرير مشاكل التكامل - Coffee System

**تاريخ:** 2026-01-14
**الحالة:** تم إصلاح المشكلة #1 - المشكلة #2 تحتاج إعداد بيانات

---

## ❌ المشكلة 1: الدفعات الآجلة لا تظهر في تقرير الموردين

### الوصف التفصيلي:

**السيناريو:**
1. المستخدم يشتري مادة خام (مثلاً: 5 كيلو لحمة)
2. يختار "دفع آجل 30 يوم" في modal المشتريات
3. يحفظ المشتريات بنجاح
4. يذهب إلى صفحة "Supplier Payments" (دفعات الموردين)
5. **❌ لا يجد الدفعة المستحقة!**

### السبب الجذري:

الكود في `backend/src/controllers/inventoryPurchaseController.js` كان:
1. ✅ يستقبل المشتريات ويحفظها في `inventory_purchases`
2. ✅ يحدّث المخزون في `raw_materials`
3. ❌ **لا يستقبل** `payment_terms` من الـ request
4. ❌ **لا يحفظ** `payment_terms` في جدول المشتريات
5. ❌ **لا ينشئ** سجل دفعة في جدول `supplier_payments`

### الإصلاح المُطبق:

**الملف:** `backend/src/controllers/inventoryPurchaseController.js`
**الوظيفة:** `createPurchase()`

**التعديل 1 - استقبال وحفظ payment_terms (السطر 66):**
```javascript
// قبل:
const { supplier_id, purchase_date, invoice_number, items, notes } = req.body;

// بعد:
const { supplier_id, warehouse_id, purchase_date, invoice_number, items, notes, payment_terms } = req.body;
```

**التعديل 2 - حفظ payment_terms في قاعدة البيانات (السطر 76-79):**
```javascript
// قبل:
INSERT INTO inventory_purchases (supplier_id, purchase_date, invoice_number, total_amount, notes, created_by)
VALUES (?, ?, ?, ?, ?, ?)

// بعد:
INSERT INTO inventory_purchases (supplier_id, warehouse_id, purchase_date, invoice_number, total_amount, payment_terms, notes, created_by)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
```

**التعديل 3 - إنشاء دفعة تلقائياً للمشتريات الآجلة (بعد السطر 110):**
```javascript
// 💰 Auto-create supplier payment record for credit purchases
if (payment_terms && payment_terms !== 'cash' && supplier_id) {
  // حساب تاريخ الاستحقاق حسب شروط الدفع
  let daysToAdd = 0;
  if (payment_terms === 'credit_7') daysToAdd = 7;
  else if (payment_terms === 'credit_15') daysToAdd = 15;
  else if (payment_terms === 'credit_30') daysToAdd = 30;
  else if (payment_terms === 'credit_60') daysToAdd = 60;

  const dueDate = new Date(purchase_date);
  dueDate.setDate(dueDate.getDate() + daysToAdd);

  // إنشاء سجل دفعة بحالة "غير مدفوع"
  await connection.query(
    `INSERT INTO supplier_payments (purchase_id, supplier_id, amount_due, amount_paid, payment_status, due_date, created_by)
     VALUES (?, ?, ?, 0, 'unpaid', ?, ?)`,
    [purchaseId, supplier_id, total_amount, dueDate.toISOString().split('T')[0], req.user?.id || null]
  );
}
```

### النتيجة المتوقعة بعد الإصلاح:

✅ **السيناريو الجديد:**
1. مستخدم يشتري 5 كيلو لحمة بـ 200 جنيه/كيلو = 1000 جنيه
2. يختار "دفع آجل 30 يوم"
3. النظام **تلقائياً**:
   - يحفظ المشتريات مع `payment_terms = 'credit_30'`
   - ينشئ سجل في `supplier_payments`:
     - `amount_due = 1000`
     - `amount_paid = 0`
     - `payment_status = 'unpaid'`
     - `due_date = تاريخ الشراء + 30 يوم`
4. الدفعة تظهر في:
   - ✅ تقرير "فواتير غير مدفوعة"
   - ✅ تقرير "الدفعات المستحقة قريباً" (7 أيام قبل الموعد)
   - ✅ تقرير "الدفعات المتأخرة" (بعد تجاوز الموعد)

### الاختبار المطلوب:

```bash
# 1. أعد تشغيل Backend
cd backend
npm start

# 2. افتح Frontend
# اذهب إلى: http://localhost:5173/raw-materials

# 3. اختبر إضافة مشتريات:
# - اضغط زر 🛒 بجانب أي مادة خام
# - املأ البيانات:
#   - المورد: أي مورد
#   - الكمية: 5
#   - سعر الوحدة: 200
#   - رقم الفاتورة: F-TEST-001
#   - شروط الدفع: آجل 30 يوم ✅
# - اضغط "إضافة المشتريات"

# 4. اذهب إلى: http://localhost:5173/supplier-payments
# - افتح تاب "فواتير غير مدفوعة"
# - ✅ يجب أن تجد الدفعة هناك!
```

---

## ⚠️ المشكلة 2: البيع لا ينقص من المواد الخام

### الوصف التفصيلي:

**السيناريو:**
1. المستخدم لديه منتج "برجر لحم" (يحتاج لحمة، خبز، جبنة)
2. لديه مخزون من اللحمة = 10 كيلو
3. يبيع 3 قطع برجر لحم
4. **❌ مخزون اللحمة لا ينقص!**

### السبب الجذري:

**الكود سليم 100%!** المشكلة ليست في البرمجة.

**التحليل:**
1. ✅ في `orderController.js` (السطر 106-111)، يوجد استدعاء لـ `deductStockForOrder()`
2. ✅ في `productRecipeController.js` (السطر 115-159)، الدالة مبرمجة صحيح
3. ✅ تقرأ من جدول `product_recipes` للحصول على الوصفة
4. ❌ **لكن جدول `product_recipes` فارغ!**

**الكود:**
```javascript
// orderController.js - line 106
// Deduct raw materials from inventory based on product recipes
try {
    await deductStockForOrder(orderId, items);
} catch (error) {
    console.error('Error deducting raw material stock:', error);
    // Continue even if recipe deduction fails (product might not have recipe)
}

// productRecipeController.js - line 125
const [recipe] = await connection.query(
  'SELECT * FROM product_recipes WHERE product_id = ?',
  [product_id]
);

// إذا كان recipe فارغ، لن يتم خصم أي شيء!
for (const recipeItem of recipe) { // ← recipe.length = 0!
  // هذا الكود لن يُنفذ أبداً
}
```

### الحل:

**المطلوب:** ربط كل منتج بالمواد الخام المستخدمة فيه

#### الطريقة 1: من Frontend (مستحسن)

**الصفحة:** `Products` → تعديل منتج → "الوصفة (Recipe)"

1. اذهب إلى صفحة المنتجات
2. اضغط "تعديل" على أي منتج
3. ابحث عن قسم "وصفة المنتج" أو "Raw Materials Used"
4. أضف المواد الخام المطلوبة:
   - المادة الخام: لحمة مفرومة
   - الكمية: 0.150 (150 جرام)
   - الوحدة: كيلو
5. اضغط "حفظ"

#### الطريقة 2: مباشرة في قاعدة البيانات

```sql
-- مثال: منتج "برجر لحم" (product_id = 1)

-- أضف اللحمة المفرومة (raw_material_id = 5)
INSERT INTO product_recipes (product_id, raw_material_id, quantity_needed, unit)
VALUES (1, 5, 0.150, 'كيلو');

-- أضف الخبز (raw_material_id = 8)
INSERT INTO product_recipes (product_id, raw_material_id, quantity_needed, unit)
VALUES (1, 8, 1, 'قطعة');

-- أضف الجبنة (raw_material_id = 12)
INSERT INTO product_recipes (product_id, raw_material_id, quantity_needed, unit)
VALUES (1, 12, 2, 'شريحة');
```

#### الطريقة 3: استخدام API

```bash
# PUT /api/product-recipes/product/:productId

curl -X PUT http://localhost:5000/api/product-recipes/product/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipe": [
      {
        "raw_material_id": 5,
        "quantity_needed": 0.150,
        "unit": "كيلو"
      },
      {
        "raw_material_id": 8,
        "quantity_needed": 1,
        "unit": "قطعة"
      }
    ]
  }'
```

### النتيجة المتوقعة بعد ربط الوصفات:

✅ **السيناريو الجديد:**
1. برجر لحم مربوط بـ:
   - 150 جرام لحمة مفرومة
   - 1 قطعة خبز
   - 2 شريحة جبنة
2. المخزون الحالي:
   - لحمة مفرومة: 10 كيلو
   - خبز: 50 قطعة
   - جبنة: 100 شريحة
3. بيع 3 قطع برجر لحم
4. النظام **تلقائياً** ينقص:
   - لحمة مفرومة: 10 - (3 × 0.150) = **9.55 كيلو** ✅
   - خبز: 50 - (3 × 1) = **47 قطعة** ✅
   - جبنة: 100 - (3 × 2) = **94 شريحة** ✅
5. يتم تسجيل كل عملية خصم في `inventory_transactions` للمراجعة

### الاختبار المطلوب:

```bash
# 1. تأكد من وجود منتج ومواد خام
# - منتج: برجر لحم (product_id مثلاً = 1)
# - مواد خام: لحمة مفرومة (raw_material_id مثلاً = 5)

# 2. أضف وصفة للمنتج (اختر طريقة من الطرق أعلاه)

# 3. تحقق من المخزون قبل البيع:
# GET /api/raw-materials
# لحمة مفرومة: current_stock = 10 كيلو

# 4. قم بعملية بيع:
# POST /api/orders/in-store
{
  "items": [
    {
      "product_id": 1,
      "quantity": 3,
      "price": 50,
      "cost_price": 30
    }
  ]
}

# 5. تحقق من المخزون بعد البيع:
# GET /api/raw-materials
# لحمة مفرومة: current_stock = 9.55 كيلو ✅

# 6. تحقق من سجل المعاملات:
# GET /api/inventory-transactions?raw_material_id=5
# يجب أن تجد سجل بـ transaction_type = 'sale'
```

---

## 📊 ملخص الحالة

| المشكلة | السبب | الحالة | الإصلاح |
|---------|-------|--------|---------|
| **#1: الدفعات لا تظهر** | كود ناقص | ✅ **تم الإصلاح** | أضيف كود إنشاء دفعة تلقائياً |
| **#2: البيع لا ينقص المخزون** | بيانات ناقصة | ⏳ **يحتاج إعداد** | ربط المنتجات بالمواد الخام |

---

## 🎯 الخطوات التالية

### لاختبار المشكلة #1 (الدفعات):

1. ✅ شغّل Backend وFrontend
2. ✅ أضف مشتريات مع "دفع آجل 30 يوم"
3. ✅ تحقق من ظهور الدفعة في `Supplier Payments`

### لحل المشكلة #2 (البيع والمخزون):

1. ⏳ افتح صفحة المنتجات
2. ⏳ اختر منتج واضغط "تعديل"
3. ⏳ أضف وصفة (recipe) بالمواد الخام المطلوبة
4. ⏳ احفظ وكرر لكل المنتجات
5. ⏳ قم بعملية بيع تجريبية
6. ⏳ تحقق من نقص المخزون

---

## 🐛 ملاحظات إضافية

### التأثير على FIFO:

بعد حل المشكلة #2 وربط المنتجات بالمواد الخام:
- ✅ البيع سيخصم تلقائياً من `raw_materials`
- ✅ يمكنك استخدام FIFO Management لتسجيل الاستهلاك حسب الدفعات
- ✅ نظام التنبيهات سيعمل تلقائياً:
  - تنبيه مخزون منخفض (عند انخفاض اللحمة تحت الحد الأدنى)
  - تنبيه دفعات قريبة الانتهاء
  - تنبيه دفعات متأخرة

### API Endpoint مهم:

```bash
# فحص توفر المخزون قبل البيع
POST /api/product-recipes/check-stock
{
  "items": [
    {
      "product_id": 1,
      "quantity": 10
    }
  ]
}

# Response:
{
  "success": true,
  "available": false,
  "message": "مخزون غير كافٍ",
  "unavailable_materials": [
    {
      "material_name": "لحمة مفرومة",
      "required": 1.5,
      "available": 0.8,
      "unit": "كيلو"
    }
  ]
}
```

هذا يساعد في منع بيع منتجات لا يوجد لها مخزون كافٍ!

---

**تم إنشاؤه بواسطة:** Claude Code
**آخر تحديث:** 2026-01-14
**الملفات المعدلة:** `backend/src/controllers/inventoryPurchaseController.js`

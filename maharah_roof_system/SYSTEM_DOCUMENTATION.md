# نظام إدارة المقهى - Coffee Management System

## 📋 نظرة عامة

نظام شامل لإدارة المقاهي يشمل:
- **نقطة البيع (POS)** - بيع المنتجات وإنشاء الطلبات
- **إدارة المخزون** - تتبع المواد الخام والموردين والمستودعات
- **إدارة الوصفات** - ربط المنتجات بالمواد الخام مع تحويل الوحدات
- **إدارة الطلبات** - تتبع المبيعات والأرباح
- **التقارير** - تقارير المبيعات والمخزون والأرباح
- **إدارة المستخدمين** - صلاحيات متعددة المستويات

---

## 🏗️ المعمارية (Architecture)

### Frontend
- **Framework**: React.js
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Hooks (useState, useEffect)

### Backend
- **Framework**: Node.js + Express.js
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs

### المجلدات الأساسية
```
coffe_system/
├── frontend/
│   ├── src/
│   │   ├── api/           # API calls
│   │   ├── components/    # React components
│   │   ├── pages/        # صفحات النظام
│   │   ├── utils/        # Helper functions
│   │   └── contexts/     # React Context (Auth)
│   └── public/
│
└── backend/
    ├── database/         # SQL files
    ├── src/
    │   ├── config/       # Database config
    │   ├── controllers/  # Business logic
    │   ├── routes/       # API routes
    │   ├── middleware/   # Auth middleware
    │   └── utils/        # Helper functions
    └── server.js
```

---

## 🗄️ قاعدة البيانات (Database Schema)

### الجداول الرئيسية

#### 1. المستخدمين (users)
```sql
- id (PK)
- username
- full_name
- email
- password (hashed)
- role (admin, cashier, manager)
- permissions (JSON)
- is_active
- created_at
```

#### 2. الفئات (categories)
```sql
- id (PK)
- name
- description
- is_active
- created_at
```

#### 3. المنتجات (products)
```sql
- id (PK)
- name
- category_id (FK → categories)
- price (سعر البيع)
- cost_price (التكلفة - يُحسب تلقائياً من الوصفة)
- stock (دائماً 0 - المنتجات تُصنع fresh)
- description
- is_active
- created_at
```

**ملاحظة مهمة**: `products.stock` دائماً = 0 لأن المنتجات تُصنع طازجة من المواد الخام!

#### 4. الموردين (suppliers)
```sql
- id (PK)
- name
- contact_person
- phone
- email
- address
- notes
- is_active
- created_at
```

#### 5. المستودعات (warehouses)
```sql
- id (PK)
- name
- location
- description
- is_active
- created_at
```

#### 6. المواد الخام (raw_materials)
```sql
- id (PK)
- name
- description
- unit (كيلو، لتر، جرام، ملليلتر، إلخ)
- current_stock (الكمية الحالية)
- min_stock (الحد الأدنى - تحذير)
- unit_cost (تكلفة الوحدة الواحدة)
- supplier_id (FK → suppliers)
- warehouse_id (FK → warehouses)
- is_active
- created_at
```

#### 7. وصفات المنتجات (product_recipes)
```sql
- id (PK)
- product_id (FK → products)
- raw_material_id (FK → raw_materials)
- quantity_needed (الكمية المطلوبة)
- unit (وحدة القياس في الوصفة - يمكن أن تختلف عن وحدة المادة الخام)
- created_at
```

**مثال**:
- المادة الخام: بن (1 كيلو = 750 ج.م)
- الوصفة: قهوة تحتاج 20 جرام بن
- النظام يحول 20 جرام → 0.02 كيلو
- التكلفة = 0.02 × 750 = 15 ج.م

#### 8. مشتريات المخزن (inventory_purchases)
```sql
- id (PK)
- supplier_id (FK)
- purchase_date
- invoice_number
- total_amount
- notes
- created_by (FK → users)
- created_at
```

#### 9. تفاصيل المشتريات (inventory_purchase_items)
```sql
- id (PK)
- purchase_id (FK → inventory_purchases)
- raw_material_id (FK → raw_materials)
- quantity
- unit_price
- total_price
- created_at
```

#### 10. سجل حركة المخزن (inventory_transactions)
```sql
- id (PK)
- raw_material_id (FK)
- transaction_type (purchase, sale, adjustment, return)
- quantity (موجب = إضافة، سالب = خصم)
- unit_cost
- reference_type (order, purchase, manual)
- reference_id
- notes
- created_by (FK → users)
- created_at
```

#### 11. الطلبات (orders)
```sql
- id (PK)
- order_number (تلقائي: ORD-YYYYMMDD-XXXX)
- order_type (in-store, online, delivery)
- status (pending, completed, cancelled)
- customer_name
- customer_phone
- customer_address
- subtotal
- discount_type (none, percentage, fixed)
- discount_value
- discount_amount
- total
- cost (التكلفة الإجمالية)
- profit (الربح)
- offer_id (FK)
- cashier_id (FK → users)
- created_at
```

#### 12. عناصر الطلب (order_items)
```sql
- id (PK)
- order_id (FK → orders)
- product_id (FK → products)
- product_name (نسخة من اسم المنتج)
- quantity
- price (سعر البيع وقت الطلب)
- cost_price (التكلفة وقت الطلب)
- subtotal
- profit
- created_at
```

#### 13. العروض (offers)
```sql
- id (PK)
- name
- description
- offer_type (percentage, fixed, buy_x_get_y)
- discount_value
- buy_quantity
- get_quantity
- start_date
- end_date
- is_active
```

#### 14. الخصومات اليومية (daily_discounts)
```sql
- id (PK)
- date
- discount_type
- discount_value
- is_active
```

#### 15. المصروفات (expenses)
```sql
- id (PK)
- expense_type (rent, salaries, utilities, maintenance, other)
- amount
- description
- date
- created_by (FK → users)
```

---

## 🔄 نظام إدارة المخزون والوصفات

### كيف يعمل النظام؟

#### 1. إضافة مواد خام
```javascript
// مثال: إضافة بن
{
  name: "بن برازيلي",
  unit: "كيلو",
  current_stock: 50,      // عندك 50 كيلو
  min_stock: 10,          // حد أدنى 10 كيلو
  unit_cost: 750,         // 750 ج.م للكيلو
  supplier_id: 1,
  warehouse_id: 1
}
```

#### 2. إنشاء وصفة منتج
```javascript
// مثال: قهوة سادة
Product: "قهوة سادة"
Price: 40 ج.م

Recipe:
[
  {
    raw_material_id: 1,    // بن برازيلي
    quantity_needed: 20,   // 20 جرام
    unit: "جرام"          // الوحدة في الوصفة
  },
  {
    raw_material_id: 2,    // لبن
    quantity_needed: 50,   // 50 ملليلتر
    unit: "ملليلتر"
  }
]

// النظام يحسب التكلفة تلقائياً:
Cost = (20g → 0.02kg × 750 ج.م) + (50ml → 0.05L × 100 ج.م)
     = 15 + 5 = 20 ج.م

Profit = 40 - 20 = 20 ج.م (50% profit margin)
```

#### 3. تحويل الوحدات (Unit Conversion)

النظام يدعم التحويل بين الوحدات المتوافقة:

**الوزن (Weight)**:
- جرام ↔ كيلو ↔ طن
- 1 كيلو = 1000 جرام
- 1 طن = 1000 كيلو

**الحجم (Volume)**:
- ملليلتر ↔ لتر ↔ جالون
- 1 لتر = 1000 ملليلتر
- 1 جالون = 3785.41 ملليلتر

**مقاييس الطبخ (Cooking)**:
- كوب = 240 جرام (تقريبي)
- ملعقة كبيرة = 15 جرام
- ملعقة صغيرة = 5 جرام
- رشة = 0.5 جرام

**العد (Count)** - لا يتم التحويل:
- قطعة، علبة، كرتونة، عبوة، كيس، زجاجة

```javascript
// Backend: /backend/src/utils/unitConversion.js
// Frontend: /frontend/src/utils/unitConversion.js

convertUnits(100, 'جرام', 'كيلو')  // → 0.1
convertUnits(1.5, 'لتر', 'ملليلتر')  // → 1500
convertUnits(2, 'كيلو', 'جرام')  // → 2000
```

#### 4. عند إنشاء طلب (Order)

```javascript
// العميل يطلب 2 قهوة سادة

1. POS: يضيف 2 قهوة للسلة
2. Order Controller: ينشئ الطلب
3. Recipe Controller: يخصم من المواد الخام:
   - بن: 2 × 20g = 40g → 0.04kg
   - لبن: 2 × 50ml = 100ml → 0.1L

4. Database Updates:
   - raw_materials: current_stock يقل
   - inventory_transactions: يسجل الحركة
   - orders: ينشئ الطلب
   - order_items: يضيف العناصر

5. Result:
   - Order Total: 80 ج.م
   - Cost: 40 ج.م
   - Profit: 40 ج.م
```

#### 5. تتبع توافر المنتجات

النظام يفحص توافر المواد الخام لكل منتج:

```javascript
// Backend: productController.js → checkProductAvailability()

For each product:
  1. Get recipe
  2. For each ingredient:
     - Convert recipe quantity to material unit
     - Check if current_stock >= required quantity
  3. Return:
     - materials_available: true/false
     - unavailable_materials: [list]
```

**في واجهة المنتجات**:
- Badge أحمر "مواد غير متوفرة" للمنتجات الناقصة
- Filter: "المواد متوفرة" / "المواد غير متوفرة"

**في نقطة البيع**:
- Indicator برتقالي خفيف "⚠️ مواد ناقصة"
- لا يمنع البيع (ممكن توجد مواد غير مسجلة)

---

## 🔐 نظام المصادقة والصلاحيات

### الأدوار (Roles)
1. **admin** - صلاحيات كاملة
2. **manager** - إدارة + تقارير (بدون حذف)
3. **cashier** - نقطة البيع فقط

### الصلاحيات (Permissions)
```json
{
  "can_view_dashboard": true,
  "can_manage_products": true,
  "can_manage_orders": true,
  "can_view_reports": true,
  "can_manage_users": false,
  "can_view_inventory": true,
  "can_manage_inventory": false
}
```

### حماية الـ Routes

**Backend Middleware**:
```javascript
// /backend/src/middleware/authMiddleware.js

authenticateToken(req, res, next)
  → يتحقق من JWT token

authorizeRole(['admin', 'manager'])
  → يتحقق من الدور

checkPermission('can_manage_products')
  → يتحقق من الصلاحية
```

**Frontend Protected Routes**:
```javascript
// /frontend/src/App.jsx

<Route element={<ProtectedRoute allowedRoles={['admin']} />}>
  <Route path="/users" element={<Users />} />
</Route>
```

---

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/login          - تسجيل دخول
POST   /api/auth/logout         - تسجيل خروج
GET    /api/auth/me             - بيانات المستخدم الحالي
```

### Products
```
GET    /api/products            - كل المنتجات (مع توافر المواد)
GET    /api/products/:id        - منتج واحد
POST   /api/products            - إضافة منتج
PUT    /api/products/:id        - تعديل منتج
DELETE /api/products/:id        - حذف منتج
```

### Categories
```
GET    /api/categories          - كل الفئات
POST   /api/categories          - إضافة فئة
PUT    /api/categories/:id      - تعديل فئة
DELETE /api/categories/:id      - حذف فئة
```

### Raw Materials
```
GET    /api/raw-materials       - كل المواد الخام
GET    /api/raw-materials/active - المواد النشطة فقط
GET    /api/raw-materials/low-stock - المواد القليلة
GET    /api/raw-materials/:id   - مادة واحدة
POST   /api/raw-materials       - إضافة مادة
PUT    /api/raw-materials/:id   - تعديل مادة
DELETE /api/raw-materials/:id   - حذف مادة
```

### Suppliers
```
GET    /api/suppliers           - كل الموردين
GET    /api/suppliers/active    - الموردين النشطين
POST   /api/suppliers           - إضافة مورد
PUT    /api/suppliers/:id       - تعديل مورد
DELETE /api/suppliers/:id       - حذف مورد
```

### Warehouses
```
GET    /api/warehouses          - كل المستودعات
POST   /api/warehouses          - إضافة مستودع
PUT    /api/warehouses/:id      - تعديل مستودع
DELETE /api/warehouses/:id      - حذف مستودع
```

### Product Recipes
```
GET    /api/recipes/product/:productId     - وصفة منتج
PUT    /api/recipes/product/:productId     - تحديث وصفة
POST   /api/recipes/check-availability     - فحص توافر المواد
```

### Inventory Purchases
```
GET    /api/inventory-purchases             - كل المشتريات
GET    /api/inventory-purchases/:id         - مشترى واحد
POST   /api/inventory-purchases             - إضافة مشترى
PUT    /api/inventory-purchases/:id         - تعديل مشترى
DELETE /api/inventory-purchases/:id         - حذف مشترى
```

### Orders
```
GET    /api/orders                  - كل الطلبات
GET    /api/orders/:id              - طلب واحد
POST   /api/orders/in-store         - طلب من المحل
POST   /api/orders/online           - طلب أونلاين
PUT    /api/orders/:id/status       - تغيير حالة الطلب
PUT    /api/orders/:id              - تعديل طلب
DELETE /api/orders/:id              - إلغاء طلب
```

### Reports
```
GET    /api/reports/sales           - تقرير المبيعات
GET    /api/reports/inventory       - تقرير المخزون
GET    /api/reports/profit          - تقرير الأرباح
GET    /api/reports/expenses        - تقرير المصروفات
```

### Offers
```
GET    /api/offers                  - كل العروض
GET    /api/offers/active           - العروض النشطة
POST   /api/offers                  - إضافة عرض
PUT    /api/offers/:id              - تعديل عرض
DELETE /api/offers/:id              - حذف عرض
```

### Daily Discounts
```
GET    /api/daily-discounts         - كل الخصومات
GET    /api/daily-discounts/:date   - خصم يوم معين
POST   /api/daily-discounts         - إضافة خصم
PUT    /api/daily-discounts/:id     - تعديل خصم
DELETE /api/daily-discounts/:id     - حذف خصم
```

### Setup (Maintenance)
```
POST   /api/setup/create-tables     - إنشاء الجداول
POST   /api/setup/migrate-warehouse - إضافة warehouse_id
POST   /api/setup/migrate-unit      - إضافة unit column
```

---

## 🚀 كيفية تشغيل النظام

### المتطلبات
- Node.js (v14+)
- MySQL (v8+)
- npm أو yarn

### التثبيت

#### 1. Backend
```bash
cd backend
npm install

# إنشاء ملف .env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cafe_system
JWT_SECRET=your_secret_key
NODE_ENV=development

# تشغيل السيرفر
npm start
```

#### 2. Frontend
```bash
cd frontend
npm install

# تشغيل التطبيق
npm run dev
```

#### 3. Database
```bash
# إنشاء قاعدة البيانات
mysql -u root -p
CREATE DATABASE cafe_system;

# الجداول ستُنشأ تلقائياً عند أول تشغيل
```

---

## 🔧 المشاكل التي تم حلها

### 1. مشكلة "نفذ المخزون" في POS
**المشكلة**: كل المنتجات تظهر "نفذ المخزون" لأن `products.stock = 0`

**الحل**:
- شيلنا stock checking من POS
- المنتجات تُصنع fresh من المواد الخام
- Indicator خفيف للمواد الناقصة بدون منع البيع

### 2. مشكلة إنشاء الطلبات
**المشكلة**: Orders Controller يرفض الطلبات بسبب `stock < quantity`

**الحل**:
- شيلنا كل stock validation من Order Controller
- شيلنا `UPDATE products SET stock...`
- النظام بس يخصم من `raw_materials` عن طريق الوصفات

### 3. مشكلة حساب التكلفة الخاطئ
**المشكلة**: التكلفة 41000 ج.م بدلاً من 41 ج.م

**الحل**:
- أضفنا unit conversion في Backend
- `750 ج.م/كيلو × 20 جرام` صارت `750 × 0.02 = 15 ج.م`

### 4. مشكلة عدم حفظ الوحدة في الوصفة
**المشكلة**: الوحدة ترجع للوحدة الأساسية بعد الحفظ

**الحل**:
- أضفنا `unit` column لجدول `product_recipes`
- Migration تلقائي عند تشغيل السيرفر
- Controller يحفظ الوحدة مع كل مكون

### 5. مشكلة warehouse_id مفقود
**المشكلة**: Error "Unknown column 'rm.warehouse_id'"

**الحل**:
- Auto-migration يضيف `warehouse_id` للمواد الخام
- Foreign key مع warehouses
- يشتغل تلقائياً أول مرة

---

## 📊 سيناريوهات الاستخدام

### سيناريو 1: إضافة منتج جديد
```
1. مدير → المنتجات → إضافة منتج
2. يدخل: اسم، فئة، سعر، وصف
3. يضيف الوصفة:
   - يختار مادة خام (مثلاً: بن - كيلو)
   - يختار وحدة (جرام)
   - يدخل الكمية (20)
   - يكرر للمواد الأخرى
4. يضغط "إضافة"
5. النظام:
   - يحسب التكلفة تلقائياً
   - يحفظ المنتج والوصفة
   - يظهر المنتج في القائمة
```

### سيناريو 2: عمل طلب (Order)
```
1. كاشير → نقطة البيع
2. يختار منتجات:
   - 2 قهوة
   - 1 كابتشينو
3. يضيف خصم (اختياري):
   - نوع: نسبة مئوية
   - القيمة: 10%
4. يدخل بيانات العميل (اختياري)
5. يضغط "إتمام الطلب"
6. النظام:
   - ينشئ Order
   - يخصم المواد الخام من المخزون
   - يسجل في inventory_transactions
   - يطبع الفاتورة
```

### سيناريو 3: شراء مواد خام
```
1. مدير → المخزن → مشتريات المخزن → إضافة
2. يختار المورد
3. يدخل تاريخ الشراء ورقم الفاتورة
4. يضيف المواد:
   - بن: 50 كيلو × 750 ج.م
   - لبن: 100 لتر × 100 ج.م
5. يضغط "إضافة"
6. النظام:
   - يضيف للمخزون (current_stock)
   - يسجل في inventory_transactions
   - يحفظ المشترى
```

### سيناريو 4: مراقبة المخزون
```
1. مدير → المنتجات
2. Filter → "المواد غير متوفرة"
3. يرى قائمة المنتجات التي موادها ناقصة
4. يذهب → المواد الخام
5. يرى المواد القليلة (أقل من الحد الأدنى)
6. يذهب → مشتريات المخزن → يشتري
```

---

## 📈 التطويرات المستقبلية المقترحة

### 1. Barcode Scanner
- إضافة دعم للـ barcode
- مسح سريع للمنتجات في POS

### 2. Multi-Branch Support
- دعم عدة فروع
- نقل مخزون بين الفروع

### 3. Online Ordering
- موقع/تطبيق للعملاء
- طلبات أونلاين
- تتبع الطلبات

### 4. Kitchen Display System
- شاشة للمطبخ
- عرض الطلبات الجديدة
- تحديث الحالة

### 5. Advanced Analytics
- Dashboards أكثر تفصيلاً
- Predictive analytics
- Best sellers analysis

### 6. Mobile App
- تطبيق موبايل للكاشير
- إدارة سريعة

### 7. Inventory Alerts
- تنبيهات تلقائية بالإيميل/SMS
- عند نقص المخزون
- عند اقتراب انتهاء الصلاحية

---

## 🛠️ استكشاف الأخطاء

### مشكلة: "Unknown column 'warehouse_id'"
**الحل**: أعد تشغيل السيرفر، الـ migration سيعمل تلقائياً

### مشكلة: "Insufficient stock"
**الحل**: تأكد من الكود المحدّث (شيلنا stock validation)

### مشكلة: التكلفة خاطئة
**الحل**: تأكد من unit conversion في Backend

### مشكلة: الوحدة لا تُحفظ
**الحل**: تأكد من وجود `unit` column في `product_recipes`

### مشكلة: JWT expired
**الحل**: سجل دخول مرة أخرى

---

## 📞 الدعم الفني

للمشاكل التقنية:
1. تحقق من Console (F12)
2. تحقق من Backend Logs
3. تحقق من قاعدة البيانات

---

## 📝 ملاحظات مهمة

1. **Products.stock دائماً = 0** - المنتجات تُصنع fresh
2. **Raw Materials فقط لها مخزون فعلي** - current_stock
3. **Unit Conversion ضروري** - للحسابات الصحيحة
4. **Auto-migrations تعمل تلقائياً** - عند تشغيل السيرفر
5. **JWT Tokens تنتهي بعد 24 ساعة** - سجل دخول مرة أخرى
6. **Permissions محفوظة في JSON** - في جدول users

---

## 🎉 الخلاصة

النظام جاهز للاستخدام مع:
- ✅ نقطة بيع كاملة
- ✅ إدارة مخزون ذكية
- ✅ وصفات مع تحويل وحدات
- ✅ تتبع دقيق للمواد الخام
- ✅ تقارير شاملة
- ✅ صلاحيات متعددة

**الكود نظيف، موثق، وجاهز للإنتاج!** 🚀

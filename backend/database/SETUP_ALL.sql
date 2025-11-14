-- ═══════════════════════════════════════════════════════════════════
-- ║  سكريبت الإعداد الشامل لقاعدة بيانات نظام إدارة المقهى  ║
-- ═══════════════════════════════════════════════════════════════════
--
-- هذا السكريبت يقوم بـ:
-- 1. إنشاء جدول المشتريات (purchases)
-- 2. إنشاء جدول المصروفات (expenses)
-- 3. إنشاء مستخدم Admin (kareem / 123456)
--
-- الاستخدام:
-- 1. افتح phpMyAdmin
-- 2. اختر قاعدة البيانات: coffee_shop
-- 3. اضغط على "SQL"
-- 4. انسخ والصق هذا السكريبت كاملاً
-- 5. اضغط "Go" أو "تنفيذ"
--
-- ═══════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════
-- الجزء 1: إنشاء جدول المشتريات
-- ═══════════════════════════════════════════════════════════════════

-- حذف الجدول القديم (إذا كنت تريد البدء من جديد)
-- تحذير: سيحذف جميع بيانات المشتريات!
DROP TABLE IF EXISTS purchases;

CREATE TABLE purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_name VARCHAR(255) NOT NULL COMMENT 'اسم المورد',
    item_description TEXT NOT NULL COMMENT 'وصف الصنف',
    quantity DECIMAL(10, 2) NOT NULL COMMENT 'الكمية',
    unit_price DECIMAL(10, 2) NOT NULL COMMENT 'سعر الوحدة',
    total_amount DECIMAL(10, 2) NOT NULL COMMENT 'المبلغ الإجمالي',
    purchase_date DATE NOT NULL COMMENT 'تاريخ الشراء',
    notes TEXT NULL COMMENT 'ملاحظات',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_purchase_date (purchase_date),
    INDEX idx_supplier (supplier_name(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول المشتريات';

-- ═══════════════════════════════════════════════════════════════════
-- الجزء 2: إنشاء جدول المصروفات
-- ═══════════════════════════════════════════════════════════════════

-- حذف الجدول القديم (إذا كنت تريد البدء من جديد)
-- تحذير: سيحذف جميع بيانات المصروفات!
DROP TABLE IF EXISTS expenses;

CREATE TABLE expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(100) NOT NULL COMMENT 'فئة المصروف',
    description TEXT NOT NULL COMMENT 'وصف المصروف',
    amount DECIMAL(10, 2) NOT NULL COMMENT 'المبلغ',
    expense_date DATE NOT NULL COMMENT 'تاريخ المصروف',
    notes TEXT NULL COMMENT 'ملاحظات',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_expense_date (expense_date),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول المصروفات';

-- ═══════════════════════════════════════════════════════════════════
-- الجزء 3: إنشاء مستخدم Admin
-- ═══════════════════════════════════════════════════════════════════

-- حذف المستخدم القديم (إذا كان موجوداً)
DELETE FROM users WHERE username IN ('kareem', 'admin', 'manager');

-- إنشاء المستخدم الرئيسي: kareem
INSERT INTO users (
    username, password, full_name, role,
    can_make_sales, can_edit_orders, can_cancel_orders, can_view_order_details,
    can_manage_products, can_manage_inventory, can_view_reports, can_manage_users,
    can_manage_settings, can_add_expenses, is_active
) VALUES (
    'kareem',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'كريم خميس',
    'admin',
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
);

-- إنشاء مستخدم احتياطي: admin
INSERT INTO users (
    username, password, full_name, role,
    can_make_sales, can_edit_orders, can_cancel_orders, can_view_order_details,
    can_manage_products, can_manage_inventory, can_view_reports, can_manage_users,
    can_manage_settings, can_add_expenses, is_active
) VALUES (
    'admin',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'المدير العام',
    'admin',
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
);

-- إنشاء مستخدم احتياطي: manager
INSERT INTO users (
    username, password, full_name, role,
    can_make_sales, can_edit_orders, can_cancel_orders, can_view_order_details,
    can_manage_products, can_manage_inventory, can_view_reports, can_manage_users,
    can_manage_settings, can_add_expenses, is_active
) VALUES (
    'manager',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'مدير المقهى',
    'admin',
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
);

-- ═══════════════════════════════════════════════════════════════════
-- الجزء 4: التحقق من الإعداد
-- ═══════════════════════════════════════════════════════════════════

-- التحقق من جدول المشتريات
SELECT 'جدول المشتريات:' as 'الجداول';
DESC purchases;

-- التحقق من جدول المصروفات
SELECT 'جدول المصروفات:' as 'الجداول';
DESC expenses;

-- التحقق من المستخدمين
SELECT 'المستخدمين المنشأين:' as 'النتيجة';
SELECT id, username, full_name, role,
       can_make_sales, can_add_expenses, is_active
FROM users
WHERE username IN ('kareem', 'admin', 'manager');

-- ═══════════════════════════════════════════════════════════════════
-- معلومات تسجيل الدخول
-- ═══════════════════════════════════════════════════════════════════
--
-- يمكنك تسجيل الدخول بأي من هذه المستخدمين:
--
-- 1. اسم المستخدم: kareem
--    كلمة المرور: 123456
--    الاسم: كريم خميس
--
-- 2. اسم المستخدم: admin
--    كلمة المرور: 123456
--    الاسم: المدير العام
--
-- 3. اسم المستخدم: manager
--    كلمة المرور: 123456
--    الاسم: مدير المقهى
--
-- جميع المستخدمين لديهم جميع الصلاحيات!
--
-- ═══════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════
-- تم بنجاح! ✓
-- ═══════════════════════════════════════════════════════════════════
-- الآن يمكنك:
-- 1. إغلاق phpMyAdmin
-- 2. تسجيل الدخول للنظام بأي من المستخدمين أعلاه
-- 3. إضافة المشتريات
-- 4. مشاهدة التقارير
-- ═══════════════════════════════════════════════════════════════════

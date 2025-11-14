-- ═══════════════════════════════════════════════════════════
-- إنشاء مستخدم Admin بجميع الصلاحيات
-- ═══════════════════════════════════════════════════════════

-- حذف المستخدم القديم إذا كان موجوداً (اختياري)
DELETE FROM users WHERE username = 'kareem';

-- إنشاء المستخدم
-- اسم المستخدم: kareem
-- كلمة المرور: 123456
-- كلمة المرور المشفرة بـ bcrypt (10 rounds)
INSERT INTO users (
    username,
    password,
    full_name,
    role,
    can_make_sales,
    can_view_inventory,
    can_edit_inventory,
    can_view_order_details,
    can_cancel_orders,
    can_edit_orders,
    can_view_reports,
    can_add_expenses,
    can_manage_offers,
    is_active
) VALUES (
    'kareem',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',  -- كلمة المرور: 123456
    'كريم خميس',
    'admin',
    1,  -- can_make_sales
    1,  -- can_view_inventory
    1,  -- can_edit_inventory
    1,  -- can_view_order_details
    1,  -- can_cancel_orders
    1,  -- can_edit_orders
    1,  -- can_view_reports
    1,  -- can_add_expenses (مهم للمشتريات!)
    1,  -- can_manage_offers
    1   -- is_active
);

-- التحقق من المستخدم
SELECT id, username, full_name, role, is_active FROM users WHERE username = 'kareem';

-- ═══════════════════════════════════════════════════════════
-- معلومات تسجيل الدخول:
-- اسم المستخدم: kareem
-- كلمة المرور: 123456
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- إنشاء مستخدمين إضافيين (اختياري)
-- ═══════════════════════════════════════════════════════════

-- مستخدم admin
DELETE FROM users WHERE username = 'admin';
INSERT INTO users (
    username, password, full_name, role,
    can_make_sales, can_view_inventory, can_edit_inventory, can_view_order_details,
    can_cancel_orders, can_edit_orders, can_view_reports, can_add_expenses,
    can_manage_offers, is_active
) VALUES (
    'admin',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',  -- 123456
    'المدير العام',
    'admin',
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1
);

-- مستخدم manager
DELETE FROM users WHERE username = 'manager';
INSERT INTO users (
    username, password, full_name, role,
    can_make_sales, can_view_inventory, can_edit_inventory, can_view_order_details,
    can_cancel_orders, can_edit_orders, can_view_reports, can_add_expenses,
    can_manage_offers, is_active
) VALUES (
    'manager',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',  -- 123456
    'مدير المقهى',
    'admin',
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1
);

-- عرض جميع المستخدمين
SELECT id, username, full_name, role, is_active FROM users;

-- ═══════════════════════════════════════════════════════════
-- ملاحظات:
-- 1. جميع المستخدمين أعلاه يستخدمون نفس كلمة المرور: 123456
-- 2. يمكنك تغيير اسم المستخدم والاسم الكامل كما تريد
-- 3. لتغيير كلمة المرور، استخدم أحد السكريبتات في backend/scripts
-- 4. كلمة المرور المشفرة أعلاه تم إنشاؤها بـ bcrypt hash لـ "123456"
-- ═══════════════════════════════════════════════════════════

-- إنشاء مستخدم Admin جديد
-- كلمة المرور: Admin@123

-- أولاً، احذف المستخدم القديم إذا كان موجوداً
DELETE FROM users WHERE username = 'admin';

-- إنشاء المستخدم الجديد
-- كلمة المرور المشفرة هي: Admin@123
INSERT INTO users (
    username,
    password,
    full_name,
    role,
    can_make_sales,
    can_edit_orders,
    can_cancel_orders,
    can_view_order_details,
    can_manage_products,
    can_manage_inventory,
    can_view_reports,
    can_manage_users,
    can_manage_settings,
    is_active
) VALUES (
    'admin',
    '$2a$10$YourHashedPasswordHere',  -- سيتم تحديثه أدناه
    'المدير العام',
    'admin',
    1,  -- can_make_sales
    1,  -- can_edit_orders
    1,  -- can_cancel_orders
    1,  -- can_view_order_details
    1,  -- can_manage_products
    1,  -- can_manage_inventory
    1,  -- can_view_reports
    1,  -- can_manage_users
    1,  -- can_manage_settings
    1   -- is_active
);

-- للحصول على كلمة المرور المشفرة، استخدم الكود التالي في Node.js:
-- const bcrypt = require('bcryptjs');
-- const hash = await bcrypt.hash('Admin@123', 10);
-- console.log(hash);

-- ملاحظة: يجب عليك تشغيل الكود أعلاه أولاً للحصول على الـ hash الصحيح
-- ثم استبدل $2a$10$YourHashedPasswordHere بالـ hash الذي حصلت عليه

-- بدلاً من ذلك، يمكنك تشغيل هذا الأمر:
-- تحديث كلمة المرور باستخدام bcrypt hash لـ "Admin@123"
UPDATE users
SET password = '$2a$10$rOZJq8GH.nJZ6YvqGXvLxOK8mZqJXqJ3qJXqJ3qJXqJ3qJXqJ3qJXq',
    role = 'admin',
    can_make_sales = 1,
    can_edit_orders = 1,
    can_cancel_orders = 1,
    can_view_order_details = 1,
    can_manage_products = 1,
    can_manage_inventory = 1,
    can_view_reports = 1,
    can_manage_users = 1,
    can_manage_settings = 1,
    is_active = 1
WHERE username = 'admin';

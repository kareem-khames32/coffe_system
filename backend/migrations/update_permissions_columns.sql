-- Migration: Update permissions columns to match the 9 standard permissions
-- Date: 2026-01-26
-- Description: Rename and consolidate permission columns in users table
--
-- Old columns:
--   - can_edit_inventory -> can_manage_inventory
--   - can_cancel_orders + can_edit_orders -> can_cancel_edit_orders
--   - Add: can_manage_online_orders
--
-- The 9 standard permissions:
--   1. can_make_sales - إجراء مبيعات
--   2. can_view_inventory - عرض المخزون
--   3. can_manage_inventory - إدارة المخزون
--   4. can_add_expenses - إضافة مصروفات
--   5. can_view_reports - عرض التقارير
--   6. can_manage_offers - إدارة العروض
--   7. can_manage_online_orders - إدارة الطلبات الأونلاين
--   8. can_view_order_details - عرض تفاصيل الطلبات
--   9. can_cancel_edit_orders - إلغاء وتعديل الطلبات

-- Step 1: Add new columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_manage_inventory TINYINT(1) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_cancel_edit_orders TINYINT(1) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_manage_online_orders TINYINT(1) DEFAULT 0;

-- Step 2: Migrate data from old columns to new columns
-- can_edit_inventory -> can_manage_inventory
UPDATE users SET can_manage_inventory = can_edit_inventory WHERE can_edit_inventory IS NOT NULL;

-- can_cancel_orders OR can_edit_orders -> can_cancel_edit_orders (if either was true, new permission is true)
UPDATE users SET can_cancel_edit_orders = (COALESCE(can_cancel_orders, 0) OR COALESCE(can_edit_orders, 0));

-- For admin users, set all permissions to true
UPDATE users SET
    can_manage_inventory = 1,
    can_cancel_edit_orders = 1,
    can_manage_online_orders = 1
WHERE role = 'admin';

-- Step 3: Drop old columns (uncomment after verifying migration)
-- ALTER TABLE users DROP COLUMN IF EXISTS can_edit_inventory;
-- ALTER TABLE users DROP COLUMN IF EXISTS can_cancel_orders;
-- ALTER TABLE users DROP COLUMN IF EXISTS can_edit_orders;

-- Verify the changes
SELECT id, username, full_name, role,
       can_make_sales, can_view_inventory, can_manage_inventory,
       can_add_expenses, can_view_reports, can_manage_offers,
       can_manage_online_orders, can_view_order_details, can_cancel_edit_orders
FROM users;

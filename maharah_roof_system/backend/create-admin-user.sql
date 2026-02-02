-- ════════════════════════════════════════════════════════════════
-- Create Admin User for Cafe Management System
-- ════════════════════════════════════════════════════════════════
-- Username: admin
-- Password: 123456
-- ════════════════════════════════════════════════════════════════

USE cafe_management;

-- Delete existing admin users if any
DELETE FROM users WHERE username IN ('admin', 'kareem');

-- Insert Admin User (password: 123456)
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
    'admin',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'المدير العام',
    'admin',
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1
);

-- Verify user was created
SELECT
    id,
    username,
    full_name,
    role,
    is_active,
    '✅ Admin user created successfully!' as message
FROM users
WHERE username = 'admin';

-- Add discount permission to users table
USE cafe_management;

-- Add can_apply_discounts column to users table
ALTER TABLE users
ADD COLUMN can_apply_discounts BOOLEAN DEFAULT FALSE AFTER can_manage_offers;

-- Update existing admin users to have discount permission
UPDATE users
SET can_apply_discounts = TRUE
WHERE role = 'admin';

-- Display success message
SELECT 'Discount permission column added successfully!' as status;

USE cafe_management;

-- حذف الـ Foreign Key Constraints أولاً
ALTER TABLE order_edit_history DROP FOREIGN KEY order_edit_history_ibfk_3;

-- حذف الأعمدة المشكلة (GENERATED/VIRTUAL)
ALTER TABLE orders DROP COLUMN IF EXISTS total;
ALTER TABLE orders DROP COLUMN IF EXISTS cost;

ALTER TABLE order_items DROP COLUMN IF EXISTS price;
ALTER TABLE order_items DROP COLUMN IF EXISTS cost_price;
ALTER TABLE order_items DROP COLUMN IF EXISTS profit;

ALTER TABLE order_edit_history DROP COLUMN IF EXISTS edited_by;
ALTER TABLE order_edit_history DROP COLUMN IF EXISTS changes;
ALTER TABLE order_edit_history DROP COLUMN IF EXISTS edited_at;

-- إضافة الأعمدة كـ Regular Columns (ليست GENERATED)
ALTER TABLE orders ADD COLUMN total DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN cost DECIMAL(10,2) DEFAULT 0;

ALTER TABLE order_items ADD COLUMN price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN cost_price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN profit DECIMAL(10,2) DEFAULT 0;

ALTER TABLE order_edit_history ADD COLUMN edited_by INT;
ALTER TABLE order_edit_history ADD COLUMN changes TEXT;
ALTER TABLE order_edit_history ADD COLUMN edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- إضافة الـ Foreign Key تاني
ALTER TABLE order_edit_history ADD CONSTRAINT fk_edited_by FOREIGN KEY (edited_by) REFERENCES users(id) ON DELETE SET NULL;

-- نسخ القيم من الأعمدة القديمة
UPDATE orders SET total = total_amount WHERE total = 0 OR total IS NULL;
UPDATE orders SET cost = total_cost WHERE cost = 0 OR cost IS NULL;

UPDATE order_edit_history SET edited_by = user_id WHERE edited_by IS NULL;
UPDATE order_edit_history SET changes = action WHERE changes IS NULL OR changes = '';
UPDATE order_edit_history SET edited_at = created_at;

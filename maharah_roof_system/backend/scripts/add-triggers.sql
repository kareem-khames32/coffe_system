USE cafe_management;

-- جعل الأعمدة الأصلية nullable أو لها قيمة افتراضية
ALTER TABLE orders MODIFY COLUMN total_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders MODIFY COLUMN total_cost DECIMAL(10,2) DEFAULT 0;

-- إنشاء Trigger لملء الأعمدة الأصلية تلقائياً من الأعمدة الجديدة
DELIMITER $$

DROP TRIGGER IF EXISTS orders_before_insert$$
CREATE TRIGGER orders_before_insert
BEFORE INSERT ON orders
FOR EACH ROW
BEGIN
    -- نسخ القيم من total إلى total_amount
    IF NEW.total IS NOT NULL THEN
        SET NEW.total_amount = NEW.total;
    END IF;

    -- نسخ القيم من cost إلى total_cost
    IF NEW.cost IS NOT NULL THEN
        SET NEW.total_cost = NEW.cost;
    END IF;
END$$

DROP TRIGGER IF EXISTS orders_before_update$$
CREATE TRIGGER orders_before_update
BEFORE UPDATE ON orders
FOR EACH ROW
BEGIN
    -- نسخ القيم من total إلى total_amount
    IF NEW.total IS NOT NULL THEN
        SET NEW.total_amount = NEW.total;
    END IF;

    -- نسخ القيم من cost إلى total_cost
    IF NEW.cost IS NOT NULL THEN
        SET NEW.total_cost = NEW.cost;
    END IF;
END$$

DELIMITER ;

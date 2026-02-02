-- ========================================
-- Fix Database Schema Issues (Safe Version)
-- ========================================
-- This script safely adds missing columns and views
-- It checks for existence before adding

USE cafe_management;

-- ========================================
-- STEP 1: Fix supplier_payments table
-- ========================================

-- Add amount_due if not exists
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'cafe_management'
AND TABLE_NAME = 'supplier_payments'
AND COLUMN_NAME = 'amount_due';

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE supplier_payments ADD COLUMN amount_due DECIMAL(10, 2) NOT NULL DEFAULT 0 COMMENT "المبلغ المستحق" AFTER purchase_id',
    'SELECT "Column amount_due already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add amount_paid if not exists
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'cafe_management'
AND TABLE_NAME = 'supplier_payments'
AND COLUMN_NAME = 'amount_paid';

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE supplier_payments ADD COLUMN amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0 COMMENT "المبلغ المدفوع" AFTER amount_due',
    'SELECT "Column amount_paid already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add payment_status if not exists
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'cafe_management'
AND TABLE_NAME = 'supplier_payments'
AND COLUMN_NAME = 'payment_status';

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE supplier_payments ADD COLUMN payment_status ENUM("unpaid", "partial", "paid") DEFAULT "unpaid" COMMENT "حالة الدفع" AFTER amount_paid',
    'SELECT "Column payment_status already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add due_date if not exists
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'cafe_management'
AND TABLE_NAME = 'supplier_payments'
AND COLUMN_NAME = 'due_date';

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE supplier_payments ADD COLUMN due_date DATE NULL COMMENT "تاريخ الاستحقاق" AFTER payment_status',
    'SELECT "Column due_date already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes if not exist
SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'cafe_management'
AND TABLE_NAME = 'supplier_payments'
AND INDEX_NAME = 'idx_payment_status';

SET @sql = IF(@index_exists = 0,
    'ALTER TABLE supplier_payments ADD INDEX idx_payment_status (payment_status)',
    'SELECT "Index idx_payment_status already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'cafe_management'
AND TABLE_NAME = 'supplier_payments'
AND INDEX_NAME = 'idx_due_date';

SET @sql = IF(@index_exists = 0,
    'ALTER TABLE supplier_payments ADD INDEX idx_due_date (due_date)',
    'SELECT "Index idx_due_date already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========================================
-- STEP 2: Fix inventory_purchases table
-- ========================================

-- warehouse_id already exists (skip)

-- ========================================
-- STEP 3: Fix material_batches table
-- ========================================

-- Add remaining_quantity if not exists
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'cafe_management'
AND TABLE_NAME = 'material_batches'
AND COLUMN_NAME = 'remaining_quantity';

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE material_batches ADD COLUMN remaining_quantity DECIMAL(10, 3) NULL COMMENT "الكمية المتبقية"',
    'SELECT "Column remaining_quantity already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add original_quantity if not exists
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'cafe_management'
AND TABLE_NAME = 'material_batches'
AND COLUMN_NAME = 'original_quantity';

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE material_batches ADD COLUMN original_quantity DECIMAL(10, 3) NULL COMMENT "الكمية الأصلية"',
    'SELECT "Column original_quantity already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Initialize remaining_quantity for existing batches
UPDATE material_batches
SET remaining_quantity = quantity,
    original_quantity = quantity
WHERE remaining_quantity IS NULL;

-- ========================================
-- STEP 4: Create Views
-- ========================================

CREATE OR REPLACE VIEW upcoming_payments AS
SELECT
    sp.*,
    s.name as supplier_name,
    ip.invoice_number,
    DATEDIFF(sp.due_date, CURDATE()) as days_until_due
FROM supplier_payments sp
LEFT JOIN suppliers s ON sp.supplier_id = s.id
LEFT JOIN inventory_purchases ip ON sp.purchase_id = ip.id
WHERE sp.payment_status IN ('unpaid', 'partial')
    AND sp.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
ORDER BY sp.due_date ASC;

CREATE OR REPLACE VIEW overdue_payments AS
SELECT
    sp.*,
    s.name as supplier_name,
    ip.invoice_number,
    DATEDIFF(CURDATE(), sp.due_date) as days_overdue
FROM supplier_payments sp
LEFT JOIN suppliers s ON sp.supplier_id = s.id
LEFT JOIN inventory_purchases ip ON sp.purchase_id = ip.id
WHERE sp.payment_status IN ('unpaid', 'partial')
    AND sp.due_date < CURDATE()
ORDER BY sp.due_date ASC;

CREATE OR REPLACE VIEW batch_stock_levels AS
SELECT
    mb.*,
    rm.name as material_name,
    rm.unit,
    w.name as warehouse_name,
    DATEDIFF(mb.expiry_date, CURDATE()) as days_until_expiry
FROM material_batches mb
JOIN raw_materials rm ON mb.raw_material_id = rm.id
JOIN warehouses w ON mb.warehouse_id = w.id
WHERE mb.remaining_quantity > 0
ORDER BY mb.expiry_date ASC;

CREATE OR REPLACE VIEW expiring_batches AS
SELECT
    mb.*,
    rm.name as material_name,
    rm.unit,
    w.name as warehouse_name,
    DATEDIFF(mb.expiry_date, CURDATE()) as days_until_expiry
FROM material_batches mb
JOIN raw_materials rm ON mb.raw_material_id = rm.id
JOIN warehouses w ON mb.warehouse_id = w.id
WHERE mb.remaining_quantity > 0
    AND mb.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
ORDER BY mb.expiry_date ASC;

CREATE OR REPLACE VIEW available_batches_fifo AS
SELECT
    mb.*,
    rm.name as material_name,
    rm.unit,
    w.name as warehouse_name,
    DATEDIFF(mb.expiry_date, CURDATE()) as days_until_expiry
FROM material_batches mb
JOIN raw_materials rm ON mb.raw_material_id = rm.id
JOIN warehouses w ON mb.warehouse_id = w.id
WHERE mb.remaining_quantity > 0
ORDER BY mb.production_date ASC, mb.id ASC;

CREATE OR REPLACE VIEW variance_summary AS
SELECT
    ic.id as count_id,
    ic.warehouse_id,
    w.name as warehouse_name,
    ic.count_date,
    ic.status,
    COUNT(ici.id) as items_counted,
    SUM(CASE WHEN ici.variance != 0 THEN 1 ELSE 0 END) as items_with_variance,
    SUM(ABS(ici.variance)) as total_variance_qty,
    SUM(ABS(ici.variance * rm.unit_cost)) as total_variance_value
FROM inventory_counts ic
LEFT JOIN inventory_count_items ici ON ic.id = ici.count_id
LEFT JOIN raw_materials rm ON ici.raw_material_id = rm.id
LEFT JOIN warehouses w ON ic.warehouse_id = w.id
GROUP BY ic.id
ORDER BY ic.count_date DESC;

CREATE OR REPLACE VIEW unresolved_alerts_summary AS
SELECT
    sa.alert_type,
    sa.severity,
    COUNT(*) as alert_count,
    MIN(sa.created_at) as oldest_alert,
    MAX(sa.created_at) as newest_alert
FROM system_alerts sa
WHERE sa.is_resolved = FALSE
GROUP BY sa.alert_type, sa.severity
ORDER BY sa.severity DESC, alert_count DESC;

-- Done!
SELECT '✅ Database schema fixed successfully!' as message;

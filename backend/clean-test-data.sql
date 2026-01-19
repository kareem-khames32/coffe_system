-- ═══════════════════════════════════════════════════════════
-- Clean Test Data - Keep Structure and Essential Data
-- ═══════════════════════════════════════════════════════════

USE cafe_management;

SET FOREIGN_KEY_CHECKS = 0;

-- Clean test orders and related data
TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;

-- Clean inventory test data
TRUNCATE TABLE product_recipes;
TRUNCATE TABLE supplier_payments;
TRUNCATE TABLE inventory_purchase_items;
TRUNCATE TABLE inventory_purchases;
TRUNCATE TABLE material_batches;
TRUNCATE TABLE stock_transfers;
TRUNCATE TABLE stock_transfer_items;
TRUNCATE TABLE inventory_transactions;
TRUNCATE TABLE batch_consumption;

-- Clean test suppliers and materials (keep structure)
DELETE FROM raw_materials WHERE id > 0;
DELETE FROM suppliers WHERE id > 0;

-- Reset auto increment
ALTER TABLE orders AUTO_INCREMENT = 1;
ALTER TABLE order_items AUTO_INCREMENT = 1;
ALTER TABLE suppliers AUTO_INCREMENT = 1;
ALTER TABLE raw_materials AUTO_INCREMENT = 1;
ALTER TABLE inventory_purchases AUTO_INCREMENT = 1;
ALTER TABLE supplier_payments AUTO_INCREMENT = 1;
ALTER TABLE product_recipes AUTO_INCREMENT = 1;
ALTER TABLE inventory_purchase_items AUTO_INCREMENT = 1;
ALTER TABLE material_batches AUTO_INCREMENT = 1;
ALTER TABLE stock_transfers AUTO_INCREMENT = 1;
ALTER TABLE inventory_transactions AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- ═══════════════════════════════════════════════════════════
-- ✅ Test data cleaned! Ready for fresh testing
-- ═══════════════════════════════════════════════════════════

SELECT
    'Database cleaned successfully!' AS status,
    (SELECT COUNT(*) FROM orders) AS orders_count,
    (SELECT COUNT(*) FROM suppliers) AS suppliers_count,
    (SELECT COUNT(*) FROM raw_materials) AS raw_materials_count,
    (SELECT COUNT(*) FROM inventory_purchases) AS purchases_count,
    (SELECT COUNT(*) FROM supplier_payments) AS payments_count,
    (SELECT COUNT(*) FROM product_recipes) AS recipes_count;

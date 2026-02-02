-- ════════════════════════════════════════════════════════════════
-- Clean Database for Fresh Testing
-- ════════════════════════════════════════════════════════════════
-- This will delete all test data but keep admin user and categories

USE cafe_management;

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Clean all transactional data
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM inventory_transactions;
DELETE FROM product_recipes;
DELETE FROM inventory_purchase_items;
DELETE FROM inventory_purchases;
DELETE FROM supplier_payments;
DELETE FROM material_batches;
DELETE FROM stock_transfer_items;
DELETE FROM stock_transfers;
DELETE FROM inventory_count_items;
DELETE FROM inventory_counts;
DELETE FROM system_alerts;

-- Clean master data (except categories)
DELETE FROM products;
DELETE FROM raw_materials;
DELETE FROM suppliers;
-- Keep warehouses with id=1 (main warehouse), delete others
DELETE FROM warehouses WHERE id > 1;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Verify clean state
SELECT 'Database cleaned! Ready for testing.' as message;
SELECT
    (SELECT COUNT(*) FROM suppliers) as suppliers_count,
    (SELECT COUNT(*) FROM warehouses) as warehouses_count,
    (SELECT COUNT(*) FROM raw_materials) as materials_count,
    (SELECT COUNT(*) FROM products) as products_count,
    (SELECT COUNT(*) FROM orders) as orders_count;

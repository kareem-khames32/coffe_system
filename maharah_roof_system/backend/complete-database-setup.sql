-- ════════════════════════════════════════════════════════════════
-- Complete Database Setup for Cafe Management System
-- ════════════════════════════════════════════════════════════════
-- This script sets up the entire database from scratch
-- Run this in phpMyAdmin or MySQL command line

-- ════════════════════════════════════════════════════════════════
-- STEP 1: Create Database
-- ════════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS cafe_management
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE cafe_management;

-- ════════════════════════════════════════════════════════════════
-- STEP 2: Core System Tables
-- ════════════════════════════════════════════════════════════════

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'cashier', 'waiter') DEFAULT 'cashier',
    can_make_sales TINYINT(1) DEFAULT 1,
    can_view_inventory TINYINT(1) DEFAULT 0,
    can_edit_inventory TINYINT(1) DEFAULT 0,
    can_view_order_details TINYINT(1) DEFAULT 1,
    can_cancel_orders TINYINT(1) DEFAULT 0,
    can_edit_orders TINYINT(1) DEFAULT 0,
    can_view_reports TINYINT(1) DEFAULT 0,
    can_add_expenses TINYINT(1) DEFAULT 0,
    can_manage_offers TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    cost_price DECIMAL(10, 2) DEFAULT 0,
    description TEXT NULL,
    image VARCHAR(255) NULL,
    is_available TINYINT(1) DEFAULT 1,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    INDEX idx_name (name),
    INDEX idx_category (category_id),
    INDEX idx_available (is_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    order_type ENUM('dine-in', 'takeaway', 'delivery') DEFAULT 'dine-in',
    table_number VARCHAR(20) NULL,
    customer_name VARCHAR(255) NULL,
    customer_phone VARCHAR(20) NULL,
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('cash', 'card', 'mixed') DEFAULT 'cash',
    payment_status ENUM('pending', 'paid', 'partial') DEFAULT 'pending',
    order_status ENUM('pending', 'preparing', 'ready', 'served', 'completed', 'cancelled') DEFAULT 'pending',
    notes TEXT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_order_number (order_number),
    INDEX idx_status (order_status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_order (order_id),
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ════════════════════════════════════════════════════════════════
-- STEP 3: Inventory Management Tables
-- ════════════════════════════════════════════════════════════════

-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(255) NULL,
    address TEXT NULL,
    notes TEXT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name(100)),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Warehouses Table
CREATE TABLE IF NOT EXISTS warehouses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NULL,
    description TEXT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name(100)),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Raw Materials Table
CREATE TABLE IF NOT EXISTS raw_materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    unit VARCHAR(50) NOT NULL,
    current_stock DECIMAL(10, 3) DEFAULT 0,
    min_stock DECIMAL(10, 3) DEFAULT 0,
    unit_cost DECIMAL(10, 2) DEFAULT 0,
    supplier_id INT NULL,
    warehouse_id INT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL,
    INDEX idx_name (name(100)),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory Purchases Table
CREATE TABLE IF NOT EXISTS inventory_purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT NOT NULL,
    warehouse_id INT NULL,
    purchase_date DATE NOT NULL,
    invoice_number VARCHAR(100) NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_terms ENUM('cash', 'credit_7', 'credit_15', 'credit_30', 'credit_60') DEFAULT 'cash',
    due_date DATE NULL,
    payment_status ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid',
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    notes TEXT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_supplier (supplier_id),
    INDEX idx_warehouse (warehouse_id),
    INDEX idx_purchase_date (purchase_date),
    INDEX idx_payment_status (payment_status),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory Purchase Items Table
CREATE TABLE IF NOT EXISTS inventory_purchase_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id INT NOT NULL,
    raw_material_id INT NOT NULL,
    quantity DECIMAL(10, 3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    unit_cost DECIMAL(10, 2) NOT NULL,
    total_cost DECIMAL(10, 2) NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_id) REFERENCES inventory_purchases(id) ON DELETE CASCADE,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE RESTRICT,
    INDEX idx_purchase (purchase_id),
    INDEX idx_material (raw_material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product Recipes Table
CREATE TABLE IF NOT EXISTS product_recipes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    raw_material_id INT NOT NULL,
    quantity_needed DECIMAL(10, 3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE RESTRICT,
    INDEX idx_product (product_id),
    INDEX idx_material (raw_material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory Transactions Table
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    raw_material_id INT NOT NULL,
    transaction_type ENUM('purchase', 'sale', 'adjustment', 'transfer', 'waste') NOT NULL,
    quantity DECIMAL(10, 3) NOT NULL,
    reference_type VARCHAR(50) NULL,
    reference_id INT NULL,
    notes TEXT NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_material (raw_material_id),
    INDEX idx_type (transaction_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ════════════════════════════════════════════════════════════════
-- STEP 4: Phase 1 Tables (Advanced Inventory Features)
-- ════════════════════════════════════════════════════════════════

-- Supplier Payments Table
CREATE TABLE IF NOT EXISTS supplier_payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    supplier_id INT NOT NULL,
    purchase_id INT NULL,
    amount_due DECIMAL(10, 2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0,
    payment_status ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid',
    due_date DATE NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method ENUM('cash', 'bank_transfer', 'check', 'credit') DEFAULT 'cash',
    reference_number VARCHAR(100) NULL,
    notes TEXT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (purchase_id) REFERENCES inventory_purchases(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_supplier (supplier_id),
    INDEX idx_purchase (purchase_id),
    INDEX idx_payment_date (payment_date),
    INDEX idx_payment_status (payment_status),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Material Batches Table
CREATE TABLE IF NOT EXISTS material_batches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    raw_material_id INT NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    quantity DECIMAL(10, 3) NOT NULL,
    remaining_quantity DECIMAL(10, 3) NULL,
    original_quantity DECIMAL(10, 3) NULL,
    unit VARCHAR(50) NOT NULL,
    production_date DATE NULL,
    expiry_date DATE NULL,
    purchase_id INT NULL,
    warehouse_id INT NULL,
    unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
    status ENUM('active', 'expired', 'disposed') DEFAULT 'active',
    disposed_date DATE NULL,
    disposed_by INT NULL,
    disposal_reason TEXT NULL,
    notes TEXT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE CASCADE,
    FOREIGN KEY (purchase_id) REFERENCES inventory_purchases(id) ON DELETE SET NULL,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (disposed_by) REFERENCES users(id),
    INDEX idx_material (raw_material_id),
    INDEX idx_batch_number (batch_number),
    INDEX idx_expiry_date (expiry_date),
    INDEX idx_status (status),
    INDEX idx_warehouse (warehouse_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stock Transfers Table
CREATE TABLE IF NOT EXISTS stock_transfers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transfer_number VARCHAR(50) NOT NULL UNIQUE,
    from_warehouse_id INT NOT NULL,
    to_warehouse_id INT NOT NULL,
    transfer_date DATE NOT NULL,
    status ENUM('pending', 'in_transit', 'completed', 'cancelled') DEFAULT 'pending',
    requested_by INT NOT NULL,
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    completed_by INT NULL,
    completed_at TIMESTAMP NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (from_warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT,
    FOREIGN KEY (to_warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT,
    FOREIGN KEY (requested_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (completed_by) REFERENCES users(id),
    INDEX idx_from_warehouse (from_warehouse_id),
    INDEX idx_to_warehouse (to_warehouse_id),
    INDEX idx_status (status),
    INDEX idx_transfer_date (transfer_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stock Transfer Items Table
CREATE TABLE IF NOT EXISTS stock_transfer_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transfer_id INT NOT NULL,
    raw_material_id INT NOT NULL,
    batch_id INT NULL,
    quantity DECIMAL(10, 3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transfer_id) REFERENCES stock_transfers(id) ON DELETE CASCADE,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE RESTRICT,
    FOREIGN KEY (batch_id) REFERENCES material_batches(id) ON DELETE SET NULL,
    INDEX idx_transfer (transfer_id),
    INDEX idx_material (raw_material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ════════════════════════════════════════════════════════════════
-- STEP 5: Phase 2 Tables (FIFO, Inventory Counts, Alerts)
-- ════════════════════════════════════════════════════════════════

-- Inventory Counts Table
CREATE TABLE IF NOT EXISTS inventory_counts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    warehouse_id INT NOT NULL,
    count_date DATE NOT NULL,
    status ENUM('draft', 'completed', 'cancelled') DEFAULT 'draft',
    notes TEXT NULL,
    created_by INT NOT NULL,
    completed_by INT NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (completed_by) REFERENCES users(id),
    INDEX idx_warehouse (warehouse_id),
    INDEX idx_count_date (count_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory Count Items Table
CREATE TABLE IF NOT EXISTS inventory_count_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    count_id INT NOT NULL,
    raw_material_id INT NOT NULL,
    system_quantity DECIMAL(10, 3) NOT NULL,
    actual_quantity DECIMAL(10, 3) NOT NULL,
    variance DECIMAL(10, 3) GENERATED ALWAYS AS (actual_quantity - system_quantity) STORED,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (count_id) REFERENCES inventory_counts(id) ON DELETE CASCADE,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE RESTRICT,
    INDEX idx_count (count_id),
    INDEX idx_material (raw_material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System Alerts Table
CREATE TABLE IF NOT EXISTS system_alerts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    alert_type ENUM('low_stock', 'expiring_batch', 'expired_batch', 'overdue_payment', 'variance') NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    reference_type VARCHAR(50) NULL,
    reference_id INT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by INT NULL,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resolved_by) REFERENCES users(id),
    INDEX idx_type (alert_type),
    INDEX idx_severity (severity),
    INDEX idx_resolved (is_resolved),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    expense_date DATE NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_expense_date (expense_date),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ════════════════════════════════════════════════════════════════
-- STEP 6: Create Views for Quick Access
-- ════════════════════════════════════════════════════════════════

-- Upcoming Payments View
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

-- Overdue Payments View
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

-- Batch Stock Levels View
CREATE OR REPLACE VIEW batch_stock_levels AS
SELECT
    mb.*,
    rm.name as material_name,
    w.name as warehouse_name,
    DATEDIFF(mb.expiry_date, CURDATE()) as days_until_expiry
FROM material_batches mb
JOIN raw_materials rm ON mb.raw_material_id = rm.id
JOIN warehouses w ON mb.warehouse_id = w.id
WHERE mb.remaining_quantity > 0
ORDER BY mb.expiry_date ASC;

-- Expiring Batches View
CREATE OR REPLACE VIEW expiring_batches AS
SELECT
    mb.*,
    rm.name as material_name,
    w.name as warehouse_name,
    DATEDIFF(mb.expiry_date, CURDATE()) as days_until_expiry
FROM material_batches mb
JOIN raw_materials rm ON mb.raw_material_id = rm.id
JOIN warehouses w ON mb.warehouse_id = w.id
WHERE mb.remaining_quantity > 0
    AND mb.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
ORDER BY mb.expiry_date ASC;

-- Available Batches FIFO View
CREATE OR REPLACE VIEW available_batches_fifo AS
SELECT
    mb.*,
    rm.name as material_name,
    w.name as warehouse_name,
    DATEDIFF(mb.expiry_date, CURDATE()) as days_until_expiry
FROM material_batches mb
JOIN raw_materials rm ON mb.raw_material_id = rm.id
JOIN warehouses w ON mb.warehouse_id = w.id
WHERE mb.remaining_quantity > 0
ORDER BY mb.production_date ASC, mb.id ASC;

-- Variance Summary View
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

-- Unresolved Alerts Summary View
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

-- Unpaid Purchases View
CREATE OR REPLACE VIEW unpaid_purchases AS
SELECT
    ip.id,
    ip.invoice_number,
    ip.purchase_date,
    ip.due_date,
    s.name AS supplier_name,
    s.phone AS supplier_phone,
    ip.total_amount,
    ip.paid_amount,
    (ip.total_amount - ip.paid_amount) AS remaining_amount,
    ip.payment_status,
    DATEDIFF(CURDATE(), ip.due_date) AS days_overdue
FROM inventory_purchases ip
JOIN suppliers s ON ip.supplier_id = s.id
WHERE ip.payment_status IN ('unpaid', 'partial')
ORDER BY ip.due_date ASC;

-- ════════════════════════════════════════════════════════════════
-- STEP 7: Insert Default Data
-- ════════════════════════════════════════════════════════════════

-- Insert Default Admin User (username: admin, password: 123456)
INSERT INTO users (username, password, full_name, role, can_make_sales, can_view_inventory, can_edit_inventory, can_view_order_details, can_cancel_orders, can_edit_orders, can_view_reports, can_add_expenses, can_manage_offers, is_active)
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'المدير العام', 'admin', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1)
ON DUPLICATE KEY UPDATE username=username;

-- Insert Default Warehouse
INSERT INTO warehouses (name, location, description, is_active)
VALUES ('المخزن الرئيسي', 'الفرع الرئيسي', 'المخزن الرئيسي للمقهى', 1)
ON DUPLICATE KEY UPDATE name=name;

-- Insert Default Category
INSERT INTO categories (name, description, is_active)
VALUES ('مشروبات', 'المشروبات الساخنة والباردة', 1)
ON DUPLICATE KEY UPDATE name=name;

-- ════════════════════════════════════════════════════════════════
-- DONE!
-- ════════════════════════════════════════════════════════════════

SELECT '✅ Database setup completed successfully!' as message,
       'You can now login with: admin / 123456' as info;

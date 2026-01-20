-- ================================================
-- Phase 1: Advanced Inventory Management Features
-- ================================================

-- 1. Supplier Payments System
-- جدول دفعات الموردين
CREATE TABLE IF NOT EXISTS supplier_payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    supplier_id INT NOT NULL COMMENT 'المورد',
    purchase_id INT NULL COMMENT 'رقم فاتورة الشراء (إن وجد)',
    amount DECIMAL(10, 2) NOT NULL COMMENT 'المبلغ المدفوع',
    payment_date DATE NOT NULL COMMENT 'تاريخ الدفع',
    payment_method ENUM('cash', 'bank_transfer', 'check', 'credit') DEFAULT 'cash' COMMENT 'طريقة الدفع',
    reference_number VARCHAR(100) NULL COMMENT 'رقم المرجع (رقم الشيك/التحويل)',
    notes TEXT NULL COMMENT 'ملاحظات',
    created_by INT NOT NULL COMMENT 'المستخدم الذي أضاف الدفعة',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (purchase_id) REFERENCES inventory_purchases(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_supplier (supplier_id),
    INDEX idx_purchase (purchase_id),
    INDEX idx_payment_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='دفعات الموردين';

-- 2. Material Batches for Expiry Tracking
-- جدول دفعات المواد الخام مع تواريخ الصلاحية
CREATE TABLE IF NOT EXISTS material_batches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    raw_material_id INT NOT NULL COMMENT 'المادة الخام',
    batch_number VARCHAR(100) NOT NULL COMMENT 'رقم الدفعة',
    quantity DECIMAL(10, 3) NOT NULL COMMENT 'الكمية',
    unit VARCHAR(50) NOT NULL COMMENT 'الوحدة',
    production_date DATE NULL COMMENT 'تاريخ الإنتاج',
    expiry_date DATE NULL COMMENT 'تاريخ الصلاحية',
    purchase_id INT NULL COMMENT 'فاتورة الشراء',
    warehouse_id INT NULL COMMENT 'المستودع',
    unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0 COMMENT 'تكلفة الوحدة',
    status ENUM('active', 'expired', 'disposed') DEFAULT 'active' COMMENT 'الحالة',
    disposed_date DATE NULL COMMENT 'تاريخ التخلص',
    disposed_by INT NULL COMMENT 'المستخدم الذي تخلص من الدفعة',
    disposal_reason TEXT NULL COMMENT 'سبب التخلص',
    notes TEXT NULL COMMENT 'ملاحظات',
    created_by INT NOT NULL COMMENT 'المستخدم',
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='دفعات المواد الخام';

-- 3. Stock Transfers Between Warehouses
-- جدول نقل المخزون بين المستودعات
CREATE TABLE IF NOT EXISTS stock_transfers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transfer_number VARCHAR(50) NOT NULL UNIQUE COMMENT 'رقم النقل',
    from_warehouse_id INT NOT NULL COMMENT 'من مستودع',
    to_warehouse_id INT NOT NULL COMMENT 'إلى مستودع',
    transfer_date DATE NOT NULL COMMENT 'تاريخ النقل',
    status ENUM('pending', 'in_transit', 'completed', 'cancelled') DEFAULT 'pending' COMMENT 'الحالة',
    requested_by INT NOT NULL COMMENT 'طلب بواسطة',
    approved_by INT NULL COMMENT 'تم الموافقة بواسطة',
    approved_at TIMESTAMP NULL COMMENT 'تاريخ الموافقة',
    completed_by INT NULL COMMENT 'تم الاستلام بواسطة',
    completed_at TIMESTAMP NULL COMMENT 'تاريخ الاستلام',
    notes TEXT NULL COMMENT 'ملاحظات',
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='نقل المخزون بين المستودعات';

-- Stock Transfer Items
-- عناصر نقل المخزون
CREATE TABLE IF NOT EXISTS stock_transfer_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transfer_id INT NOT NULL COMMENT 'رقم النقل',
    raw_material_id INT NOT NULL COMMENT 'المادة الخام',
    batch_id INT NULL COMMENT 'رقم الدفعة (إذا كان FIFO مفعل)',
    quantity DECIMAL(10, 3) NOT NULL COMMENT 'الكمية',
    unit VARCHAR(50) NOT NULL COMMENT 'الوحدة',
    notes TEXT NULL COMMENT 'ملاحظات',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transfer_id) REFERENCES stock_transfers(id) ON DELETE CASCADE,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE RESTRICT,
    FOREIGN KEY (batch_id) REFERENCES material_batches(id) ON DELETE SET NULL,
    INDEX idx_transfer (transfer_id),
    INDEX idx_material (raw_material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='عناصر نقل المخزون';

-- ================================================
-- Modify Existing Tables
-- ================================================

-- Add payment terms to inventory_purchases
-- إضافة شروط الدفع إلى جدول المشتريات
ALTER TABLE inventory_purchases
ADD COLUMN payment_terms ENUM('cash', 'credit_7', 'credit_15', 'credit_30', 'credit_60') DEFAULT 'cash' COMMENT 'شروط الدفع' AFTER total_amount,
ADD COLUMN due_date DATE NULL COMMENT 'تاريخ الاستحقاق' AFTER payment_terms,
ADD COLUMN payment_status ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid' COMMENT 'حالة الدفع' AFTER due_date,
ADD COLUMN paid_amount DECIMAL(10, 2) DEFAULT 0 COMMENT 'المبلغ المدفوع' AFTER payment_status,
ADD INDEX idx_payment_status (payment_status),
ADD INDEX idx_due_date (due_date);

-- ================================================
-- Views for Quick Access
-- ================================================

-- View: Unpaid Purchases
CREATE OR REPLACE VIEW unpaid_purchases AS
SELECT
    ip.id,
    ip.supplier_id,
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

-- View: Expiring Materials (next 30 days)
CREATE OR REPLACE VIEW expiring_materials AS
SELECT
    mb.id,
    mb.batch_number,
    rm.name AS material_name,
    mb.quantity,
    mb.unit,
    mb.expiry_date,
    DATEDIFF(mb.expiry_date, CURDATE()) AS days_until_expiry,
    w.name AS warehouse_name,
    mb.status
FROM material_batches mb
JOIN raw_materials rm ON mb.raw_material_id = rm.id
LEFT JOIN warehouses w ON mb.warehouse_id = w.id
WHERE mb.status = 'active'
  AND mb.expiry_date IS NOT NULL
  AND mb.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
ORDER BY mb.expiry_date ASC;

-- View: Pending Stock Transfers
CREATE OR REPLACE VIEW pending_transfers AS
SELECT
    st.id,
    st.transfer_number,
    st.transfer_date,
    wf.name AS from_warehouse,
    wt.name AS to_warehouse,
    st.status,
    u.full_name AS requested_by_name,
    COUNT(sti.id) AS items_count
FROM stock_transfers st
JOIN warehouses wf ON st.from_warehouse_id = wf.id
JOIN warehouses wt ON st.to_warehouse_id = wt.id
JOIN users u ON st.requested_by = u.id
LEFT JOIN stock_transfer_items sti ON st.id = sti.transfer_id
WHERE st.status IN ('pending', 'in_transit')
GROUP BY st.id
ORDER BY st.transfer_date DESC;

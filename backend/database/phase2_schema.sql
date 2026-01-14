-- ============================================
-- Phase 2: FIFO Tracking, Inventory Counts, and Alerts System
-- ============================================

-- ============================================
-- 1. FIFO Batch Consumption Tracking
-- ============================================

-- Track which batches were consumed in which production/sale
CREATE TABLE IF NOT EXISTS batch_consumption (
    id INT PRIMARY KEY AUTO_INCREMENT,
    batch_id INT NOT NULL,
    raw_material_id INT NOT NULL,
    warehouse_id INT NOT NULL,
    quantity_consumed DECIMAL(10, 3) NOT NULL,
    consumption_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    consumption_type ENUM('production', 'adjustment', 'sale', 'waste') DEFAULT 'production',
    reference_id INT NULL COMMENT 'ID of related production/order/adjustment',
    reference_type VARCHAR(50) NULL COMMENT 'Type: production, order, adjustment',
    consumed_by INT NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES material_batches(id) ON DELETE RESTRICT,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE RESTRICT,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT,
    FOREIGN KEY (consumed_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_batch_consumption_date (consumption_date),
    INDEX idx_batch_consumption_batch (batch_id),
    INDEX idx_batch_consumption_material (raw_material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update material_batches to track remaining quantity
ALTER TABLE material_batches
ADD COLUMN remaining_quantity DECIMAL(10, 3) NULL COMMENT 'Remaining quantity in batch',
ADD COLUMN original_quantity DECIMAL(10, 3) NULL COMMENT 'Original quantity when batch was created';

-- Initialize remaining_quantity for existing batches
UPDATE material_batches
SET remaining_quantity = quantity,
    original_quantity = quantity
WHERE remaining_quantity IS NULL;

-- ============================================
-- 2. Inventory Count System
-- ============================================

-- Physical inventory count sessions
CREATE TABLE IF NOT EXISTS inventory_counts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    count_number VARCHAR(50) NOT NULL UNIQUE,
    warehouse_id INT NOT NULL,
    count_date DATE NOT NULL,
    status ENUM('draft', 'in_progress', 'completed', 'cancelled') DEFAULT 'draft',
    counted_by INT NOT NULL,
    approved_by INT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT,
    FOREIGN KEY (counted_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_count_warehouse (warehouse_id),
    INDEX idx_count_date (count_date),
    INDEX idx_count_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Individual items in inventory count
CREATE TABLE IF NOT EXISTS inventory_count_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    count_id INT NOT NULL,
    raw_material_id INT NOT NULL,
    batch_id INT NULL COMMENT 'Optional: Count specific batch',
    system_quantity DECIMAL(10, 3) NOT NULL COMMENT 'Quantity in system',
    counted_quantity DECIMAL(10, 3) NOT NULL COMMENT 'Physical count quantity',
    variance DECIMAL(10, 3) GENERATED ALWAYS AS (counted_quantity - system_quantity) STORED,
    variance_percentage DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE
            WHEN system_quantity = 0 THEN 0
            ELSE ((counted_quantity - system_quantity) / system_quantity * 100)
        END
    ) STORED,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (count_id) REFERENCES inventory_counts(id) ON DELETE CASCADE,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE RESTRICT,
    FOREIGN KEY (batch_id) REFERENCES material_batches(id) ON DELETE SET NULL,
    INDEX idx_count_item_count (count_id),
    INDEX idx_count_item_material (raw_material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adjustments made based on inventory counts
CREATE TABLE IF NOT EXISTS inventory_adjustments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    adjustment_number VARCHAR(50) NOT NULL UNIQUE,
    count_id INT NULL COMMENT 'Related inventory count if applicable',
    warehouse_id INT NOT NULL,
    raw_material_id INT NOT NULL,
    batch_id INT NULL,
    adjustment_type ENUM('increase', 'decrease') NOT NULL,
    quantity DECIMAL(10, 3) NOT NULL,
    reason ENUM('count_variance', 'damage', 'theft', 'correction', 'other') NOT NULL,
    notes TEXT NULL,
    adjusted_by INT NOT NULL,
    approved_by INT NULL,
    adjustment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (count_id) REFERENCES inventory_counts(id) ON DELETE SET NULL,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE RESTRICT,
    FOREIGN KEY (batch_id) REFERENCES material_batches(id) ON DELETE SET NULL,
    FOREIGN KEY (adjusted_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_adjustment_warehouse (warehouse_id),
    INDEX idx_adjustment_date (adjustment_date),
    INDEX idx_adjustment_material (raw_material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. Alerts System
-- ============================================

-- System alerts and notifications
CREATE TABLE IF NOT EXISTS system_alerts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    alert_type ENUM('low_stock', 'expiry_warning', 'overdue_payment', 'transfer_pending', 'count_variance', 'custom') NOT NULL,
    severity ENUM('info', 'warning', 'critical') DEFAULT 'warning',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    reference_type VARCHAR(50) NULL COMMENT 'Type: material, batch, payment, transfer, count',
    reference_id INT NULL COMMENT 'ID of related record',
    warehouse_id INT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by INT NULL,
    resolved_at TIMESTAMP NULL,
    resolved_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_alert_type (alert_type),
    INDEX idx_alert_severity (severity),
    INDEX idx_alert_read (is_read),
    INDEX idx_alert_resolved (is_resolved),
    INDEX idx_alert_created (created_at),
    INDEX idx_alert_warehouse (warehouse_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Alert thresholds configuration
CREATE TABLE IF NOT EXISTS alert_thresholds (
    id INT PRIMARY KEY AUTO_INCREMENT,
    raw_material_id INT NOT NULL UNIQUE,
    warehouse_id INT NULL,
    low_stock_threshold DECIMAL(10, 3) NOT NULL DEFAULT 10,
    critical_stock_threshold DECIMAL(10, 3) NOT NULL DEFAULT 5,
    expiry_warning_days INT DEFAULT 30,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Views for Quick Access
-- ============================================

-- View: Available batches with FIFO order (oldest first)
CREATE OR REPLACE VIEW available_batches_fifo AS
SELECT
    mb.id,
    mb.raw_material_id,
    rm.name AS material_name,
    rm.warehouse_id,
    w.name AS warehouse_name,
    mb.batch_number,
    mb.remaining_quantity,
    mb.original_quantity,
    mb.unit,
    mb.production_date,
    mb.expiry_date,
    DATEDIFF(mb.expiry_date, CURDATE()) AS days_until_expiry,
    mb.created_at
FROM material_batches mb
JOIN raw_materials rm ON mb.raw_material_id = rm.id
JOIN warehouses w ON rm.warehouse_id = w.id
WHERE mb.status = 'active'
  AND mb.remaining_quantity > 0
ORDER BY rm.id, mb.production_date ASC, mb.created_at ASC;

-- View: Low stock materials
CREATE OR REPLACE VIEW low_stock_materials AS
SELECT
    rm.id AS material_id,
    rm.name AS material_name,
    rm.current_stock,
    rm.unit,
    rm.warehouse_id,
    w.name AS warehouse_name,
    COALESCE(at.low_stock_threshold, 10) AS low_threshold,
    COALESCE(at.critical_stock_threshold, 5) AS critical_threshold,
    CASE
        WHEN rm.current_stock <= COALESCE(at.critical_stock_threshold, 5) THEN 'critical'
        WHEN rm.current_stock <= COALESCE(at.low_stock_threshold, 10) THEN 'warning'
        ELSE 'normal'
    END AS stock_status
FROM raw_materials rm
JOIN warehouses w ON rm.warehouse_id = w.id
LEFT JOIN alert_thresholds at ON rm.id = at.raw_material_id
WHERE rm.current_stock <= COALESCE(at.low_stock_threshold, 10);

-- View: Inventory count variances
CREATE OR REPLACE VIEW count_variances AS
SELECT
    ic.id AS count_id,
    ic.count_number,
    ic.warehouse_id,
    w.name AS warehouse_name,
    ic.count_date,
    ici.id AS item_id,
    ici.raw_material_id,
    rm.name AS material_name,
    ici.system_quantity,
    ici.counted_quantity,
    ici.variance,
    ici.variance_percentage,
    CASE
        WHEN ABS(ici.variance_percentage) > 10 THEN 'high'
        WHEN ABS(ici.variance_percentage) > 5 THEN 'medium'
        ELSE 'low'
    END AS variance_level
FROM inventory_counts ic
JOIN warehouses w ON ic.warehouse_id = w.id
JOIN inventory_count_items ici ON ic.id = ici.count_id
JOIN raw_materials rm ON ici.raw_material_id = rm.id
WHERE ic.status = 'completed'
  AND ici.variance != 0;

-- View: Unresolved alerts summary
CREATE OR REPLACE VIEW unresolved_alerts_summary AS
SELECT
    sa.alert_type,
    sa.severity,
    sa.warehouse_id,
    w.name AS warehouse_name,
    COUNT(*) AS alert_count,
    MIN(sa.created_at) AS oldest_alert,
    MAX(sa.created_at) AS newest_alert
FROM system_alerts sa
LEFT JOIN warehouses w ON sa.warehouse_id = w.id
WHERE sa.is_resolved = FALSE
GROUP BY sa.alert_type, sa.severity, sa.warehouse_id, w.name;

-- View: Batch consumption history
CREATE OR REPLACE VIEW batch_consumption_history AS
SELECT
    bc.id,
    bc.batch_id,
    mb.batch_number,
    bc.raw_material_id,
    rm.name AS material_name,
    bc.warehouse_id,
    w.name AS warehouse_name,
    bc.quantity_consumed,
    bc.consumption_type,
    bc.consumption_date,
    bc.consumed_by,
    u.full_name AS consumed_by_name,
    bc.notes
FROM batch_consumption bc
JOIN material_batches mb ON bc.batch_id = mb.id
JOIN raw_materials rm ON bc.raw_material_id = rm.id
JOIN warehouses w ON bc.warehouse_id = w.id
JOIN users u ON bc.consumed_by = u.id
ORDER BY bc.consumption_date DESC;

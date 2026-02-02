-- ═══════════════════════════════════════════════════════════════════
-- ║  Warehouses Table (المستودعات)                                 ║
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS warehouses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT 'اسم المستودع',
    location VARCHAR(255) NULL COMMENT 'الموقع/الفرع',
    description TEXT NULL COMMENT 'وصف المستودع',
    is_active TINYINT(1) DEFAULT 1 COMMENT 'نشط/غير نشط',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name(100)),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول المستودعات';

-- Add warehouse_id to raw_materials table
ALTER TABLE raw_materials
ADD COLUMN warehouse_id INT NULL COMMENT 'المستودع' AFTER supplier_id,
ADD FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL,
ADD INDEX idx_warehouse (warehouse_id);

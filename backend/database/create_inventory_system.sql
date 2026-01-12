-- ═══════════════════════════════════════════════════════════════════
-- ║  Inventory Management & Recipe Costing System                 ║
-- ═══════════════════════════════════════════════════════════════════

-- 1. Suppliers Table (الموردين)
CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT 'اسم المورد',
    contact_person VARCHAR(255) NULL COMMENT 'اسم الشخص المسؤول',
    phone VARCHAR(20) NULL COMMENT 'رقم الهاتف',
    email VARCHAR(255) NULL COMMENT 'البريد الإلكتروني',
    address TEXT NULL COMMENT 'العنوان',
    notes TEXT NULL COMMENT 'ملاحظات',
    is_active TINYINT(1) DEFAULT 1 COMMENT 'نشط/غير نشط',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name(100)),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول الموردين';

-- 2. Warehouses Table (المستودعات)
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

-- 3. Raw Materials Table (المواد الخام/المكونات)
CREATE TABLE IF NOT EXISTS raw_materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT 'اسم المادة الخام',
    description TEXT NULL COMMENT 'الوصف',
    unit VARCHAR(50) NOT NULL COMMENT 'وحدة القياس (كيلو، جرام، لتر، مل، قطعة، إلخ)',
    current_stock DECIMAL(10, 3) DEFAULT 0 COMMENT 'الكمية الحالية في المخزون',
    min_stock DECIMAL(10, 3) DEFAULT 0 COMMENT 'الحد الأدنى للمخزون (تحذير)',
    unit_cost DECIMAL(10, 2) DEFAULT 0 COMMENT 'تكلفة الوحدة الواحدة',
    supplier_id INT NULL COMMENT 'المورد الأساسي',
    warehouse_id INT NULL COMMENT 'المستودع',
    is_active TINYINT(1) DEFAULT 1 COMMENT 'نشط/غير نشط',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL,
    INDEX idx_name (name(100)),
    INDEX idx_active (is_active),
    INDEX idx_warehouse (warehouse_id),
    INDEX idx_low_stock (current_stock, min_stock)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول المواد الخام';

-- 4. Inventory Purchases Table (مشتريات المخزن)
CREATE TABLE IF NOT EXISTS inventory_purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT NULL COMMENT 'المورد',
    purchase_date DATE NOT NULL COMMENT 'تاريخ الشراء',
    invoice_number VARCHAR(100) NULL COMMENT 'رقم الفاتورة',
    total_amount DECIMAL(10, 2) DEFAULT 0 COMMENT 'المبلغ الإجمالي',
    notes TEXT NULL COMMENT 'ملاحظات',
    created_by INT NULL COMMENT 'المستخدم الذي أضاف المشتريات',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_purchase_date (purchase_date),
    INDEX idx_supplier (supplier_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول مشتريات المخزن';

-- 5. Inventory Purchase Items Table (تفاصيل المشتريات)
CREATE TABLE IF NOT EXISTS inventory_purchase_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id INT NOT NULL COMMENT 'رقم المشتريات',
    raw_material_id INT NOT NULL COMMENT 'المادة الخام',
    quantity DECIMAL(10, 3) NOT NULL COMMENT 'الكمية المشتراة',
    unit_price DECIMAL(10, 2) NOT NULL COMMENT 'سعر الوحدة',
    total_price DECIMAL(10, 2) NOT NULL COMMENT 'المبلغ الإجمالي',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_id) REFERENCES inventory_purchases(id) ON DELETE CASCADE,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE CASCADE,
    INDEX idx_purchase (purchase_id),
    INDEX idx_material (raw_material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول تفاصيل المشتريات';

-- 6. Product Recipes Table (وصفات المنتجات)
CREATE TABLE IF NOT EXISTS product_recipes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL COMMENT 'المنتج',
    raw_material_id INT NOT NULL COMMENT 'المادة الخام المستخدمة',
    quantity_needed DECIMAL(10, 3) NOT NULL COMMENT 'الكمية المطلوبة لوحدة واحدة من المنتج',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE CASCADE,
    UNIQUE KEY unique_product_material (product_id, raw_material_id),
    INDEX idx_product (product_id),
    INDEX idx_material (raw_material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول وصفات المنتجات';

-- 7. Inventory Transactions Table (سجل حركة المخزن)
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    raw_material_id INT NOT NULL COMMENT 'المادة الخام',
    transaction_type ENUM('purchase', 'sale', 'adjustment', 'return') NOT NULL COMMENT 'نوع الحركة',
    quantity DECIMAL(10, 3) NOT NULL COMMENT 'الكمية (موجب للإضافة، سالب للخصم)',
    unit_cost DECIMAL(10, 2) NULL COMMENT 'تكلفة الوحدة',
    reference_type ENUM('order', 'purchase', 'manual', 'adjustment') NULL COMMENT 'نوع المرجع',
    reference_id INT NULL COMMENT 'رقم المرجع (Order ID, Purchase ID, etc.)',
    notes TEXT NULL COMMENT 'ملاحظات',
    created_by INT NULL COMMENT 'المستخدم',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_material (raw_material_id),
    INDEX idx_type (transaction_type),
    INDEX idx_date (created_at),
    INDEX idx_reference (reference_type, reference_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول سجل حركة المخزن';

-- ═══════════════════════════════════════════════════════════════════
-- Note: Triggers will be created separately after table creation
-- ═══════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════
-- Success Message
-- ═══════════════════════════════════════════════════════════════════

SELECT '✅ Inventory Management System tables created successfully!' AS Status;

-- التحقق من وجود جدول المشتريات وإنشائه إذا لم يكن موجوداً

-- إنشاء جدول المشتريات إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_name VARCHAR(255) NOT NULL COMMENT 'اسم المورد',
    item_description TEXT NOT NULL COMMENT 'وصف الصنف',
    quantity DECIMAL(10, 2) NOT NULL COMMENT 'الكمية',
    unit_price DECIMAL(10, 2) NOT NULL COMMENT 'سعر الوحدة',
    total_amount DECIMAL(10, 2) NOT NULL COMMENT 'المبلغ الإجمالي',
    purchase_date DATE NOT NULL COMMENT 'تاريخ الشراء',
    notes TEXT COMMENT 'ملاحظات',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_purchase_date (purchase_date),
    INDEX idx_supplier (supplier_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- عرض هيكل الجدول للتأكد
DESC purchases;

-- عرض عدد السجلات في الجدول
SELECT COUNT(*) as total_purchases FROM purchases;

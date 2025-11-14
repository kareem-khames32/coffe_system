-- ═══════════════════════════════════════════════════════════
-- إعداد جدول المشتريات (Purchases Table Setup)
-- ═══════════════════════════════════════════════════════════

-- حذف الجدول القديم إذا كان موجوداً (احذف هذا السطر إذا كنت لا تريد حذف البيانات)
-- DROP TABLE IF EXISTS purchases;

-- إنشاء جدول المشتريات
CREATE TABLE IF NOT EXISTS purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_name VARCHAR(255) NOT NULL COMMENT 'اسم المورد',
    item_description TEXT NOT NULL COMMENT 'وصف الصنف',
    quantity DECIMAL(10, 2) NOT NULL COMMENT 'الكمية',
    unit_price DECIMAL(10, 2) NOT NULL COMMENT 'سعر الوحدة',
    total_amount DECIMAL(10, 2) NOT NULL COMMENT 'المبلغ الإجمالي',
    purchase_date DATE NOT NULL COMMENT 'تاريخ الشراء',
    notes TEXT NULL COMMENT 'ملاحظات',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_purchase_date (purchase_date),
    INDEX idx_supplier (supplier_name(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول المشتريات';

-- التحقق من الجدول
DESC purchases;

-- عرض عدد السجلات
SELECT COUNT(*) as total_records FROM purchases;

-- عرض أول 5 سجلات (إذا كانت موجودة)
SELECT * FROM purchases ORDER BY created_at DESC LIMIT 5;

-- ═══════════════════════════════════════════════════════════
-- ملاحظات:
-- 1. إذا كان الجدول موجود بأسماء أعمدة مختلفة، قم بحذفه أولاً
-- 2. تأكد من تشغيل هذا السكريبت في phpMyAdmin
-- 3. اختر قاعدة البيانات الصحيحة (coffee_shop) قبل التشغيل
-- ═══════════════════════════════════════════════════════════

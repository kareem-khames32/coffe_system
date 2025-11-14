-- ═══════════════════════════════════════════════════════════
-- جدول الخصومات اليومية
-- ═══════════════════════════════════════════════════════════

DROP TABLE IF EXISTS daily_discounts;

CREATE TABLE daily_discounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT 'اسم الخصم',
    description TEXT NULL COMMENT 'وصف الخصم',
    discount_type ENUM('percentage', 'fixed') DEFAULT 'percentage' COMMENT 'نوع الخصم',
    discount_value DECIMAL(10, 2) NOT NULL COMMENT 'قيمة الخصم',
    target_date DATE NOT NULL COMMENT 'تاريخ الخصم',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'نشط أو لا',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_target_date (target_date),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول الخصومات اليومية';

-- إضافة بيانات تجريبية
INSERT INTO daily_discounts (name, description, discount_type, discount_value, target_date, is_active) VALUES
('خصم العطلة الأسبوعية', 'خصم 15% على جميع الطلبات يوم الجمعة', 'percentage', 15.00, '2025-11-21', 1),
('خصم اليوم الوطني', 'خصم 20% على جميع الطلبات في اليوم الوطني', 'percentage', 20.00, '2025-11-23', 1);

-- التحقق
SELECT * FROM daily_discounts;

-- ═══════════════════════════════════════════════════════════
-- ملاحظات:
-- 1. يمكن إضافة خصومات متعددة لنفس اليوم
-- 2. الخصومات يمكن أن تكون نسبة مئوية أو قيمة ثابتة
-- 3. يمكن تفعيل/تعطيل الخصومات بسهولة
-- ═══════════════════════════════════════════════════════════

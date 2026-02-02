-- ═══════════════════════════════════════════════════════════
-- إعداد جدول المصروفات (Expenses Table Setup)
-- ═══════════════════════════════════════════════════════════

-- حذف الجدول القديم إذا كان موجوداً (احذف هذا السطر إذا كنت لا تريد حذف البيانات)
-- DROP TABLE IF EXISTS expenses;

-- إنشاء جدول المصروفات
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(100) NOT NULL COMMENT 'فئة المصروف',
    description TEXT NOT NULL COMMENT 'وصف المصروف',
    amount DECIMAL(10, 2) NOT NULL COMMENT 'المبلغ',
    expense_date DATE NOT NULL COMMENT 'تاريخ المصروف',
    notes TEXT NULL COMMENT 'ملاحظات',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_expense_date (expense_date),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول المصروفات';

-- التحقق من الجدول
DESC expenses;

-- عرض عدد السجلات
SELECT COUNT(*) as total_records FROM expenses;

-- عرض أول 5 سجلات (إذا كانت موجودة)
SELECT * FROM expenses ORDER BY created_at DESC LIMIT 5;

-- ═══════════════════════════════════════════════════════════
-- ملاحظات:
-- 1. إذا كان الجدول موجود بأسماء أعمدة مختلفة، قم بحذفه أولاً
-- 2. تأكد من تشغيل هذا السكريبت في phpMyAdmin
-- 3. اختر قاعدة البيانات الصحيحة (coffee_shop) قبل التشغيل
-- ═══════════════════════════════════════════════════════════

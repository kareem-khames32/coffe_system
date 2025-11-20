USE cafe_management;

-- إنشاء جدول الإعدادات
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- إضافة الإعدادات الافتراضية
INSERT INTO settings (setting_key, setting_value, description) VALUES
('cafe_name', 'مقهى الأحلام', 'اسم المقهى'),
('cafe_address', 'القاهرة، مصر', 'عنوان المقهى'),
('cafe_phone', '01234567890', 'رقم هاتف المقهى')
ON DUPLICATE KEY UPDATE setting_value = setting_value;

SELECT 'Settings table created successfully!' as status;

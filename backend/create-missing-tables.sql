-- ═══════════════════════════════════════════════════════════
-- Create Missing Tables for Cafe Management System
-- ═══════════════════════════════════════════════════════════

USE cafe_management;

-- 1. Offers Table
CREATE TABLE IF NOT EXISTS offers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    offer_type ENUM('percentage', 'fixed', 'buy_x_get_y') DEFAULT 'percentage',
    discount_value DECIMAL(10, 2),
    buy_quantity INT,
    get_quantity INT,
    image VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dates (start_date, end_date),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Settings Table
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Daily Discounts Table
CREATE TABLE IF NOT EXISTS daily_discounts (
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

-- Insert default settings
INSERT INTO settings (setting_key, setting_value) VALUES
('cafe_name', 'Cafe Management System'),
('cafe_phone', ''),
('cafe_address', ''),
('logo_path', NULL)
ON DUPLICATE KEY UPDATE setting_key = setting_key;

-- ═══════════════════════════════════════════════════════════
-- Done! Missing tables created successfully
-- ═══════════════════════════════════════════════════════════

-- Create settings table for system configuration
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `setting_key` VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES
('logo_path', NULL),
('cafe_name', 'مقهى الأحلام'),
('cafe_phone', ''),
('cafe_address', '')
ON DUPLICATE KEY UPDATE setting_key = setting_key;

-- Check if purchases table exists with old structure and update it
-- Drop the old table if it exists (CAREFUL - this will delete data!)
-- Comment this out if you want to preserve data
-- DROP TABLE IF EXISTS purchases;

-- Recreate purchases table with correct structure
CREATE TABLE IF NOT EXISTS purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_name VARCHAR(255) NOT NULL,
    item_description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    purchase_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_purchase_date (purchase_date),
    INDEX idx_supplier (supplier_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- If table already exists with different columns, use ALTER TABLE instead:
-- ALTER TABLE purchases
-- ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(255),
-- ADD COLUMN IF NOT EXISTS item_description TEXT,
-- ADD COLUMN IF NOT EXISTS quantity DECIMAL(10, 2),
-- ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10, 2),
-- ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2);

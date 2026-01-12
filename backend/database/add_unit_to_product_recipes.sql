-- ═══════════════════════════════════════════════════════════════════
-- Add unit column to product_recipes table
-- ═══════════════════════════════════════════════════════════════════

-- Check if column exists before adding it
SET @dbname = DATABASE();
SET @tablename = 'product_recipes';
SET @columnname = 'unit';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT "⏭️  unit column already exists" AS Status',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(50) NULL COMMENT \'وحدة القياس المستخدمة في الوصفة\' AFTER quantity_needed')
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SELECT '✅ Migration completed: unit column added to product_recipes table' AS Status;

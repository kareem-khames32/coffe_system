-- Add warehouse_id column to existing raw_materials table
-- This is a migration script for existing databases

-- Check if column exists before adding it
SET @dbname = DATABASE();
SET @tablename = 'raw_materials';
SET @columnname = 'warehouse_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' INT NULL COMMENT \'المستودع\' AFTER supplier_id')
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add foreign key if it doesn't exist
SET @fk_name = 'fk_raw_materials_warehouse';
SET @preparedStatement2 = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND CONSTRAINT_NAME = @fk_name
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD CONSTRAINT ', @fk_name, ' FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL')
));

PREPARE addFKIfNotExists FROM @preparedStatement2;
EXECUTE addFKIfNotExists;
DEALLOCATE PREPARE addFKIfNotExists;

-- Add index if it doesn't exist
SET @idx_name = 'idx_warehouse';
SET @preparedStatement3 = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND INDEX_NAME = @idx_name
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD INDEX ', @idx_name, ' (warehouse_id)')
));

PREPARE addIdxIfNotExists FROM @preparedStatement3;
EXECUTE addIdxIfNotExists;
DEALLOCATE PREPARE addIdxIfNotExists;

SELECT '✅ Migration completed: warehouse_id added to raw_materials table' AS Status;

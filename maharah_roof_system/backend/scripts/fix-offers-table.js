const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixOffersTable() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   Fix Offers Table Column Names        ║');
  console.log('╚════════════════════════════════════════╝\n');

  let connection;

  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'cafe_management',
      port: process.env.DB_PORT || 3306,
      multipleStatements: true
    });
    console.log('✅ Connected!\n');

    console.log('🔧 Step 1: Adding missing columns to offers table...\n');

    // Add description column
    try {
      await connection.query('ALTER TABLE offers ADD COLUMN description TEXT AFTER name');
      console.log('✅ Added description column');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  description column already exists');
      } else {
        console.log('⚠️  Could not add description:', e.message);
      }
    }

    // Add image column
    try {
      await connection.query('ALTER TABLE offers ADD COLUMN image VARCHAR(255) AFTER free_quantity');
      console.log('✅ Added image column');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  image column already exists');
      } else {
        console.log('⚠️  Could not add image:', e.message);
      }
    }

    // Add offer_type (alias for type)
    try {
      await connection.query('ALTER TABLE offers ADD COLUMN offer_type ENUM(\'percentage\', \'fixed\', \'buy_x_get_y\') AFTER description');
      console.log('✅ Added offer_type column');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  offer_type column already exists');
      } else {
        console.log('⚠️  Could not add offer_type:', e.message);
      }
    }

    // Add discount_value (alias for value)
    try {
      await connection.query('ALTER TABLE offers ADD COLUMN discount_value DECIMAL(10,2) DEFAULT 0 AFTER offer_type');
      console.log('✅ Added discount_value column');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  discount_value column already exists');
      } else {
        console.log('⚠️  Could not add discount_value:', e.message);
      }
    }

    // Add buy_quantity (alias for min_quantity)
    try {
      await connection.query('ALTER TABLE offers ADD COLUMN buy_quantity INT DEFAULT 0 AFTER discount_value');
      console.log('✅ Added buy_quantity column');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  buy_quantity column already exists');
      } else {
        console.log('⚠️  Could not add buy_quantity:', e.message);
      }
    }

    // Add get_quantity (alias for free_quantity)
    try {
      await connection.query('ALTER TABLE offers ADD COLUMN get_quantity INT DEFAULT 0 AFTER buy_quantity');
      console.log('✅ Added get_quantity column');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  get_quantity column already exists');
      } else {
        console.log('⚠️  Could not add get_quantity:', e.message);
      }
    }

    console.log('\n🔧 Step 2: Making original columns nullable with defaults...');

    await connection.query('ALTER TABLE offers MODIFY COLUMN type ENUM(\'percentage\', \'fixed\', \'buy_x_get_y\') DEFAULT \'percentage\'');
    console.log('✅ type column now has default');

    await connection.query('ALTER TABLE offers MODIFY COLUMN value DECIMAL(10,2) DEFAULT 0');
    console.log('✅ value column now has default');

    console.log('\n🔧 Step 3: Creating triggers to sync columns...\n');

    // Drop existing triggers if they exist
    try {
      await connection.query('DROP TRIGGER IF EXISTS offers_before_insert');
      await connection.query('DROP TRIGGER IF EXISTS offers_before_update');
      console.log('✅ Dropped old triggers\n');
    } catch (e) {
      console.log('⚠️  No old triggers to drop\n');
    }

    // Create INSERT trigger for offers
    await connection.query(`
      CREATE TRIGGER offers_before_insert
      BEFORE INSERT ON offers
      FOR EACH ROW
      BEGIN
        -- Sync offer_type with type
        IF NEW.offer_type IS NOT NULL THEN
          SET NEW.type = NEW.offer_type;
        ELSEIF NEW.type IS NOT NULL THEN
          SET NEW.offer_type = NEW.type;
        END IF;

        -- Sync discount_value with value
        IF NEW.discount_value IS NOT NULL THEN
          SET NEW.value = NEW.discount_value;
        ELSEIF NEW.value IS NOT NULL THEN
          SET NEW.discount_value = NEW.value;
        END IF;

        -- Sync buy_quantity with min_quantity
        IF NEW.buy_quantity IS NOT NULL THEN
          SET NEW.min_quantity = NEW.buy_quantity;
        ELSEIF NEW.min_quantity IS NOT NULL THEN
          SET NEW.buy_quantity = NEW.min_quantity;
        END IF;

        -- Sync get_quantity with free_quantity
        IF NEW.get_quantity IS NOT NULL THEN
          SET NEW.free_quantity = NEW.get_quantity;
        ELSEIF NEW.free_quantity IS NOT NULL THEN
          SET NEW.get_quantity = NEW.free_quantity;
        END IF;
      END
    `);
    console.log('✅ Created offers_before_insert trigger');

    // Create UPDATE trigger for offers
    await connection.query(`
      CREATE TRIGGER offers_before_update
      BEFORE UPDATE ON offers
      FOR EACH ROW
      BEGIN
        -- Sync offer_type with type
        IF NEW.offer_type IS NOT NULL THEN
          SET NEW.type = NEW.offer_type;
        ELSEIF NEW.type IS NOT NULL THEN
          SET NEW.offer_type = NEW.type;
        END IF;

        -- Sync discount_value with value
        IF NEW.discount_value IS NOT NULL THEN
          SET NEW.value = NEW.discount_value;
        ELSEIF NEW.value IS NOT NULL THEN
          SET NEW.discount_value = NEW.value;
        END IF;

        -- Sync buy_quantity with min_quantity
        IF NEW.buy_quantity IS NOT NULL THEN
          SET NEW.min_quantity = NEW.buy_quantity;
        ELSEIF NEW.min_quantity IS NOT NULL THEN
          SET NEW.buy_quantity = NEW.min_quantity;
        END IF;

        -- Sync get_quantity with free_quantity
        IF NEW.get_quantity IS NOT NULL THEN
          SET NEW.free_quantity = NEW.get_quantity;
        ELSEIF NEW.free_quantity IS NOT NULL THEN
          SET NEW.get_quantity = NEW.free_quantity;
        END IF;
      END
    `);
    console.log('✅ Created offers_before_update trigger\n');

    console.log('📋 Step 4: Copying existing values...');
    await connection.query('UPDATE offers SET offer_type = type, discount_value = value, buy_quantity = min_quantity, get_quantity = free_quantity WHERE offer_type IS NULL');
    console.log('✅ Copied values from old columns\n');

    console.log('🎉 SUCCESS! Offers table fixed.\n');
    console.log('Now you can create offers with the expected column names!\n');
    console.log('Restart the backend server (type "rs" in nodemon)\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

fixOffersTable();

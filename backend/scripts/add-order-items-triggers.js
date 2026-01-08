const mysql = require('mysql2/promise');
require('dotenv').config();

async function addOrderItemsTriggers() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   Add Order Items Triggers             ║');
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

    console.log('🔧 Step 1: Making original columns in order_items nullable with defaults...');
    await connection.query('ALTER TABLE order_items MODIFY COLUMN unit_price DECIMAL(10,2) DEFAULT 0');
    console.log('✅ unit_price now has default value 0');

    await connection.query('ALTER TABLE order_items MODIFY COLUMN unit_cost DECIMAL(10,2) DEFAULT 0');
    console.log('✅ unit_cost now has default value 0\n');

    console.log('🔧 Step 2: Creating triggers to sync order_items columns...\n');

    // Drop existing triggers if they exist
    try {
      await connection.query('DROP TRIGGER IF EXISTS order_items_before_insert');
      await connection.query('DROP TRIGGER IF EXISTS order_items_before_update');
      console.log('✅ Dropped old triggers\n');
    } catch (e) {
      console.log('⚠️  No old triggers to drop\n');
    }

    // Create INSERT trigger for order_items
    await connection.query(`
      CREATE TRIGGER order_items_before_insert
      BEFORE INSERT ON order_items
      FOR EACH ROW
      BEGIN
        IF NEW.price IS NOT NULL THEN
          SET NEW.unit_price = NEW.price;
        END IF;

        IF NEW.cost_price IS NOT NULL THEN
          SET NEW.unit_cost = NEW.cost_price;
        END IF;
      END
    `);
    console.log('✅ Created order_items_before_insert trigger');

    // Create UPDATE trigger for order_items
    await connection.query(`
      CREATE TRIGGER order_items_before_update
      BEFORE UPDATE ON order_items
      FOR EACH ROW
      BEGIN
        IF NEW.price IS NOT NULL THEN
          SET NEW.unit_price = NEW.price;
        END IF;

        IF NEW.cost_price IS NOT NULL THEN
          SET NEW.unit_cost = NEW.cost_price;
        END IF;
      END
    `);
    console.log('✅ Created order_items_before_update trigger\n');

    console.log('🎉 SUCCESS! Order items triggers added.\n');
    console.log('Now when you INSERT/UPDATE order_items with "price" and "cost_price",');
    console.log('the triggers will automatically fill "unit_price" and "unit_cost"!\n');
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

addOrderItemsTriggers();

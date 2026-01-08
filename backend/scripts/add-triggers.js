const mysql = require('mysql2/promise');
require('dotenv').config();

async function addTriggers() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   Add Database Triggers                ║');
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

    console.log('🔧 Step 1: Making original columns nullable with defaults...');
    await connection.query('ALTER TABLE orders MODIFY COLUMN total_amount DECIMAL(10,2) DEFAULT 0');
    console.log('✅ total_amount now has default value 0');

    await connection.query('ALTER TABLE orders MODIFY COLUMN total_cost DECIMAL(10,2) DEFAULT 0');
    console.log('✅ total_cost now has default value 0\n');

    console.log('🔧 Step 2: Creating triggers to sync columns...\n');

    // Drop existing triggers if they exist
    try {
      await connection.query('DROP TRIGGER IF EXISTS orders_before_insert');
      await connection.query('DROP TRIGGER IF EXISTS orders_before_update');
      console.log('✅ Dropped old triggers\n');
    } catch (e) {
      console.log('⚠️  No old triggers to drop\n');
    }

    // Create INSERT trigger
    await connection.query(`
      CREATE TRIGGER orders_before_insert
      BEFORE INSERT ON orders
      FOR EACH ROW
      BEGIN
        IF NEW.total IS NOT NULL THEN
          SET NEW.total_amount = NEW.total;
        END IF;

        IF NEW.cost IS NOT NULL THEN
          SET NEW.total_cost = NEW.cost;
        END IF;
      END
    `);
    console.log('✅ Created orders_before_insert trigger');

    // Create UPDATE trigger
    await connection.query(`
      CREATE TRIGGER orders_before_update
      BEFORE UPDATE ON orders
      FOR EACH ROW
      BEGIN
        IF NEW.total IS NOT NULL THEN
          SET NEW.total_amount = NEW.total;
        END IF;

        IF NEW.cost IS NOT NULL THEN
          SET NEW.total_cost = NEW.cost;
        END IF;
      END
    `);
    console.log('✅ Created orders_before_update trigger\n');

    console.log('🎉 SUCCESS! Triggers added.\n');
    console.log('Now when you INSERT/UPDATE orders with "total" and "cost",');
    console.log('the triggers will automatically fill "total_amount" and "total_cost"!\n');
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

addTriggers();

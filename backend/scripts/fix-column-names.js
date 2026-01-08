/**
 * Fix database column names to match backend code
 * Usage: node scripts/fix-column-names.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cafe_management'
};

async function fixColumnNames() {
  let connection;
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected!\n');

    console.log('🔧 Adding column aliases in orders table...\n');

    // Add 'total' as alias for total_amount (or add it as separate column)
    try {
      console.log('Adding total column...');
      await connection.query('ALTER TABLE orders ADD COLUMN total DECIMAL(10,2) GENERATED ALWAYS AS (total_amount) VIRTUAL');
      console.log('✅ total column added\n');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  total column already exists\n');
      } else {
        // Try alternative: just add as regular column
        try {
          await connection.query('ALTER TABLE orders ADD COLUMN total DECIMAL(10,2) DEFAULT 0 AFTER total_amount');
          // Update existing rows
          await connection.query('UPDATE orders SET total = total_amount WHERE total IS NULL OR total = 0');
          console.log('✅ total column added\n');
        } catch (e2) {
          console.log('⚠️  Could not add total column:', e2.message, '\n');
        }
      }
    }

    // Add 'cost' as alias for total_cost
    try {
      console.log('Adding cost column...');
      await connection.query('ALTER TABLE orders ADD COLUMN cost DECIMAL(10,2) DEFAULT 0 AFTER total_cost');
      await connection.query('UPDATE orders SET cost = total_cost WHERE cost IS NULL OR cost = 0');
      console.log('✅ cost column added\n');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  cost column already exists\n');
      } else {
        console.log('⚠️  Could not add cost column:', e.message, '\n');
      }
    }

    // Add price as regular column in order_items (backend INSERTs into this)
    try {
      console.log('Adding price column to order_items...');
      await connection.query('ALTER TABLE order_items ADD COLUMN price DECIMAL(10,2) DEFAULT 0 AFTER product_name');
      console.log('✅ price column added to order_items\n');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  price column already exists in order_items\n');
      } else {
        console.log('⚠️  Could not add price column:', e.message, '\n');
      }
    }

    // Add cost_price as regular column in order_items (backend INSERTs into this)
    try {
      console.log('Adding cost_price column to order_items...');
      await connection.query('ALTER TABLE order_items ADD COLUMN cost_price DECIMAL(10,2) DEFAULT 0 AFTER price');
      console.log('✅ cost_price column added to order_items\n');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  cost_price column already exists\n');
      } else {
        console.log('⚠️  Could not add cost_price column:', e.message, '\n');
      }
    }

    // Add profit column to order_items (backend INSERTs into this)
    try {
      console.log('Adding profit column to order_items...');
      await connection.query('ALTER TABLE order_items ADD COLUMN profit DECIMAL(10,2) DEFAULT 0 AFTER subtotal');
      console.log('✅ profit column added to order_items\n');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  profit column already exists in order_items\n');
      } else {
        console.log('⚠️  Could not add profit column:', e.message, '\n');
      }
    }

    // Show orders table structure
    const [ordersColumns] = await connection.query('SHOW COLUMNS FROM orders');
    console.log('📋 Orders table structure:');
    console.table(ordersColumns.map(col => ({ Field: col.Field, Type: col.Type })));

    console.log('\n📋 Order_items table structure:');
    const [itemsColumns] = await connection.query('SHOW COLUMNS FROM order_items');
    console.table(itemsColumns.map(col => ({ Field: col.Field, Type: col.Type })));

    console.log('\n🎉 Success! Column names fixed.');
    console.log('\nNow restart Backend (type "rs")');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

fixColumnNames();

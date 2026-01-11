/**
 * Fix orders table columns
 * Usage: node scripts/fix-orders-table.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cafe_management'
};

async function fixOrdersTable() {
  let connection;
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected!\n');

    console.log('🔧 Adding missing columns to orders table...\n');

    // Add total column
    try {
      console.log('Adding total column...');
      await connection.query('ALTER TABLE orders ADD COLUMN total DECIMAL(10,2) DEFAULT 0 AFTER discount_amount');
      console.log('✅ total added\n');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  total already exists\n');
      } else {
        throw error;
      }
    }

    // Add cost column
    try {
      console.log('Adding cost column...');
      await connection.query('ALTER TABLE orders ADD COLUMN cost DECIMAL(10,2) DEFAULT 0 AFTER total');
      console.log('✅ cost added\n');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  cost already exists\n');
      } else {
        throw error;
      }
    }

    // Add profit column
    try {
      console.log('Adding profit column...');
      await connection.query('ALTER TABLE orders ADD COLUMN profit DECIMAL(10,2) DEFAULT 0 AFTER cost');
      console.log('✅ profit added\n');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  profit already exists\n');
      } else {
        throw error;
      }
    }

    // Add offer_id
    try {
      console.log('Adding offer_id column...');
      await connection.query('ALTER TABLE orders ADD COLUMN offer_id INT AFTER profit');
      console.log('✅ offer_id added\n');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  offer_id already exists\n');
      } else {
        throw error;
      }
    }

    // Add cashier_id
    try {
      console.log('Adding cashier_id column...');
      await connection.query('ALTER TABLE orders ADD COLUMN cashier_id INT AFTER offer_id');
      console.log('✅ cashier_id added\n');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  cashier_id already exists\n');
      } else {
        throw error;
      }
    }

    // Add foreign keys
    try {
      console.log('Adding foreign key for cashier_id...');
      await connection.query('ALTER TABLE orders ADD FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE SET NULL');
      console.log('✅ Foreign key added\n');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('⚠️  Foreign key already exists\n');
      } else {
        console.log('⚠️  Could not add foreign key (may already exist)\n');
      }
    }

    try {
      console.log('Adding foreign key for offer_id...');
      await connection.query('ALTER TABLE orders ADD FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE SET NULL');
      console.log('✅ Foreign key added\n');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('⚠️  Foreign key already exists\n');
      } else {
        console.log('⚠️  Could not add foreign key (may already exist)\n');
      }
    }

    // Show table structure
    const [columns] = await connection.query('SHOW COLUMNS FROM orders');
    console.log('📋 Orders table structure:');
    console.table(columns.map(col => ({ Field: col.Field, Type: col.Type, Null: col.Null, Key: col.Key })));

    console.log('\n🎉 Success! Orders table fixed.');
    console.log('\nNow restart Backend (type "rs" in the backend window)');

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

fixOrdersTable();

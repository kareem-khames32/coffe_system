/**
 * Fix orders table for online orders support
 * Adds customer_address column and updates ENUM values
 * Usage: node scripts/fix-online-orders.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cafe_management'
};

async function fixOnlineOrders() {
  let connection;
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected!\n');

    console.log('🔧 Fixing orders table for online orders support...\n');

    // Add customer_address column if not exists
    try {
      console.log('Adding customer_address column...');
      await connection.query('ALTER TABLE orders ADD COLUMN customer_address TEXT NULL AFTER customer_phone');
      console.log('✅ customer_address added\n');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  customer_address already exists\n');
      } else {
        throw error;
      }
    }

    // Update order_type ENUM to include 'online'
    try {
      console.log('Updating order_type ENUM to include online...');
      await connection.query(`ALTER TABLE orders MODIFY COLUMN order_type ENUM('dine-in', 'takeaway', 'delivery', 'online') DEFAULT 'dine-in'`);
      console.log('✅ order_type ENUM updated\n');
    } catch (error) {
      console.error('⚠️  Error updating order_type:', error.message, '\n');
    }

    // Update order_status ENUM to include 'confirmed'
    try {
      console.log('Updating order_status ENUM to include confirmed...');
      await connection.query(`ALTER TABLE orders MODIFY COLUMN order_status ENUM('pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled') DEFAULT 'pending'`);
      console.log('✅ order_status ENUM updated\n');
    } catch (error) {
      console.error('⚠️  Error updating order_status:', error.message, '\n');
    }

    // Make created_by nullable for online orders (no authenticated user)
    try {
      console.log('Making created_by nullable for online orders...');
      await connection.query(`ALTER TABLE orders MODIFY COLUMN created_by INT NULL`);
      console.log('✅ created_by is now nullable\n');
    } catch (error) {
      console.error('⚠️  Error updating created_by:', error.message, '\n');
    }

    console.log('🎉 Done! Online orders should now work correctly.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit(0);
  }
}

fixOnlineOrders();

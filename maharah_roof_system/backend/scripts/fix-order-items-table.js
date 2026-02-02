/**
 * Fix order_items table columns
 * Usage: node scripts/fix-order-items-table.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cafe_management'
};

async function fixOrderItemsTable() {
  let connection;
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected!\n');

    console.log('🔧 Adding missing columns to order_items table...\n');

    // Get current structure
    const [columns] = await connection.query('DESCRIBE order_items');
    const columnNames = columns.map(col => col.Field);
    console.log('Current columns:', columnNames.join(', '), '\n');

    // Add price column (unit price)
    if (!columnNames.includes('price')) {
      try {
        console.log('Adding price column...');
        await connection.query('ALTER TABLE order_items ADD COLUMN price DECIMAL(10,2) DEFAULT 0 AFTER quantity');
        console.log('✅ price added\n');
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log('⚠️  price already exists\n');
        } else {
          throw error;
        }
      }
    } else {
      console.log('✅ price column already exists\n');
    }

    // Add cost_price column
    if (!columnNames.includes('cost_price')) {
      try {
        console.log('Adding cost_price column...');
        await connection.query('ALTER TABLE order_items ADD COLUMN cost_price DECIMAL(10,2) DEFAULT 0 AFTER price');
        console.log('✅ cost_price added\n');
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log('⚠️  cost_price already exists\n');
        } else {
          throw error;
        }
      }
    } else {
      console.log('✅ cost_price column already exists\n');
    }

    // Add subtotal column
    if (!columnNames.includes('subtotal')) {
      try {
        console.log('Adding subtotal column...');
        await connection.query('ALTER TABLE order_items ADD COLUMN subtotal DECIMAL(10,2) DEFAULT 0 AFTER cost_price');
        console.log('✅ subtotal added\n');
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log('⚠️  subtotal already exists\n');
        } else {
          throw error;
        }
      }
    } else {
      console.log('✅ subtotal column already exists\n');
    }

    // Add profit column
    if (!columnNames.includes('profit')) {
      try {
        console.log('Adding profit column...');
        await connection.query('ALTER TABLE order_items ADD COLUMN profit DECIMAL(10,2) DEFAULT 0 AFTER subtotal');
        console.log('✅ profit added\n');
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log('⚠️  profit already exists\n');
        } else {
          throw error;
        }
      }
    } else {
      console.log('✅ profit column already exists\n');
    }

    // Add product_name column if missing
    if (!columnNames.includes('product_name')) {
      try {
        console.log('Adding product_name column...');
        await connection.query('ALTER TABLE order_items ADD COLUMN product_name VARCHAR(255) AFTER product_id');
        console.log('✅ product_name added\n');
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log('⚠️  product_name already exists\n');
        } else {
          throw error;
        }
      }
    } else {
      console.log('✅ product_name column already exists\n');
    }

    // Show table structure
    const [finalColumns] = await connection.query('SHOW COLUMNS FROM order_items');
    console.log('\n📋 Order_items table structure:');
    console.table(finalColumns.map(col => ({ Field: col.Field, Type: col.Type, Null: col.Null, Key: col.Key })));

    console.log('\n🎉 Success! Order_items table fixed.');
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

fixOrderItemsTable();

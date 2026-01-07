/**
 * Recreate orders table with correct structure
 * Usage: node scripts/recreate-orders-table.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cafe_management'
};

async function recreateOrdersTable() {
  let connection;
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected!\n');

    console.log('🗑️  Dropping old orders table...');
    await connection.query('DROP TABLE IF EXISTS order_edit_history');
    await connection.query('DROP TABLE IF EXISTS order_items');
    await connection.query('DROP TABLE IF EXISTS orders');
    console.log('✅ Old tables dropped\n');

    console.log('📋 Creating new orders table with correct structure...');
    await connection.query(`
      CREATE TABLE orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        order_type ENUM('in-store', 'online') DEFAULT 'in-store',
        status ENUM('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled') DEFAULT 'pending',
        customer_name VARCHAR(255),
        customer_phone VARCHAR(20),
        customer_address TEXT,
        subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
        discount_type ENUM('percentage', 'fixed', 'none') DEFAULT 'none',
        discount_value DECIMAL(10,2) DEFAULT 0,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL,
        total_cost DECIMAL(10,2) DEFAULT 0,
        profit DECIMAL(10,2) DEFAULT 0,
        offer_id INT,
        user_id INT,
        cashier_id INT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE SET NULL,
        INDEX idx_order_number (order_number),
        INDEX idx_order_type (order_type),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Orders table created\n');

    console.log('📋 Creating order_items table...');
    await connection.query(`
      CREATE TABLE order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        unit_cost DECIMAL(10,2) DEFAULT 0,
        subtotal DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
        INDEX idx_order_id (order_id),
        INDEX idx_product_id (product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Order items table created\n');

    console.log('📋 Creating order_edit_history table...');
    await connection.query(`
      CREATE TABLE order_edit_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        user_id INT,
        action VARCHAR(100) NOT NULL,
        old_value TEXT,
        new_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_order_id (order_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Order edit history table created\n');

    // Show table structure
    const [columns] = await connection.query('SHOW COLUMNS FROM orders');
    console.log('📋 Orders table structure:');
    console.table(columns.map(col => ({ Field: col.Field, Type: col.Type })));

    console.log('\n🎉 Success! Orders tables recreated with correct structure.');
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

recreateOrdersTable();

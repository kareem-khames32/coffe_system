/**
 * Complete Database Setup - Fresh Start
 * Creates all tables and admin user
 * Usage: node scripts/setup-complete.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cafe_management'
};

async function setupComplete() {
  let connection;
  try {
    console.log('╔════════════════════════════════════════╗');
    console.log('║   Complete Database Setup             ║');
    console.log('╚════════════════════════════════════════╝\n');

    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected!\n');

    // Drop all tables
    console.log('🗑️  Removing old tables...');
    const tables = ['order_edit_history', 'order_items', 'orders', 'daily_discounts',
                    'expenses', 'purchases', 'products', 'categories', 'offers', 'settings', 'users'];

    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of tables) {
      await connection.query(`DROP TABLE IF EXISTS ${table}`);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Old tables removed\n');

    // Create users table
    console.log('📋 Creating users table...');
    await connection.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role ENUM('admin', 'cashier') DEFAULT 'cashier',
        can_make_sales TINYINT(1) DEFAULT 1,
        can_view_inventory TINYINT(1) DEFAULT 0,
        can_edit_inventory TINYINT(1) DEFAULT 0,
        can_view_order_details TINYINT(1) DEFAULT 0,
        can_cancel_orders TINYINT(1) DEFAULT 0,
        can_edit_orders TINYINT(1) DEFAULT 0,
        can_view_reports TINYINT(1) DEFAULT 0,
        can_add_expenses TINYINT(1) DEFAULT 0,
        can_manage_offers TINYINT(1) DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Users table created\n');

    // Create categories table
    console.log('📋 Creating categories table...');
    await connection.query(`
      CREATE TABLE categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Categories table created\n');

    // Create products table
    console.log('📋 Creating products table...');
    await connection.query(`
      CREATE TABLE products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category_id INT,
        price DECIMAL(10,2) NOT NULL,
        cost_price DECIMAL(10,2) DEFAULT 0,
        stock INT DEFAULT 0,
        image VARCHAR(255),
        low_stock_alert INT DEFAULT 10,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Products table created\n');

    // Create offers table
    console.log('📋 Creating offers table...');
    await connection.query(`
      CREATE TABLE offers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type ENUM('percentage', 'fixed', 'buy_x_get_y') NOT NULL,
        value DECIMAL(10,2) NOT NULL,
        product_id INT,
        min_quantity INT DEFAULT 1,
        free_quantity INT DEFAULT 0,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Offers table created\n');

    // Create orders table
    console.log('📋 Creating orders table...');
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
        FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Orders table created\n');

    // Create order_items table
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
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Order items table created\n');

    // Create other tables
    await connection.query(`CREATE TABLE order_edit_history (id INT AUTO_INCREMENT PRIMARY KEY, order_id INT NOT NULL, user_id INT, action VARCHAR(100) NOT NULL, old_value TEXT, new_value TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await connection.query(`CREATE TABLE daily_discounts (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, discount_type ENUM('percentage', 'fixed') NOT NULL, discount_value DECIMAL(10,2) NOT NULL, min_purchase_amount DECIMAL(10,2) DEFAULT 0, max_discount_amount DECIMAL(10,2), is_active TINYINT(1) DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await connection.query(`CREATE TABLE expenses (id INT AUTO_INCREMENT PRIMARY KEY, category VARCHAR(100) NOT NULL, description TEXT NOT NULL, amount DECIMAL(10,2) NOT NULL, expense_date DATE NOT NULL, notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await connection.query(`CREATE TABLE purchases (id INT AUTO_INCREMENT PRIMARY KEY, supplier_name VARCHAR(255) NOT NULL, item_description TEXT NOT NULL, quantity DECIMAL(10,2) NOT NULL, unit_price DECIMAL(10,2) NOT NULL, total_amount DECIMAL(10,2) NOT NULL, purchase_date DATE NOT NULL, notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await connection.query(`CREATE TABLE settings (id INT AUTO_INCREMENT PRIMARY KEY, setting_key VARCHAR(100) UNIQUE NOT NULL, setting_value TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    console.log('✅ All tables created\n');

    // Create admin user
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await connection.query(`
      INSERT INTO users (username, password, full_name, role,
        can_make_sales, can_view_inventory, can_edit_inventory,
        can_view_order_details, can_cancel_orders, can_edit_orders,
        can_view_reports, can_add_expenses, can_manage_offers, is_active)
      VALUES (?, ?, ?, ?, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1)
    `, ['admin', hashedPassword, 'Administrator', 'admin']);
    console.log('✅ Admin user created\n');

    // Insert default settings
    console.log('⚙️  Adding default settings...');
    await connection.query(`INSERT INTO settings (setting_key, setting_value) VALUES ('cafe_name', 'My Cafe')`);
    console.log('✅ Settings added\n');

    // Show summary
    const [tables_result] = await connection.query('SHOW TABLES');
    const [users] = await connection.query('SELECT id, username, role FROM users');

    console.log('╔════════════════════════════════════════╗');
    console.log('║   Setup Complete!                     ║');
    console.log('╚════════════════════════════════════════╝\n');

    console.log('📊 Tables created:', tables_result.length);
    console.table(tables_result);

    console.log('\n👥 Users created:');
    console.table(users);

    console.log('\n🎉 Database is ready!');
    console.log('\n🔐 Login credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('\n💻 Now start Backend: npm run dev');

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

setupComplete();

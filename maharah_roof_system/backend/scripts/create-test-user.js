/**
 * Create admin user with correct password hashing
 * Usage: node scripts/create-test-user.js
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

async function createTestUser() {
  let connection;

  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected!\n');

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const testPassword = await bcrypt.hash('123456', 10);

    // Delete existing users
    console.log('🗑️  Removing old users...');
    await connection.query('DELETE FROM users WHERE username IN (?, ?, ?)', ['admin', 'kareem', 'test']);
    console.log('✅ Old users removed\n');

    // Create admin user
    console.log('👤 Creating admin user...');
    await connection.query(`
      INSERT INTO users (
        username, password, full_name, role,
        can_make_sales, can_view_inventory, can_edit_inventory,
        can_view_order_details, can_cancel_orders, can_edit_orders,
        can_view_reports, can_add_expenses, can_manage_offers,
        is_active
      ) VALUES (?, ?, ?, ?, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1)
    `, ['admin', adminPassword, 'Administrator', 'admin']);
    console.log('✅ Admin created: admin / admin123\n');

    // Create test user
    console.log('👤 Creating test user...');
    await connection.query(`
      INSERT INTO users (
        username, password, full_name, role,
        can_make_sales, can_view_inventory, can_edit_inventory,
        can_view_order_details, can_cancel_orders, can_edit_orders,
        can_view_reports, can_add_expenses, can_manage_offers,
        is_active
      ) VALUES (?, ?, ?, ?, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1)
    `, ['test', testPassword, 'Test User', 'admin']);
    console.log('✅ Test user created: test / 123456\n');

    // Create kareem user
    console.log('👤 Creating kareem user...');
    await connection.query(`
      INSERT INTO users (
        username, password, full_name, role,
        can_make_sales, can_view_inventory, can_edit_inventory,
        can_view_order_details, can_cancel_orders, can_edit_orders,
        can_view_reports, can_add_expenses, can_manage_offers,
        is_active
      ) VALUES (?, ?, ?, ?, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1)
    `, ['kareem', testPassword, 'Kareem', 'admin']);
    console.log('✅ Kareem user created: kareem / 123456\n');

    // Show all users
    const [users] = await connection.query('SELECT id, username, role, is_active FROM users');
    console.log('📋 All users:');
    console.table(users);

    console.log('\n🎉 Success! You can now login with:');
    console.log('   - admin / admin123');
    console.log('   - test / 123456');
    console.log('   - kareem / 123456');

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

createTestUser();

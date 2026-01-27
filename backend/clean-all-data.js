/**
 * ════════════════════════════════════════════════════════════════
 * مسح جميع البيانات (ماعدا المستخدمين)
 * Clean All Data (Except Users)
 * ════════════════════════════════════════════════════════════════
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function cleanAllData() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║        🧹 مسح جميع البيانات (ماعدا المستخدمين)                 ║');
  console.log('║           Clean All Data (Except Users)                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cafe_management',
    port: process.env.DB_PORT || 3306,
  };

  // Add socket if available
  if (process.env.DB_SOCKET) {
    connectionConfig.socketPath = process.env.DB_SOCKET;
  }

  let connection;

  try {
    connection = await mysql.createConnection(connectionConfig);
    console.log('✅ تم الاتصال بقاعدة البيانات\n');

    // Disable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('🔓 تم تعطيل فحص المفاتيح الأجنبية\n');

    // Tables to clean (in order - children first)
    const tablesToClean = [
      // Alerts & Notifications
      'system_alerts',

      // Orders related
      'order_items',
      'orders',

      // Inventory transactions
      'inventory_transactions',
      'batch_consumption',

      // Stock transfers
      'stock_transfer_items',
      'stock_transfers',

      // Material batches
      'material_batches',

      // Inventory purchases
      'inventory_purchase_items',
      'inventory_purchases',

      // Supplier payments
      'supplier_payments',

      // Product recipes
      'product_recipes',

      // Products & Categories
      'products',
      'categories',

      // Raw materials
      'raw_materials',

      // Warehouses
      'warehouses',

      // Suppliers
      'suppliers',

      // Discounts & Offers
      'daily_discounts',
      'offers',

      // Expenses
      'expenses',

      // Inventory counts
      'inventory_count_items',
      'inventory_counts',
    ];

    console.log('🗑️  جاري مسح البيانات...\n');

    for (const table of tablesToClean) {
      try {
        // Check if table exists
        const [tables] = await connection.query(
          `SELECT TABLE_NAME FROM information_schema.TABLES
           WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
          [process.env.DB_NAME || 'cafe_management', table]
        );

        if (tables.length > 0) {
          // Get count before delete
          const [countResult] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
          const count = countResult[0].count;

          if (count > 0) {
            // Delete all data
            await connection.query(`DELETE FROM ${table}`);
            // Reset auto increment
            await connection.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
            console.log(`   ✅ ${table}: تم مسح ${count} سجل`);
          }
        }
      } catch (err) {
        // Table might not exist, skip
        if (!err.message.includes("doesn't exist")) {
          console.log(`   ⚠️  ${table}: ${err.message}`);
        }
      }
    }

    // Re-enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('\n🔒 تم تفعيل فحص المفاتيح الأجنبية');

    // Show remaining users
    const [users] = await connection.query('SELECT id, username, full_name, role FROM users');
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    👥 المستخدمون المتبقون                      ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    users.forEach(user => {
      console.log(`║  ${user.id.toString().padEnd(4)} ${user.username.padEnd(15)} ${user.full_name.padEnd(20)} ${user.role.padEnd(10)} ║`);
    });
    console.log('╚════════════════════════════════════════════════════════════════╝');

    console.log('\n');
    console.log('🎉 تم مسح جميع البيانات بنجاح!');
    console.log('✨ النظام جاهز للاستخدام على السيرفر الجديد.');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

cleanAllData();

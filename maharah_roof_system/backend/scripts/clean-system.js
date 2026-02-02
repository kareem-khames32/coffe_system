/**
 * سكريبت تنظيف قاعدة البيانات
 * Database Cleanup Script
 *
 * يقوم بحذف جميع البيانات من النظام عدا اليوزرات والإعدادات
 * Deletes all data except users and settings
 *
 * Usage: node scripts/clean-system.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cafe_management',
  multipleStatements: true
};

async function cleanDatabase() {
  let connection;

  try {
    console.log('🔄 جاري الاتصال بقاعدة البيانات...');
    console.log('🔄 Connecting to database...');

    connection = await mysql.createConnection(dbConfig);

    console.log('✅ تم الاتصال بنجاح');
    console.log('✅ Connected successfully\n');

    console.log('⚠️  تحذير: سيتم حذف جميع البيانات عدا اليوزرات والإعدادات');
    console.log('⚠️  Warning: All data except users and settings will be deleted\n');

    // تعطيل فحص المفاتيح الأجنبية
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    console.log('🗑️  جاري حذف بيانات الطلبات...');
    console.log('🗑️  Deleting orders data...');
    await connection.query('TRUNCATE TABLE order_items');
    await connection.query('TRUNCATE TABLE order_edit_history');
    await connection.query('TRUNCATE TABLE orders');
    console.log('✅ تم حذف بيانات الطلبات\n');

    console.log('🗑️  جاري حذف بيانات المنتجات...');
    console.log('🗑️  Deleting products data...');
    await connection.query('TRUNCATE TABLE products');
    console.log('✅ تم حذف بيانات المنتجات\n');

    console.log('🗑️  جاري حذف البيانات المالية...');
    console.log('🗑️  Deleting financial data...');
    await connection.query('TRUNCATE TABLE expenses');
    await connection.query('TRUNCATE TABLE purchases');
    console.log('✅ تم حذف البيانات المالية\n');

    console.log('🗑️  جاري حذف العروض والخصومات...');
    console.log('🗑️  Deleting offers and discounts...');
    await connection.query('TRUNCATE TABLE offers');
    await connection.query('TRUNCATE TABLE daily_discounts');
    console.log('✅ تم حذف العروض والخصومات\n');

    // إعادة تفعيل فحص المفاتيح الأجنبية
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // عرض الجداول التي تم الاحتفاظ بها
    console.log('✅ تم تنظيف قاعدة البيانات بنجاح!');
    console.log('✅ Database cleaned successfully!\n');

    console.log('📋 الجداول التي تم الاحتفاظ بها:');
    console.log('📋 Tables that were preserved:');
    console.log('   - users (المستخدمون)');
    console.log('   - settings (الإعدادات)');
    console.log('   - categories (الفئات)');

    // عرض إحصائيات
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [categories] = await connection.query('SELECT COUNT(*) as count FROM categories');
    const [settings] = await connection.query('SELECT COUNT(*) as count FROM settings');

    console.log('\n📊 الإحصائيات / Statistics:');
    console.log(`   - المستخدمون / Users: ${users[0].count}`);
    console.log(`   - الفئات / Categories: ${categories[0].count}`);
    console.log(`   - الإعدادات / Settings: ${settings[0].count}`);

  } catch (error) {
    console.error('❌ حدث خطأ / Error occurred:');
    console.error(error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات');
      console.log('🔌 Database connection closed');
    }
  }
}

// تشغيل السكريبت
cleanDatabase();

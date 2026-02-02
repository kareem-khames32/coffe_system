/**
 * ════════════════════════════════════════════════════════════════
 * سكريبت التحقق من صحة النظام
 * System Verification Script
 * ════════════════════════════════════════════════════════════════
 *
 * يقوم بـ:
 * 1. فحص الاتصال بقاعدة البيانات
 * 2. فحص جميع الجداول
 * 3. فحص المستخدمين
 * 4. اختبار تسجيل الدخول
 * 5. فحص API endpoints
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const axios = require('axios');

const BASE_URL = `http://localhost:${process.env.PORT || 5000}/api`;

const results = {
  database: { status: 'pending', details: [] },
  tables: { status: 'pending', details: [] },
  users: { status: 'pending', details: [] },
  api: { status: 'pending', details: [] },
};

async function checkDatabase() {
  console.log('\n📊 فحص قاعدة البيانات...');

  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 3306,
  };

  if (process.env.DB_SOCKET) {
    dbConfig.socketPath = process.env.DB_SOCKET;
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

    // Check tables
    const [tables] = await connection.query(`
      SELECT TABLE_NAME, TABLE_ROWS
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [process.env.DB_NAME]);

    results.database.status = 'success';
    results.database.details.push(`متصل بـ: ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);
    results.database.details.push(`قاعدة البيانات: ${process.env.DB_NAME}`);

    // Required tables
    const requiredTables = [
      'users', 'categories', 'products', 'orders', 'order_items',
      'suppliers', 'warehouses', 'raw_materials', 'inventory_purchases',
      'inventory_purchase_items', 'product_recipes', 'inventory_transactions',
      'expenses', 'system_alerts', 'material_batches', 'stock_transfers',
      'stock_transfer_items', 'supplier_payments', 'inventory_counts',
      'inventory_count_items', 'offers', 'daily_discounts'
    ];

    const existingTables = tables.map(t => t.TABLE_NAME);
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));
    const extraTables = existingTables.filter(t => !requiredTables.includes(t) && !t.includes('_view'));

    results.tables.status = missingTables.length === 0 ? 'success' : 'warning';
    results.tables.details.push(`إجمالي الجداول: ${tables.length}`);

    if (missingTables.length > 0) {
      results.tables.details.push(`⚠️ جداول مفقودة: ${missingTables.join(', ')}`);
    } else {
      results.tables.details.push('✅ جميع الجداول الأساسية موجودة');
    }

    // Check users
    const [users] = await connection.query('SELECT id, username, full_name, role, is_active FROM users');

    if (users.length === 0) {
      results.users.status = 'error';
      results.users.details.push('❌ لا يوجد مستخدمين!');
    } else {
      results.users.status = 'success';
      results.users.details.push(`عدد المستخدمين: ${users.length}`);
      users.forEach(u => {
        results.users.details.push(`   • ${u.username} (${u.role}) - ${u.is_active ? 'نشط' : 'غير نشط'}`);
      });

      // Check admin password
      const [admin] = await connection.query('SELECT password FROM users WHERE username = ?', ['admin']);
      if (admin.length > 0) {
        const isValid = await bcrypt.compare('123456', admin[0].password);
        if (isValid) {
          results.users.details.push('✅ كلمة مرور admin صحيحة (123456)');
        } else {
          results.users.details.push('⚠️ كلمة مرور admin مختلفة عن 123456');
        }
      }
    }

    await connection.end();
  } catch (error) {
    results.database.status = 'error';
    results.database.details.push(`❌ خطأ: ${error.message}`);
  }
}

async function checkAPI() {
  console.log('\n🌐 فحص API...');

  try {
    // Test login
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: '123456',
    }, { timeout: 5000 });

    if (loginResponse.data.success || loginResponse.data.data?.token) {
      results.api.status = 'success';
      results.api.details.push('✅ تسجيل الدخول يعمل');

      const token = loginResponse.data.data?.token || loginResponse.data.token;

      // Test other endpoints
      const endpoints = [
        { name: 'الفئات', path: '/categories' },
        { name: 'المنتجات', path: '/products' },
        { name: 'الموردين', path: '/suppliers' },
        { name: 'المخازن', path: '/warehouses' },
        { name: 'المواد الخام', path: '/raw-materials' },
        { name: 'التقارير', path: '/reports/dashboard' },
      ];

      for (const ep of endpoints) {
        try {
          await axios.get(`${BASE_URL}${ep.path}`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
          });
          results.api.details.push(`   ✅ ${ep.name}`);
        } catch (e) {
          results.api.details.push(`   ⚠️ ${ep.name}: ${e.response?.status || e.message}`);
        }
      }
    } else {
      results.api.status = 'error';
      results.api.details.push('❌ فشل تسجيل الدخول');
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      results.api.status = 'error';
      results.api.details.push('❌ السيرفر غير شغال!');
      results.api.details.push('   شغل السيرفر أولاً: npm start');
    } else {
      results.api.status = 'error';
      results.api.details.push(`❌ خطأ: ${error.message}`);
    }
  }
}

async function printResults() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║              📋 نتائج فحص النظام                               ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  const sections = [
    { name: '🗄️  قاعدة البيانات', data: results.database },
    { name: '📋 الجداول', data: results.tables },
    { name: '👥 المستخدمون', data: results.users },
    { name: '🌐 API', data: results.api },
  ];

  for (const section of sections) {
    const statusIcon = section.data.status === 'success' ? '✅' :
                       section.data.status === 'warning' ? '⚠️' :
                       section.data.status === 'error' ? '❌' : '⏳';

    console.log(`\n${section.name} ${statusIcon}`);
    console.log('─'.repeat(50));
    section.data.details.forEach(d => console.log(`   ${d}`));
  }

  // Overall status
  const allSuccess = Object.values(results).every(r => r.status === 'success');
  const hasErrors = Object.values(results).some(r => r.status === 'error');

  console.log('\n');
  console.log('═'.repeat(60));

  if (allSuccess) {
    console.log('🎉 النظام يعمل بشكل ممتاز! جاهز للاستخدام.');
  } else if (hasErrors) {
    console.log('⚠️  يوجد مشاكل تحتاج إصلاح. راجع التفاصيل أعلاه.');
  } else {
    console.log('👍 النظام يعمل مع بعض التحذيرات البسيطة.');
  }

  console.log('\n');
}

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║        🔍 فحص النظام - System Verification                    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  await checkDatabase();
  await checkAPI();
  await printResults();
}

main();

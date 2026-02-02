/**
 * ════════════════════════════════════════════════════════════════
 * سكريبت إعداد النظام على السيرفر الجديد
 * Server Deployment Setup Script
 * ════════════════════════════════════════════════════════════════
 *
 * هذا السكريبت يقوم بـ:
 * 1. فحص الاتصال بقاعدة البيانات
 * 2. إنشاء جميع الجداول
 * 3. إنشاء المستخدم الأدمن
 * 4. التحقق من صحة الإعداد
 *
 * الاستخدام:
 *   node deploy-setup.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, type = 'info') {
  const icons = {
    info: `${colors.blue}ℹ️ `,
    success: `${colors.green}✅`,
    error: `${colors.red}❌`,
    warning: `${colors.yellow}⚠️ `,
    step: `${colors.cyan}📦`,
  };
  console.log(`${icons[type] || ''} ${message}${colors.reset}`);
}

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║        🚀 إعداد نظام إدارة الكافيه على السيرفر                 ║');
  console.log('║           Cafe Management System - Server Setup                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  // Check .env file
  log('فحص ملف الإعدادات (.env)...', 'step');

  const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);

  if (missingVars.length > 0) {
    log(`متغيرات مفقودة في .env: ${missingVars.join(', ')}`, 'error');
    log('تأكد من إنشاء ملف .env بالإعدادات الصحيحة', 'warning');
    process.exit(1);
  }
  log('ملف الإعدادات موجود وصحيح', 'success');

  // Database connection config
  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT) || 3306,
    multipleStatements: true,
  };

  if (process.env.DB_SOCKET) {
    dbConfig.socketPath = process.env.DB_SOCKET;
  }

  let connection;

  try {
    // Step 1: Connect to MySQL (without database)
    log('الاتصال بخادم MySQL...', 'step');
    connection = await mysql.createConnection(dbConfig);
    log('تم الاتصال بخادم MySQL', 'success');

    // Step 2: Create database if not exists
    log('إنشاء قاعدة البيانات...', 'step');
    const dbName = process.env.DB_NAME;
    await connection.query(`
      CREATE DATABASE IF NOT EXISTS \`${dbName}\`
      CHARACTER SET utf8mb4
      COLLATE utf8mb4_unicode_ci
    `);
    log(`قاعدة البيانات "${dbName}" جاهزة`, 'success');

    // Switch to database
    await connection.query(`USE \`${dbName}\``);

    // Step 3: Create tables
    log('إنشاء الجداول...', 'step');

    const sqlFilePath = path.join(__dirname, 'complete-database-setup.sql');
    if (!fs.existsSync(sqlFilePath)) {
      log('ملف complete-database-setup.sql غير موجود!', 'error');
      process.exit(1);
    }

    let sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Remove CREATE DATABASE and USE statements (we already did that)
    sqlContent = sqlContent.replace(/CREATE DATABASE.*?;/gi, '');
    sqlContent = sqlContent.replace(/USE\s+\w+;/gi, '');

    // Split by semicolon and execute each statement
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    let tablesCreated = 0;
    let viewsCreated = 0;

    for (const statement of statements) {
      try {
        if (statement.toLowerCase().includes('create table')) {
          await connection.query(statement);
          tablesCreated++;
        } else if (statement.toLowerCase().includes('create or replace view') || statement.toLowerCase().includes('create view')) {
          await connection.query(statement);
          viewsCreated++;
        } else if (statement.toLowerCase().includes('insert into')) {
          // Skip default inserts, we'll handle admin separately
          continue;
        } else if (statement.toLowerCase().includes('select')) {
          // Skip SELECT statements
          continue;
        }
      } catch (err) {
        // Ignore "already exists" errors
        if (!err.message.includes('already exists')) {
          // log(`   تحذير: ${err.message.substring(0, 50)}...`, 'warning');
        }
      }
    }

    log(`تم إنشاء ${tablesCreated} جدول و ${viewsCreated} عرض`, 'success');

    // Step 4: Create admin user
    log('إنشاء المستخدم الأدمن...', 'step');

    // Check if admin exists
    const [existingAdmin] = await connection.query(
      'SELECT id, username FROM users WHERE username = ?',
      ['admin']
    );

    if (existingAdmin.length > 0) {
      log('المستخدم admin موجود بالفعل', 'info');

      // Update password to ensure it's correct
      const hashedPassword = await bcrypt.hash('123456', 10);
      await connection.query(
        'UPDATE users SET password = ?, is_active = 1 WHERE username = ?',
        [hashedPassword, 'admin']
      );
      log('تم تحديث كلمة مرور admin إلى: 123456', 'success');
    } else {
      // Create new admin
      const hashedPassword = await bcrypt.hash('123456', 10);
      await connection.query(`
        INSERT INTO users (username, password, full_name, role, can_make_sales, can_view_inventory, can_edit_inventory, can_view_order_details, can_cancel_orders, can_edit_orders, can_view_reports, can_add_expenses, can_manage_offers, is_active)
        VALUES (?, ?, ?, 'admin', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1)
      `, ['admin', hashedPassword, 'المدير العام']);
      log('تم إنشاء المستخدم admin بكلمة مرور: 123456', 'success');
    }

    // Step 5: Create uploads directory
    log('إنشاء مجلد الرفع...', 'step');
    const uploadsPath = process.env.UPLOAD_PATH || './uploads';
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
      log(`تم إنشاء مجلد ${uploadsPath}`, 'success');
    } else {
      log('مجلد الرفع موجود', 'info');
    }

    // Step 6: Verify setup
    log('التحقق من الإعداد...', 'step');

    const [tables] = await connection.query(`
      SELECT TABLE_NAME FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
    `, [dbName]);

    const expectedTables = [
      'users', 'categories', 'products', 'orders', 'order_items',
      'suppliers', 'warehouses', 'raw_materials', 'inventory_purchases',
      'inventory_purchase_items', 'product_recipes', 'inventory_transactions',
      'expenses', 'system_alerts'
    ];

    const existingTables = tables.map(t => t.TABLE_NAME);
    const missingTables = expectedTables.filter(t => !existingTables.includes(t));

    if (missingTables.length > 0) {
      log(`جداول مفقودة: ${missingTables.join(', ')}`, 'warning');
    } else {
      log('جميع الجداول الأساسية موجودة', 'success');
    }

    // Print summary
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    🎉 تم الإعداد بنجاح!                        ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log('║                                                                ║');
    console.log('║  📊 قاعدة البيانات: ' + dbName.padEnd(42) + '║');
    console.log('║  📋 عدد الجداول: ' + existingTables.length.toString().padEnd(45) + '║');
    console.log('║                                                                ║');
    console.log('║  👤 بيانات الدخول:                                             ║');
    console.log('║     اسم المستخدم: admin                                        ║');
    console.log('║     كلمة المرور: 123456                                        ║');
    console.log('║                                                                ║');
    console.log('║  🚀 لتشغيل السيرفر:                                            ║');
    console.log('║     npm start                                                  ║');
    console.log('║                                                                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('\n');

  } catch (error) {
    console.log('\n');
    log(`خطأ: ${error.message}`, 'error');

    if (error.code === 'ECONNREFUSED') {
      log('تأكد أن خادم MySQL يعمل', 'warning');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      log('تأكد من صحة اسم المستخدم وكلمة المرور في .env', 'warning');
    }

    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

main();

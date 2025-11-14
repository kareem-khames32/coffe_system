const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function quickCreateAdmin() {
    let connection;

    try {
        // يمكنك تغيير هذه القيم حسب الحاجة
        const username = process.argv[2] || 'manager';  // اسم المستخدم من command line أو 'manager'
        const password = process.argv[3] || 'Admin@123'; // كلمة المرور من command line أو 'Admin@123'
        const fullName = process.argv[4] || 'المدير';    // الاسم الكامل من command line أو 'المدير'

        console.log('\n═══════════════════════════════════════════');
        console.log('   إنشاء مستخدم Admin سريع');
        console.log('═══════════════════════════════════════════\n');

        // Create database connection
        console.log('⏳ جاري الاتصال بقاعدة البيانات...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'coffee_shop'
        });

        console.log('✓ تم الاتصال بقاعدة البيانات');

        // Hash the password
        console.log('⏳ جاري تشفير كلمة المرور...');
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('✓ تم تشفير كلمة المرور');

        // Check if username exists
        const [existing] = await connection.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (existing.length > 0) {
            // Update existing user
            console.log(`\n⏳ المستخدم "${username}" موجود، جاري التحديث...`);
            await connection.query(
                `UPDATE users SET
                    password = ?,
                    full_name = ?,
                    role = 'admin',
                    can_make_sales = 1,
                    can_edit_orders = 1,
                    can_cancel_orders = 1,
                    can_view_order_details = 1,
                    can_manage_products = 1,
                    can_manage_inventory = 1,
                    can_view_reports = 1,
                    can_manage_users = 1,
                    can_manage_settings = 1,
                    can_add_expenses = 1,
                    is_active = 1
                WHERE username = ?`,
                [hashedPassword, fullName, username]
            );
            console.log('✓ تم تحديث المستخدم بنجاح');
        } else {
            // Create new user
            console.log(`\n⏳ جاري إنشاء المستخدم "${username}"...`);
            await connection.query(
                `INSERT INTO users (
                    username,
                    password,
                    full_name,
                    role,
                    can_make_sales,
                    can_edit_orders,
                    can_cancel_orders,
                    can_view_order_details,
                    can_manage_products,
                    can_manage_inventory,
                    can_view_reports,
                    can_manage_users,
                    can_manage_settings,
                    can_add_expenses,
                    is_active
                ) VALUES (?, ?, ?, 'admin', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1)`,
                [username, hashedPassword, fullName]
            );
            console.log('✓ تم إنشاء المستخدم بنجاح');
        }

        console.log('\n═══════════════════════════════════════════');
        console.log('✓ تم إنشاء/تحديث مستخدم Admin بنجاح!');
        console.log('═══════════════════════════════════════════');
        console.log(`اسم المستخدم: ${username}`);
        console.log(`كلمة المرور: ${password}`);
        console.log(`الاسم الكامل: ${fullName}`);
        console.log('الصلاحيات: جميع الصلاحيات (Admin)');
        console.log('═══════════════════════════════════════════\n');

    } catch (error) {
        console.error('\n✗ حدث خطأ:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('✗ تأكد من أن MySQL يعمل وأن معلومات الاتصال صحيحة في ملف .env');
        }
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('✓ تم إغلاق الاتصال بقاعدة البيانات\n');
        }
    }
}

// Show usage if help requested
if (process.argv[2] === '--help' || process.argv[2] === '-h') {
    console.log('\nالاستخدام:');
    console.log('  node quick-create-admin.js [username] [password] [fullName]');
    console.log('\nأمثلة:');
    console.log('  node quick-create-admin.js');
    console.log('    → ينشئ مستخدم: username=manager, password=Admin@123, fullName=المدير');
    console.log('\n  node quick-create-admin.js kareem');
    console.log('    → ينشئ مستخدم: username=kareem, password=Admin@123, fullName=المدير');
    console.log('\n  node quick-create-admin.js kareem MyPass123');
    console.log('    → ينشئ مستخدم: username=kareem, password=MyPass123, fullName=المدير');
    console.log('\n  node quick-create-admin.js kareem MyPass123 "كريم خميس"');
    console.log('    → ينشئ مستخدم: username=kareem, password=MyPass123, fullName=كريم خميس\n');
    process.exit(0);
}

// Run the function
quickCreateAdmin();

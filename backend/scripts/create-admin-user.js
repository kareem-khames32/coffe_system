const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const readline = require('readline');
require('dotenv').config();

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Promisify question
function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function createAdminUser() {
    let connection;

    try {
        console.log('\n═══════════════════════════════════════════');
        console.log('   إنشاء مستخدم Admin بجميع الصلاحيات');
        console.log('═══════════════════════════════════════════\n');

        // Get username from user
        const username = await question('أدخل اسم المستخدم (username): ');
        if (!username || username.trim() === '') {
            console.log('\n✗ اسم المستخدم مطلوب!');
            rl.close();
            process.exit(1);
        }

        // Get full name
        const fullName = await question('أدخل الاسم الكامل: ');
        if (!fullName || fullName.trim() === '') {
            console.log('\n✗ الاسم الكامل مطلوب!');
            rl.close();
            process.exit(1);
        }

        // Get password
        const password = await question('أدخل كلمة المرور (أو اضغط Enter لاستخدام "Admin@123"): ');
        const finalPassword = password.trim() === '' ? 'Admin@123' : password;

        rl.close();

        // Create database connection
        console.log('\n⏳ جاري الاتصال بقاعدة البيانات...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'coffee_shop'
        });

        console.log('✓ تم الاتصال بقاعدة البيانات');

        // Hash the password
        console.log('⏳ جاري تشفير كلمة المرور...');
        const hashedPassword = await bcrypt.hash(finalPassword, 10);
        console.log('✓ تم تشفير كلمة المرور');

        // Check if username exists
        const [existing] = await connection.query(
            'SELECT * FROM users WHERE username = ?',
            [username.trim()]
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
                [hashedPassword, fullName.trim(), username.trim()]
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
                [username.trim(), hashedPassword, fullName.trim()]
            );
            console.log('✓ تم إنشاء المستخدم بنجاح');
        }

        console.log('\n═══════════════════════════════════════════');
        console.log('✓ تم إنشاء/تحديث مستخدم Admin بنجاح!');
        console.log('═══════════════════════════════════════════');
        console.log(`اسم المستخدم: ${username}`);
        console.log(`كلمة المرور: ${finalPassword}`);
        console.log(`الاسم الكامل: ${fullName}`);
        console.log('الصلاحيات: جميع الصلاحيات (Admin)');
        console.log('═══════════════════════════════════════════\n');

        // Show all permissions
        console.log('الصلاحيات الممنوحة:');
        console.log('  ✓ إجراء المبيعات (can_make_sales)');
        console.log('  ✓ تعديل الطلبات (can_edit_orders)');
        console.log('  ✓ إلغاء الطلبات (can_cancel_orders)');
        console.log('  ✓ عرض تفاصيل الطلبات (can_view_order_details)');
        console.log('  ✓ إدارة المنتجات (can_manage_products)');
        console.log('  ✓ إدارة المخزون (can_manage_inventory)');
        console.log('  ✓ عرض التقارير (can_view_reports)');
        console.log('  ✓ إدارة المستخدمين (can_manage_users)');
        console.log('  ✓ إدارة الإعدادات (can_manage_settings)');
        console.log('  ✓ إضافة المصروفات والمشتريات (can_add_expenses)\n');

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

// Run the function
createAdminUser();

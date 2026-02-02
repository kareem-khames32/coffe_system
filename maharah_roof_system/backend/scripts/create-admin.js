const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createAdmin() {
    let connection;

    try {
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'coffee_shop'
        });

        console.log('✓ متصل بقاعدة البيانات');

        // Hash the password
        const password = 'Admin@123';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('✓ تم تشفير كلمة المرور');

        // Check if admin user exists
        const [existing] = await connection.query(
            'SELECT * FROM users WHERE username = ?',
            ['admin']
        );

        if (existing.length > 0) {
            // Update existing admin user
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
                    is_active = 1
                WHERE username = 'admin'`,
                [hashedPassword, 'المدير العام']
            );
            console.log('✓ تم تحديث مستخدم Admin الموجود');
        } else {
            // Create new admin user
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
                    is_active
                ) VALUES (?, ?, ?, 'admin', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1)`,
                ['admin', hashedPassword, 'المدير العام']
            );
            console.log('✓ تم إنشاء مستخدم Admin جديد');
        }

        console.log('\n═══════════════════════════════════');
        console.log('✓ تم إنشاء/تحديث مستخدم Admin بنجاح!');
        console.log('═══════════════════════════════════');
        console.log('اسم المستخدم: admin');
        console.log('كلمة المرور: Admin@123');
        console.log('═══════════════════════════════════\n');

    } catch (error) {
        console.error('✗ حدث خطأ:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('✓ تم إغلاق الاتصال بقاعدة البيانات');
        }
    }
}

// Run the function
createAdmin();

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupUsers() {
    let connection;

    try {
        console.log('\n═══════════════════════════════════════════');
        console.log('   إنشاء مستخدمين Admin');
        console.log('═══════════════════════════════════════════\n');

        // Create database connection
        console.log('⏳ جاري الاتصال بقاعدة البيانات...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'coffee_shop'
        });

        console.log('✓ تم الاتصال بقاعدة البيانات\n');

        // كلمة المرور البسيطة
        const password = '123456';
        console.log('⏳ جاري تشفير كلمة المرور: 123456');
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('✓ تم تشفير كلمة المرور\n');
        console.log('Hash:', hashedPassword, '\n');

        // المستخدمين المطلوب إنشاؤهم
        const users = [
            { username: 'kareem', fullName: 'كريم خميس' },
            { username: 'admin', fullName: 'المدير العام' },
            { username: 'manager', fullName: 'مدير المقهى' }
        ];

        for (const user of users) {
            console.log(`⏳ جاري معالجة المستخدم: ${user.username}`);

            // حذف المستخدم القديم إذا كان موجوداً
            await connection.query(
                'DELETE FROM users WHERE username = ?',
                [user.username]
            );

            // إنشاء المستخدم الجديد
            await connection.query(
                `INSERT INTO users (
                    username, password, full_name, role,
                    can_make_sales, can_view_inventory, can_edit_inventory, can_view_order_details,
                    can_cancel_orders, can_edit_orders, can_view_reports, can_add_expenses,
                    can_manage_offers, is_active
                ) VALUES (?, ?, ?, 'admin', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1)`,
                [user.username, hashedPassword, user.fullName]
            );

            console.log(`✓ تم إنشاء المستخدم: ${user.username}`);
        }

        // التحقق من المستخدمين
        console.log('\n⏳ جاري التحقق من المستخدمين...');
        const [allUsers] = await connection.query(
            `SELECT id, username, full_name, role,
                    can_make_sales, can_view_inventory, can_edit_inventory,
                    can_view_order_details, can_cancel_orders, can_edit_orders,
                    can_view_reports, can_add_expenses, can_manage_offers, is_active
             FROM users
             WHERE username IN ('kareem', 'admin', 'manager')`
        );

        console.log('\n✓ المستخدمين المُنشأين:');
        console.log('═══════════════════════════════════════════');
        allUsers.forEach(user => {
            console.log(`\nID: ${user.id}`);
            console.log(`اسم المستخدم: ${user.username}`);
            console.log(`الاسم الكامل: ${user.full_name}`);
            console.log(`الدور: ${user.role}`);
            console.log(`نشط: ${user.is_active ? 'نعم' : 'لا'}`);
            console.log(`الصلاحيات:`);
            console.log(`  - إجراء المبيعات: ${user.can_make_sales ? '✓' : '✗'}`);
            console.log(`  - عرض المخزون: ${user.can_view_inventory ? '✓' : '✗'}`);
            console.log(`  - تعديل المخزون: ${user.can_edit_inventory ? '✓' : '✗'}`);
            console.log(`  - عرض تفاصيل الطلبات: ${user.can_view_order_details ? '✓' : '✗'}`);
            console.log(`  - إلغاء الطلبات: ${user.can_cancel_orders ? '✓' : '✗'}`);
            console.log(`  - تعديل الطلبات: ${user.can_edit_orders ? '✓' : '✗'}`);
            console.log(`  - عرض التقارير: ${user.can_view_reports ? '✓' : '✗'}`);
            console.log(`  - إضافة المصروفات: ${user.can_add_expenses ? '✓' : '✗'}`);
            console.log(`  - إدارة العروض: ${user.can_manage_offers ? '✓' : '✗'}`);
        });

        console.log('\n═══════════════════════════════════════════');
        console.log('✓ تم إنشاء جميع المستخدمين بنجاح!');
        console.log('═══════════════════════════════════════════');
        console.log('\nمعلومات تسجيل الدخول:');
        console.log('─────────────────────────────────────────');
        console.log('1. اسم المستخدم: kareem');
        console.log('   كلمة المرور: 123456');
        console.log('─────────────────────────────────────────');
        console.log('2. اسم المستخدم: admin');
        console.log('   كلمة المرور: 123456');
        console.log('─────────────────────────────────────────');
        console.log('3. اسم المستخدم: manager');
        console.log('   كلمة المرور: 123456');
        console.log('─────────────────────────────────────────\n');

        // اختبار تسجيل الدخول
        console.log('⏳ جاري اختبار تسجيل الدخول...');
        const testResult = await bcrypt.compare('123456', hashedPassword);
        console.log(`✓ اختبار كلمة المرور: ${testResult ? 'نجح ✓' : 'فشل ✗'}\n`);

    } catch (error) {
        console.error('\n✗ حدث خطأ:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('✗ تأكد من أن MySQL يعمل وأن معلومات الاتصال صحيحة في ملف .env');
        } else if (error.code === 'ER_NO_SUCH_TABLE') {
            console.error('✗ جدول users غير موجود! قم بتشغيل database.sql أولاً');
        } else {
            console.error('تفاصيل الخطأ:', error);
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
setupUsers();

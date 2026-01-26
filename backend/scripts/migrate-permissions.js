/**
 * Migration Script: Update permissions columns
 *
 * This script updates the users table to use the 9 standard permissions:
 * 1. can_make_sales - إجراء مبيعات
 * 2. can_view_inventory - عرض المخزون
 * 3. can_manage_inventory - إدارة المخزون
 * 4. can_add_expenses - إضافة مصروفات
 * 5. can_view_reports - عرض التقارير
 * 6. can_manage_offers - إدارة العروض
 * 7. can_manage_online_orders - إدارة الطلبات الأونلاين
 * 8. can_view_order_details - عرض تفاصيل الطلبات
 * 9. can_cancel_edit_orders - إلغاء وتعديل الطلبات
 *
 * Run: node scripts/migrate-permissions.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function migratePermissions() {
    let connection;

    try {
        console.log('🔄 بدء تحديث أعمدة الصلاحيات...\n');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            database: process.env.DB_NAME || 'coffee_system'
        });

        console.log('✅ تم الاتصال بقاعدة البيانات\n');

        // Check existing columns
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
        `, [process.env.DB_NAME || 'coffee_system']);

        const existingColumns = columns.map(c => c.COLUMN_NAME);
        console.log('📋 الأعمدة الموجودة:', existingColumns.filter(c => c.startsWith('can_')).join(', '));

        // Step 1: Add new columns if they don't exist
        console.log('\n📝 الخطوة 1: إضافة الأعمدة الجديدة...');

        if (!existingColumns.includes('can_manage_inventory')) {
            await connection.query('ALTER TABLE users ADD COLUMN can_manage_inventory TINYINT(1) DEFAULT 0');
            console.log('  ✓ تم إضافة can_manage_inventory');
        } else {
            console.log('  - can_manage_inventory موجود بالفعل');
        }

        if (!existingColumns.includes('can_cancel_edit_orders')) {
            await connection.query('ALTER TABLE users ADD COLUMN can_cancel_edit_orders TINYINT(1) DEFAULT 0');
            console.log('  ✓ تم إضافة can_cancel_edit_orders');
        } else {
            console.log('  - can_cancel_edit_orders موجود بالفعل');
        }

        if (!existingColumns.includes('can_manage_online_orders')) {
            await connection.query('ALTER TABLE users ADD COLUMN can_manage_online_orders TINYINT(1) DEFAULT 0');
            console.log('  ✓ تم إضافة can_manage_online_orders');
        } else {
            console.log('  - can_manage_online_orders موجود بالفعل');
        }

        // Step 2: Migrate data from old columns
        console.log('\n📝 الخطوة 2: نقل البيانات من الأعمدة القديمة...');

        if (existingColumns.includes('can_edit_inventory')) {
            await connection.query('UPDATE users SET can_manage_inventory = can_edit_inventory WHERE can_edit_inventory IS NOT NULL');
            console.log('  ✓ تم نقل can_edit_inventory -> can_manage_inventory');
        }

        if (existingColumns.includes('can_cancel_orders') || existingColumns.includes('can_edit_orders')) {
            let updateQuery = 'UPDATE users SET can_cancel_edit_orders = (';
            const parts = [];

            if (existingColumns.includes('can_cancel_orders')) {
                parts.push('COALESCE(can_cancel_orders, 0)');
            }
            if (existingColumns.includes('can_edit_orders')) {
                parts.push('COALESCE(can_edit_orders, 0)');
            }

            if (parts.length > 0) {
                updateQuery += parts.join(' OR ') + ')';
                await connection.query(updateQuery);
                console.log('  ✓ تم نقل can_cancel_orders + can_edit_orders -> can_cancel_edit_orders');
            }
        }

        // Step 3: Update admin users to have all permissions
        console.log('\n📝 الخطوة 3: تحديث صلاحيات المدراء...');
        await connection.query(`
            UPDATE users SET
                can_manage_inventory = 1,
                can_cancel_edit_orders = 1,
                can_manage_online_orders = 1
            WHERE role = 'admin'
        `);
        console.log('  ✓ تم تحديث صلاحيات المدراء');

        // Step 4: Drop old columns
        console.log('\n📝 الخطوة 4: حذف الأعمدة القديمة...');

        if (existingColumns.includes('can_edit_inventory')) {
            await connection.query('ALTER TABLE users DROP COLUMN can_edit_inventory');
            console.log('  ✓ تم حذف can_edit_inventory');
        }

        if (existingColumns.includes('can_cancel_orders')) {
            await connection.query('ALTER TABLE users DROP COLUMN can_cancel_orders');
            console.log('  ✓ تم حذف can_cancel_orders');
        }

        if (existingColumns.includes('can_edit_orders')) {
            await connection.query('ALTER TABLE users DROP COLUMN can_edit_orders');
            console.log('  ✓ تم حذف can_edit_orders');
        }

        // Verify the changes
        console.log('\n📋 التحقق من النتائج:');
        const [users] = await connection.query(`
            SELECT id, username, full_name, role,
                   can_make_sales, can_view_inventory, can_manage_inventory,
                   can_add_expenses, can_view_reports, can_manage_offers,
                   can_manage_online_orders, can_view_order_details, can_cancel_edit_orders
            FROM users
        `);

        console.log('\n👥 المستخدمين:');
        users.forEach(user => {
            console.log(`  - ${user.full_name} (${user.role})`);
        });

        console.log('\n✅ تم تحديث أعمدة الصلاحيات بنجاح!');
        console.log('\nالصلاحيات الـ 9 الجديدة:');
        console.log('  1. can_make_sales - إجراء مبيعات');
        console.log('  2. can_view_inventory - عرض المخزون');
        console.log('  3. can_manage_inventory - إدارة المخزون');
        console.log('  4. can_add_expenses - إضافة مصروفات');
        console.log('  5. can_view_reports - عرض التقارير');
        console.log('  6. can_manage_offers - إدارة العروض');
        console.log('  7. can_manage_online_orders - إدارة الطلبات الأونلاين');
        console.log('  8. can_view_order_details - عرض تفاصيل الطلبات');
        console.log('  9. can_cancel_edit_orders - إلغاء وتعديل الطلبات');

    } catch (error) {
        console.error('❌ خطأ:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

migratePermissions();

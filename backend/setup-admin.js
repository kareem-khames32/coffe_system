require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function setupAdmin() {
    try {
        console.log('🔧 Setting up admin user...\n');

        // Create connection
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'cafe_management',
        });

        console.log('✅ Connected to database');

        // Hash password
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('✅ Password hashed');

        // Delete old admin if exists
        await connection.execute('DELETE FROM users WHERE username = ?', ['admin']);
        console.log('✅ Removed old admin user (if existed)');

        // Insert new admin
        await connection.execute(
            `INSERT INTO users (username, password, full_name, role, can_make_sales,
             can_view_inventory, can_edit_inventory, can_view_order_details,
             can_cancel_orders, can_edit_orders, can_view_reports, can_add_expenses,
             can_manage_offers)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            ['admin', hashedPassword, 'System Administrator', 'admin',
             true, true, true, true, true, true, true, true, true]
        );

        console.log('✅ Created new admin user');
        console.log('\n===========================================');
        console.log('✅ Admin user setup complete!');
        console.log('===========================================');
        console.log('Username: admin');
        console.log('Password: admin123');
        console.log('===========================================\n');

        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

setupAdmin();

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function setupSystem() {
    console.log('\n🔧 Setting up complete system...\n');

    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'kareem123',
        database: 'cafe_management',
        multipleStatements: true
    });

    try {
        // 1. Create missing tables
        console.log('📋 Step 1: Creating missing tables...');
        const createTablesSql = fs.readFileSync(path.join(__dirname, 'create-missing-tables.sql'), 'utf8');
        await connection.query(createTablesSql);
        console.log('   ✅ Tables created (offers, settings, daily_discounts)\n');

        // 2. Create admin user
        console.log('👤 Step 2: Creating admin user...');
        const passwordHash = await bcrypt.hash('admin123', 10);

        // Check if admin exists
        const [existing] = await connection.query('SELECT id FROM users WHERE username = ?', ['admin']);

        if (existing.length > 0) {
            // Update existing admin
            await connection.query(
                'UPDATE users SET password = ?, full_name = ?, role = ?, is_active = TRUE WHERE username = ?',
                [passwordHash, 'Admin User', 'admin', 'admin']
            );
            console.log('   ✅ Admin user updated\n');
        } else {
            // Create new admin
            await connection.query(
                'INSERT INTO users (username, password, full_name, role, is_active) VALUES (?, ?, ?, ?, TRUE)',
                ['admin', passwordHash, 'Admin User', 'admin']
            );
            console.log('   ✅ Admin user created\n');
        }

        // 3. Verify setup
        console.log('🔍 Step 3: Verifying setup...');

        const [tables] = await connection.query(`
            SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = 'cafe_management'
            AND TABLE_NAME IN ('settings', 'offers', 'daily_discounts', 'users')
        `);

        const [adminUser] = await connection.query(
            'SELECT id, username, full_name, role FROM users WHERE username = ?',
            ['admin']
        );

        console.log('   ✅ Tables found:', tables.map(t => t.TABLE_NAME).join(', '));
        console.log('   ✅ Admin user:', adminUser[0]);
        console.log('\n╔════════════════════════════════════════╗');
        console.log('║  ✅ System setup completed!           ║');
        console.log('╠════════════════════════════════════════╣');
        console.log('║  Login credentials:                    ║');
        console.log('║  Username: admin                       ║');
        console.log('║  Password: admin123                    ║');
        console.log('╚════════════════════════════════════════╝\n');

    } catch (error) {
        console.error('❌ Setup error:', error.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

setupSystem();

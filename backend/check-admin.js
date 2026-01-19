const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function checkAdmin() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'kareem123',
        database: 'cafe_management'
    });

    try {
        // Get admin user
        const [users] = await connection.query(
            'SELECT id, username, password, full_name, role FROM users WHERE username = ?',
            ['admin']
        );

        if (users.length === 0) {
            console.log('❌ Admin user NOT found!');
            return;
        }

        const admin = users[0];
        console.log('\n📊 Admin User Info:');
        console.log('   ID:', admin.id);
        console.log('   Username:', admin.username);
        console.log('   Full Name:', admin.full_name);
        console.log('   Role:', admin.role);
        console.log('   Password Hash:', admin.password.substring(0, 20) + '...');

        // Test password
        const testPassword = 'admin123';
        const isValid = await bcrypt.compare(testPassword, admin.password);

        console.log('\n🔐 Password Test:');
        console.log('   Testing password:', testPassword);
        console.log('   Result:', isValid ? '✅ VALID' : '❌ INVALID');

        if (!isValid) {
            console.log('\n🔧 Fixing password...');
            const newHash = await bcrypt.hash('admin123', 10);
            await connection.query(
                'UPDATE users SET password = ? WHERE username = ?',
                [newHash, 'admin']
            );
            console.log('   ✅ Password updated!');

            // Test again
            const [updatedUsers] = await connection.query(
                'SELECT password FROM users WHERE username = ?',
                ['admin']
            );
            const isValidNow = await bcrypt.compare('admin123', updatedUsers[0].password);
            console.log('   ✅ Verification:', isValidNow ? 'VALID' : 'STILL INVALID');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await connection.end();
    }
}

checkAdmin();

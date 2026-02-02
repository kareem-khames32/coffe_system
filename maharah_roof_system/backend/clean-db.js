const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function cleanDatabase() {
    console.log('\n🧹 Cleaning test data from database...\n');

    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'kareem123',
        database: 'cafe_management',
        multipleStatements: true
    });

    try {
        // Read SQL file
        const sqlFile = path.join(__dirname, 'clean-test-data.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        // Execute SQL
        await connection.query(sql);

        console.log('✅ Database cleaned successfully!\n');
        console.log('📊 Ready for fresh testing!\n');
    } catch (error) {
        console.error('❌ Error cleaning database:', error.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

cleanDatabase();

const mysql = require('mysql2');
require('dotenv').config();

console.log('=== Testing MySQL Connection ===');
console.log('Connecting with:');
console.log('Host:', process.env.DB_HOST);
console.log('User:', process.env.DB_USER);
console.log('Password:', '***' + process.env.DB_PASSWORD.substring(1) + '***');
console.log('Database:', process.env.DB_NAME);
console.log('Port:', process.env.DB_PORT);
console.log('');

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Connection failed!');
        console.error('Error Code:', err.code);
        console.error('Error Number:', err.errno);
        console.error('SQL State:', err.sqlState);
        console.error('SQL Message:', err.sqlMessage);
        console.error('Full Error:', err);
        process.exit(1);
    }

    console.log('✅ Connected successfully!');
    console.log('Connection ID:', connection.threadId);

    // Try a simple query
    connection.query('SELECT 1 + 1 AS result', (error, results) => {
        if (error) {
            console.error('❌ Query failed:', error);
        } else {
            console.log('✅ Query successful:', results);
        }
        connection.end();
    });
});

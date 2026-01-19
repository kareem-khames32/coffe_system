const mysql = require('mysql2');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cafe_management',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci'
});

// Promisify for async/await
const promisePool = pool.promise();

// Test connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:');
        console.error('Error Code:', err.code);
        console.error('Error Message:', err.message);
        console.error('SQL State:', err.sqlState);
        console.error('\n📋 Current Configuration:');
        console.error('Host:', process.env.DB_HOST || 'localhost');
        console.error('User:', process.env.DB_USER || 'root');
        console.error('Password:', process.env.DB_PASSWORD ? '***SET***' : '***EMPTY***');
        console.error('Database:', process.env.DB_NAME || 'cafe_management');
        console.error('Port:', process.env.DB_PORT || 3306);
        return;
    }
    console.log('✅ Database connected successfully');
    connection.release();
});

module.exports = promisePool;

const mysql = require('mysql2/promise');
require('dotenv').config();

async function clearAllOrders() {
    let connection;

    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('🗑️  Clearing all old orders...\n');

        // Start transaction
        await connection.beginTransaction();

        // 1. Delete order items first (foreign key constraint)
        const [orderItemsResult] = await connection.query('DELETE FROM order_items');
        console.log(`✅ Deleted ${orderItemsResult.affectedRows} order items`);

        // 2. Delete order edit history if exists
        try {
            const [historyResult] = await connection.query('DELETE FROM order_edit_history');
            console.log(`✅ Deleted ${historyResult.affectedRows} order edit history records`);
        } catch (err) {
            console.log('ℹ️  No order_edit_history table found (OK)');
        }

        // 3. Delete orders
        const [ordersResult] = await connection.query('DELETE FROM orders');
        console.log(`✅ Deleted ${ordersResult.affectedRows} orders`);

        // Commit transaction
        await connection.commit();

        console.log('\n✅ All old orders cleared successfully!');
        console.log('🎯 Ready for fresh testing!\n');

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('❌ Error clearing orders:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

clearAllOrders();

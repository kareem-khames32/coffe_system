const mysql = require('mysql2/promise');
require('dotenv').config();

async function clearAllDataExceptUsers() {
    let connection;

    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('🗑️  Clearing all data (except users)...\n');

        // Start transaction
        await connection.beginTransaction();

        // Delete in correct order (respecting foreign keys)

        // 1. Delete order items first (depend on orders)
        const [orderItemsResult] = await connection.query('DELETE FROM order_items');
        console.log(`✅ Deleted ${orderItemsResult.affectedRows} order items`);

        // 2. Delete order edit history if exists
        try {
            const [historyResult] = await connection.query('DELETE FROM order_edit_history');
            console.log(`✅ Deleted ${historyResult.affectedRows} order edit history records`);
        } catch (err) {
            console.log('ℹ️  No order_edit_history table (OK)');
        }

        // 3. Delete orders
        const [ordersResult] = await connection.query('DELETE FROM orders');
        console.log(`✅ Deleted ${ordersResult.affectedRows} orders`);

        // 4. Delete product recipes (depend on products)
        try {
            const [recipesResult] = await connection.query('DELETE FROM product_recipes');
            console.log(`✅ Deleted ${recipesResult.affectedRows} product recipes`);
        } catch (err) {
            console.log('ℹ️  No product_recipes table (OK)');
        }

        // 5. Delete products
        try {
            const [productsResult] = await connection.query('DELETE FROM products');
            console.log(`✅ Deleted ${productsResult.affectedRows} products`);
        } catch (err) {
            console.log('ℹ️  No products table (OK)');
        }

        // 6. Delete raw materials
        try {
            const [rawMaterialsResult] = await connection.query('DELETE FROM raw_materials');
            console.log(`✅ Deleted ${rawMaterialsResult.affectedRows} raw materials`);
        } catch (err) {
            console.log('ℹ️  No raw_materials table (OK)');
        }

        // 7. Delete categories
        try {
            const [categoriesResult] = await connection.query('DELETE FROM categories');
            console.log(`✅ Deleted ${categoriesResult.affectedRows} categories`);
        } catch (err) {
            console.log('ℹ️  No categories table (OK)');
        }

        // Commit transaction
        await connection.commit();

        console.log('\n✅ All data cleared successfully!');
        console.log('👥 Users preserved');
        console.log('🎯 Ready for fresh testing!\n');

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('❌ Error clearing data:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

clearAllDataExceptUsers();

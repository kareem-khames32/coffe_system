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
        try {
            const [orderItemsResult] = await connection.query('DELETE FROM order_items');
            console.log(`✅ Deleted ${orderItemsResult.affectedRows} order items`);
        } catch (err) {
            console.log('ℹ️  No order_items table (OK)');
        }

        // 2. Delete order edit history
        try {
            const [historyResult] = await connection.query('DELETE FROM order_edit_history');
            console.log(`✅ Deleted ${historyResult.affectedRows} order edit history records`);
        } catch (err) {
            console.log('ℹ️  No order_edit_history table (OK)');
        }

        // 3. Delete orders
        try {
            const [ordersResult] = await connection.query('DELETE FROM orders');
            console.log(`✅ Deleted ${ordersResult.affectedRows} orders`);
        } catch (err) {
            console.log('ℹ️  No orders table (OK)');
        }

        // 4. Delete product recipes (depend on products)
        try {
            const [recipesResult] = await connection.query('DELETE FROM product_recipes');
            console.log(`✅ Deleted ${recipesResult.affectedRows} product recipes`);
        } catch (err) {
            console.log('ℹ️  No product_recipes table (OK)');
        }

        // 5. Delete inventory transactions
        try {
            const [inventoryTransResult] = await connection.query('DELETE FROM inventory_transactions');
            console.log(`✅ Deleted ${inventoryTransResult.affectedRows} inventory transactions`);
        } catch (err) {
            console.log('ℹ️  No inventory_transactions table (OK)');
        }

        // 6. Delete inventory purchase items
        try {
            const [purchaseItemsResult] = await connection.query('DELETE FROM inventory_purchase_items');
            console.log(`✅ Deleted ${purchaseItemsResult.affectedRows} inventory purchase items`);
        } catch (err) {
            console.log('ℹ️  No inventory_purchase_items table (OK)');
        }

        // 7. Delete inventory purchases
        try {
            const [purchasesResult] = await connection.query('DELETE FROM inventory_purchases');
            console.log(`✅ Deleted ${purchasesResult.affectedRows} inventory purchases`);
        } catch (err) {
            console.log('ℹ️  No inventory_purchases table (OK)');
        }

        // 8. Delete products
        try {
            const [productsResult] = await connection.query('DELETE FROM products');
            console.log(`✅ Deleted ${productsResult.affectedRows} products`);
        } catch (err) {
            console.log('ℹ️  No products table (OK)');
        }

        // 9. Delete raw materials
        try {
            const [rawMaterialsResult] = await connection.query('DELETE FROM raw_materials');
            console.log(`✅ Deleted ${rawMaterialsResult.affectedRows} raw materials`);
        } catch (err) {
            console.log('ℹ️  No raw_materials table (OK)');
        }

        // 10. Delete suppliers
        try {
            const [suppliersResult] = await connection.query('DELETE FROM suppliers');
            console.log(`✅ Deleted ${suppliersResult.affectedRows} suppliers`);
        } catch (err) {
            console.log('ℹ️  No suppliers table (OK)');
        }

        // 11. Delete warehouses
        try {
            const [warehousesResult] = await connection.query('DELETE FROM warehouses');
            console.log(`✅ Deleted ${warehousesResult.affectedRows} warehouses`);
        } catch (err) {
            console.log('ℹ️  No warehouses table (OK)');
        }

        // 12. Delete categories
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

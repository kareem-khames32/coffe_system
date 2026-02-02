const mysql = require('mysql2/promise');

async function checkSchema() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'kareem123',
        database: 'cafe_management'
    });

    try {
        const tables = ['warehouses', 'suppliers', 'categories', 'raw_materials', 'products', 'product_recipes', 'orders', 'order_items', 'inventory_purchases', 'inventory_purchase_items'];

        for (const table of tables) {
            try {
                console.log(`\n📋 ${table.toUpperCase()} TABLE SCHEMA:`);
                console.log('═'.repeat(60));
                const [cols] = await connection.query(`DESCRIBE ${table}`);
                cols.forEach(col => {
                    console.log(`  ${col.Field.padEnd(20)} ${col.Type.padEnd(20)} ${col.Null} ${col.Key} ${col.Default || ''}`);
                });
            } catch (err) {
                console.log(`  ⚠️  Table not found: ${table}`);
            }
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await connection.end();
    }
}

checkSchema();

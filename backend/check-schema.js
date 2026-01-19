const mysql = require('mysql2/promise');

async function checkSchema() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'kareem123',
        database: 'cafe_management'
    });

    try {
        console.log('\n📋 PRODUCTS TABLE SCHEMA:');
        console.log('═'.repeat(60));
        const [productsCols] = await connection.query('DESCRIBE products');
        productsCols.forEach(col => {
            console.log(`  ${col.Field.padEnd(20)} ${col.Type.padEnd(20)} ${col.Null} ${col.Key} ${col.Default || ''}`);
        });

        console.log('\n📋 ORDERS TABLE SCHEMA:');
        console.log('═'.repeat(60));
        const [ordersCols] = await connection.query('DESCRIBE orders');
        ordersCols.forEach(col => {
            console.log(`  ${col.Field.padEnd(20)} ${col.Type.padEnd(20)} ${col.Null} ${col.Key} ${col.Default || ''}`);
        });

        console.log('\n📋 RAW_MATERIALS TABLE SCHEMA:');
        console.log('═'.repeat(60));
        const [rawMaterialsCols] = await connection.query('DESCRIBE raw_materials');
        rawMaterialsCols.forEach(col => {
            console.log(`  ${col.Field.padEnd(20)} ${col.Type.padEnd(20)} ${col.Null} ${col.Key} ${col.Default || ''}`);
        });

        console.log('\n📋 ORDER_ITEMS TABLE SCHEMA:');
        console.log('═'.repeat(60));
        const [orderItemsCols] = await connection.query('DESCRIBE order_items');
        orderItemsCols.forEach(col => {
            console.log(`  ${col.Field.padEnd(20)} ${col.Type.padEnd(20)} ${col.Null} ${col.Key} ${col.Default || ''}`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await connection.end();
    }
}

checkSchema();

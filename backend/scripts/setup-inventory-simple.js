/**
 * Simple Setup Script for Inventory System (no dependencies)
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database config - hardcoded for simplicity
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'kareem123',
  database: 'cafe_management',
  multipleStatements: true
};

async function setupInventorySystem() {
  let connection;
  try {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  Setup Inventory Management System    ║');
    console.log('╚════════════════════════════════════════╝\n');

    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected!\n');

    // Read SQL file
    const sqlFilePath = path.join(__dirname, '..', 'database', 'create_inventory_system.sql');
    console.log('📂 Reading SQL file...');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('🔧 Creating tables...\n');

    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));

    for (const statement of statements) {
      try {
        if (statement.toLowerCase().includes('select')) {
          const [results] = await connection.query(statement);
          if (results.length > 0) {
            console.log('\n' + results[0].Status + '\n');
          }
        } else {
          await connection.query(statement);
          if (statement.toLowerCase().includes('create table')) {
            // Extract table name
            const match = statement.match(/create table (?:if not exists )?`?(\w+)`?/i);
            if (match) {
              console.log(`✅ Table '${match[1]}' created`);
            }
          }
        }
      } catch (error) {
        // Ignore "already exists" errors
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          const match = statement.match(/create table (?:if not exists )?`?(\w+)`?/i);
          if (match) {
            console.log(`⚠️  Table '${match[1]}' already exists (skipped)`);
          }
          continue;
        }
        throw error;
      }
    }

    console.log('\n🎉 SUCCESS! Inventory Management System setup complete.\n');
    console.log('Tables created:');
    console.log('  • suppliers (الموردين)');
    console.log('  • raw_materials (المواد الخام)');
    console.log('  • inventory_purchases (مشتريات المخزن)');
    console.log('  • inventory_purchase_items (تفاصيل المشتريات)');
    console.log('  • product_recipes (وصفات المنتجات)');
    console.log('  • inventory_transactions (سجل حركة المخزن)\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.sqlState) console.error('SQL State:', error.sqlState);
    if (error.sqlMessage) console.error('SQL Message:', error.sqlMessage);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed\n');
    }
  }
}

setupInventorySystem();

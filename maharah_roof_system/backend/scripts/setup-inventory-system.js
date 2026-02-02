/**
 * Setup Inventory Management & Recipe Costing System
 * Usage: node scripts/setup-inventory-system.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cafe_management',
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

    // Remove DELIMITER statements as they don't work well with Node.js mysql2
    const cleanedSql = sql
      .replace(/DELIMITER \$\$/gi, '')
      .replace(/DELIMITER ;/gi, '')
      .replace(/\$\$/g, ';');

    console.log('🔧 Creating tables...\n');

    // Split by semicolon and execute each statement
    const statements = cleanedSql
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
          } else if (statement.toLowerCase().includes('create trigger')) {
            const match = statement.match(/create trigger (\w+)/i);
            if (match) {
              console.log(`✅ Trigger '${match[1]}' created`);
            }
          }
        }
      } catch (error) {
        // Ignore "already exists" errors
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_TRG_ALREADY_EXISTS') {
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

    console.log('Now restart the backend server!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('SQL State:', error.sqlState);
    console.error('SQL Message:', error.sqlMessage);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

setupInventorySystem();

const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixDailyDiscountsTable() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   Fix Daily Discounts Table            ║');
  console.log('╚════════════════════════════════════════╝\n');

  let connection;

  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'cafe_management',
      port: process.env.DB_PORT || 3306
    });
    console.log('✅ Connected!\n');

    console.log('🔧 Adding missing columns to daily_discounts table...\n');

    // Add description column
    try {
      await connection.query('ALTER TABLE daily_discounts ADD COLUMN description TEXT AFTER name');
      console.log('✅ Added description column');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  description column already exists');
      } else {
        console.log('⚠️  Could not add description:', e.message);
      }
    }

    // Add target_date column
    try {
      await connection.query('ALTER TABLE daily_discounts ADD COLUMN target_date DATE');
      console.log('✅ Added target_date column');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  target_date column already exists');
      } else {
        console.log('⚠️  Could not add target_date:', e.message);
      }
    }

    console.log('\n📋 Daily_discounts table structure:');
    const [columns] = await connection.query('SHOW COLUMNS FROM daily_discounts');
    console.table(columns.map(col => ({ Field: col.Field, Type: col.Type })));

    console.log('\n🎉 SUCCESS! Daily discounts table fixed.\n');
    console.log('Now you can create daily discounts!\n');
    console.log('Restart the backend server (type "rs" in nodemon)\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

fixDailyDiscountsTable();

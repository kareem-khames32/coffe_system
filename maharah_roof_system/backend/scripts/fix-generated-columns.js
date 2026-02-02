const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixGeneratedColumns() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   Fix Generated Columns Issue          ║');
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

    console.log('🔧 Step 1: Dropping Foreign Key Constraints...');
    try {
      await connection.query('ALTER TABLE order_edit_history DROP FOREIGN KEY order_edit_history_ibfk_3');
      console.log('✅ Foreign key dropped\n');
    } catch (e) {
      console.log('⚠️  Foreign key might not exist, continuing...\n');
    }

    console.log('🗑️  Step 2: Dropping GENERATED/VIRTUAL columns...');

    // Drop columns from orders
    try {
      await connection.query('ALTER TABLE orders DROP COLUMN total');
      console.log('✅ Dropped orders.total');
    } catch (e) {
      console.log('⚠️  orders.total not found');
    }

    try {
      await connection.query('ALTER TABLE orders DROP COLUMN cost');
      console.log('✅ Dropped orders.cost');
    } catch (e) {
      console.log('⚠️  orders.cost not found');
    }

    // Drop columns from order_items
    try {
      await connection.query('ALTER TABLE order_items DROP COLUMN price');
      console.log('✅ Dropped order_items.price');
    } catch (e) {
      console.log('⚠️  order_items.price not found');
    }

    try {
      await connection.query('ALTER TABLE order_items DROP COLUMN cost_price');
      console.log('✅ Dropped order_items.cost_price');
    } catch (e) {
      console.log('⚠️  order_items.cost_price not found');
    }

    try {
      await connection.query('ALTER TABLE order_items DROP COLUMN profit');
      console.log('✅ Dropped order_items.profit');
    } catch (e) {
      console.log('⚠️  order_items.profit not found');
    }

    // Drop columns from order_edit_history
    try {
      await connection.query('ALTER TABLE order_edit_history DROP COLUMN edited_by');
      console.log('✅ Dropped order_edit_history.edited_by');
    } catch (e) {
      console.log('⚠️  order_edit_history.edited_by not found');
    }

    try {
      await connection.query('ALTER TABLE order_edit_history DROP COLUMN changes');
      console.log('✅ Dropped order_edit_history.changes');
    } catch (e) {
      console.log('⚠️  order_edit_history.changes not found');
    }

    try {
      await connection.query('ALTER TABLE order_edit_history DROP COLUMN edited_at');
      console.log('✅ Dropped order_edit_history.edited_at');
    } catch (e) {
      console.log('⚠️  order_edit_history.edited_at not found');
    }

    console.log('\n✨ Step 3: Adding columns as REGULAR columns (not GENERATED)...\n');

    // Add regular columns to orders
    await connection.query('ALTER TABLE orders ADD COLUMN total DECIMAL(10,2) DEFAULT 0');
    console.log('✅ Added orders.total as regular column');

    await connection.query('ALTER TABLE orders ADD COLUMN cost DECIMAL(10,2) DEFAULT 0');
    console.log('✅ Added orders.cost as regular column');

    // Add regular columns to order_items
    await connection.query('ALTER TABLE order_items ADD COLUMN price DECIMAL(10,2) DEFAULT 0');
    console.log('✅ Added order_items.price as regular column');

    await connection.query('ALTER TABLE order_items ADD COLUMN cost_price DECIMAL(10,2) DEFAULT 0');
    console.log('✅ Added order_items.cost_price as regular column');

    await connection.query('ALTER TABLE order_items ADD COLUMN profit DECIMAL(10,2) DEFAULT 0');
    console.log('✅ Added order_items.profit as regular column');

    // Add regular columns to order_edit_history
    await connection.query('ALTER TABLE order_edit_history ADD COLUMN edited_by INT');
    console.log('✅ Added order_edit_history.edited_by as regular column');

    await connection.query('ALTER TABLE order_edit_history ADD COLUMN changes TEXT');
    console.log('✅ Added order_edit_history.changes as regular column');

    await connection.query('ALTER TABLE order_edit_history ADD COLUMN edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    console.log('✅ Added order_edit_history.edited_at as regular column');

    console.log('\n🔗 Step 4: Re-adding Foreign Key...');
    try {
      await connection.query('ALTER TABLE order_edit_history ADD CONSTRAINT fk_edited_by FOREIGN KEY (edited_by) REFERENCES users(id) ON DELETE SET NULL');
      console.log('✅ Foreign key re-added\n');
    } catch (e) {
      console.log('⚠️  Could not add foreign key:', e.message, '\n');
    }

    console.log('📋 Step 5: Copying values from old columns...');
    await connection.query('UPDATE orders SET total = total_amount WHERE total = 0 OR total IS NULL');
    await connection.query('UPDATE orders SET cost = total_cost WHERE cost = 0 OR cost IS NULL');
    console.log('✅ Copied values in orders table');

    await connection.query('UPDATE order_edit_history SET edited_by = user_id WHERE edited_by IS NULL');
    await connection.query('UPDATE order_edit_history SET changes = action WHERE changes IS NULL OR changes = \'\'');
    await connection.query('UPDATE order_edit_history SET edited_at = created_at WHERE edited_at IS NULL');
    console.log('✅ Copied values in order_edit_history table\n');

    console.log('🎉 SUCCESS! All columns fixed.\n');
    console.log('Now restart the backend server (type "rs" in nodemon)\n');

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

fixGeneratedColumns();

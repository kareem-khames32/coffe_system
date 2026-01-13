const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const productRoutes = require('./src/routes/productRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const offerRoutes = require('./src/routes/offerRoutes');
const expenseRoutes = require('./src/routes/expenseRoutes');
const purchaseRoutes = require('./src/routes/purchaseRoutes');
const settingsRoutes = require('./src/routes/settingsRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const dailyDiscountRoutes = require('./src/routes/dailyDiscountRoutes');
// Inventory Management Routes
const supplierRoutes = require('./src/routes/supplierRoutes');
const rawMaterialRoutes = require('./src/routes/rawMaterialRoutes');
const warehouseRoutes = require('./src/routes/warehouseRoutes');
const inventoryPurchaseRoutes = require('./src/routes/inventoryPurchaseRoutes');
const productRecipeRoutes = require('./src/routes/productRecipeRoutes');
const inventoryReportsRoutes = require('./src/routes/inventoryReportsRoutes');
const setupRoutes = require('./src/routes/setupRoutes');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/daily-discounts', dailyDiscountRoutes);
// Inventory Management Routes
app.use('/api/suppliers', supplierRoutes);
app.use('/api/raw-materials', rawMaterialRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/inventory-purchases', inventoryPurchaseRoutes);
app.use('/api/recipes', productRecipeRoutes);
app.use('/api/reports/inventory', inventoryReportsRoutes);
app.use('/api/setup', setupRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error'
    });
});

// Auto-setup inventory tables on server start
const fs = require('fs');
async function setupInventoryTables() {
    try {
        const sqlFilePath = path.join(__dirname, 'database', 'create_inventory_system.sql');

        console.log('🔧 Setting up inventory tables...');
        console.log(`   Reading SQL file: ${sqlFilePath}`);

        const sql = fs.readFileSync(sqlFilePath, 'utf8');

        // Remove comments and split by semicolon
        const lines = sql.split('\n');
        let cleanSQL = '';
        for (const line of lines) {
            const trimmedLine = line.trim();
            // Skip comment-only lines
            if (trimmedLine.startsWith('--') || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*') || trimmedLine.length === 0) {
                continue;
            }
            // Remove inline comments
            const commentIndex = trimmedLine.indexOf('COMMENT');
            if (commentIndex > -1) {
                // Keep COMMENT clauses but clean the line
                cleanSQL += ' ' + trimmedLine;
            } else {
                cleanSQL += ' ' + trimmedLine;
            }
        }

        const statements = cleanSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && stmt.toLowerCase().includes('create table'));

        const db = require('./src/config/database');

        // Test database connection first
        try {
            await db.query('SELECT 1');
        } catch (error) {
            console.error('⚠️  Database not ready yet, skipping setup');
            return;
        }

        console.log(`   Found ${statements.length} CREATE TABLE statements`);

        let tablesCreated = 0;
        for (const statement of statements) {
            try {
                await db.query(statement);
                const match = statement.match(/create table (?:if not exists )?`?(\w+)`?/i);
                if (match) {
                    console.log(`   ✅ Table '${match[1]}' created`);
                    tablesCreated++;
                }
            } catch (error) {
                if (error.code === 'ER_TABLE_EXISTS_ERROR') {
                    const match = statement.match(/create table (?:if not exists )?`?(\w+)`?/i);
                    if (match) {
                        console.log(`   ⏭️  Table '${match[1]}' already exists`);
                    }
                } else {
                    console.error(`   ❌ Setup error: ${error.message}`);
                    console.error(`   Statement: ${statement.substring(0, 100)}...`);
                }
            }
        }

        if (tablesCreated > 0) {
            console.log(`\n✅ Inventory system ready! (${tablesCreated} tables created)\n`);
        } else {
            console.log('\n✅ All inventory tables already exist!\n');
        }

        // Run migrations
        await migrateWarehouseColumn();
        await migrateProductRecipeUnit();
    } catch (error) {
        console.error('⚠️  Could not setup inventory tables:', error.message);
        console.error('   Full error:', error);
    }
}

// Migration: Add warehouse_id to existing raw_materials table
async function migrateWarehouseColumn() {
    try {
        const db = require('./src/config/database');

        // Check if warehouse_id column exists
        const [columns] = await db.query(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'raw_materials'
            AND COLUMN_NAME = 'warehouse_id'
        `);

        if (columns.length === 0) {
            console.log('🔄 Migrating raw_materials table...');

            // Add warehouse_id column
            await db.query(`
                ALTER TABLE raw_materials
                ADD COLUMN warehouse_id INT NULL COMMENT 'المستودع' AFTER supplier_id
            `);
            console.log('   ✅ Added warehouse_id column');

            // Add foreign key
            await db.query(`
                ALTER TABLE raw_materials
                ADD CONSTRAINT fk_raw_materials_warehouse
                FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL
            `);
            console.log('   ✅ Added foreign key constraint');

            // Add index
            await db.query(`
                ALTER TABLE raw_materials
                ADD INDEX idx_warehouse (warehouse_id)
            `);
            console.log('   ✅ Added warehouse index');
            console.log('✅ Migration completed!\n');
        }
    } catch (error) {
        // Column might already exist, that's ok
        if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_DUP_KEYNAME') {
            console.log('   ⏭️  warehouse_id column already exists\n');
        } else {
            console.error('⚠️  Migration warning:', error.message);
        }
    }
}

// Migration: Add unit column to product_recipes table
async function migrateProductRecipeUnit() {
    try {
        const db = require('./src/config/database');

        // Check if unit column exists
        const [columns] = await db.query(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'product_recipes'
            AND COLUMN_NAME = 'unit'
        `);

        if (columns.length === 0) {
            console.log('🔄 Migrating product_recipes table...');

            // Add unit column
            await db.query(`
                ALTER TABLE product_recipes
                ADD COLUMN unit VARCHAR(50) NULL COMMENT 'وحدة القياس المستخدمة في الوصفة' AFTER quantity_needed
            `);
            console.log('   ✅ Added unit column to product_recipes');
            console.log('✅ Recipe migration completed!\n');
        }
    } catch (error) {
        // Column might already exist, that's ok
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('   ⏭️  unit column already exists in product_recipes\n');
        } else {
            console.error('⚠️  Recipe migration warning:', error.message);
        }
    }
}

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════╗');
    console.log('║   Cafe Management System Backend      ║');
    console.log('╠════════════════════════════════════════╣');
    console.log(`║   Server running on port: ${PORT}        ║`);
    console.log(`║   Environment: ${process.env.NODE_ENV || 'development'}        ║`);
    console.log('╚════════════════════════════════════════╝');

    // Run setup after a short delay to ensure DB is connected
    setTimeout(setupInventoryTables, 2000);
});

module.exports = app;

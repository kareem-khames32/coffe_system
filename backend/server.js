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
const inventoryPurchaseRoutes = require('./src/routes/inventoryPurchaseRoutes');
const productRecipeRoutes = require('./src/routes/productRecipeRoutes');
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
app.use('/api/inventory-purchases', inventoryPurchaseRoutes);
app.use('/api/recipes', productRecipeRoutes);
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
    } catch (error) {
        console.error('⚠️  Could not setup inventory tables:', error.message);
        console.error('   Full error:', error);
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

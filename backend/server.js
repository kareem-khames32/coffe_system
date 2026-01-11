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

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════╗');
    console.log('║   Cafe Management System Backend      ║');
    console.log('╠════════════════════════════════════════╣');
    console.log(`║   Server running on port: ${PORT}        ║`);
    console.log(`║   Environment: ${process.env.NODE_ENV || 'development'}        ║`);
    console.log('╚════════════════════════════════════════╝');
});

module.exports = app;

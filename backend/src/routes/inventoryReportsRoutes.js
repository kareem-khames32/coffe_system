const express = require('express');
const router = express.Router();
const inventoryReportsController = require('../controllers/inventoryReportsController');
const { verifyToken } = require('../middleware/auth');

// Apply authentication to all routes
router.use(verifyToken);

// Dashboard Stats
router.get('/dashboard-stats', inventoryReportsController.getDashboardStats);

// Warehouses Reports
router.get('/warehouses', inventoryReportsController.getWarehousesReport);
router.get('/warehouses/:id/details', inventoryReportsController.getWarehouseDetails);
router.get('/warehouses/:id/transactions', inventoryReportsController.getWarehouseTransactions);

// Raw Materials Reports
router.get('/materials/summary', inventoryReportsController.getMaterialsSummary);
router.get('/materials/by-value', inventoryReportsController.getMaterialsByValue);
router.get('/materials/low-stock', inventoryReportsController.getLowStockMaterials);
router.get('/materials/out-of-stock', inventoryReportsController.getOutOfStockMaterials);
router.get('/materials/no-movement', inventoryReportsController.getNoMovementMaterials);
router.get('/materials/:id/transactions', inventoryReportsController.getMaterialTransactions);
router.get('/materials/consumption', inventoryReportsController.getMaterialsConsumption);

// Suppliers Reports
router.get('/suppliers/summary', inventoryReportsController.getSuppliersSummary);
router.get('/suppliers/:id/details', inventoryReportsController.getSupplierDetails);
router.get('/suppliers/:id/purchases', inventoryReportsController.getSupplierPurchases);
router.get('/suppliers/:id/materials', inventoryReportsController.getSupplierMaterials);

// Purchases Reports
router.get('/purchases', inventoryReportsController.getPurchasesReport);
router.get('/purchases/daily', inventoryReportsController.getDailyPurchases);
router.get('/purchases/monthly', inventoryReportsController.getMonthlyPurchases);
router.get('/purchases/top-materials', inventoryReportsController.getTopPurchasedMaterials);
router.get('/purchases/material/:id/price-history', inventoryReportsController.getMaterialPriceHistory);

module.exports = router;

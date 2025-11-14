const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, checkPermission } = require('../middleware/auth');

// All routes require authentication and view reports permission
router.use(verifyToken);
router.use(checkPermission('can_view_reports'));

router.get('/dashboard', reportController.getDashboardStats);
router.get('/sales', reportController.getSalesReport);
router.get('/products', reportController.getProductsReport);
router.get('/profit', reportController.getProfitReport);
router.get('/categories', reportController.getCategorySalesReport);
router.get('/customers', reportController.getCustomerReport);
router.get('/purchases-expenses', reportController.getPurchasesAndExpensesReport);

module.exports = router;

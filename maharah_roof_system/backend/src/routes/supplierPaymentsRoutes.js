const express = require('express');
const router = express.Router();
const supplierPaymentsController = require('../controllers/supplierPaymentsController');
const { verifyToken } = require('../middleware/auth');

// Apply authentication to all routes
router.use(verifyToken);

// Get all payments
router.get('/', supplierPaymentsController.getAllPayments);

// Get payment statistics
router.get('/stats', supplierPaymentsController.getPaymentStats);

// Get unpaid purchases
router.get('/unpaid-purchases', supplierPaymentsController.getUnpaidPurchases);

// Get payments for specific supplier
router.get('/supplier/:supplier_id', supplierPaymentsController.getSupplierPayments);

// Get payments for specific purchase
router.get('/purchase/:purchase_id', supplierPaymentsController.getPurchasePayments);

// Add new payment
router.post('/', supplierPaymentsController.addPayment);

// Delete payment
router.delete('/:id', supplierPaymentsController.deletePayment);

module.exports = router;

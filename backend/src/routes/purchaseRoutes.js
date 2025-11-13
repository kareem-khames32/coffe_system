const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const { verifyToken, checkPermission } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

router.get('/', checkPermission('can_view_reports'), purchaseController.getAllPurchases);
router.get('/total', checkPermission('can_view_reports'), purchaseController.getTotalPurchases);
router.get('/:id', checkPermission('can_view_reports'), purchaseController.getPurchaseById);

router.post('/', checkPermission('can_add_expenses'), purchaseController.createPurchase);
router.put('/:id', checkPermission('can_add_expenses'), purchaseController.updatePurchase);
router.delete('/:id', checkPermission('can_add_expenses'), purchaseController.deletePurchase);

module.exports = router;

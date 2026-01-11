const express = require('express');
const router = express.Router();
const inventoryPurchaseController = require('../controllers/inventoryPurchaseController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', inventoryPurchaseController.getAllPurchases);
router.get('/:id', inventoryPurchaseController.getPurchaseById);
router.post('/', inventoryPurchaseController.createPurchase);
router.delete('/:id', inventoryPurchaseController.deletePurchase);

module.exports = router;

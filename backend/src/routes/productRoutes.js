const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, checkPermission } = require('../middleware/auth');

// Public routes (for online orders)
router.get('/available', productController.getAvailableProducts);

// Protected routes
router.get('/', verifyToken, checkPermission('can_view_inventory'), productController.getAllProducts);
router.get('/low-stock', verifyToken, checkPermission('can_view_inventory'), productController.getLowStockProducts);
router.get('/:id', verifyToken, checkPermission('can_view_inventory'), productController.getProductById);
router.get('/category/:categoryId', verifyToken, checkPermission('can_view_inventory'), productController.getProductsByCategory);

router.post('/', verifyToken, checkPermission('can_edit_inventory'), productController.createProduct);
router.put('/:id', verifyToken, checkPermission('can_edit_inventory'), productController.updateProduct);
router.patch('/:id/stock', verifyToken, checkPermission('can_edit_inventory'), productController.updateStock);
router.delete('/:id', verifyToken, checkPermission('can_edit_inventory'), productController.deleteProduct);

module.exports = router;

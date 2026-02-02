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

router.post('/', verifyToken, checkPermission('can_manage_inventory'), productController.createProduct);
router.put('/:id', verifyToken, checkPermission('can_manage_inventory'), productController.updateProduct);
router.delete('/:id', verifyToken, checkPermission('can_manage_inventory'), productController.deleteProduct);

module.exports = router;

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken, checkPermission } = require('../middleware/auth');

// Public routes (for online orders)
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Protected routes
router.post('/', verifyToken, checkPermission('can_manage_inventory'), categoryController.createCategory);
router.put('/:id', verifyToken, checkPermission('can_manage_inventory'), categoryController.updateCategory);
router.delete('/:id', verifyToken, checkPermission('can_manage_inventory'), categoryController.deleteCategory);

module.exports = router;

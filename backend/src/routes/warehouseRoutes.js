const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth.verifyToken);

// Get all warehouses
router.get('/', warehouseController.getAllWarehouses);

// Get active warehouses only
router.get('/active', warehouseController.getActiveWarehouses);

// Get warehouse by ID
router.get('/:id', warehouseController.getWarehouseById);

// Create warehouse
router.post('/', warehouseController.createWarehouse);

// Update warehouse
router.put('/:id', warehouseController.updateWarehouse);

// Delete warehouse
router.delete('/:id', warehouseController.deleteWarehouse);

module.exports = router;

const express = require('express');
const router = express.Router();
const inventoryCountsController = require('../controllers/inventoryCountsController');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Get all inventory counts
router.get('/', inventoryCountsController.getAllCounts);

// Get count by ID with items
router.get('/:id', inventoryCountsController.getCountById);

// Create new inventory count
router.post('/', inventoryCountsController.createCount);

// Add item to count
router.post('/:count_id/items', inventoryCountsController.addCountItem);

// Remove item from count
router.delete('/items/:item_id', inventoryCountsController.removeCountItem);

// Complete count
router.post('/:id/complete', inventoryCountsController.completeCount);

// Cancel count
router.post('/:id/cancel', inventoryCountsController.cancelCount);

// Get count variances
router.get('/variances/all', inventoryCountsController.getCountVariances);

// Get count statistics
router.get('/stats/summary', inventoryCountsController.getCountStats);

module.exports = router;

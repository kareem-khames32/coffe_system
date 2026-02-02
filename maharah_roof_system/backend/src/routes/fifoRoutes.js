const express = require('express');
const router = express.Router();
const fifoController = require('../controllers/fifoController');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Get available batches in FIFO order
router.get('/available-batches', fifoController.getAvailableBatches);

// Auto-consume material using FIFO logic
router.post('/auto-consume', fifoController.autoConsumeMaterial);

// Record manual consumption from specific batch
router.post('/record-consumption', fifoController.recordConsumption);

// Get consumption history
router.get('/consumption-history', fifoController.getConsumptionHistory);

// Get consumption statistics
router.get('/consumption-stats', fifoController.getConsumptionStats);

// Get specific batch consumption details
router.get('/batch/:batch_id/consumption', fifoController.getBatchConsumption);

module.exports = router;

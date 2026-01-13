const express = require('express');
const router = express.Router();
const materialBatchesController = require('../controllers/materialBatchesController');
const { verifyToken } = require('../middleware/auth');

// Apply authentication to all routes
router.use(verifyToken);

// Get all batches
router.get('/', materialBatchesController.getAllBatches);

// Get batch statistics
router.get('/stats', materialBatchesController.getBatchStats);

// Get expiring batches
router.get('/expiring', materialBatchesController.getExpiringBatches);

// Get expired batches
router.get('/expired', materialBatchesController.getExpiredBatches);

// Get batches for specific material
router.get('/material/:material_id', materialBatchesController.getMaterialBatches);

// Add new batch
router.post('/', materialBatchesController.addBatch);

// Update batch
router.put('/:id', materialBatchesController.updateBatch);

// Dispose expired batch
router.post('/:id/dispose', materialBatchesController.disposeBatch);

// Delete batch
router.delete('/:id', materialBatchesController.deleteBatch);

module.exports = router;

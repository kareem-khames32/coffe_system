const express = require('express');
const router = express.Router();
const stockTransfersController = require('../controllers/stockTransfersController');
const { verifyToken } = require('../middleware/auth');

// Apply authentication to all routes
router.use(verifyToken);

// Get all transfers
router.get('/', stockTransfersController.getAllTransfers);

// Get transfer statistics
router.get('/stats', stockTransfersController.getTransferStats);

// Get pending transfers
router.get('/pending', stockTransfersController.getPendingTransfers);

// Get transfer by ID
router.get('/:id', stockTransfersController.getTransferById);

// Create new transfer
router.post('/', stockTransfersController.createTransfer);

// Approve transfer
router.post('/:id/approve', stockTransfersController.approveTransfer);

// Complete transfer (receive)
router.post('/:id/complete', stockTransfersController.completeTransfer);

// Cancel transfer
router.post('/:id/cancel', stockTransfersController.cancelTransfer);

// Delete transfer
router.delete('/:id', stockTransfersController.deleteTransfer);

module.exports = router;

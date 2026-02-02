const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');
const { verifyToken, checkPermission } = require('../middleware/auth');

// Public routes (for online orders)
router.get('/active', offerController.getActiveOffers);

// Protected routes
router.get('/', verifyToken, offerController.getAllOffers);
router.get('/:id', verifyToken, offerController.getOfferById);

router.post('/', verifyToken, checkPermission('can_manage_offers'), offerController.createOffer);
router.put('/:id', verifyToken, checkPermission('can_manage_offers'), offerController.updateOffer);
router.delete('/:id', verifyToken, checkPermission('can_manage_offers'), offerController.deleteOffer);

module.exports = router;

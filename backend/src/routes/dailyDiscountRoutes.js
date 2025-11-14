const express = require('express');
const router = express.Router();
const dailyDiscountController = require('../controllers/dailyDiscountController');
const { verifyToken, checkPermission } = require('../middleware/auth');

// Public route - get discount for specific date (for POS)
router.get('/date', dailyDiscountController.getDiscountForDate);

// Public route - get active discounts
router.get('/active', dailyDiscountController.getActiveDailyDiscounts);

// All other routes require authentication and manage offers permission
router.use(verifyToken);
router.use(checkPermission('can_manage_offers'));

router.get('/', dailyDiscountController.getAllDailyDiscounts);
router.get('/:id', dailyDiscountController.getDailyDiscountById);
router.post('/', dailyDiscountController.createDailyDiscount);
router.put('/:id', dailyDiscountController.updateDailyDiscount);
router.delete('/:id', dailyDiscountController.deleteDailyDiscount);

module.exports = router;

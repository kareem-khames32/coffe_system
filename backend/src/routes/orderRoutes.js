const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, checkPermission } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiter for online orders (prevent spam)
const onlineOrderLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: 'Too many orders from this IP, please try again later'
});

// Public routes (for online orders - no authentication)
router.post('/online', onlineOrderLimiter, orderController.createOnlineOrder);
router.get('/track/:orderNumber', orderController.trackOrder);

// Protected routes
router.get('/', verifyToken, checkPermission('can_view_order_details'), orderController.getAllOrders);
router.get('/pending-count', verifyToken, orderController.getPendingOrdersCount);
router.get('/:id', verifyToken, checkPermission('can_view_order_details'), orderController.getOrderById);
router.get('/:id/history', verifyToken, checkPermission('can_view_order_details'), orderController.getOrderEditHistory);

router.post('/in-store', verifyToken, checkPermission('can_make_sales'), orderController.createInStoreOrder);

router.put('/:id/status', verifyToken, checkPermission('can_view_order_details'), orderController.updateOrderStatus);
router.put('/:id/edit', verifyToken, checkPermission('can_edit_orders'), orderController.editOrder);

router.delete('/:id', verifyToken, checkPermission('can_cancel_orders'), orderController.cancelOrder);

module.exports = router;

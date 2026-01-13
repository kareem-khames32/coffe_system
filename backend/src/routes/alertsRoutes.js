const express = require('express');
const router = express.Router();
const alertsController = require('../controllers/alertsController');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Get all alerts
router.get('/', alertsController.getAllAlerts);

// Get unresolved alerts summary
router.get('/unresolved/summary', alertsController.getUnresolvedSummary);

// Create custom alert
router.post('/', alertsController.createAlert);

// Mark alert as read
router.patch('/:id/read', alertsController.markAsRead);

// Mark all alerts as read
router.patch('/read-all', alertsController.markAllAsRead);

// Resolve alert
router.patch('/:id/resolve', alertsController.resolveAlert);

// Delete alert
router.delete('/:id', alertsController.deleteAlert);

// Alert thresholds
router.get('/thresholds', alertsController.getThresholds);
router.post('/thresholds', alertsController.setThreshold);
router.delete('/thresholds/:id', alertsController.deleteThreshold);

// Generate automatic alerts
router.post('/generate-auto', alertsController.generateAutoAlerts);

module.exports = router;

const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate, authorize } = require('../middleware/auth');

// جميع المسارات تحتاج authentication
router.use(authenticate);

// Get all settings - متاح للجميع
router.get('/', settingsController.getAllSettings);

// Update settings - Admin فقط
router.put('/', authorize(['admin']), settingsController.updateSettings);

module.exports = router;

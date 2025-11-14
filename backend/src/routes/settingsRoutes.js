const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Get settings (any authenticated user)
router.get('/', settingsController.getAllSettings);
router.get('/:key', settingsController.getSettingByKey);

// Update/delete settings (admin only)
router.put('/', isAdmin, settingsController.updateMultipleSettings);
router.put('/:key', isAdmin, settingsController.updateSetting);
router.delete('/:key', isAdmin, settingsController.deleteSetting);

// Logo upload/delete (admin only)
router.post('/logo', isAdmin, settingsController.uploadMiddleware, settingsController.uploadLogo);
router.delete('/logo/delete', isAdmin, settingsController.deleteLogo);

module.exports = router;

const express = require('express');
const router = express.Router();
const rawMaterialController = require('../controllers/rawMaterialController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', rawMaterialController.getAllRawMaterials);
router.get('/active', rawMaterialController.getActiveRawMaterials);
router.get('/low-stock', rawMaterialController.getLowStockMaterials);
router.get('/:id', rawMaterialController.getRawMaterialById);
router.post('/', rawMaterialController.createRawMaterial);
router.put('/:id', rawMaterialController.updateRawMaterial);
router.patch('/:id/adjust', rawMaterialController.adjustStock);
router.delete('/:id', rawMaterialController.deleteRawMaterial);

module.exports = router;

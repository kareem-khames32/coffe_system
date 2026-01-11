const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', supplierController.getAllSuppliers);
router.get('/active', supplierController.getActiveSuppliers);
router.get('/:id', supplierController.getSupplierById);
router.post('/', supplierController.createSupplier);
router.put('/:id', supplierController.updateSupplier);
router.delete('/:id', supplierController.deleteSupplier);

module.exports = router;

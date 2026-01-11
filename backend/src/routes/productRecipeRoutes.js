const express = require('express');
const router = express.Router();
const productRecipeController = require('../controllers/productRecipeController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/product/:productId', productRecipeController.getProductRecipe);
router.put('/product/:productId', productRecipeController.updateProductRecipe);
router.post('/check-stock', productRecipeController.checkStockAvailability);

module.exports = router;

const express = require('express');
const router = express.Router();
const productController = require('./products.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

// All product routes require authentication
router.use(authMiddleware.verifyToken);

// View routes - accessible by Store Owner, Manager, Cashier, Inventory Staff, Warehouse Staff
router.get('/stats', productController.getProductStats);
router.get('/check-sku', productController.checkSKU);
router.get('/check-barcode', productController.checkBarcode);
router.get('/for-sale', productController.getProductsForSale); // Cashier only
router.get('/category/:categoryId', productController.getProductsByCategory);
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Store Owner ONLY routes (management)
router.post('/',
    roleMiddleware.isStoreOwner(),
    productController.createProduct
);

router.put('/:id',
    roleMiddleware.isStoreOwner(),
    productController.updateProduct
);

router.delete('/:id',
    roleMiddleware.isStoreOwner(),
    productController.deleteProduct
);

router.patch('/:id/toggle-status',
    roleMiddleware.isStoreOwner(),
    productController.toggleProductStatus
);

module.exports = router;
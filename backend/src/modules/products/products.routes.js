const express = require('express');
const router = express.Router();
const productController = require('./products.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

// All product routes require authentication
router.use(authMiddleware.verifyToken);

// Block Super Admin from all product routes
router.use((req, res, next) => {
    if (req.user && req.user.role_name === 'Super Admin') {
        const responseUtils = require('../../utils/response.utils');
        return responseUtils.forbidden(res, 'Super Admins do not have access to the Products module');
    }
    next();
});

// View routes - accessible by Store Owner, Manager, Cashier, Inventory Staff, Warehouse Staff
const VIEW_ROLES = ['Store Owner', 'Store Manager', 'Cashier', 'Inventory Staff', 'Warehouse Staff'];

router.get('/stats', roleMiddleware.hasRole(VIEW_ROLES), productController.getProductStats);
router.get('/check-sku', roleMiddleware.hasRole(['Store Owner']), productController.checkSKU);
router.get('/check-barcode', roleMiddleware.hasRole(['Store Owner']), productController.checkBarcode);
router.get('/for-sale', roleMiddleware.isCashier(), productController.getProductsForSale);
router.get('/category/:categoryId', roleMiddleware.hasRole(VIEW_ROLES), productController.getProductsByCategory);
router.get('/', roleMiddleware.hasRole(VIEW_ROLES), productController.getAllProducts);
router.get('/:id', roleMiddleware.hasRole(VIEW_ROLES), productController.getProductById);

// Store Owner ONLY routes (management)
router.post('/bulk',
    roleMiddleware.isStoreOwner(),
    productController.bulkCreateProducts
);

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
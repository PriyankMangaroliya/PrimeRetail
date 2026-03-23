const express = require('express');
const router = express.Router();
const discountController = require('./discounts.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

// All discount routes require authentication
router.use(authMiddleware.verifyToken);

// View routes - accessible by Store Owner, Store Manager, Cashier
router.get('/active', discountController.getActiveDiscounts);
router.get('/type/:type', discountController.getDiscountsByType);
router.get('/', discountController.getAllDiscounts);
router.get('/:id', discountController.getDiscountById);

// Store Owner ONLY routes (statistics)
router.get('/stats',
    roleMiddleware.isStoreOwner(),
    discountController.getDiscountStats
);

// Store Owner ONLY routes (management)
router.post('/',
    roleMiddleware.isStoreOwner(),
    discountController.createDiscount
);

router.put('/:id',
    roleMiddleware.isStoreOwner(),
    discountController.updateDiscount
);

router.delete('/:id',
    roleMiddleware.isStoreOwner(),
    discountController.deleteDiscount
);

router.patch('/:id/toggle-status',
    roleMiddleware.isStoreOwner(),
    discountController.toggleDiscountStatus
);

router.post('/validate', discountController.validateDiscount);

module.exports = router;
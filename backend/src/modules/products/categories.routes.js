const express = require('express');
const router = express.Router();
const categoryController = require('./categories.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

// All category routes require authentication
router.use(authMiddleware.verifyToken);

// View routes - accessible by Store Owner, Manager, Cashier, Inventory Staff, Warehouse Staff
router.get('/active', categoryController.getActiveCategories);
router.get('/stats', categoryController.getCategoryStats);
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Store Owner ONLY routes (management)
router.post('/',
    roleMiddleware.isStoreOwner(),
    categoryController.createCategory
);

router.put('/:id',
    roleMiddleware.isStoreOwner(),
    categoryController.updateCategory
);

router.delete('/:id',
    roleMiddleware.isStoreOwner(),
    categoryController.deleteCategory
);

router.patch('/:id/toggle-status',
    roleMiddleware.isStoreOwner(),
    categoryController.toggleCategoryStatus
);

module.exports = router;
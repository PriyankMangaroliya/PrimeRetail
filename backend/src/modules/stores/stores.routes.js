const express = require('express');
const router = express.Router();
const storeController = require('./stores.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

// All store routes require authentication
router.use(authMiddleware.verifyToken);

// View routes - accessible by Store Owner and Store Manager only
// Super Admin has no access to the stores module
const storeViewRoles = ['Super Admin', 'Store Owner', 'Store Manager', 'Cashier', 'Inventory Staff'];

router.get('/dropdown', roleMiddleware.hasRole(storeViewRoles), storeController.getStoreDropdown);
router.get('/stats', roleMiddleware.hasRole(storeViewRoles), storeController.getStoreStats);
router.get('/check-code', roleMiddleware.hasRole(['Store Owner']), storeController.checkStoreCode);
router.get('/', roleMiddleware.hasRole(storeViewRoles), storeController.getAllStores);
router.get('/:id', roleMiddleware.hasRole(storeViewRoles), storeController.getStoreById);

// Store Owner ONLY routes (CRUD operations)
router.post('/',
    roleMiddleware.hasRole(['Store Owner']),
    storeController.createStore
);

router.put('/:id',
    roleMiddleware.hasRole(['Store Owner']),
    roleMiddleware.hasStoreAccess(),
    storeController.updateStore
);

router.delete('/:id',
    roleMiddleware.hasRole(['Store Owner']),
    roleMiddleware.hasStoreAccess(),
    storeController.deleteStore
);

router.patch('/:id/toggle-status',
    roleMiddleware.hasRole(['Store Owner']),
    roleMiddleware.hasStoreAccess(),
    storeController.toggleStoreStatus
);

module.exports = router;
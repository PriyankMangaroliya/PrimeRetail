const express = require('express');
const router = express.Router();
const warehouseController = require('./warehouses.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

// All warehouse routes require authentication
router.use(authMiddleware.verifyToken);

// View routes - accessible by Super Admin, Store Owner, and Warehouse Staff
router.get('/dropdown', warehouseController.getWarehouseDropdown);
router.get('/', warehouseController.getAllWarehouses);
router.get('/:id', warehouseController.getWarehouseById);

// Statistics - only Super Admin and Store Owner
router.get('/stats', warehouseController.getWarehouseStats);

// Code check - Store Owner only (for creation)
router.get('/check-code',
    roleMiddleware.isStoreOwner(), // CHANGED: use helper method
    warehouseController.checkWarehouseCode
);

// Store Owner ONLY routes (CRUD operations)
router.post('/',
    roleMiddleware.isStoreOwner(), // CHANGED: use helper method
    warehouseController.createWarehouse
);

router.put('/:id',
    roleMiddleware.isStoreOwner(), // CHANGED: use helper method
    warehouseController.updateWarehouse
);

router.delete('/:id',
    roleMiddleware.isStoreOwner(), // CHANGED: use helper method
    warehouseController.deleteWarehouse
);

router.patch('/:id/toggle-status',
    roleMiddleware.isStoreOwner(), // CHANGED: use helper method
    warehouseController.toggleWarehouseStatus
);

module.exports = router;
const express = require('express');
const router = express.Router();
const userController = require('./users.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

// All user routes require authentication
router.use(authMiddleware.verifyToken);

// View routes - accessible by multiple roles
router.get('/stats', userController.getEmployeeStats);
router.get('/', userController.getAllEmployees);
router.get('/:id', userController.getEmployeeById);

// Store-specific employee views
router.get('/store/:storeId',
    roleMiddleware.hasRole(['Store Owner', 'Store Manager']),
    userController.getEmployeesByStore
);

// Warehouse-specific employee views (Store Owner only)
router.get('/warehouse/:warehouseId',
    roleMiddleware.isStoreOwner(),
    userController.getEmployeesByWarehouse
);

// Create employee - Store Owner and Store Manager
router.post('/',
    roleMiddleware.hasRole(['Store Owner', 'Store Manager']),
    userController.createEmployee
);

// Update employee - Store Owner and Store Manager
router.put('/:id',
    roleMiddleware.hasRole(['Store Owner', 'Store Manager']),
    userController.updateEmployee
);

// Delete employee - Store Owner and Store Manager
router.delete('/:id',
    roleMiddleware.hasRole(['Store Owner', 'Store Manager']),
    userController.deleteEmployee
);

// Toggle employee status - Store Owner and Store Manager
router.patch('/:id/toggle-status',
    roleMiddleware.hasRole(['Store Owner', 'Store Manager']),
    userController.toggleEmployeeStatus
);

module.exports = router;
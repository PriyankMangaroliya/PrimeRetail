const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

// All Dashboard routes require authentication
router.use(authMiddleware.verifyToken);

// Main Dashboard endpoint - returns data based on user role
router.get('/', dashboardController.getDashboard);

// Summary endpoint - quick stats only
router.get('/summary', dashboardController.getSummary);

// Recent activities endpoint
router.get('/activities', dashboardController.getRecentActivities);

// Role-specific Dashboard endpoints (optional direct access)
router.get('/admin',
    roleMiddleware.isSystemAdmin(),
    dashboardController.getDashboard
);

router.get('/owner',
    roleMiddleware.isStoreOwner(),
    dashboardController.getDashboard
);

router.get('/manager',
    roleMiddleware.isStoreManager(),
    roleMiddleware.hasStoreAccess(),
    dashboardController.getDashboard
);

router.get('/cashier',
    roleMiddleware.isCashier(),
    roleMiddleware.hasStoreAccess(),
    dashboardController.getDashboard
);

router.get('/inventory',
    roleMiddleware.isInventoryStaff(),
    roleMiddleware.hasStoreAccess(),
    dashboardController.getDashboard
);

router.get('/warehouse',
    roleMiddleware.isWarehouseStaff(),
    roleMiddleware.hasWarehouseAccess(),
    dashboardController.getDashboard
);

module.exports = router;
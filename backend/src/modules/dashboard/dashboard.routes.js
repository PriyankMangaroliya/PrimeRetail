const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

// All dashboard routes require authentication
router.use(authMiddleware.verifyToken);

const allRoles = ['Super Admin', 'Store Owner', 'Store Manager', 'Cashier', 'Inventory Staff', 'Warehouse Staff'];

router.get('/stats', roleMiddleware.hasRole(allRoles), dashboardController.getStats);
router.get('/trends', roleMiddleware.hasRole(['Super Admin', 'Store Owner', 'Store Manager', 'Cashier']), dashboardController.getTrends);

module.exports = router;

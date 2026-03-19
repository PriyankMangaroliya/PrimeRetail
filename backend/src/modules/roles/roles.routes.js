const express = require('express');
const router = express.Router();
const roleController = require('./roles.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

// All role routes require authentication
router.use(authMiddleware.verifyToken);

// Role management routes - restricted to Super Admin
router.post('/', roleMiddleware.isSystemAdmin(), roleController.createRole);
router.put('/:id', roleMiddleware.isSystemAdmin(), roleController.updateRole);
router.delete('/:id', roleMiddleware.isSystemAdmin(), roleController.deleteRole);

// View routes - accessible by Super Admin, Store Owner, and Store Manager
router.get('/', 
    roleMiddleware.hasRole(['Super Admin', 'Store Owner', 'Store Manager']), 
    roleController.getAllRoles
);
router.get('/active', 
    roleMiddleware.hasRole(['Super Admin', 'Store Owner', 'Store Manager']), 
    roleController.getActiveRoles
);
router.get('/stats', roleMiddleware.isSystemAdmin(), roleController.getRoleStats);
router.get('/:id', 
    roleMiddleware.hasRole(['Super Admin', 'Store Owner', 'Store Manager']), 
    roleController.getRoleById
);

// Utility route for initial setup
// router.post('/defaults/create', roleController.createDefaultRoles);

module.exports = router;
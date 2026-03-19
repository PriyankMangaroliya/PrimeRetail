const express = require('express');
const router = express.Router();
const storeOwnerController = require('./storeOwners.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

// All store owner routes require authentication and system admin access
router.use(authMiddleware.verifyToken);
router.use(roleMiddleware.isSystemAdmin());

// Store owner management routes
router.post('/', storeOwnerController.createStoreOwner);
router.get('/', storeOwnerController.getAllStoreOwners);
router.get('/stats', storeOwnerController.getStoreOwnerStats);
router.get('/:id', storeOwnerController.getStoreOwnerById);
router.put('/:id', storeOwnerController.updateStoreOwner);
router.delete('/:id', storeOwnerController.deleteStoreOwner);
router.patch('/:id/toggle-status', storeOwnerController.toggleOwnerStatus);
router.get('/:id/stores', storeOwnerController.getStoresByOwner);

module.exports = router;
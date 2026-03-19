const express = require('express');
const router = express.Router();
const storeTaxController = require('./storeTaxes.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

// All store tax routes require authentication and store owner access
router.use(authMiddleware.verifyToken);
router.use(roleMiddleware.isStoreOwner());
router.use(roleMiddleware.hasStoreAccess());

// Store tax management routes
router.get('/', storeTaxController.getStoreTaxes);
router.post('/', storeTaxController.addStoreTax);
router.delete('/:id', storeTaxController.removeStoreTax);

module.exports = router;
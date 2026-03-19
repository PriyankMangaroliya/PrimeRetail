const express = require('express');
const router = express.Router();
const taxController = require('./taxes.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

// All tax routes require authentication
router.use(authMiddleware.verifyToken);

// Public routes (accessible by multiple roles with restrictions)
// Active taxes - Store Owner can view for selection
router.get('/active', taxController.getActiveTaxes);

// Tax by ID - System Admin only (full details)
router.get('/:id',
    roleMiddleware.isSystemAdmin(),
    taxController.getTaxById
);

// System Admin ONLY routes (full management)
router.use(roleMiddleware.isSystemAdmin());

router.post('/', taxController.createTax);
router.get('/', taxController.getAllTaxes);
router.get('/stats', taxController.getTaxStats);
router.put('/:id', taxController.updateTax);
router.delete('/:id', taxController.deleteTax);
router.patch('/:id/toggle-status', taxController.toggleTaxStatus);

module.exports = router;
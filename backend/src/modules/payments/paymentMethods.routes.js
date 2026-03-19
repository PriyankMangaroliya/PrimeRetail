const express = require('express');
const router = express.Router();
const paymentMethodController = require('./paymentMethods.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

// All payment method routes require authentication
router.use(authMiddleware.verifyToken);

// Public routes (accessible by multiple roles for viewing)
// Active payment methods - Cashier, Store Owner, Manager can view
router.get('/active', paymentMethodController.getActivePaymentMethods);

// Payment method by ID - System Admin only (full details)
router.get('/:id', roleMiddleware.isSystemAdmin(), paymentMethodController.getPaymentMethodById);

// System Admin ONLY routes (full management)
router.use(roleMiddleware.isSystemAdmin());

router.post('/', paymentMethodController.createPaymentMethod);
router.get('/', paymentMethodController.getAllPaymentMethods);
router.get('/:id/usage', paymentMethodController.getPaymentMethodUsage);
router.put('/:id', paymentMethodController.updatePaymentMethod);
router.delete('/:id', paymentMethodController.deletePaymentMethod);
router.patch('/:id/toggle-status', paymentMethodController.togglePaymentMethodStatus);
router.get('/stats', paymentMethodController.getPaymentMethodStats);

module.exports = router;
const express = require('express');
const router = express.Router();
const paymentController = require('./payments.controller');
const paymentValidation = require('./payments.validation');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { hasRole } = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');

// All payment routes are protected
router.use(verifyToken);

// Create payment record
router.post('/', 
    hasRole(['Cashier', 'Store Owner', 'Store Manager']), 
    validate(paymentValidation.createPayment),
    paymentController.createPayment
);

// Get all paymentMethods (Store Owner / Manager / Cashier)
router.get('/', hasRole(['Store Owner', 'Store Manager', 'Cashier']), paymentController.getAllPayments);

// Get by invoice
router.get('/invoice/:invoice_id', 
    validate(paymentValidation.invoiceIdQuery, 'params'),
    paymentController.getPaymentsByInvoice
);

// Get by store
router.get('/store/:store_id', 
    hasRole(['Store Owner', 'Store Manager', 'Cashier']), 
    validate(paymentValidation.storeIdQuery, 'params'),
    paymentController.getPaymentsByStore
);

// Get by ID
router.get('/:id', 
    validate(paymentValidation.paymentIdParam, 'params'),
    paymentController.getPaymentById
);

// Update status
router.patch('/:id/status', hasRole(['Store Owner', 'Store Manager']), paymentController.updatePaymentStatus);

module.exports = router;

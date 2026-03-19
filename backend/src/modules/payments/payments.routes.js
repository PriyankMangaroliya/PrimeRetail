const express = require('express');
const router = express.Router();
const paymentController = require('./payments.controller');
const { protect, authorize } = require('../../middlewares/auth.middleware');

// All payment routes are protected
router.use(protect);

// Create payment record
router.post('/', authorize('Cashier', 'Store Owner', 'Store Manager'), paymentController.createPayment);

// Get all payments (Store Owner / Manager)
router.get('/', authorize('Store Owner', 'Store Manager'), paymentController.getAllPayments);

// Get by invoice
router.get('/invoice/:invoice_id', paymentController.getPaymentsByInvoice);

// Get by store
router.get('/store/:store_id', authorize('Store Owner', 'Store Manager'), paymentController.getPaymentsByStore);

// Get by ID
router.get('/:id', paymentController.getPaymentById);

// Update status
router.patch('/:id/status', authorize('Store Owner', 'Store Manager'), paymentController.updatePaymentStatus);

module.exports = router;

const express = require('express');
const router = express.Router();
const invoiceController = require('./invoices.controller');
const { protect, authorize } = require('../../middlewares/auth.middleware');

// All invoice routes are protected
router.use(protect);

// Create invoice (Cashier / Store Owner / Manager)
router.post('/', authorize('Cashier', 'Store Owner', 'Store Manager'), invoiceController.createInvoice);

// Get sales summary
router.get('/summary', authorize('Store Owner', 'Store Manager'), invoiceController.getSalesSummary);

// Get all invoices (Store Owner / Manager)
router.get('/', authorize('Store Owner', 'Store Manager'), invoiceController.getAllInvoices);

// Get invoice by ID
router.get('/:id', invoiceController.getInvoiceById);

// Update status
router.patch('/:id/status', authorize('Store Owner', 'Store Manager'), invoiceController.updateInvoiceStatus);

// Get invoices by store
router.get('/store/:store_id', authorize('Store Owner', 'Store Manager'), invoiceController.getInvoicesByStore);

module.exports = router;

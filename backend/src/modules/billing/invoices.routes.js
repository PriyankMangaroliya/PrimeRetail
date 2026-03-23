const express = require('express');
const router = express.Router();
const invoiceController = require('./invoices.controller');
const invoiceValidation = require('./invoices.validation');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { hasRole } = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');

// All invoice routes are protected
router.use(verifyToken);

// Create invoice (Cashier / Store Owner / Manager)
router.post('/', 
    hasRole(['Cashier', 'Store Owner', 'Store Manager']), 
    validate(invoiceValidation.createInvoice),
    invoiceController.createInvoice
);

// Get sales summary
router.get('/summary', hasRole(['Store Owner', 'Store Manager']), invoiceController.getSalesSummary);

// Get all invoices (Store Owner / Manager / Cashier)
router.get('/', hasRole(['Store Owner', 'Store Manager', 'Cashier']), invoiceController.getAllInvoices);

// Get invoice by ID
router.get('/:id', 
    validate(invoiceValidation.invoiceIdParam, 'params'),
    invoiceController.getInvoiceById
);

// Update status
router.patch('/:id/status', hasRole(['Store Owner', 'Store Manager']), invoiceController.updateInvoiceStatus);

// Get invoices by store
router.get('/store/:store_id', 
    hasRole(['Store Owner', 'Store Manager', 'Cashier']), 
    validate(invoiceValidation.storeIdQuery, 'params'),
    invoiceController.getInvoicesByStore
);

module.exports = router;

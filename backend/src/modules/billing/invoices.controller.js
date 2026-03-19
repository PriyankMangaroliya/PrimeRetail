const invoiceService = require('./invoices.service');
const invoiceValidation = require('./invoices.validation');
const responseUtils = require('../../utils/response.utils');

const invoiceController = {
    // Create new invoice
    createInvoice: async (req, res) => {
        try {
            // Validate request body
            const { error, value } = invoiceValidation.createInvoice.validate({
                ...req.body,
                created_by: req.user.id
            });
            if (error) {
                return responseUtils.validationError(res, 'Validation failed', error.details);
            }

            const invoice = await invoiceService.createInvoice(value);

            return responseUtils.created(res, 'Invoice created successfully', invoice);
        } catch (error) {
            console.error('Create Invoice Error:', error);

            if (error.message.includes('Insufficient stock')) {
                return responseUtils.badRequest(res, error.message);
            }
            if (error.message.includes('Stock not found')) {
                return responseUtils.notFound(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to create invoice');
        }
    },

    // Get all invoices
    getAllInvoices: async (req, res) => {
        try {
            const invoices = await invoiceService.getAllInvoices();
            return responseUtils.success(res, 200, 'Invoices retrieved successfully', invoices);
        } catch (error) {
            console.error('Get All Invoices Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve invoices');
        }
    },

    // Get invoice by ID
    getInvoiceById: async (req, res) => {
        try {
            const { id } = req.params;

            const { error: paramError } = invoiceValidation.invoiceIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid invoice ID', paramError.details);
            }

            const invoice = await invoiceService.getInvoiceById(id);
            return responseUtils.success(res, 200, 'Invoice retrieved successfully', invoice);
        } catch (error) {
            console.error('Get Invoice By ID Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to retrieve invoice');
        }
    },

    // Update invoice status
    updateInvoiceStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const { error: paramError } = invoiceValidation.invoiceIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid invoice ID', paramError.details);
            }

            if (!['Paid', 'Pending', 'Cancelled'].includes(status)) {
                return responseUtils.badRequest(res, 'Invalid status');
            }

            const invoice = await invoiceService.updateInvoiceStatus(id, status, req.user.id);

            return responseUtils.success(res, 200, 'Invoice status updated successfully', invoice);
        } catch (error) {
            console.error('Update Status Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to update invoice status');
        }
    },

    // Get invoices by store
    getInvoicesByStore: async (req, res) => {
        try {
            const { store_id } = req.params;

            const { error: paramError } = invoiceValidation.storeIdQuery.validate({ store_id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid store ID', paramError.details);
            }

            const invoices = await invoiceService.getInvoicesByStore(store_id);
            return responseUtils.success(res, 200, 'Store invoices retrieved successfully', invoices);
        } catch (error) {
            console.error('Get Invoices By Store Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve store invoices');
        }
    },

    // Get sales summary
    getSalesSummary: async (req, res) => {
        try {
            const { period, year, month, date } = req.query;

            let summary;
            if (period === 'daily') {
                summary = await invoiceService.getSalesSummary('daily', { date });
            } else if (period === 'monthly') {
                summary = await invoiceService.getSalesSummary('monthly', { year, month });
            } else if (period === 'yearly') {
                summary = await invoiceService.getSalesSummary('yearly', { year });
            } else {
                return responseUtils.badRequest(res, 'Invalid summary period');
            }

            return responseUtils.success(res, 200, 'Sales summary retrieved successfully', summary);
        } catch (error) {
            console.error('Sales Summary Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve sales summary');
        }
    }
};

module.exports = invoiceController;

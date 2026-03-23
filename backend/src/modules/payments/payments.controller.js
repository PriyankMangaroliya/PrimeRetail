const paymentService = require('./payments.service');
const paymentValidation = require('./payments.validation');
const responseUtils = require('../../utils/response.utils');

const paymentController = {
    // Create new payment
    createPayment: async (req, res) => {
        try {
            // Validation is now handled by the middleware
            const payment = await paymentService.createPayment({
                ...req.body,
                created_by: req.user.id
            });

            return responseUtils.created(res, 'Payment recorded successfully', payment);
        } catch (error) {
            console.error('Create Payment Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to record payment');
        }
    },

    // Get all paymentMethods
    getAllPayments: async (req, res) => {
        try {
            const payments = await paymentService.getAllPayments(req.user);
            return responseUtils.success(res, 200, 'Payments retrieved successfully', payments);
        } catch (error) {
            console.error('Get All Invoices Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve paymentMethods');
        }
    },

    // Get payment by ID
    getPaymentById: async (req, res) => {
        try {
            const { id } = req.params;

            const { error: paramError } = paymentValidation.paymentIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid payment ID', paramError.details);
            }

            const payment = await paymentService.getPaymentById(id);
            return responseUtils.success(res, 200, 'Payment retrieved successfully', payment);
        } catch (error) {
            console.error('Get Payment By ID Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to retrieve payment');
        }
    },

    // Update payment status
    updatePaymentStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { payment_status } = req.body;

            const { error: paramError } = paymentValidation.paymentIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid payment ID', paramError.details);
            }

            const { error, value } = paymentValidation.updatePaymentStatus.validate({
                payment_status,
                updated_by: req.user.id
            });
            if (error) {
                return responseUtils.validationError(res, 'Validation failed', error.details);
            }

            const payment = await paymentService.updatePaymentStatus(id, value.payment_status, value.updated_by);

            return responseUtils.success(res, 200, 'Payment status updated successfully', payment);
        } catch (error) {
            console.error('Update Payment Status Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to update payment status');
        }
    },

    // Get paymentMethods by invoice
    getPaymentsByInvoice: async (req, res) => {
        try {
            const { invoice_id } = req.params;

            const { error: paramError } = paymentValidation.invoiceIdQuery.validate({ invoice_id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid invoice ID', paramError.details);
            }

            const payments = await paymentService.getPaymentsByInvoice(invoice_id);
            return responseUtils.success(res, 200, 'Invoice paymentMethods retrieved successfully', payments);
        } catch (error) {
            console.error('Get Invoices By Invoice Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve invoice paymentMethods');
        }
    },

    // Get paymentMethods by store
    getPaymentsByStore: async (req, res) => {
        try {
            const { store_id } = req.params;

            const { error: paramError } = paymentValidation.storeIdQuery.validate({ store_id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid store ID', paramError.details);
            }

            const payments = await paymentService.getPaymentsByStore(store_id);
            return responseUtils.success(res, 200, 'Store paymentMethods retrieved successfully', payments);
        } catch (error) {
            console.error('Get Invoices By Store Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve store paymentMethods');
        }
    }
};

module.exports = paymentController;

const paymentService = require('./payments.service');
const paymentValidation = require('./payments.validation');
const responseUtils = require('../../utils/response.utils');

const paymentController = {
    // Create new payment
    createPayment: async (req, res) => {
        try {
            // Validate request body
            const { error, value } = paymentValidation.createPayment.validate({
                ...req.body,
                created_by: req.user.id
            });
            if (error) {
                return responseUtils.validationError(res, 'Validation failed', error.details);
            }

            const payment = await paymentService.createPayment(value);

            return responseUtils.created(res, 'Payment recorded successfully', payment);
        } catch (error) {
            console.error('Create Payment Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to record payment');
        }
    },

    // Get all payments
    getAllPayments: async (req, res) => {
        try {
            const payments = await paymentService.getAllPayments();
            return responseUtils.success(res, 200, 'Payments retrieved successfully', payments);
        } catch (error) {
            console.error('Get All Payments Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve payments');
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

    // Get payments by invoice
    getPaymentsByInvoice: async (req, res) => {
        try {
            const { invoice_id } = req.params;

            const { error: paramError } = paymentValidation.invoiceIdQuery.validate({ invoice_id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid invoice ID', paramError.details);
            }

            const payments = await paymentService.getPaymentsByInvoice(invoice_id);
            return responseUtils.success(res, 200, 'Invoice payments retrieved successfully', payments);
        } catch (error) {
            console.error('Get Payments By Invoice Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve invoice payments');
        }
    },

    // Get payments by store
    getPaymentsByStore: async (req, res) => {
        try {
            const { store_id } = req.params;

            const { error: paramError } = paymentValidation.storeIdQuery.validate({ store_id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid store ID', paramError.details);
            }

            const payments = await paymentService.getPaymentsByStore(store_id);
            return responseUtils.success(res, 200, 'Store payments retrieved successfully', payments);
        } catch (error) {
            console.error('Get Payments By Store Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve store payments');
        }
    }
};

module.exports = paymentController;

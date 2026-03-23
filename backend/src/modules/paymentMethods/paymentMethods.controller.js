const paymentMethodService = require('./paymentMethods.service');
const paymentMethodValidation = require('./paymentMethods.validation');
const responseUtils = require('../../utils/response.utils');

const paymentMethodController = {
    // Create new payment method (System Admin only)
    createPaymentMethod: async (req, res) => {
        try {
            // Validate request body
            const { error, value } = paymentMethodValidation.createPaymentMethod.validate({
                ...req.body,
                created_by: req.user.id
            });
            if (error) {
                return responseUtils.validationError(res, 'Validation failed', error.details);
            }

            const method = await paymentMethodService.createPaymentMethod(value);

            return responseUtils.created(res, 'Payment method created successfully', method);
        } catch (error) {
            console.error('Create Payment Method Error:', error);

            if (error.message.includes('already exists')) {
                return responseUtils.conflict(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to create payment method');
        }
    },

    // Update payment method (System Admin only)
    updatePaymentMethod: async (req, res) => {
        try {
            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = paymentMethodValidation.methodIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid payment method ID', paramError.details);
            }

            // Validate request body
            const { error, value } = paymentMethodValidation.updatePaymentMethod.validate({
                ...req.body,
                updated_by: req.user.id
            });
            if (error) {
                return responseUtils.validationError(res, 'Validation failed', error.details);
            }

            const method = await paymentMethodService.updatePaymentMethod(id, value);

            return responseUtils.success(res, 200, 'Payment method updated successfully', method);
        } catch (error) {
            console.error('Update Payment Method Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }
            if (error.message.includes('already exists')) {
                return responseUtils.conflict(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to update payment method');
        }
    },

    // Delete payment method (System Admin only)
    deletePaymentMethod: async (req, res) => {
        try {
            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = paymentMethodValidation.methodIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid payment method ID', paramError.details);
            }

            const result = await paymentMethodService.deletePaymentMethod(id);

            return responseUtils.success(res, 200, 'Payment method deleted successfully', result);
        } catch (error) {
            console.error('Delete Payment Method Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }
            if (error.message.includes('used')) {
                return responseUtils.conflict(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to delete payment method');
        }
    },

    // Get all payment methods (System Admin only)
    getAllPaymentMethods: async (req, res) => {
        try {
            const methods = await paymentMethodService.getAllPaymentMethods();
            return responseUtils.success(res, 200, 'Payment methods retrieved successfully', methods);
        } catch (error) {
            console.error('Get All Payment Methods Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve payment methods');
        }
    },

    // Get active payment methods only (Cashier, Store Owner, Manager - for selection)
    getActivePaymentMethods: async (req, res) => {
        try {
            const methods = await paymentMethodService.getActivePaymentMethods();
            return responseUtils.success(res, 200, 'Active payment methods retrieved successfully', methods);
        } catch (error) {
            console.error('Get Active Payment Methods Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve active payment methods');
        }
    },

    // Get payment method by ID
    getPaymentMethodById: async (req, res) => {
        try {
            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = paymentMethodValidation.methodIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid payment method ID', paramError.details);
            }

            const method = await paymentMethodService.getPaymentMethodById(id);

            return responseUtils.success(res, 200, 'Payment method retrieved successfully', method);
        } catch (error) {
            console.error('Get Payment Method By ID Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to retrieve payment method');
        }
    },

    // Get payment method statistics (System Admin only)
    getPaymentMethodStats: async (req, res) => {
        try {
            const stats = await paymentMethodService.getPaymentMethodStats();
            return responseUtils.success(res, 200, 'Payment method statistics retrieved successfully', stats);
        } catch (error) {
            console.error('Get Payment Method Stats Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve statistics');
        }
    },

    // Get payment method usage (System Admin only)
    getPaymentMethodUsage: async (req, res) => {
        try {
            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = paymentMethodValidation.methodIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid payment method ID', paramError.details);
            }

            const usage = await paymentMethodService.getPaymentMethodUsage(id);

            return responseUtils.success(res, 200, 'Payment method usage retrieved successfully', usage);
        } catch (error) {
            console.error('Get Payment Method Usage Error:', error);

            if (error.message === 'Payment method not found') {
                return responseUtils.notFound(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to retrieve usage');
        }
    },

    // Toggle payment method status (System Admin only)
    togglePaymentMethodStatus: async (req, res) => {
        try {
            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = paymentMethodValidation.methodIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid payment method ID', paramError.details);
            }

            const result = await paymentMethodService.togglePaymentMethodStatus(id, req.user.id);

            return responseUtils.success(res, 200, result.message, { is_active: result.is_active });
        } catch (error) {
            console.error('Toggle Payment Method Status Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to toggle payment method status');
        }
    },
};

module.exports = paymentMethodController;
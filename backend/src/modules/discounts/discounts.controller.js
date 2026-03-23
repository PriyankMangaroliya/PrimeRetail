const discountService = require('./discounts.service');
const discountValidation = require('./discounts.validation');
const responseUtils = require('../../utils/response.utils');

const discountController = {
    // Create new discount (Store Owner only)
    createDiscount: async (req, res) => {
        try {
            // Check if user is Store Owner
            if (req.user.role_name !== 'Store Owner') {
                return responseUtils.forbidden(res, 'Only Store Owners can create discounts');
            }

            // Validate request body
            const { error, value } = discountValidation.createDiscount.validate(req.body);
            if (error) {
                return responseUtils.validationError(res, 'Validation failed', error.details);
            }

            const ownerId = req.user.id;
            const discount = await discountService.createDiscount(value, ownerId);

            return responseUtils.created(res, 'Discount created successfully', discount);
        } catch (error) {
            console.error('Create Discount Error:', error);

            if (error.message.includes('already exists')) {
                return responseUtils.conflict(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to create discount');
        }
    },

    // Update discount (Store Owner only)
    updateDiscount: async (req, res) => {
        try {
            // Check if user is Store Owner
            if (req.user.role_name !== 'Store Owner') {
                return responseUtils.forbidden(res, 'Only Store Owners can update discounts');
            }

            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = discountValidation.discountIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid discount ID', paramError.details);
            }

            // Validate request body
            const { error, value } = discountValidation.updateDiscount.validate(req.body);
            if (error) {
                return responseUtils.validationError(res, 'Validation failed', error.details);
            }

            const ownerId = req.user.id;
            const discount = await discountService.updateDiscount(id, value, ownerId);

            return responseUtils.success(res, 200, 'Discount updated successfully', discount);
        } catch (error) {
            console.error('Update Discount Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }
            if (error.message.includes('already exists')) {
                return responseUtils.conflict(res, error.message);
            }
            if (error.message.includes('permission')) {
                return responseUtils.forbidden(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to update discount');
        }
    },

    // Delete discount (Store Owner only)
    deleteDiscount: async (req, res) => {
        try {
            // Check if user is Store Owner
            if (req.user.role_name !== 'Store Owner') {
                return responseUtils.forbidden(res, 'Only Store Owners can delete discounts');
            }

            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = discountValidation.discountIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid discount ID', paramError.details);
            }

            const ownerId = req.user.id;
            const result = await discountService.deleteDiscount(id, ownerId);

            return responseUtils.success(res, 200, 'Discount deleted successfully', result);
        } catch (error) {
            console.error('Delete Discount Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }
            if (error.message.includes('used in invoices')) {
                return responseUtils.conflict(res, error.message);
            }
            if (error.message.includes('permission') || error.message.includes('forbidden')) {
                return responseUtils.forbidden(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to delete discount');
        }
    },

    // Get all discounts
    getAllDiscounts: async (req, res) => {
        try {
            const userRole = req.user.role_name;
            const userId = req.user.id;

            // Check if user has access
            if (!['Store Owner', 'Store Manager', 'Cashier'].includes(userRole)) {
                return responseUtils.forbidden(res, 'You do not have permission to view discounts');
            }

            const discounts = await discountService.getAllDiscounts(userRole, userId);

            return responseUtils.success(res, 200, 'Discounts retrieved successfully', discounts);
        } catch (error) {
            console.error('Get All Discounts Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve discounts');
        }
    },

    // Get discount by ID
    getDiscountById: async (req, res) => {
        try {
            const { id } = req.params;
            const userRole = req.user.role_name;
            const userId = req.user.id;

            // Validate ID param
            const { error: paramError } = discountValidation.discountIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid discount ID', paramError.details);
            }

            // Check if user has access
            if (!['Store Owner', 'Store Manager', 'Cashier'].includes(userRole)) {
                return responseUtils.forbidden(res, 'You do not have permission to view discounts');
            }

            const discount = await discountService.getDiscountById(id, userRole, userId);

            return responseUtils.success(res, 200, 'Discount retrieved successfully', discount);
        } catch (error) {
            console.error('Get Discount By ID Error:', error);

            if (error.message === 'Discount not found') {
                return responseUtils.notFound(res, error.message);
            }
            if (error.message.includes('permission')) {
                return responseUtils.forbidden(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to retrieve discount');
        }
    },

    // Get active discounts for dropdown
    getActiveDiscounts: async (req, res) => {
        try {
            const userRole = req.user.role_name;
            const userId = req.user.id;

            // Check if user has access
            if (!['Store Owner', 'Store Manager', 'Cashier'].includes(userRole)) {
                return responseUtils.forbidden(res, 'You do not have permission to view discounts');
            }

            const discounts = await discountService.getActiveDiscounts(userId, userRole);

            return responseUtils.success(res, 200, 'Active discounts retrieved successfully', discounts);
        } catch (error) {
            console.error('Get Active Discounts Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve active discounts');
        }
    },

    // Get discount statistics (Store Owner only)
    getDiscountStats: async (req, res) => {
        try {
            // Check if user is Store Owner
            if (req.user.role_name !== 'Store Owner') {
                return responseUtils.forbidden(res, 'Only Store Owners can view discount statistics');
            }

            const ownerId = req.user.id;
            const stats = await discountService.getDiscountStats(ownerId);

            return responseUtils.success(res, 200, 'Discount statistics retrieved successfully', stats);
        } catch (error) {
            console.error('Get Discount Stats Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve statistics');
        }
    },

    // Get discounts by type
    getDiscountsByType: async (req, res) => {
        try {
            const { type } = req.params;
            const userRole = req.user.role_name;
            const userId = req.user.id;

            // Validate type
            const { error } = discountValidation.discountTypeQuery.validate({ type });
            if (error) {
                return responseUtils.validationError(res, 'Invalid discount type', error.details);
            }

            // Check if user has access
            if (!['Store Owner', 'Store Manager', 'Cashier'].includes(userRole)) {
                return responseUtils.forbidden(res, 'You do not have permission to view discounts');
            }

            const discounts = await discountService.getDiscountsByType(type, userId, userRole);

            return responseUtils.success(res, 200, `${type} discounts retrieved successfully`, discounts);
        } catch (error) {
            console.error('Get Discounts By Type Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve discounts');
        }
    },

    // Toggle discount status (Store Owner only)
    toggleDiscountStatus: async (req, res) => {
        try {
            // Check if user is Store Owner
            if (req.user.role_name !== 'Store Owner') {
                return responseUtils.forbidden(res, 'Only Store Owners can toggle discount status');
            }

            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = discountValidation.discountIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid discount ID', paramError.details);
            }

            const ownerId = req.user.id;
            const result = await discountService.toggleDiscountStatus(id, ownerId);

            return responseUtils.success(res, 200, result.message, { is_active: result.is_active });
        } catch (error) {
            console.error('Toggle Discount Status Error:', error);

            if (error.message === 'Discount not found') {
                return responseUtils.notFound(res, error.message);
            }
            if (error.message.includes('permission')) {
                return responseUtils.forbidden(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to toggle discount status');
        }
    },

    // Validate discount by code (for POS)
    validateDiscount: async (req, res) => {
        try {
            const { code, amount } = req.body;
            if (!code || !amount) {
                return responseUtils.badRequest(res, 'Code and amount are required');
            }

            const userRole = req.user.role_name;
            let ownerId = null;

            if (userRole === 'Store Owner') {
                ownerId = req.user.id;
            } else {
                const db = require('../../config/database.config');
                const storeResult = await db.query(
                    'SELECT owner_id FROM store_master WHERE id = $1',
                    [req.user.store_id]
                );
                ownerId = storeResult.rows[0]?.owner_id;
            }

            const result = await discountService.validateDiscountByCode(code, amount, ownerId);
            return responseUtils.success(res, 200, 'Discount applied', result);
        } catch (error) {
            console.error('Validate Discount Error:', error);
            return responseUtils.badRequest(res, error.message || 'Failed to validate discount');
        }
    }
};

module.exports = discountController;
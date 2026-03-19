const taxService = require('./taxes.service');
const taxValidation = require('./taxes.validation');
const responseUtils = require('../../utils/response.utils');

const taxController = {
    // Create new tax (System Admin only)
    createTax: async (req, res) => {
        try {
            // Validate request body
            const { error, value } = taxValidation.createTax.validate(req.body);
            if (error) {
                return responseUtils.validationError(res, 'Validation failed', error.details);
            }

            // Get created_by from authenticated user
            const taxData = {
                ...value,
                created_by: req.user.id // Add created_by from token
            };

            const tax = await taxService.createTax(taxData);

            return responseUtils.created(res, 'Tax created successfully', tax);
        } catch (error) {
            console.error('Create Tax Error:', error);

            if (error.message.includes('already exists')) {
                return responseUtils.conflict(res, error.message);
            }
            if (error.message.includes('not found') || error.message.includes('required')) {
                return responseUtils.badRequest(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to create tax');
        }
    },

    // Update tax (System Admin only)
    updateTax: async (req, res) => {
        try {
            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = taxValidation.taxIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid tax ID', paramError.details);
            }

            // Validate request body
            const { error, value } = taxValidation.updateTax.validate(req.body);
            if (error) {
                return responseUtils.validationError(res, 'Validation failed', error.details);
            }

            // Add updated_by from authenticated user
            const updateData = {
                ...value,
                updated_by: req.user.id // Add updated_by from token
            };

            const tax = await taxService.updateTax(id, updateData);

            return responseUtils.success(res, 200, 'Tax updated successfully', tax);
        } catch (error) {
            console.error('Update Tax Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }
            if (error.message.includes('already exists')) {
                return responseUtils.conflict(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to update tax');
        }
    },

    // Delete tax (System Admin only)
    deleteTax: async (req, res) => {
        try {
            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = taxValidation.taxIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid tax ID', paramError.details);
            }

            const result = await taxService.deleteTax(id);

            return responseUtils.success(res, 200, 'Tax deleted successfully', result);
        } catch (error) {
            console.error('Delete Tax Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }
            if (error.message.includes('assigned to products') || error.message.includes('assigned to stores')) {
                return responseUtils.conflict(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to delete tax');
        }
    },

    // Get all taxes (System Admin only)
    getAllTaxes: async (req, res) => {
        try {
            const taxes = await taxService.getAllTaxes();
            return responseUtils.success(res, 200, 'Taxes retrieved successfully', taxes);
        } catch (error) {
            console.error('Get All Taxes Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve taxes');
        }
    },

    // Get active taxes only (Store Owner - for selection)
    getActiveTaxes: async (req, res) => {
        try {
            const taxes = await taxService.getActiveTaxes();
            return responseUtils.success(res, 200, 'Active taxes retrieved successfully', taxes);
        } catch (error) {
            console.error('Get Active Taxes Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve active taxes');
        }
    },

    // Get tax by ID
    getTaxById: async (req, res) => {
        try {
            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = taxValidation.taxIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid tax ID', paramError.details);
            }

            const tax = await taxService.getTaxById(id);

            return responseUtils.success(res, 200, 'Tax retrieved successfully', tax);
        } catch (error) {
            console.error('Get Tax By ID Error:', error);

            if (error.message === 'Tax not found') {
                return responseUtils.notFound(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to retrieve tax');
        }
    },

    // Get tax statistics (System Admin only)
    getTaxStats: async (req, res) => {
        try {
            const stats = await taxService.getTaxStats();
            return responseUtils.success(res, 200, 'Tax statistics retrieved successfully', stats);
        } catch (error) {
            console.error('Get Tax Stats Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve statistics');
        }
    },

    // Toggle tax status (System Admin only)
    toggleTaxStatus: async (req, res) => {
        try {
            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = taxValidation.taxIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid tax ID', paramError.details);
            }

            const result = await taxService.toggleTaxStatus(id, req.user.id); // Pass updated_by

            return responseUtils.success(res, 200, result.message, { is_active: result.is_active });
        } catch (error) {
            console.error('Toggle Tax Status Error:', error);

            if (error.message === 'Tax not found') {
                return responseUtils.notFound(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to toggle tax status');
        }
    }
};

module.exports = taxController;
const storeTaxService = require('./storeTaxes.service');
const responseUtils = require('../../utils/response.utils');

const storeTaxController = {
    // Add tax to store (Store Owner only)
    addStoreTax: async (req, res) => {
        try {
            const storeId = req.user.store_id; // Store Owner's store ID
            const { tax_id } = req.body;

            // Validate using storeTaxValidation
            const { error } = storeTaxValidation.addStoreTax.validate({ 
                store_id: storeId, 
                tax_id, 
                created_by: req.user.id 
            });
            if (error) {
                return responseUtils.validationError(res, 'Validation failed', error.details);
            }

            const result = await storeTaxService.addStoreTax(storeId, tax_id);

            return responseUtils.created(res, 'Tax added to store successfully', result);
        } catch (error) {
            console.error('Add Store Tax Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }
            if (error.message.includes('already added')) {
                return responseUtils.conflict(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to add tax to store');
        }
    },

    // Remove tax from store (Store Owner only)
    removeStoreTax: async (req, res) => {
        try {
            const { id } = req.params;
            const storeId = req.user.store_id;

            // Validate ID param
            const { error: paramError } = storeTaxValidation.storeTaxIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid store tax ID', paramError.details);
            }

            const result = await storeTaxService.removeStoreTax(id, storeId);

            return responseUtils.success(res, 200, 'Tax removed from store successfully', result);
        } catch (error) {
            console.error('Remove Store Tax Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }
            if (error.message.includes('permission') || error.message.includes('forbidden')) {
                return responseUtils.forbidden(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to remove tax from store');
        }
    },

    // Get taxes by store (Store Owner only)
    getStoreTaxes: async (req, res) => {
        try {
            const storeId = req.user.store_id;

            const taxes = await storeTaxService.getStoreTaxes(storeId);

            return responseUtils.success(res, 200, 'Store taxes retrieved successfully', taxes);
        } catch (error) {
            console.error('Get Store Taxes Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve store taxes');
        }
    }
};

module.exports = storeTaxController;
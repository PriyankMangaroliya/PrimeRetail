const storeTaxService = require('./storeTaxes.service');
const responseUtils = require('../../utils/response.utils');

const storeTaxController = {
    // Add tax to store (Store Owner only)
    addStoreTax: async (req, res) => {
        try {
            const ownerId = req.user.id; // Store Owner's user ID
            const { tax_id } = req.body;

            const result = await storeTaxService.addStoreTax(ownerId, tax_id);

            return responseUtils.created(res, 'Tax added successfully', result);
        } catch (error) {
            console.error('Add Store Tax Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }
            if (error.message.includes('already added')) {
                return responseUtils.conflict(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to add tax');
        }
    },

    // Remove tax from store (Store Owner only)
    removeStoreTax: async (req, res) => {
        try {
            const { id } = req.params;
            const ownerId = req.user.id;

            const result = await storeTaxService.removeStoreTax(id, ownerId);

            return responseUtils.success(res, 200, 'Tax removed successfully', result);
        } catch (error) {
            console.error('Remove Store Tax Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }
            if (error.message.includes('permission') || error.message.includes('forbidden')) {
                return responseUtils.forbidden(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to remove tax');
        }
    },

    // Get taxes by owner (Store Owner only)
    getStoreTaxes: async (req, res) => {
        try {
            const ownerId = req.user.id;

            const taxes = await storeTaxService.getStoreTaxes(ownerId);

            return responseUtils.success(res, 200, 'Taxes retrieved successfully', taxes);
        } catch (error) {
            console.error('Get Store Taxes Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve taxes');
        }
    },

    // Toggle store tax status
    toggleStoreTaxStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { is_active } = req.body;
            const ownerId = req.user.id;

            const result = await storeTaxService.toggleStoreTaxStatus(id, ownerId, is_active);

            return responseUtils.success(res, 200, `Tax ${is_active ? 'activated' : 'deactivated'} successfully`, result);
        } catch (error) {
            console.error('Toggle Store Tax Status Error:', error);
            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }
            if (error.message.includes('Forbidden')) {
                return responseUtils.forbidden(res, error.message);
            }
            return responseUtils.error(res, 500, error.message || 'Failed to toggle status');
        }
    },

    // Get tax usage
    getTaxUsage: async (req, res) => {
        try {
            const { id } = req.params;
            const ownerId = req.user.id;

            const result = await storeTaxService.getTaxUsage(id, ownerId);

            return responseUtils.success(res, 200, 'Tax usage retrieved successfully', result);
        } catch (error) {
            console.error('Get Tax Usage Error:', error);
            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }
            if (error.message.includes('Forbidden')) {
                return responseUtils.forbidden(res, error.message);
            }
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve usage');
        }
    }
};

module.exports = storeTaxController;
const storeOwnerService = require('./storeOwners.service');
const storeOwnerValidation = require('./storeOwners.validation');
const responseUtils = require('../../utils/response.utils');

const storeOwnerController = {
    // Create new store owner
    createStoreOwner: async (req, res) => {
        try {
            // Validate request body
            const { error, value } = storeOwnerValidation.createStoreOwner.validate(req.body);
            if (error) {
                return responseUtils.validationError(res, 'Validation failed', error.details);
            }

            const createdBy = req.user.id;
            const owner = await storeOwnerService.createStoreOwner(value, createdBy);

            return responseUtils.created(res, 'Store owner created successfully', owner);
        } catch (error) {
            console.error('Create Store Owner Error:', error);

            if (error.message.includes('registered')) {
                return responseUtils.conflict(res, error.message);
            }
            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to create store owner');
        }
    },

    // Get all store owners
    getAllStoreOwners: async (req, res) => {
        try {
            const owners = await storeOwnerService.getAllStoreOwners();
            return responseUtils.success(res, 200, 'Store owners retrieved successfully', owners);
        } catch (error) {
            console.error('Get All Store Owners Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve store owners');
        }
    },

    // Get store owner by ID
    getStoreOwnerById: async (req, res) => {
        try {
            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = storeOwnerValidation.ownerIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid owner ID', paramError.details);
            }

            const owner = await storeOwnerService.getStoreOwnerById(id);
            return responseUtils.success(res, 200, 'Store owner retrieved successfully', owner);
        } catch (error) {
            console.error('Get Store Owner By ID Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to retrieve store owner');
        }
    },

    // Update store owner
    updateStoreOwner: async (req, res) => {
        try {
            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = storeOwnerValidation.ownerIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid owner ID', paramError.details);
            }

            // Validate request body
            const { error, value } = storeOwnerValidation.updateStoreOwner.validate(req.body);
            if (error) {
                return responseUtils.validationError(res, 'Validation failed', error.details);
            }

            const updatedBy = req.user.id;
            const owner = await storeOwnerService.updateStoreOwner(id, value, updatedBy);

            return responseUtils.success(res, 200, 'Store owner updated successfully', owner);
        } catch (error) {
            console.error('Update Store Owner Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }
            if (error.message.includes('registered')) {
                return responseUtils.conflict(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to update store owner');
        }
    },

    // Delete store owner
    deleteStoreOwner: async (req, res) => {
        try {
            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = storeOwnerValidation.ownerIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid owner ID', paramError.details);
            }

            const updatedBy = req.user.id;
            const result = await storeOwnerService.deleteStoreOwner(id, updatedBy);

            return responseUtils.success(res, 200, 'Store owner deleted successfully', result);
        } catch (error) {
            console.error('Delete Store Owner Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }
            if (error.message.includes('existing stores')) {
                return responseUtils.conflict(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to delete store owner');
        }
    },

    // Get store owner statistics
    getStoreOwnerStats: async (req, res) => {
        try {
            const stats = await storeOwnerService.getStoreOwnerStats();
            return responseUtils.success(res, 200, 'Store owner statistics retrieved successfully', stats);
        } catch (error) {
            console.error('Get Store Owner Stats Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve statistics');
        }
    },

    // Get stores by owner ID
    getStoresByOwner: async (req, res) => {
        try {
            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = storeOwnerValidation.ownerIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid owner ID', paramError.details);
            }

            // Check if owner exists
            await storeOwnerService.getStoreOwnerById(id);

            const stores = await storeOwnerService.getStoresByOwner(id);
            return responseUtils.success(res, 200, 'Stores retrieved successfully', stores);
        } catch (error) {
            console.error('Get Stores By Owner Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to retrieve stores');
        }
    },

    // Toggle owner status
    toggleOwnerStatus: async (req, res) => {
        try {
            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = storeOwnerValidation.ownerIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid owner ID', paramError.details);
            }

            const updatedBy = req.user.id;
            const result = await storeOwnerService.toggleOwnerStatus(id, updatedBy);

            return responseUtils.success(res, 200, result.message, { is_active: result.is_active });
        } catch (error) {
            console.error('Toggle Owner Status Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to toggle owner status');
        }
    }
};

module.exports = storeOwnerController;
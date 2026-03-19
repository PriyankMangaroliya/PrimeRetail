const storeService = require('./stores.service');
const storeValidation = require('./stores.validation');
const responseUtils = require('../../utils/response.utils');

const storeController = {
    // Create new store (Store Owner only)
    createStore: async (req, res) => {
        try {
            // Get owner_id from logged in user
            const owner_id = req.user.id;

            // Add owner_id to request body
            req.body.owner_id = owner_id;

            // Add created_by from authenticated user
            req.body.created_by = req.user.id;

            // Validate request body
            const { error, value } = storeValidation.createStore.validate(req.body);
            if (error) {
                return responseUtils.validationError(res, 'Validation failed', error.details);
            }

            const store = await storeService.createStore(value);

            return responseUtils.created(res, 'Store created successfully', store);
        } catch (error) {
            console.error('Create Store Error:', error);

            if (error.message.includes('already exists')) {
                return responseUtils.conflict(res, error.message);
            }
            if (error.message.includes('not found') || error.message.includes('required')) {
                return responseUtils.badRequest(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to create store');
        }
    },

    // Get all stores (role-based filtering in service)
    getAllStores: async (req, res) => {
        try {
            const userRole = req.user.role_name;
            const userId = req.user.id;
            const storeId = req.user.store_id; // Store Manager's assigned store

            const stores = await storeService.getAllStores(userRole, userId, storeId);

            return responseUtils.success(res, 200, 'Stores retrieved successfully', stores);
        } catch (error) {
            console.error('Get All Stores Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve stores');
        }
    },

    // Get store by ID (role-based)
    getStoreById: async (req, res) => {
        try {
            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = storeValidation.storeIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid store ID', paramError.details);
            }

            const userRole = req.user.role_name;
            const userId = req.user.id;
            const storeId = req.user.store_id; // Store Manager's assigned store

            const store = await storeService.getStoreById(id, userRole, userId, storeId);

            return responseUtils.success(res, 200, 'Store retrieved successfully', store);
        } catch (error) {
            console.error('Get Store By ID Error:', error);

            if (error.message.includes('not found') || error.message.includes('no access') || error.message.includes('permission')) {
                return responseUtils.notFound(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to retrieve store');
        }
    },

    // Update store (Store Owner only)
    updateStore: async (req, res) => {
        try {
            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = storeValidation.storeIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid store ID', paramError.details);
            }

            // Add updated_by from authenticated user
            req.body.updated_by = req.user.id;

            // Validate request body
            const { error, value } = storeValidation.updateStore.validate(req.body);
            if (error) {
                return responseUtils.validationError(res, 'Validation failed', error.details);
            }

            const userId = req.user.id; // Store Owner ID

            const store = await storeService.updateStore(id, value, userId);

            return responseUtils.success(res, 200, 'Store updated successfully', store);
        } catch (error) {
            console.error('Update Store Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }
            if (error.message.includes('already exists')) {
                return responseUtils.conflict(res, error.message);
            }
            if (error.message.includes('permission') || error.message.includes('forbidden')) {
                return responseUtils.forbidden(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to update store');
        }
    },

    // Delete store (Store Owner only)
    deleteStore: async (req, res) => {
        try {
            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = storeValidation.storeIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid store ID', paramError.details);
            }

            const userId = req.user.id; // Store Owner ID

            const result = await storeService.deleteStore(id, userId);

            return responseUtils.success(res, 200, 'Store deleted successfully', result);
        } catch (error) {
            console.error('Delete Store Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }
            if (error.message.includes('existing employees') || error.message.includes('existing stock')) {
                return responseUtils.conflict(res, error.message);
            }
            if (error.message.includes('permission') || error.message.includes('forbidden')) {
                return responseUtils.forbidden(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to delete store');
        }
    },

    // Get store statistics (role-based)
    getStoreStats: async (req, res) => {
        try {
            const userRole = req.user.role_name;
            const userId = req.user.id;
            const storeId = req.user.store_id; // Store Manager's assigned store

            const stats = await storeService.getStoreStats(userRole, userId, storeId);

            return responseUtils.success(res, 200, 'Store statistics retrieved successfully', stats);
        } catch (error) {
            console.error('Get Store Stats Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve statistics');
        }
    },

    // Get store dropdown (role-based)
    getStoreDropdown: async (req, res) => {
        try {
            const userRole = req.user.role_name;
            const userId = req.user.id;
            const storeId = req.user.store_id; // Store Manager's assigned store

            const stores = await storeService.getStoreDropdown(userRole, userId, storeId);

            return responseUtils.success(res, 200, 'Store dropdown retrieved successfully', stores);
        } catch (error) {
            console.error('Get Store Dropdown Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve store dropdown');
        }
    },

    // Toggle store status (Store Owner only)
    toggleStoreStatus: async (req, res) => {
        try {
            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = storeValidation.storeIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid store ID', paramError.details);
            }

            const userId = req.user.id; // Store Owner ID
            const updatedBy = req.user.id; // Add updated_by

            const result = await storeService.toggleStoreStatus(id, userId, updatedBy);

            return responseUtils.success(res, 200, result.message, { is_active: result.is_active });
        } catch (error) {
            console.error('Toggle Store Status Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }
            if (error.message.includes('do not have permission')) {
                return responseUtils.forbidden(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to toggle store status');
        }
    },

    // Check store code availability
    checkStoreCode: async (req, res) => {
        try {
            const { store_code } = req.query;
            const { exclude_id } = req.query;

            if (!store_code) {
                return responseUtils.badRequest(res, 'Store code is required');
            }

            const result = await storeService.checkStoreCode(store_code, exclude_id);

            return responseUtils.success(res, 200, result.message, { available: result.available });
        } catch (error) {
            console.error('Check Store Code Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to check store code');
        }
    }
};

module.exports = storeController;
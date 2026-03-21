const warehouseService = require('./warehouses.service');
const warehouseValidation = require('./warehouses.validation');
const responseUtils = require('../../utils/response.utils');

const warehouseController = {
    // Create new warehouse (Store Owner only)
    createWarehouse: async (req, res) => {
        try {
            // Get owner_id from logged in user (Store Owner)
            const owner_id = req.user.id;

            // Add owner_id and created_by to request body
            req.body.owner_id = owner_id;
            req.body.created_by = owner_id; // Track who created this warehouse

            // Validate request body
            const { error, value } = warehouseValidation.createWarehouse.validate(req.body);
            if (error) {
                return responseUtils.validationError(res, 'Validation failed', error.details);
            }

            const warehouse = await warehouseService.createWarehouse(value);

            return responseUtils.created(res, 'Warehouse created successfully', warehouse);
        } catch (error) {
            console.error('Create Warehouse Error:', error);

            if (error.message.includes('already exists')) {
                return responseUtils.conflict(res, error.message);
            }
            if (error.message.includes('not found') || error.message.includes('required')) {
                return responseUtils.badRequest(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to create warehouse');
        }
    },

    // Get all warehouses (role-based)
    getAllWarehouses: async (req, res) => {
        try {
            const userRole = req.user.role_name;
            const userId = req.user.id;

            const warehouses = await warehouseService.getAllWarehouses(userRole, userId);

            return responseUtils.success(res, 200, 'Warehouses retrieved successfully', warehouses);
        } catch (error) {
            console.error('Get All Warehouses Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve warehouses');
        }
    },

    // Get warehouse by ID (role-based)
    getWarehouseById: async (req, res) => {
        try {
            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = warehouseValidation.warehouseIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid warehouse ID', paramError.details);
            }

            const userRole = req.user.role_name;
            const userId = req.user.id;
            const warehouseId = req.user.warehouse_id; // Warehouse Staff's assigned warehouse

            const warehouse = await warehouseService.getWarehouseById(id, userRole, userId, warehouseId);

            return responseUtils.success(res, 200, 'Warehouse retrieved successfully', warehouse);
        } catch (error) {
            console.error('Get Warehouse By ID Error:', error);

            if (error.message.includes('not found') || error.message.includes('no permission')) {
                return responseUtils.notFound(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to retrieve warehouse');
        }
    },

    // Update warehouse (Store Owner only)
    updateWarehouse: async (req, res) => {
        try {
            const { id } = req.params;

            // Double-check that only Store Owner can perform CRUD
            if (req.user.role_name !== 'Store Owner') {
                return responseUtils.forbidden(res, 'Only Store Owners can perform this action');
            }

            // Validate ID param
            const { error: paramError } = warehouseValidation.warehouseIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid warehouse ID', paramError.details);
            }

            // Validate request body
            const { error, value } = warehouseValidation.updateWarehouse.validate(req.body);
            if (error) {
                return responseUtils.validationError(res, 'Validation failed', error.details);
            }

            const ownerId = req.user.id; // Store Owner ID
            const warehouse = await warehouseService.updateWarehouse(id, value, ownerId);

            return responseUtils.success(res, 200, 'Warehouse updated successfully', warehouse);
        } catch (error) {
            console.error('Update Warehouse Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }
            if (error.message.includes('already exists')) {
                return responseUtils.conflict(res, error.message);
            }
            if (error.message.includes('permission') || error.message.includes('forbidden')) {
                return responseUtils.forbidden(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to update warehouse');
        }
    },

    // Delete warehouse (Store Owner only)
    deleteWarehouse: async (req, res) => {
        try {
            const { id } = req.params;

            // Double-check that only Store Owner can perform CRUD
            if (req.user.role_name !== 'Store Owner') {
                return responseUtils.forbidden(res, 'Only Store Owners can perform this action');
            }

            // Validate ID param
            const { error: paramError } = warehouseValidation.warehouseIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid warehouse ID', paramError.details);
            }

            const ownerId = req.user.id; // Store Owner ID
            const result = await warehouseService.deleteWarehouse(id, ownerId);

            return responseUtils.success(res, 200, 'Warehouse deleted successfully', result);
        } catch (error) {
            console.error('Delete Warehouse Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }
            if (error.message.includes('existing staff') || error.message.includes('existing stock')) {
                return responseUtils.conflict(res, error.message);
            }
            if (error.message.includes('do not have permission')) {
                return responseUtils.forbidden(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to delete warehouse');
        }
    },

    // Get warehouse statistics (role-based)
    getWarehouseStats: async (req, res) => {
        try {
            const userRole = req.user.role_name;
            const userId = req.user.id;

            // Only Super Admin and Store Owner can view stats
            if (userRole !== 'Super Admin' && userRole !== 'Store Owner') {
                return responseUtils.forbidden(res, 'You do not have permission to view warehouse statistics');
            }

            const stats = await warehouseService.getWarehouseStats(userRole, userId);

            return responseUtils.success(res, 200, 'Warehouse statistics retrieved successfully', stats);
        } catch (error) {
            console.error('Get Warehouse Stats Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve statistics');
        }
    },

    // Get warehouse dropdown (role-based)
    getWarehouseDropdown: async (req, res) => {
        try {
            const userRole = req.user.role_name;
            const userId = req.user.id;

            const warehouses = await warehouseService.getWarehouseDropdown(userRole, userId);

            return responseUtils.success(res, 200, 'Warehouse dropdown retrieved successfully', warehouses);
        } catch (error) {
            console.error('Get Warehouse Dropdown Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve warehouse dropdown');
        }
    },

    // Toggle warehouse status (Store Owner only)
    toggleWarehouseStatus: async (req, res) => {
        try {
            const { id } = req.params;

            // Double-check that only Store Owner can perform this action
            if (req.user.role_name !== 'Store Owner') {
                return responseUtils.forbidden(res, 'Only Store Owners can perform this action');
            }

            // Validate ID param
            const { error: paramError } = warehouseValidation.warehouseIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid warehouse ID', paramError.details);
            }

            const ownerId = req.user.id; // Store Owner ID
            const result = await warehouseService.toggleWarehouseStatus(id, ownerId);

            return responseUtils.success(res, 200, result.message, { is_active: result.is_active });
        } catch (error) {
            console.error('Toggle Warehouse Status Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }
            if (error.message.includes('do not have permission')) {
                return responseUtils.forbidden(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to toggle warehouse status');
        }
    },

    // Check warehouse code availability
    checkWarehouseCode: async (req, res) => {
        try {
            const { warehouse_code } = req.query;
            const { exclude_id } = req.query;

            if (!warehouse_code) {
                return responseUtils.badRequest(res, 'Warehouse code is required');
            }

            const result = await warehouseService.checkWarehouseCode(warehouse_code, exclude_id);

            return responseUtils.success(res, 200, result.message, { available: result.available });
        } catch (error) {
            console.error('Check Warehouse Code Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to check warehouse code');
        }
    }
};

module.exports = warehouseController;
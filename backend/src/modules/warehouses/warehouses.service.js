const warehouseModel = require('./warehouses.model');
const userModel = require('../users/users.model');

const warehouseService = {
    // Create new warehouse (Store Owner only)
    createWarehouse: async (warehouseData) => {
        try {
            // Check if warehouse code already exists
            const existingCode = await warehouseModel.checkWarehouseCodeExists(warehouseData.warehouse_code);
            if (existingCode.rows.length > 0) {
                throw new Error('Warehouse code already exists');
            }

            // Check if owner exists and is a Store Owner
            const owner = await userModel.getUserById(warehouseData.owner_id);
            if (!owner.rows.length) {
                throw new Error('Owner not found');
            }

            const result = await warehouseModel.createWarehouse(warehouseData);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Get all warehouses based on user role
    getAllWarehouses: async (userRole, userId) => {
        try {
            let warehouses;

            if (userRole === 'Super Admin') {
                // Super Admin sees all warehouses
                warehouses = await warehouseModel.getAllWarehouses();
            } else if (userRole === 'Store Owner') {
                // Store Owner sees their own warehouses
                warehouses = await warehouseModel.getWarehousesByOwner(userId);
            } else if (userRole === 'Warehouse Staff') {
                // Warehouse Staff only see their assigned warehouse
                const warehouse = await warehouseModel.getWarehouseBasicById(userId); // userId is warehouse_id
                warehouses = { rows: warehouse.rows.length ? [warehouse.rows[0]] : [] };
            } else {
                warehouses = { rows: [] };
            }

            return warehouses.rows;
        } catch (error) {
            throw error;
        }
    },

    // Get warehouse by ID with role-based access
    getWarehouseById: async (id, userRole, userId) => {
        try {
            let result;

            if (userRole === 'Super Admin') {
                // Super Admin can view any warehouse
                result = await warehouseModel.getWarehouseById(id, userRole, userId);
            } else if (userRole === 'Store Owner') {
                // Store Owner can only view their own warehouses
                result = await warehouseModel.getWarehouseById(id, userRole, userId);
            } else if (userRole === 'Warehouse Staff') {
                // Warehouse Staff can only view their assigned warehouse
                if (parseInt(id) !== parseInt(userId)) {
                    throw new Error('You do not have permission to view this warehouse');
                }
                result = await warehouseModel.getWarehouseById(id, userRole, userId);
            } else {
                throw new Error('You do not have permission to view warehouses');
            }

            if (!result.rows.length) {
                throw new Error('Warehouse not found');
            }

            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Update warehouse (Store Owner only)
    updateWarehouse: async (id, warehouseData, ownerId) => {
        try {
            // Check if warehouse exists and belongs to this owner
            const warehouse = await warehouseModel.getWarehouseById(id, 'Store Owner', ownerId);

            if (!warehouse.rows.length) {
                throw new Error('Warehouse not found or you do not have permission to update this warehouse');
            }

            // Check if warehouse code already exists (if updating)
            if (warehouseData.warehouse_code && warehouseData.warehouse_code !== warehouse.rows[0].warehouse_code) {
                const existingCode = await warehouseModel.checkWarehouseCodeExists(warehouseData.warehouse_code, id);
                if (existingCode.rows.length > 0) {
                    throw new Error('Warehouse code already exists');
                }
            }

            // Pass ownerId as updatedBy so updated_by column is recorded
            const result = await warehouseModel.updateWarehouse(id, warehouseData, ownerId);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Delete warehouse (Store Owner only)
    deleteWarehouse: async (id, ownerId) => {
        try {
            // Check if warehouse exists and belongs to this owner
            const warehouse = await warehouseModel.getWarehouseById(id, 'Store Owner', ownerId);

            if (!warehouse.rows.length) {
                throw new Error('Warehouse not found or you do not have permission to delete this warehouse');
            }

            // Check if warehouse has any staff
            const staff = await userModel.getUsersByWarehouse(id);
            if (staff.rows.length > 0) {
                throw new Error('Cannot delete warehouse with existing staff. Transfer staff first.');
            }

            // Check if warehouse has any stock
            const db = require('../../config/database.config');
            const stockCheck = await db.query(
                'SELECT COUNT(*) as count FROM stock_master WHERE location_type = $1 AND location_id = $2',
                ['Warehouse', id]
            );

            if (parseInt(stockCheck.rows[0].count) > 0) {
                throw new Error('Cannot delete warehouse with existing stock. Transfer stock first.');
            }

            const result = await warehouseModel.deleteWarehouse(id);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Get warehouse statistics
    getWarehouseStats: async (userRole, userId) => {
        try {
            const result = await warehouseModel.getWarehouseStats(userRole, userId);
            return result.rows[0] || {};
        } catch (error) {
            throw error;
        }
    },

    // Get warehouse dropdown
    getWarehouseDropdown: async (userRole, userId) => {
        try {
            const result = await warehouseModel.getWarehouseDropdown(userRole, userId);
            return result.rows;
        } catch (error) {
            throw error;
        }
    },

    // Toggle warehouse status (Store Owner only)
    toggleWarehouseStatus: async (id, ownerId) => {
        try {
            // Check if warehouse exists and belongs to this owner
            const warehouse = await warehouseModel.getWarehouseById(id, 'Store Owner', ownerId);

            if (!warehouse.rows.length) {
                throw new Error('Warehouse not found or you do not have permission to modify this warehouse');
            }

            const newStatus = !warehouse.rows[0].is_active;
            // Pass ownerId as updatedBy so updated_by is recorded on status toggle
            const result = await warehouseModel.updateWarehouse(id, { is_active: newStatus }, ownerId);

            return {
                id: result.rows[0].id,
                is_active: result.rows[0].is_active,
                message: `Warehouse ${newStatus ? 'activated' : 'deactivated'} successfully`
            };
        } catch (error) {
            throw error;
        }
    },

    // Check warehouse code availability
    checkWarehouseCode: async (warehouse_code, excludeId = null) => {
        try {
            const result = await warehouseModel.checkWarehouseCodeExists(warehouse_code, excludeId);
            return {
                available: result.rows.length === 0,
                message: result.rows.length === 0 ? 'Warehouse code is available' : 'Warehouse code already exists'
            };
        } catch (error) {
            throw error;
        }
    }
};

module.exports = warehouseService;
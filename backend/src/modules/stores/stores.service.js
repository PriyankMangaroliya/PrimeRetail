const storeModel = require('./stores.model');
const userModel = require('../users/users.model');

const storeService = {
    // Create new store (Store Owner only)
    createStore: async (storeData) => {
        try {
            // Check if store code already exists
            const existingCode = await storeModel.checkStoreCodeExists(storeData.store_code);
            if (existingCode.rows.length > 0) {
                throw new Error('Store code already exists');
            }

            // Check if GSTIN already exists (if provided)
            if (storeData.gstin) {
                const existingGstin = await storeModel.checkGstinExists(storeData.gstin);
                if (existingGstin.rows.length > 0) {
                    throw new Error('GSTIN already exists');
                }
            }

            const result = await storeModel.createStore(storeData);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Get all stores based on user role
    // Routes only allow: Store Owner, Store Manager
    getAllStores: async (userRole, userId, storeId) => {
        try {
            let stores;

            if (userRole === 'Store Owner') {
                // Store Owner sees only their own stores
                stores = await storeModel.getStoresByOwner(userId);
            } else if (userRole === 'Store Manager') {
                // Store Manager sees only their assigned store (via store_id)
                if (!storeId) {
                    return [];
                }
                stores = await storeModel.getStoreByAssignedId(storeId);
            } else {
                stores = { rows: [] };
            }

            return stores.rows;
        } catch (error) {
            throw error;
        }
    },

    // Get store by ID with role-based access
    // Routes only allow: Store Owner, Store Manager
    getStoreById: async (id, userRole, userId, storeId) => {
        try {
            let result;

            if (userRole === 'Store Owner') {
                // Store Owner can only view their own stores
                result = await storeModel.getStoreById(id, 'Store Owner', userId);
            } else if (userRole === 'Store Manager') {
                // Store Manager can only view their single assigned store
                if (!storeId || parseInt(id) !== parseInt(storeId)) {
                    throw new Error('You do not have permission to view this store');
                }
                result = await storeModel.getStoreByAssignedId(storeId);
            } else {
                throw new Error('You do not have permission to view this store');
            }

            if (!result.rows.length) {
                throw new Error('Store not found');
            }

            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Update store (Store Owner only)
    updateStore: async (id, storeData, ownerId) => {
        try {
            // Check if store exists and belongs to this owner
            const store = await storeModel.getStoreById(id, 'Store Owner', ownerId);

            if (!store.rows.length) {
                throw new Error('Store not found or you do not have permission to update this store');
            }

            // Check if store code already exists (if updating)
            if (storeData.store_code && storeData.store_code !== store.rows[0].store_code) {
                const existingCode = await storeModel.checkStoreCodeExists(storeData.store_code, id);
                if (existingCode.rows.length > 0) {
                    throw new Error('Store code already exists');
                }
            }

            // Check if GSTIN already exists (if updating)
            if (storeData.gstin && storeData.gstin !== store.rows[0].gstin) {
                const existingGstin = await storeModel.checkGstinExists(storeData.gstin, id);
                if (existingGstin.rows.length > 0) {
                    throw new Error('GSTIN already exists');
                }
            }

            const result = await storeModel.updateStore(id, storeData);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Delete store (Store Owner only)
    deleteStore: async (id, ownerId) => {
        try {
            // Check if store exists and belongs to this owner
            const store = await storeModel.getStoreById(id, 'Store Owner', ownerId);

            if (!store.rows.length) {
                throw new Error('Store not found or you do not have permission to delete this store');
            }

            // Check if store has any employees
            const employees = await userModel.getUsersByStore(id);
            if (employees.rows.length > 0) {
                throw new Error('Cannot delete store with existing employees. Transfer employees first.');
            }

            const result = await storeModel.deleteStore(id);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Get store statistics
    // Routes only allow: Store Owner, Store Manager
    getStoreStats: async (userRole, userId, storeId) => {
        try {
            // Store Manager has no aggregated stats (only 1 store, no charts needed)
            if (userRole === 'Store Manager') {
                return {};
            }
            const result = await storeModel.getStoreStats(userRole, userId);
            return result.rows[0] || {};
        } catch (error) {
            throw error;
        }
    },

    // Get store dropdown
    // Routes only allow: Store Owner, Store Manager
    getStoreDropdown: async (userRole, userId, storeId) => {
        try {
            const result = await storeModel.getStoreDropdown(userRole, userId, storeId);
            return result.rows;
        } catch (error) {
            throw error;
        }
    },

    // Toggle store status (Store Owner only)
    toggleStoreStatus: async (id, ownerId, updatedBy) => {
        try {
            // Check if store exists and belongs to this owner
            const store = await storeModel.getStoreById(id, 'Store Owner', ownerId);

            if (!store.rows.length) {
                throw new Error('Store not found or you do not have permission to modify this store');
            }

            const newStatus = !store.rows[0].is_active;
            const result = await storeModel.updateStore(id, {
                is_active: newStatus,
                updated_by: updatedBy
            });

            return {
                id: result.rows[0].id,
                is_active: result.rows[0].is_active,
                message: `Store ${newStatus ? 'activated' : 'deactivated'} successfully`
            };
        } catch (error) {
            throw error;
        }
    },

    // Check store code availability
    checkStoreCode: async (store_code, excludeId = null) => {
        try {
            const result = await storeModel.checkStoreCodeExists(store_code, excludeId);
            return {
                available: result.rows.length === 0,
                message: result.rows.length === 0 ? 'Store code is available' : 'Store code already exists'
            };
        } catch (error) {
            throw error;
        }
    }
};

module.exports = storeService;
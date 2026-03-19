const bcrypt = require('bcryptjs');
const storeOwnerModel = require('./storeOwners.model');
const roleModel = require('../roles/roles.model');

const storeOwnerService = {
    // Hash password
    hashPassword: async (password) => {
        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10);
        return bcrypt.hash(password, salt);
    },

    // Create new store owner
    createStoreOwner: async (ownerData, createdBy) => {
        try {
            // Check if email already exists
            const existingOwner = await storeOwnerModel.getStoreOwnerByEmail(ownerData.email);
            if (existingOwner.rows.length > 0) {
                throw new Error('Email already registered');
            }

            // Get Store Owner role ID
            const roleResult = await roleModel.checkRoleExistsByName('Store Owner');
            if (!roleResult.rows.length) {
                throw new Error('Store Owner role not found');
            }
            const roleId = roleResult.rows[0].id;

            // Hash password
            const hashedPassword = await storeOwnerService.hashPassword(ownerData.password);

            // Create store owner
            const newOwner = {
                role_id: roleId,
                name: ownerData.name,
                email: ownerData.email,
                password: hashedPassword,
                phone: ownerData.phone,
                profile_image: ownerData.profile_image,
                created_by: createdBy
            };

            const result = await storeOwnerModel.createStoreOwner(newOwner);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Get all store owners
    getAllStoreOwners: async () => {
        try {
            const result = await storeOwnerModel.getAllStoreOwners();
            return result.rows;
        } catch (error) {
            throw error;
        }
    },

    // Get store owner by ID
    getStoreOwnerById: async (id) => {
        try {
            const result = await storeOwnerModel.getStoreOwnerById(id);
            if (result.rows.length === 0) {
                throw new Error('Store owner not found');
            }
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Update store owner
    updateStoreOwner: async (id, ownerData, updatedBy) => {
        try {
            // Check if owner exists
            const owner = await storeOwnerModel.getStoreOwnerById(id);
            if (!owner.rows.length) {
                throw new Error('Store owner not found');
            }

            // If email is being updated, check if it already exists
            if (ownerData.email && ownerData.email !== owner.rows[0].email) {
                const existingOwner = await storeOwnerModel.getStoreOwnerByEmail(ownerData.email);
                if (existingOwner.rows.length > 0) {
                    throw new Error('Email already registered by another user');
                }
            }

            // Hash password if provided
            let updateData = {
                ...ownerData,
                updated_by: updatedBy
            };
            
            if (updateData.password) {
                updateData.password = await storeOwnerService.hashPassword(updateData.password);
            }

            const result = await storeOwnerModel.updateStoreOwner(id, updateData);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Delete store owner
    deleteStoreOwner: async (id, updatedBy) => {
        try {
            // Check if owner exists
            const owner = await storeOwnerModel.getStoreOwnerById(id);
            if (!owner.rows.length) {
                throw new Error('Store owner not found');
            }

            // Check if owner has any stores
            const stores = await storeOwnerModel.getStoresByOwner(id);
            if (stores.rows.length > 0) {
                throw new Error('Cannot delete store owner with existing stores. Transfer or delete stores first.');
            }

            // Soft delete owner
            const result = await storeOwnerModel.deleteStoreOwner(id, updatedBy);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Get store owner statistics
    getStoreOwnerStats: async () => {
        try {
            const result = await storeOwnerModel.getStoreOwnerStats();
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Get stores by owner ID
    getStoresByOwner: async (ownerId) => {
        try {
            const result = await storeOwnerModel.getStoresByOwner(ownerId);
            return result.rows;
        } catch (error) {
            throw error;
        }
    },

    // Toggle owner status (activate/deactivate)
    toggleOwnerStatus: async (id, updatedBy) => {
        try {
            const owner = await storeOwnerModel.getStoreOwnerById(id);
            if (!owner.rows.length) {
                throw new Error('Store owner not found');
            }

            const newStatus = !owner.rows[0].is_active;
            const result = await storeOwnerModel.updateStoreOwner(id, {
                is_active: newStatus,
                updated_by: updatedBy
            });

            return {
                id: result.rows[0].id,
                is_active: result.rows[0].is_active,
                message: `Store owner ${newStatus ? 'activated' : 'deactivated'} successfully`
            };
        } catch (error) {
            throw error;
        }
    }
};

module.exports = storeOwnerService;
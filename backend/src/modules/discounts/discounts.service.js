const discountModel = require('./discounts.model');

const discountService = {
    // Create new discount (Store Owner only)
    createDiscount: async (discountData, ownerId) => {
        try {
            // Check if discount name already exists for this owner
            const existingDiscount = await discountModel.checkDiscountNameExists(ownerId, discountData.discount_name);
            if (existingDiscount.rows.length > 0) {
                throw new Error('Discount name already exists');
            }

            const data = {
                ...discountData,
                owner_id: ownerId,
                created_by: ownerId
            };

            const result = await discountModel.createDiscount(data);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Update discount (Store Owner only)
    updateDiscount: async (id, discountData, ownerId) => {
        try {
            // Check if discount exists and belongs to owner
            const discount = await discountModel.getDiscountBasicById(id);
            if (discount.rows.length === 0) {
                throw new Error('Discount not found');
            }

            if (discount.rows[0].owner_id !== ownerId) {
                throw new Error('You do not have permission to update this discount');
            }

            // Check if discount name already exists (if updating)
            if (discountData.discount_name && discountData.discount_name !== discount.rows[0].discount_name) {
                const existingDiscount = await discountModel.checkDiscountNameExists(ownerId, discountData.discount_name, id);
                if (existingDiscount.rows.length > 0) {
                    throw new Error('Discount name already exists');
                }
            }

            const updateData = {
                ...discountData,
                updated_by: ownerId
            };

            const result = await discountModel.updateDiscount(id, updateData);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Delete discount (Store Owner only)
    deleteDiscount: async (id, ownerId) => {
        try {
            // Check if discount exists and belongs to owner
            const discount = await discountModel.getDiscountBasicById(id);
            if (discount.rows.length === 0) {
                throw new Error('Discount not found');
            }

            if (discount.rows[0].owner_id !== ownerId) {
                throw new Error('You do not have permission to delete this discount');
            }

            // Check if discount is used in any invoices
            const usage = await discountModel.checkDiscountUsage(id);
            if (parseInt(usage.rows[0].usage_count) > 0) {
                throw new Error('Cannot delete discount as it is used in invoices');
            }

            const result = await discountModel.deleteDiscount(id);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Get all discounts based on user role
    getAllDiscounts: async (userRole, userId) => {
        try {
            let ownerId = null;

            if (userRole === 'Store Owner') {
                ownerId = userId;
            } else if (userRole === 'Store Manager' || userRole === 'Cashier') {
                // Get owner_id from their store
                const db = require('../../config/database.config');
                const storeResult = await db.query(
                    'SELECT owner_id FROM store_master WHERE id = $1',
                    [userId] // userId is store_id for these roles
                );
                ownerId = storeResult.rows[0]?.owner_id;
            }

            if (!ownerId) {
                return [];
            }

            const result = await discountModel.getAllDiscounts(userRole, ownerId);
            return result.rows;
        } catch (error) {
            throw error;
        }
    },

    // Get discount by ID
    getDiscountById: async (id, userRole, userId) => {
        try {
            let ownerId = null;

            if (userRole === 'Store Owner') {
                ownerId = userId;
            } else if (userRole === 'Store Manager' || userRole === 'Cashier') {
                const db = require('../../config/database.config');
                const storeResult = await db.query(
                    'SELECT owner_id FROM store_master WHERE id = $1',
                    [userId]
                );
                ownerId = storeResult.rows[0]?.owner_id;
            }

            if (!ownerId) {
                throw new Error('You do not have permission to view discounts');
            }

            const result = await discountModel.getDiscountById(id, userRole, ownerId);

            if (result.rows.length === 0) {
                throw new Error('Discount not found');
            }

            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Get active discounts for dropdown (Cashier/Manager view)
    getActiveDiscounts: async (userId, userRole) => {
        try {
            let ownerId = null;

            if (userRole === 'Store Owner') {
                ownerId = userId;
            } else if (userRole === 'Store Manager' || userRole === 'Cashier') {
                const db = require('../../config/database.config');
                const storeResult = await db.query(
                    'SELECT owner_id FROM store_master WHERE id = $1',
                    [userId]
                );
                ownerId = storeResult.rows[0]?.owner_id;
            }

            if (!ownerId) {
                return [];
            }

            const result = await discountModel.getActiveDiscounts(ownerId);
            return result.rows;
        } catch (error) {
            throw error;
        }
    },

    // Get discount statistics (Store Owner only)
    getDiscountStats: async (ownerId) => {
        try {
            const result = await discountModel.getDiscountStats(ownerId);
            return result.rows[0] || {};
        } catch (error) {
            throw error;
        }
    },

    // Get discounts by type
    getDiscountsByType: async (discountType, userId, userRole) => {
        try {
            let ownerId = null;

            if (userRole === 'Store Owner') {
                ownerId = userId;
            } else if (userRole === 'Store Manager' || userRole === 'Cashier') {
                const db = require('../../config/database.config');
                const storeResult = await db.query(
                    'SELECT owner_id FROM store_master WHERE id = $1',
                    [userId]
                );
                ownerId = storeResult.rows[0]?.owner_id;
            }

            if (!ownerId) {
                return [];
            }

            const result = await discountModel.getDiscountsByType(ownerId, discountType);
            return result.rows;
        } catch (error) {
            throw error;
        }
    },

    // Toggle discount status (Store Owner only)
    toggleDiscountStatus: async (id, ownerId) => {
        try {
            // Check if discount exists and belongs to owner
            const discount = await discountModel.getDiscountBasicById(id);
            if (discount.rows.length === 0) {
                throw new Error('Discount not found');
            }

            if (discount.rows[0].owner_id !== ownerId) {
                throw new Error('You do not have permission to modify this discount');
            }

            const newStatus = !discount.rows[0].is_active;
            const result = await discountModel.toggleDiscountStatus(id, newStatus);

            return {
                id: result.rows[0].id,
                is_active: result.rows[0].is_active,
                message: `Discount ${newStatus ? 'activated' : 'deactivated'} successfully`
            };
        } catch (error) {
            throw error;
        }
    },

    // Validate discount for invoice
    validateDiscount: async (discountId, amount, ownerId) => {
        try {
            const discount = await discountModel.getDiscountBasicById(discountId);
            if (discount.rows.length === 0 || !discount.rows[0].is_active) {
                throw new Error('Invalid or inactive discount');
            }

            if (discount.rows[0].owner_id !== ownerId) {
                throw new Error('Discount does not belong to this store');
            }

            const discountValue = parseFloat(discount.rows[0].discount_value);
            const discountType = discount.rows[0].discount_type;

            let discountAmount;
            if (discountType === 'Percentage') {
                discountAmount = (amount * discountValue) / 100;
            } else {
                discountAmount = Math.min(discountValue, amount); // Fixed amount, cannot exceed total
            }

            return {
                valid: true,
                discount: discount.rows[0],
                discountAmount: discountAmount
            };
        } catch (error) {
            throw error;
        }
    }
};

module.exports = discountService;
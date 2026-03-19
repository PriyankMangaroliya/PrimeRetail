const categoryModel = require('./categories.model');

const categoryService = {
    // Create new category (Store Owner only)
    createCategory: async (categoryData, ownerId) => {
        try {
            // Check if category name already exists for this owner
            const existingCategory = await categoryModel.checkCategoryNameExists(ownerId, categoryData.category_name);
            if (existingCategory.rows.length > 0) {
                throw new Error('Category name already exists');
            }

            const data = {
                ...categoryData,
                owner_id: ownerId,
                created_by: ownerId
            };

            const result = await categoryModel.createCategory(data);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Update category (Store Owner only)
    updateCategory: async (id, categoryData, ownerId) => {
        try {
            // Check if category exists and belongs to owner
            const category = await categoryModel.getCategoryBasicById(id);
            if (category.rows.length === 0) {
                throw new Error('Category not found');
            }

            if (category.rows[0].owner_id !== ownerId) {
                throw new Error('You do not have permission to update this category');
            }

            // Check if category name already exists (if updating)
            if (categoryData.category_name && categoryData.category_name !== category.rows[0].category_name) {
                const existingCategory = await categoryModel.checkCategoryNameExists(ownerId, categoryData.category_name, id);
                if (existingCategory.rows.length > 0) {
                    throw new Error('Category name already exists');
                }
            }

            const updateData = {
                ...categoryData,
                updated_by: ownerId
            };

            const result = await categoryModel.updateCategory(id, updateData);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Delete category (Store Owner only)
    deleteCategory: async (id, ownerId) => {
        try {
            // Check if category exists and belongs to owner
            const category = await categoryModel.getCategoryBasicById(id);
            if (category.rows.length === 0) {
                throw new Error('Category not found');
            }

            if (category.rows[0].owner_id !== ownerId) {
                throw new Error('You do not have permission to delete this category');
            }

            // Check if category has any products
            const db = require('../../config/database.config');
            const productCheck = await db.query(
                'SELECT COUNT(*) as count FROM product_master WHERE category_id = $1 AND is_deleted = false',
                [id]
            );

            if (parseInt(productCheck.rows[0].count) > 0) {
                throw new Error('Cannot delete category with existing products');
            }

            const result = await categoryModel.deleteCategory(id);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Get all categories based on user role
    getAllCategories: async (userRole, userId) => {
        try {
            let ownerId = null;

            if (userRole === 'Store Owner') {
                ownerId = userId;
            } else if (userRole === 'Store Manager' || userRole === 'Cashier' ||
                userRole === 'Inventory Staff' || userRole === 'Warehouse Staff') {
                // For these roles, get owner_id from their store/warehouse
                const db = require('../../config/database.config');
                let query;

                if (userRole === 'Warehouse Staff') {
                    query = {
                        text: 'SELECT owner_id FROM warehouse_master WHERE id = $1',
                        values: [userId] // userId is warehouse_id
                    };
                } else {
                    query = {
                        text: 'SELECT owner_id FROM store_master WHERE id = $1',
                        values: [userId] // userId is store_id
                    };
                }

                const result = await db.query(query);
                ownerId = result.rows[0]?.owner_id;
            }

            const result = await categoryModel.getAllCategories(userRole, ownerId);
            return result.rows;
        } catch (error) {
            throw error;
        }
    },

    // Get category by ID
    getCategoryById: async (id, userRole, userId) => {
        try {
            let ownerId = null;

            if (userRole === 'Store Owner') {
                ownerId = userId;
            } else if (userRole === 'Store Manager' || userRole === 'Cashier' ||
                userRole === 'Inventory Staff' || userRole === 'Warehouse Staff') {
                // Get owner_id from their store/warehouse
                const db = require('../../config/database.config');
                let query;

                if (userRole === 'Warehouse Staff') {
                    query = {
                        text: 'SELECT owner_id FROM warehouse_master WHERE id = $1',
                        values: [userId]
                    };
                } else {
                    query = {
                        text: 'SELECT owner_id FROM store_master WHERE id = $1',
                        values: [userId]
                    };
                }

                const result = await db.query(query);
                ownerId = result.rows[0]?.owner_id;
            }

            const result = await categoryModel.getCategoryById(id, userRole, ownerId);

            if (result.rows.length === 0) {
                throw new Error('Category not found');
            }

            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Get active categories for dropdown
    getActiveCategories: async (userRole, userId) => {
        try {
            let ownerId = null;

            if (userRole === 'Store Owner') {
                ownerId = userId;
            } else if (userRole === 'Store Manager' || userRole === 'Cashier' ||
                userRole === 'Inventory Staff' || userRole === 'Warehouse Staff') {
                const db = require('../../config/database.config');
                let query;

                if (userRole === 'Warehouse Staff') {
                    query = {
                        text: 'SELECT owner_id FROM warehouse_master WHERE id = $1',
                        values: [userId]
                    };
                } else {
                    query = {
                        text: 'SELECT owner_id FROM store_master WHERE id = $1',
                        values: [userId]
                    };
                }

                const result = await db.query(query);
                ownerId = result.rows[0]?.owner_id;
            }

            if (!ownerId) {
                return [];
            }

            const result = await categoryModel.getActiveCategories(ownerId);
            return result.rows;
        } catch (error) {
            throw error;
        }
    },

    // Get category statistics
    getCategoryStats: async (userRole, userId) => {
        try {
            let ownerId = null;

            if (userRole === 'Store Owner') {
                ownerId = userId;
            } else if (userRole === 'Store Manager' || userRole === 'Cashier' ||
                userRole === 'Inventory Staff' || userRole === 'Warehouse Staff') {
                const db = require('../../config/database.config');
                let query;

                if (userRole === 'Warehouse Staff') {
                    query = {
                        text: 'SELECT owner_id FROM warehouse_master WHERE id = $1',
                        values: [userId]
                    };
                } else {
                    query = {
                        text: 'SELECT owner_id FROM store_master WHERE id = $1',
                        values: [userId]
                    };
                }

                const result = await db.query(query);
                ownerId = result.rows[0]?.owner_id;
            }

            const result = await categoryModel.getCategoryStats(userRole, ownerId);
            return result.rows[0] || {};
        } catch (error) {
            throw error;
        }
    },

    // Toggle category status (Store Owner only)
    toggleCategoryStatus: async (id, ownerId) => {
        try {
            // Check if category exists and belongs to owner
            const category = await categoryModel.getCategoryBasicById(id);
            if (category.rows.length === 0) {
                throw new Error('Category not found');
            }

            if (category.rows[0].owner_id !== ownerId) {
                throw new Error('You do not have permission to modify this category');
            }

            const newStatus = !category.rows[0].is_active;
            const result = await categoryModel.toggleCategoryStatus(id, newStatus);

            return {
                id: result.rows[0].id,
                is_active: result.rows[0].is_active,
                message: `Category ${newStatus ? 'activated' : 'deactivated'} successfully`
            };
        } catch (error) {
            throw error;
        }
    }
};

module.exports = categoryService;
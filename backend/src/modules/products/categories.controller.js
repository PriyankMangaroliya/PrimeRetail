const categoryService = require('./categories.service');
const categoryValidation = require('./categories.validation');
const responseUtils = require('../../utils/response.utils');

const categoryController = {
    // Create new category (Store Owner only)
    createCategory: async (req, res) => {
        try {
            // Check if user is Store Owner
            if (req.user.role_name !== 'Store Owner') {
                return responseUtils.forbidden(res, 'Only Store Owners can create categories');
            }

            // Validate request body
            const { error, value } = categoryValidation.createCategory.validate(req.body);
            if (error) {
                return responseUtils.validationError(res, 'Validation failed', error.details);
            }

            const ownerId = req.user.id;
            const category = await categoryService.createCategory(value, ownerId);

            return responseUtils.created(res, 'Category created successfully', category);
        } catch (error) {
            console.error('Create Category Error:', error);

            if (error.message.includes('already exists')) {
                return responseUtils.conflict(res, error.message);
            }
            if (error.message.includes('not found') || error.message.includes('required')) {
                return responseUtils.badRequest(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to create category');
        }
    },

    // Update category (Store Owner only)
    updateCategory: async (req, res) => {
        try {
            // Check if user is Store Owner
            if (req.user.role_name !== 'Store Owner') {
                return responseUtils.forbidden(res, 'Only Store Owners can update categories');
            }

            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = categoryValidation.categoryIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid category ID', paramError.details);
            }

            // Validate request body
            const { error, value } = categoryValidation.updateCategory.validate(req.body);
            if (error) {
                return responseUtils.validationError(res, 'Validation failed', error.details);
            }

            const ownerId = req.user.id;
            const category = await categoryService.updateCategory(id, value, ownerId);

            return responseUtils.success(res, 200, 'Category updated successfully', category);
        } catch (error) {
            console.error('Update Category Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }
            if (error.message.includes('already exists')) {
                return responseUtils.conflict(res, error.message);
            }
            if (error.message.includes('permission') || error.message.includes('forbidden')) {
                return responseUtils.forbidden(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to update category');
        }
    },

    // Delete category (Store Owner only)
    deleteCategory: async (req, res) => {
        try {
            // Check if user is Store Owner
            if (req.user.role_name !== 'Store Owner') {
                return responseUtils.forbidden(res, 'Only Store Owners can delete categories');
            }

            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = categoryValidation.categoryIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid category ID', paramError.details);
            }

            const ownerId = req.user.id;
            const result = await categoryService.deleteCategory(id, ownerId);

            return responseUtils.success(res, 200, 'Category deleted successfully', result);
        } catch (error) {
            console.error('Delete Category Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }
            if (error.message.includes('existing products')) {
                return responseUtils.conflict(res, error.message);
            }
            if (error.message.includes('permission') || error.message.includes('forbidden')) {
                return responseUtils.forbidden(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to delete category');
        }
    },

    // Get all categories
    getAllCategories: async (req, res) => {
        try {
            const userRole = req.user.role_name;
            const userId = req.user.id;

            // Check if user has access
            if (!['Store Owner', 'Store Manager', 'Cashier', 'Inventory Staff', 'Warehouse Staff'].includes(userRole)) {
                return responseUtils.forbidden(res, 'You do not have permission to view categories');
            }

            const categories = await categoryService.getAllCategories(userRole, userId);

            return responseUtils.success(res, 200, 'Categories retrieved successfully', categories);
        } catch (error) {
            console.error('Get All Categories Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve categories');
        }
    },

    // Get category by ID
    getCategoryById: async (req, res) => {
        try {
            const { id } = req.params;
            const userRole = req.user.role_name;
            const userId = req.user.id;

            // Validate ID param
            const { error: paramError } = categoryValidation.categoryIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid category ID', paramError.details);
            }

            // Check if user has access
            if (!['Store Owner', 'Store Manager', 'Cashier', 'Inventory Staff', 'Warehouse Staff'].includes(userRole)) {
                return responseUtils.forbidden(res, 'You do not have permission to view categories');
            }

            const category = await categoryService.getCategoryById(id, userRole, userId);

            return responseUtils.success(res, 200, 'Category retrieved successfully', category);
        } catch (error) {
            console.error('Get Category By ID Error:', error);

            if (error.message === 'Category not found') {
                return responseUtils.notFound(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to retrieve category');
        }
    },

    // Get active categories for dropdown
    getActiveCategories: async (req, res) => {
        try {
            const userRole = req.user.role_name;
            const userId = req.user.id;

            // Check if user has access
            if (!['Store Owner', 'Store Manager', 'Cashier', 'Inventory Staff', 'Warehouse Staff'].includes(userRole)) {
                return responseUtils.forbidden(res, 'You do not have permission to view categories');
            }

            const categories = await categoryService.getActiveCategories(userRole, userId);

            return responseUtils.success(res, 200, 'Active categories retrieved successfully', categories);
        } catch (error) {
            console.error('Get Active Categories Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve active categories');
        }
    },

    // Get category statistics
    getCategoryStats: async (req, res) => {
        try {
            const userRole = req.user.role_name;
            const userId = req.user.id;

            // Check if user has access
            if (!['Store Owner', 'Store Manager', 'Cashier', 'Inventory Staff', 'Warehouse Staff'].includes(userRole)) {
                return responseUtils.forbidden(res, 'You do not have permission to view category statistics');
            }

            const stats = await categoryService.getCategoryStats(userRole, userId);

            return responseUtils.success(res, 200, 'Category statistics retrieved successfully', stats);
        } catch (error) {
            console.error('Get Category Stats Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve statistics');
        }
    },

    // Toggle category status (Store Owner only)
    toggleCategoryStatus: async (req, res) => {
        try {
            // Check if user is Store Owner
            if (req.user.role_name !== 'Store Owner') {
                return responseUtils.forbidden(res, 'Only Store Owners can toggle category status');
            }

            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = categoryValidation.categoryIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid category ID', paramError.details);
            }

            const ownerId = req.user.id;
            const result = await categoryService.toggleCategoryStatus(id, ownerId);

            return responseUtils.success(res, 200, result.message, { is_active: result.is_active });
        } catch (error) {
            console.error('Toggle Category Status Error:', error);

            if (error.message === 'Category not found') {
                return responseUtils.notFound(res, error.message);
            }
            if (error.message.includes('permission')) {
                return responseUtils.forbidden(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to toggle category status');
        }
    }
};

module.exports = categoryController;
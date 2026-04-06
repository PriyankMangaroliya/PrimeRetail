const productService = require('./products.service');
const productValidation = require('./products.validation');
const responseUtils = require('../../utils/response.utils');

const productController = {
    // Create new product (Store Owner only)
    createProduct: async (req, res) => {
        try {
            // Check if user is Store Owner
            if (req.user.role_name !== 'Store Owner') {
                return responseUtils.forbidden(res, 'Only Store Owners can create products');
            }

            // Validate request body
            const { error, value } = productValidation.createProduct.validate(req.body);
            if (error) {
                return responseUtils.validationError(res, 'Validation failed', error.details);
            }

            const ownerId = req.user.id;
            const userId = req.user.id;
            const product = await productService.createProduct(value, ownerId, userId);

            return responseUtils.created(res, 'Product created successfully', product);
        } catch (error) {
            console.error('Create Product Error:', error);

            if (error.message.includes('already exists')) {
                return responseUtils.conflict(res, error.message);
            }
            if (error.message.includes('not found') || error.message.includes('required')) {
                return responseUtils.badRequest(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to create product');
        }
    },

    // Update product (Store Owner only)
    updateProduct: async (req, res) => {
        try {
            // Check if user is Store Owner
            if (req.user.role_name !== 'Store Owner') {
                return responseUtils.forbidden(res, 'Only Store Owners can update products');
            }

            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = productValidation.productIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid product ID', paramError.details);
            }

            // Validate request body
            const { error, value } = productValidation.updateProduct.validate(req.body);
            if (error) {
                return responseUtils.validationError(res, 'Validation failed', error.details);
            }

            const ownerId = req.user.id;
            const userId = req.user.id;
            const product = await productService.updateProduct(id, value, ownerId, userId);

            return responseUtils.success(res, 200, 'Product updated successfully', product);
        } catch (error) {
            console.error('Update Product Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }
            if (error.message.includes('already exists')) {
                return responseUtils.conflict(res, error.message);
            }
            if (error.message.includes('permission') || error.message.includes('forbidden')) {
                return responseUtils.forbidden(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to update product');
        }
    },

    // Delete product (Store Owner only)
    deleteProduct: async (req, res) => {
        try {
            // Check if user is Store Owner
            if (req.user.role_name !== 'Store Owner') {
                return responseUtils.forbidden(res, 'Only Store Owners can delete products');
            }

            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = productValidation.productIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid product ID', paramError.details);
            }

            const ownerId = req.user.id;
            const userId = req.user.id;
            const result = await productService.deleteProduct(id, ownerId, userId);

            return responseUtils.success(res, 200, 'Product deleted successfully', result);
        } catch (error) {
            console.error('Delete Product Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }
            if (error.message.includes('existing transactions') || error.message.includes('existing stock')) {
                return responseUtils.conflict(res, error.message);
            }
            if (error.message.includes('permission') || error.message.includes('forbidden')) {
                return responseUtils.forbidden(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to delete product');
        }
    },

    // Get all products
    getAllProducts: async (req, res) => {
        try {
            const userRole = req.user.role_name;
            const userId = req.user.id;

            // Check if user has access
            if (!['Store Owner', 'Store Manager', 'Cashier', 'Inventory Staff', 'Warehouse Staff'].includes(userRole)) {
                return responseUtils.forbidden(res, 'You do not have permission to view products');
            }

            const products = await productService.getAllProducts({ ...req.user, ...req.query });

            return responseUtils.success(res, 200, 'Products retrieved successfully', products);
        } catch (error) {
            console.error('Get All Products Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve products');
        }
    },

    // Get product by ID
    getProductById: async (req, res) => {
        try {
            const { id } = req.params;
            const userRole = req.user.role_name;
            const userId = req.user.id;

            // Validate ID param
            const { error: paramError } = productValidation.productIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid product ID', paramError.details);
            }

            // Check if user has access
            if (!['Store Owner', 'Store Manager', 'Cashier', 'Inventory Staff', 'Warehouse Staff'].includes(userRole)) {
                return responseUtils.forbidden(res, 'You do not have permission to view products');
            }

            const product = await productService.getProductById(id, req.user);

            return responseUtils.success(res, 200, 'Product retrieved successfully', product);
        } catch (error) {
            console.error('Get Product By ID Error:', error);

            if (error.message === 'Product not found') {
                return responseUtils.notFound(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to retrieve product');
        }
    },

    // Get products by category
    getProductsByCategory: async (req, res) => {
        try {
            const { categoryId } = req.params;
            const userRole = req.user.role_name;
            const userId = req.user.id;

            // Check if user has access
            if (!['Store Owner', 'Store Manager', 'Cashier', 'Inventory Staff', 'Warehouse Staff'].includes(userRole)) {
                return responseUtils.forbidden(res, 'You do not have permission to view products');
            }

            const products = await productService.getProductsByCategory(categoryId, req.user);

            return responseUtils.success(res, 200, 'Products retrieved successfully', products);
        } catch (error) {
            console.error('Get Products By Category Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve products');
        }
    },

    // Get products for sale (Cashier view)
    getProductsForSale: async (req, res) => {
        try {
            const userRole = req.user.role_name;
            const storeId = req.user.store_id;

            // Only Cashier can access this endpoint
            if (userRole !== 'Cashier') {
                return responseUtils.forbidden(res, 'Only Cashiers can access products for sale');
            }

            if (!storeId) {
                return responseUtils.badRequest(res, 'No store assigned');
            }

            const products = await productService.getProductsForSale(storeId, req.query.search);

            return responseUtils.success(res, 200, 'Products retrieved successfully', products);
        } catch (error) {
            console.error('Get Products For Sale Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve products');
        }
    },

    // Get product statistics
    getProductStats: async (req, res) => {
        try {
            const userRole = req.user.role_name;
            const userId = req.user.id;

            // Check if user has access
            if (!['Store Owner', 'Store Manager', 'Cashier', 'Inventory Staff', 'Warehouse Staff'].includes(userRole)) {
                return responseUtils.forbidden(res, 'You do not have permission to view product statistics');
            }

            const stats = await productService.getProductStats(req.user);

            return responseUtils.success(res, 200, 'Product statistics retrieved successfully', stats);
        } catch (error) {
            console.error('Get Product Stats Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve statistics');
        }
    },

    // Check SKU availability
    checkSKU: async (req, res) => {
        try {
            const { sku } = req.query;
            const { exclude_id } = req.query;

            if (!sku) {
                return responseUtils.badRequest(res, 'SKU is required');
            }

            // Only Store Owner can check SKU
            if (req.user.role_name !== 'Store Owner') {
                return responseUtils.forbidden(res, 'Only Store Owners can check SKU availability');
            }

            const ownerId = req.user.id;
            const result = await productService.checkSKU(sku, ownerId, exclude_id);

            return responseUtils.success(res, 200, result.message, { available: result.available });
        } catch (error) {
            console.error('Check SKU Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to check SKU');
        }
    },

    // Check barcode availability
    checkBarcode: async (req, res) => {
        try {
            const { barcode } = req.query;
            const { exclude_id } = req.query;

            if (!barcode) {
                return responseUtils.badRequest(res, 'Barcode is required');
            }

            // Only Store Owner can check barcode
            if (req.user.role_name !== 'Store Owner') {
                return responseUtils.forbidden(res, 'Only Store Owners can check barcode availability');
            }

            const ownerId = req.user.id;
            const result = await productService.checkBarcode(barcode, ownerId, exclude_id);

            return responseUtils.success(res, 200, result.message, { available: result.available });
        } catch (error) {
            console.error('Check Barcode Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to check barcode');
        }
    },

    // Toggle product status (Store Owner only)
    toggleProductStatus: async (req, res) => {
        try {
            // Check if user is Store Owner
            if (req.user.role_name !== 'Store Owner') {
                return responseUtils.forbidden(res, 'Only Store Owners can toggle product status');
            }

            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = productValidation.productIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid product ID', paramError.details);
            }

            const ownerId = req.user.id;
            const result = await productService.toggleProductStatus(id, ownerId);

            return responseUtils.success(res, 200, result.message, { is_active: result.is_active });
        } catch (error) {
            console.error('Toggle Product Status Error:', error);

            if (error.message.includes('not found') || error.message.includes('permission')) {
                return responseUtils.notFound(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to toggle product status');
        }
    },

    // Bulk create products (Store Owner only)
    bulkCreateProducts: async (req, res) => {
        try {
            // Check if user is Store Owner
            if (req.user.role_name !== 'Store Owner') {
                return responseUtils.forbidden(res, 'Only Store Owners can bulk create products');
            }

            if (!Array.isArray(req.body.products)) {
                return responseUtils.badRequest(res, 'Invalid request format. "products" must be an array.');
            }

            const ownerId = req.user.id;
            const userId = req.user.id;
            const results = await productService.bulkCreateProducts(req.body.products, ownerId, userId);

            return responseUtils.success(res, 200, 'Bulk processing completed', results);
        } catch (error) {
            console.error('Bulk Create Product Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to process bulk products');
        }
    }
};

module.exports = productController;
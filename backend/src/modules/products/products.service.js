const productModel = require('./products.model');

const productService = {
    // Create new product (Store Owner only)
    createProduct: async (productData, ownerId, userId) => {
        try {
            // Check if product name is unique for this owner
            const nameCheck = await productModel.checkProductNameUnique(productData.product_name, ownerId);
            if (nameCheck.rows.length > 0) {
                throw new Error('Product name already exists');
            }

            // Generate SKU if not provided
            if (!productData.sku) {
                productData.sku = productData.product_name
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, '_')
                    .substring(0, 50);
            }

            // Check if SKU already exists for this owner
            const existingSKU = await productModel.getProductBySKU(productData.sku, ownerId);
            if (existingSKU.rows.length > 0) {
                // If auto-generated SKU exists, append a random suffix
                if (!productData.sku_provided) {
                    productData.sku = `${productData.sku}_${Math.floor(Math.random() * 1000)}`;
                } else {
                    throw new Error('SKU already exists');
                }
            }

            // Generate barcode from SKU if not provided
            if (!productData.barcode) {
                productData.barcode = productData.sku;
            }

            // Check if barcode already exists (if provided)
            const existingBarcode = await productModel.getProductByBarcode(productData.barcode, ownerId);
            if (existingBarcode.rows.length > 0) {
                throw new Error('Barcode already exists');
            }

            // Verify category belongs to owner
            const db = require('../../config/database.config');
            const categoryCheck = await db.query(
                'SELECT id FROM category_master WHERE id = $1 AND owner_id = $2',
                [productData.category_id, ownerId]
            );
            if (!categoryCheck.rows.length) {
                throw new Error('Category not found or does not belong to you');
            }

            // Verify tax belongs to owner
            const taxCheck = await db.query(
                'SELECT id FROM store_taxes WHERE id = $1 AND owner_id = $2 AND is_deleted = false',
                [productData.tax_id, ownerId]
            );
            if (!taxCheck.rows.length) {
                throw new Error('Tax rule not found or does not belong to your store');
            }

            const data = {
                ...productData,
                owner_id: ownerId,
                created_by: userId
            };

            const result = await productModel.createProduct(data);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Update product (Store Owner only)
    updateProduct: async (id, productData, ownerId, userId) => {
        try {
            // Check if product exists and belongs to owner
            const db = require('../../config/database.config');
            const productCheck = await db.query(
                'SELECT * FROM product_master WHERE id = $1 AND owner_id = $2 AND is_deleted = false',
                [id, ownerId]
            );

            if (!productCheck.rows.length) {
                throw new Error('Product not found or you do not have permission');
            }

            // Check if product name is unique (if updating)
            if (productData.product_name && productData.product_name !== productCheck.rows[0].product_name) {
                const nameCheck = await productModel.checkProductNameUnique(productData.product_name, ownerId, id);
                if (nameCheck.rows.length > 0) {
                    throw new Error('Product name already exists');
                }
            }

            // Check if SKU already exists (if updating)
            if (productData.sku && productData.sku !== productCheck.rows[0].sku) {
                const existingSKU = await productModel.getProductBySKU(productData.sku, ownerId, id);
                if (existingSKU.rows.length > 0) {
                    throw new Error('SKU already exists');
                }
            }

            // Check if barcode already exists (if updating)
            if (productData.barcode && productData.barcode !== productCheck.rows[0].barcode) {
                const existingBarcode = await productModel.getProductByBarcode(productData.barcode, ownerId, id);
                if (existingBarcode.rows.length > 0) {
                    throw new Error('Barcode already exists');
                }
            }

            // Verify category belongs to owner (if updating)
            if (productData.category_id) {
                const categoryCheck = await db.query(
                    'SELECT id FROM category_master WHERE id = $1 AND owner_id = $2',
                    [productData.category_id, ownerId]
                );
                if (!categoryCheck.rows.length) {
                    throw new Error('Category not found or does not belong to you');
                }
            }

            // Verify tax belongs to owner (if updating)
            if (productData.tax_id) {
                const taxCheck = await db.query(
                    'SELECT id FROM store_taxes WHERE id = $1 AND owner_id = $2 AND is_deleted = false',
                    [productData.tax_id, ownerId]
                );
                if (!taxCheck.rows.length) {
                    throw new Error('Tax rule not found or does not belong to your store');
                }
            }

            const data = {
                ...productData,
                updated_by: userId
            };

            const result = await productModel.updateProduct(id, data);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Delete product (Store Owner only)
    deleteProduct: async (id, ownerId, userId) => {
        try {
            // Check if product exists and belongs to owner
            const db = require('../../config/database.config');
            const productCheck = await db.query(
                'SELECT id FROM product_master WHERE id = $1 AND owner_id = $2 AND is_deleted = false',
                [id, ownerId]
            );

            if (!productCheck.rows.length) {
                throw new Error('Product not found or you do not have permission');
            }

            // Check if product has any transactions
            const txCheck = await productModel.checkTransactions(id);
            if (txCheck.hasTransactions) {
                throw new Error('Cannot delete product with existing transactions');
            }

            // Check if product has any stock (additional safety)
            const stockCheck = await db.query(
                'SELECT COUNT(*) as count FROM stock_master WHERE product_id = $1 AND quantity > 0',
                [id]
            );

            if (parseInt(stockCheck.rows[0].count) > 0) {
                throw new Error('Cannot delete product with existing stock');
            }

            const result = await productModel.deleteProduct(id, userId);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Get all products based on user role
    getAllProducts: async (user) => {
        try {
            const userRole = user.role_name;
            const userId = user.id;
            let ownerId = null;
            let locationType = null;
            let locationId = null;

            if (userRole === 'Store Owner') {
                ownerId = userId;
            } else if (['Store Manager', 'Cashier', 'Inventory Staff'].includes(userRole)) {
                locationType = 'Store';
                locationId = user.store_id;
                // Get owner_id from store
                const db = require('../../config/database.config');
                const storeResult = await db.query(
                    'SELECT owner_id FROM store_master WHERE id = $1',
                    [locationId]
                );
                ownerId = storeResult.rows[0]?.owner_id;
            } else if (userRole === 'Warehouse Staff') {
                locationType = 'Warehouse';
                locationId = user.warehouse_id;
                // Get owner_id from warehouse
                const db = require('../../config/database.config');
                const warehouseResult = await db.query(
                    'SELECT owner_id FROM warehouse_master WHERE id = $1',
                    [locationId]
                );
                ownerId = warehouseResult.rows[0]?.owner_id;
            }

            if (!ownerId) {
                return [];
            }

            const result = await productModel.getAllProducts(userRole, ownerId, locationType, locationId);
            return result.rows;
        } catch (error) {
            throw error;
        }
    },

    // Get product by ID
    getProductById: async (id, user) => {
        try {
            const userRole = user.role_name;
            const userId = user.id;
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
                        values: [user.warehouse_id]
                    };
                } else {
                    query = {
                        text: 'SELECT owner_id FROM store_master WHERE id = $1',
                        values: [user.store_id]
                    };
                }

                const result = await db.query(query);
                ownerId = result.rows[0]?.owner_id;
            }

            const result = await productModel.getProductById(id, userRole, ownerId);

            if (result.rows.length === 0) {
                throw new Error('Product not found');
            }

            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Get products by category
    getProductsByCategory: async (categoryId, user) => {
        try {
            const userRole = user.role_name;
            const userId = user.id;
            let ownerId = null;

            if (userRole === 'Store Owner') {
                ownerId = userId;
            } else {
                const db = require('../../config/database.config');
                let query;

                if (userRole === 'Warehouse Staff') {
                    query = {
                        text: 'SELECT owner_id FROM warehouse_master WHERE id = $1',
                        values: [user.warehouse_id]
                    };
                } else {
                    query = {
                        text: 'SELECT owner_id FROM store_master WHERE id = $1',
                        values: [user.store_id]
                    };
                }

                const result = await db.query(query);
                ownerId = result.rows[0]?.owner_id;
            }

            const result = await productModel.getProductsByCategory(categoryId, ownerId);
            return result.rows;
        } catch (error) {
            throw error;
        }
    },

    // Get products for sale (Cashier view)
    getProductsForSale: async (storeId) => {
        try {
            const result = await productModel.getProductsForSale(storeId);
            return result.rows;
        } catch (error) {
            throw error;
        }
    },

    // Get product statistics
    getProductStats: async (user) => {
        try {
            const userRole = user.role_name;
            const userId = user.id;
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
                        values: [user.warehouse_id]
                    };
                } else {
                    query = {
                        text: 'SELECT owner_id FROM store_master WHERE id = $1',
                        values: [user.store_id]
                    };
                }

                const result = await db.query(query);
                ownerId = result.rows[0]?.owner_id;
            }

            const result = await productModel.getProductStats(userRole, ownerId);
            return result.rows[0] || {};
        } catch (error) {
            throw error;
        }
    },

    // Check SKU availability
    checkSKU: async (sku, ownerId, excludeId = null) => {
        try {
            const result = await productModel.getProductBySKU(sku, ownerId, excludeId);
            return {
                available: result.rows.length === 0,
                message: result.rows.length === 0 ? 'SKU is available' : 'SKU already exists'
            };
        } catch (error) {
            throw error;
        }
    },

    // Check barcode availability
    checkBarcode: async (barcode, ownerId, excludeId = null) => {
        try {
            const result = await productModel.getProductByBarcode(barcode, ownerId, excludeId);
            return {
                available: result.rows.length === 0,
                message: result.rows.length === 0 ? 'Barcode is available' : 'Barcode already exists'
            };
        } catch (error) {
            throw error;
        }
    },

    // Toggle product status (Store Owner only)
    toggleProductStatus: async (id, ownerId) => {
        try {
            const db = require('../../config/database.config');
            const productCheck = await db.query(
                'SELECT is_active FROM product_master WHERE id = $1 AND owner_id = $2 AND is_deleted = false',
                [id, ownerId]
            );

            if (!productCheck.rows.length) {
                throw new Error('Product not found or you do not have permission');
            }

            const newStatus = !productCheck.rows[0].is_active;
            const result = await productModel.toggleProductStatus(id, newStatus);

            return {
                id: result.rows[0].id,
                is_active: result.rows[0].is_active,
                message: `Product ${newStatus ? 'activated' : 'deactivated'} successfully`
            };
        } catch (error) {
            throw error;
        }
    }
};

module.exports = productService;
const db = require('../../config/database.config');

const productModel = {
    // Create new product (Store Owner only)
    createProduct: (productData) => {
        const { owner_id, product_name, sku, barcode, description, category_id, tax_id, price, unit, min_stock, created_by } = productData;
        const query = {
            text: `INSERT INTO product_master
                   (owner_id, product_name, sku, barcode, description, category_id, tax_id, price, unit, min_stock, created_by, updated_by)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11) RETURNING *`,
            values: [owner_id, product_name, sku, barcode, description, category_id, tax_id, price, unit, min_stock || 0, created_by]
        };
        return db.query(query);
    },

    // Update product (Store Owner only)
    updateProduct: (id, productData) => {
        const { product_name, sku, barcode, description, category_id, tax_id, price, unit, min_stock, is_active, updated_by } = productData;
        const query = {
            text: `UPDATE product_master
                   SET product_name = COALESCE($1, product_name),
                       sku = COALESCE($2, sku),
                       barcode = COALESCE($3, barcode),
                       description = COALESCE($4, description),
                       category_id = COALESCE($5, category_id),
                       tax_id = COALESCE($6, tax_id),
                       price = COALESCE($7, price),
                       unit = COALESCE($8, unit),
                       min_stock = COALESCE($9, min_stock),
                       is_active = COALESCE($10, is_active),
                       updated_by = $11,
                       updated_at = CURRENT_TIMESTAMP
                   WHERE id = $12 AND is_deleted = false RETURNING *`,
            values: [product_name, sku, barcode, description, category_id, tax_id, price, unit, min_stock, is_active, updated_by, id]
        };
        return db.query(query);
    },

    // Soft delete product (Store Owner only)
    deleteProduct: (id, updated_by) => {
        const query = {
            text: `UPDATE product_master
                   SET is_deleted = true,
                       updated_by = $1,
                       updated_at = CURRENT_TIMESTAMP
                   WHERE id = $2 AND is_deleted = false RETURNING *`,
            values: [updated_by, id]
        };
        return db.query(query);
    },

    // Check if product name is unique for an owner
    checkProductNameUnique: (productName, ownerId, excludeId = null) => {
        let text = 'SELECT id FROM product_master WHERE LOWER(product_name) = LOWER($1) AND owner_id = $2 AND is_deleted = false';
        const values = [productName, ownerId];

        if (excludeId) {
            text += ' AND id != $3';
            values.push(excludeId);
        }

        return db.query({ text, values });
    },

    // Check for existing transactions
    checkTransactions: async (id) => {
        const invoiceCheck = await db.query(
            'SELECT COUNT(*) FROM invoice_items WHERE product_id = $1',
            [id]
        );
        const stockTxCheck = await db.query(
            'SELECT COUNT(*) FROM stock_transactions WHERE product_id = $1',
            [id]
        );
        
        return {
            hasTransactions: parseInt(invoiceCheck.rows[0].count) > 0 || parseInt(stockTxCheck.rows[0].count) > 0
        };
    },

    // Get all products based on user role
    getAllProducts: (userRole, ownerId, locationType, locationId, search = '') => {
        let query;

        if (userRole === 'Store Owner') {
            let text = `SELECT p.*, c.category_name, t.tax_name, t.tax_rate,
                              0 as stock_quantity
                       FROM product_master p
                       LEFT JOIN category_master c ON p.category_id = c.id
                       LEFT JOIN store_taxes st ON p.tax_id = st.id
                       LEFT JOIN tax_master t ON st.tax_id = t.id
                       WHERE p.owner_id = $1 AND p.is_deleted = false`;
            const values = [ownerId];
            
            if (search) {
                text += ` AND (LOWER(p.product_name) LIKE LOWER($2) OR LOWER(p.sku) LIKE LOWER($2) OR LOWER(p.barcode) LIKE LOWER($2))`;
                values.push(`%${search}%`);
            }
            
            text += ` ORDER BY p.id DESC`;
            query = { text, values };
        } else {
            // Staff roles see products from their owner with stock levels specific to their location
            let text = `SELECT p.*, c.category_name, t.tax_name, t.tax_rate,
                               COALESCE(s.quantity, 0) as stock_quantity
                        FROM product_master p
                        LEFT JOIN category_master c ON p.category_id = c.id
                        LEFT JOIN store_taxes st ON p.tax_id = st.id
                        LEFT JOIN tax_master t ON st.tax_id = t.id
                        LEFT JOIN stock_master s ON p.id = s.product_id 
                             AND s.location_type = $2 
                             AND s.location_id = $3
                        WHERE p.owner_id = $1 AND p.is_active = true AND p.is_deleted = false`;
            const values = [ownerId, locationType, locationId];

            if (search) { // search parameter
                text += ` AND (LOWER(p.product_name) LIKE LOWER($4) OR LOWER(p.sku) LIKE LOWER($4) OR LOWER(p.barcode) LIKE LOWER($4))`;
                values.push(`%${search}%`);
            }

            text += ` ORDER BY p.product_name`;
            query = { text, values };
        }

        return db.query(query);
    },

    // Get product by ID
    getProductById: (id, userRole, ownerId) => {
        let query;

        if (userRole === 'Store Owner') {
            query = {
                text: `SELECT p.*, c.category_name, t.tax_name, t.tax_rate
                       FROM product_master p
                       LEFT JOIN category_master c ON p.category_id = c.id
                       LEFT JOIN store_taxes st ON p.tax_id = st.id
                       LEFT JOIN tax_master t ON st.tax_id = t.id
                       WHERE p.id = $1 AND p.owner_id = $2 AND p.is_deleted = false`,
                values: [id, ownerId]
            };
        } else {
            query = {
                text: `SELECT p.*, c.category_name, t.tax_name, t.tax_rate
                       FROM product_master p
                       LEFT JOIN category_master c ON p.category_id = c.id
                       LEFT JOIN store_taxes st ON p.tax_id = st.id
                       LEFT JOIN tax_master t ON st.tax_id = t.id
                       WHERE p.id = $1 AND p.is_active = true AND p.is_deleted = false`,
                values: [id]
            };
        }

        return db.query(query);
    },

    // Get product by SKU
    getProductBySKU: (sku, ownerId, excludeId = null) => {
        let query;
        if (excludeId) {
            query = {
                text: `SELECT id FROM product_master 
                       WHERE sku = $1 AND owner_id = $2 AND id != $3 AND is_deleted = false`,
                values: [sku, ownerId, excludeId]
            };
        } else {
            query = {
                text: `SELECT id FROM product_master 
                       WHERE sku = $1 AND owner_id = $2 AND is_deleted = false`,
                values: [sku, ownerId]
            };
        }
        return db.query(query);
    },

    // Get product by barcode
    getProductByBarcode: (barcode, ownerId, excludeId = null) => {
        let query;
        if (excludeId) {
            query = {
                text: `SELECT id FROM product_master 
                       WHERE barcode = $1 AND owner_id = $2 AND id != $3 AND is_deleted = false`,
                values: [barcode, ownerId, excludeId]
            };
        } else {
            query = {
                text: `SELECT id FROM product_master 
                       WHERE barcode = $1 AND owner_id = $2 AND is_deleted = false`,
                values: [barcode, ownerId]
            };
        }
        return db.query(query);
    },

    // Get products by category
    getProductsByCategory: (categoryId, ownerId) => {
        const query = {
            text: `SELECT * FROM product_master
                   WHERE category_id = $1 AND owner_id = $2 AND is_deleted = false
                   ORDER BY product_name`,
            values: [categoryId, ownerId]
        };
        return db.query(query);
    },

    // Get products for dropdown (Cashier view)
    getProductsForSale: (storeId, search = null) => {
        let text = `SELECT p.id, p.product_name, p.sku, p.price, p.unit, p.barcode,
                          c.category_name, st.tax_id, t.tax_rate as tax_percentage,
                          COALESCE(s.quantity, 0) as stock_quantity
                   FROM product_master p
                            JOIN category_master c ON p.category_id = c.id
                            LEFT JOIN store_taxes st ON p.tax_id = st.id
                            LEFT JOIN tax_master t ON st.tax_id = t.id
                            LEFT JOIN stock_master s ON p.id = s.product_id
                       AND s.location_type = 'Store' AND s.location_id = $1
                   WHERE p.is_active = true AND p.is_deleted = false AND COALESCE(s.quantity, 0) > 0`;
        const values = [storeId];

        if (search) {
            text += ` AND (LOWER(p.product_name) LIKE LOWER($2) OR LOWER(p.sku) LIKE LOWER($2) OR LOWER(p.barcode) LIKE LOWER($2))`;
            values.push(`%${search}%`);
        }

        text += ` ORDER BY p.product_name LIMIT 50`;
        return db.query({ text, values });
    },

    // Get product statistics
    getProductStats: (userRole, ownerId) => {
        let query;

        if (userRole === 'Store Owner') {
            query = {
                text: `SELECT 
                           COUNT(*) as total_products,
                           COUNT(CASE WHEN is_active THEN 1 END) as active_products,
                           COUNT(CASE WHEN NOT is_active THEN 1 END) as inactive_products,
                           MIN(price) as min_price,
                           MAX(price) as max_price,
                           AVG(price) as avg_price,
                           COUNT(DISTINCT category_id) as total_categories
                       FROM product_master 
                       WHERE owner_id = $1 AND is_deleted = false`,
                values: [ownerId]
            };
        } else {
            query = {
                text: `SELECT 
                           COUNT(*) as total_products,
                           MIN(price) as min_price,
                           MAX(price) as max_price,
                           AVG(price) as avg_price,
                           COUNT(DISTINCT category_id) as total_categories
                       FROM product_master 
                       WHERE is_active = true AND is_deleted = false`
            };
        }

        return db.query(query);
    },

    // Toggle product status (Store Owner only)
    toggleProductStatus: (id, is_active) => {
        const query = {
            text: `UPDATE product_master 
                   SET is_active = $1, updated_at = CURRENT_TIMESTAMP
                   WHERE id = $2 AND is_deleted = false RETURNING *`,
            values: [is_active, id]
        };
        return db.query(query);
    }
};

module.exports = productModel;
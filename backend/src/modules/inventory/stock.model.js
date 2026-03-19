const db = require('../../config/database.config');

const stockModel = {
    // Create new stock entry
    createStock: (stockData) => {
        const { product_id, location_type, location_id, quantity, created_by } = stockData;
        const query = {
            text: `INSERT INTO stock_master 
             (product_id, location_type, location_id, quantity, created_by, updated_by) 
             VALUES ($1, $2, $3, $4, $5, $5) RETURNING *`,
            values: [product_id, location_type, location_id, quantity, created_by]
        };
        return db.query(query);
    },

    // Update stock quantity
    updateStockQuantity: (id, quantity, updated_by) => {
        const query = {
            text: `UPDATE stock_master 
             SET quantity = $1, 
                 updated_by = $2, 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $3 AND is_deleted = false RETURNING *`,
            values: [quantity, updated_by, id]
        };
        return db.query(query);
    },

    // Delete stock (soft delete)
    deleteStock: (id, updated_by) => {
        const query = {
            text: `UPDATE stock_master 
             SET is_deleted = true, 
                 updated_by = $1, 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 AND is_deleted = false RETURNING *`,
            values: [updated_by, id]
        };
        return db.query(query);
    },

    // Get stock by ID
    getStockById: (id) => {
        const query = {
            text: `SELECT s.*, p.product_name, p.sku 
             FROM stock_master s
             INNER JOIN product_master p ON s.product_id = p.id
             WHERE s.id = $1 AND s.is_deleted = false`,
            values: [id]
        };
        return db.query(query);
    },

    // Get stock by product
    getStockByProduct: (product_id) => {
        const query = {
            text: `SELECT * FROM stock_master 
             WHERE product_id = $1 AND is_deleted = false 
             ORDER BY id DESC`,
            values: [product_id]
        };
        return db.query(query);
    },

    // Get stock by location (store or warehouse)
    getStockByLocation: (location_type, location_id) => {
        const query = {
            text: `SELECT s.*, p.product_name, p.sku, p.price 
             FROM stock_master s
             INNER JOIN product_master p ON s.product_id = p.id
             WHERE s.location_type = $1 AND s.location_id = $2 
               AND s.is_deleted = false AND p.is_deleted = false
             ORDER BY s.id DESC`,
            values: [location_type, location_id]
        };
        return db.query(query);
    },

    // Get stock by store
    getStockByStore: (store_id) => {
        return stockModel.getStockByLocation('Store', store_id);
    },

    // Get stock by warehouse
    getStockByWarehouse: (warehouse_id) => {
        return stockModel.getStockByLocation('Warehouse', warehouse_id);
    },

    // Get low stock products (below threshold)
    getLowStockProducts: (threshold = 10) => {
        const query = {
            text: `SELECT s.*, p.product_name, p.sku 
             FROM stock_master s
             INNER JOIN product_master p ON s.product_id = p.id
             WHERE s.quantity <= $1 AND s.is_deleted = false AND p.is_deleted = false
             ORDER BY s.quantity ASC`,
            values: [threshold]
        };
        return db.query(query);
    }
};

module.exports = stockModel;
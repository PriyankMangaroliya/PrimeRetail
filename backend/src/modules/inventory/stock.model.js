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
             WHERE id = $3 RETURNING *`,
            values: [quantity, updated_by, id]
        };
        return db.query(query);
    },

    // Delete stock (hard delete)
    deleteStock: (id) => {
        const query = {
            text: `DELETE FROM stock_master WHERE id = $1 RETURNING *`,
            values: [id]
        };
        return db.query(query);
    },

    // Get stock by ID
    getStockById: (id) => {
        const query = {
            text: `SELECT s.*, p.product_name, p.sku, p.price, p.min_stock,
                    CASE 
                        WHEN s.location_type = 'Store' THEN st.store_name 
                        WHEN s.location_type = 'Warehouse' THEN wh.warehouse_name 
                    END as location_name,
                    CASE 
                        WHEN s.location_type = 'Store' THEN st.store_code 
                        WHEN s.location_type = 'Warehouse' THEN wh.warehouse_code 
                    END as location_code
             FROM stock_master s
             INNER JOIN product_master p ON s.product_id = p.id
             LEFT JOIN store_master st ON s.location_id = st.id AND s.location_type = 'Store'
             LEFT JOIN warehouse_master wh ON s.location_id = wh.id AND s.location_type = 'Warehouse'
             WHERE s.id = $1 AND p.is_deleted = false`,
            values: [id]
        };
        return db.query(query);
    },

    // Get all stock (for Owner)
    getAllStock: () => {
        const query = {
            text: `SELECT s.*, p.product_name, p.sku, p.price, p.min_stock,
                    CASE 
                        WHEN s.location_type = 'Store' THEN st.store_name 
                        WHEN s.location_type = 'Warehouse' THEN wh.warehouse_name 
                    END as location_name,
                    CASE 
                        WHEN s.location_type = 'Store' THEN st.store_code 
                        WHEN s.location_type = 'Warehouse' THEN wh.warehouse_code 
                    END as location_code
             FROM stock_master s
             INNER JOIN product_master p ON s.product_id = p.id
             LEFT JOIN store_master st ON s.location_id = st.id AND s.location_type = 'Store'
             LEFT JOIN warehouse_master wh ON s.location_id = wh.id AND s.location_type = 'Warehouse'
             WHERE p.is_deleted = false
             ORDER BY s.id DESC`
        };
        return db.query(query);
    },

    // Get stock by product and location
    getStockByLocationAndProduct: (location_type, location_id, product_id) => {
        const query = {
            text: `SELECT * FROM stock_master 
             WHERE location_type = $1 AND location_id = $2 AND product_id = $3`,
            values: [location_type, location_id, product_id]
        };
        return db.query(query);
    },

    // Get stock by product
    getStockByProduct: (product_id) => {
        const query = {
            text: `SELECT * FROM stock_master 
             WHERE product_id = $1 
             ORDER BY id DESC`,
            values: [product_id]
        };
        return db.query(query);
    },

    // Get stock by location (store or warehouse)
    getStockByLocation: (location_type, location_id) => {
        const query = {
            text: `SELECT s.*, p.product_name, p.sku, p.price, p.min_stock,
                    CASE 
                        WHEN s.location_type = 'Store' THEN st.store_name 
                        WHEN s.location_type = 'Warehouse' THEN wh.warehouse_name 
                    END as location_name,
                    CASE 
                        WHEN s.location_type = 'Store' THEN st.store_code 
                        WHEN s.location_type = 'Warehouse' THEN wh.warehouse_code 
                    END as location_code
             FROM stock_master s
             INNER JOIN product_master p ON s.product_id = p.id
             LEFT JOIN store_master st ON s.location_id = st.id AND s.location_type = 'Store'
             LEFT JOIN warehouse_master wh ON s.location_id = wh.id AND s.location_type = 'Warehouse'
             WHERE s.location_type = $1 AND s.location_id = $2 
               AND p.is_deleted = false
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

    getLowStockProducts: (threshold = null) => {
        const query = {
            text: `SELECT s.*, p.product_name, p.sku, p.min_stock
             FROM stock_master s
             INNER JOIN product_master p ON s.product_id = p.id
             WHERE s.quantity <= COALESCE($1, p.min_stock) AND p.is_deleted = false
             ORDER BY s.quantity ASC`,
            values: [threshold]
        };
        return db.query(query);
    }
};

module.exports = stockModel;
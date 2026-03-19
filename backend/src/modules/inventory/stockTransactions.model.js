const db = require('../../config/database.config');

const stockTransactionModel = {
    // Create new stock transaction
    createStockTransaction: (transactionData) => {
        const { product_id, stock_id, movement_type, source_location_type, source_location_id,
            destination_location_type, destination_location_id, quantity, reference_type,
            reference_id, notes, created_by } = transactionData;

        const query = {
            text: `INSERT INTO stock_transactions 
             (product_id, stock_id, movement_type, source_location_type, source_location_id, 
              destination_location_type, destination_location_id, quantity, reference_type, 
              reference_id, notes, created_by) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
            values: [product_id, stock_id, movement_type, source_location_type, source_location_id,
                destination_location_type, destination_location_id, quantity, reference_type,
                reference_id, notes, created_by]
        };
        return db.query(query);
    },

    // Get all stock transactions
    getAllStockTransactions: () => {
        const query = {
            text: `SELECT t.*, p.product_name, p.sku 
             FROM stock_transactions t
             INNER JOIN product_master p ON t.product_id = p.id
             ORDER BY t.id DESC`
        };
        return db.query(query);
    },

    // Get transaction by ID
    getTransactionById: (id) => {
        const query = {
            text: `SELECT t.*, p.product_name, p.sku 
             FROM stock_transactions t
             INNER JOIN product_master p ON t.product_id = p.id
             WHERE t.id = $1`,
            values: [id]
        };
        return db.query(query);
    },

    // Get transactions by product
    getTransactionsByProduct: (product_id) => {
        const query = {
            text: `SELECT * FROM stock_transactions 
             WHERE product_id = $1 
             ORDER BY id DESC`,
            values: [product_id]
        };
        return db.query(query);
    },

    // Get transactions by location (source or destination)
    getTransactionsByLocation: (location_type, location_id) => {
        const query = {
            text: `SELECT * FROM stock_transactions 
             WHERE (source_location_type = $1 AND source_location_id = $2)
                OR (destination_location_type = $1 AND destination_location_id = $2)
             ORDER BY id DESC`,
            values: [location_type, location_id]
        };
        return db.query(query);
    },

    // Get transactions by reference (invoice, etc.)
    getTransactionsByReference: (reference_type, reference_id) => {
        const query = {
            text: `SELECT * FROM stock_transactions 
             WHERE reference_type = $1 AND reference_id = $2 
             ORDER BY id DESC`,
            values: [reference_type, reference_id]
        };
        return db.query(query);
    }
};

module.exports = stockTransactionModel;
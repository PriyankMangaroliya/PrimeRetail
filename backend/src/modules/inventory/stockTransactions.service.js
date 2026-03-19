const stockTransactionModel = require('./stockTransactions.model');
const stockModel = require('./stock.model');

const stockTransactionService = {
    // Create new stock transaction
    createStockTransaction: async (transactionData) => {
        const { product_id, stock_id, movement_type, quantity, created_by } = transactionData;

        // Check if stock exists
        const stockResult = await stockModel.getStockById(stock_id);
        if (stockResult.rows.length === 0) {
            throw new Error('Stock entry not found');
        }

        const currentStock = stockResult.rows[0];
        let newQuantity = currentStock.quantity;

        // Update stock quantity based on movement type
        switch (movement_type) {
            case 'Add':
                newQuantity += quantity;
                break;
            case 'Remove':
            case 'Damaged':
                if (currentStock.quantity < quantity) {
                    throw new Error('Insufficient stock for this operation');
                }
                newQuantity -= quantity;
                break;
            case 'Transfer':
                if (currentStock.quantity < quantity) {
                    throw new Error('Insufficient stock for transfer');
                }
                newQuantity -= quantity;
                // Note: For transfers, a corresponding 'Add' transaction should be created at the destination
                break;
        }

        // Create the transaction
        const result = await stockTransactionModel.createStockTransaction(transactionData);

        // Update the stock master quantity
        await stockModel.updateStockQuantity(stock_id, newQuantity, created_by);

        return result.rows[0];
    },

    // Get all stock transactions
    getAllStockTransactions: async () => {
        const result = await stockTransactionModel.getAllStockTransactions();
        return result.rows;
    },

    // Get transaction by ID
    getTransactionById: async (id) => {
        const result = await stockTransactionModel.getTransactionById(id);
        if (result.rows.length === 0) {
            throw new Error('Transaction not found');
        }
        return result.rows[0];
    },

    // Get transactions by product
    getTransactionsByProduct: async (product_id) => {
        const result = await stockTransactionModel.getTransactionsByProduct(product_id);
        return result.rows;
    },

    // Get transactions by location
    getTransactionsByLocation: async (location_type, location_id) => {
        const result = await stockTransactionModel.getTransactionsByLocation(location_type, location_id);
        return result.rows;
    },

    // Get transactions by reference
    getTransactionsByReference: async (reference_type, reference_id) => {
        const result = await stockTransactionModel.getTransactionsByReference(reference_type, reference_id);
        return result.rows;
    }
};

module.exports = stockTransactionService;

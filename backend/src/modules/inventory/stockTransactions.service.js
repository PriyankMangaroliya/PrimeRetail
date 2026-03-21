const stockTransactionModel = require('./stockTransactions.model');
const stockModel = require('./stock.model');

const stockTransactionService = {
    // Create new stock transaction
    createStockTransaction: async (transactionData) => {
        const { product_id, stock_id, movement_type, quantity, destination_location_type, destination_location_id, created_by } = transactionData;

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
            case 'Return':
            case 'Exchange':
                newQuantity += quantity;
                break;
            case 'Damaged':
            case 'By Mistake Add':
            case 'Sell':
            case 'Remove':
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
                
                // Credit the destination
                const destResult = await stockModel.getStockByLocationAndProduct(
                    destination_location_type,
                    destination_location_id,
                    product_id
                );
                
                if (destResult.rows.length > 0) {
                    const destStock = destResult.rows[0];
                    await stockModel.updateStockQuantity(destStock.id, destStock.quantity + quantity, created_by);
                } else {
                    await stockModel.createStock({
                        product_id,
                        location_type: destination_location_type,
                        location_id: destination_location_id,
                        quantity,
                        created_by
                    });
                }
                break;
        }

        // Create the transaction
        const result = await stockTransactionModel.createStockTransaction(transactionData);

        // Update the stock master quantity
        await stockModel.updateStockQuantity(stock_id, newQuantity, created_by);

        return result.rows[0];
    },

    // Get all stock transactions
    // Get all stock transactions
    getAllStockTransactions: async (user) => {
        if (user.role_name === 'Store Owner' || user.role_name === 'Super Admin') {
            const result = await stockTransactionModel.getAllStockTransactions();
            return result.rows;
        } else if (['Store Manager', 'Cashier', 'Inventory Staff'].includes(user.role_name)) {
            if (!user.store_id) throw new Error('Store ID not found for user');
            const result = await stockTransactionModel.getTransactionsByLocation('Store', user.store_id);
            return result.rows;
        } else if (user.role_name === 'Warehouse Staff') {
            if (!user.warehouse_id) throw new Error('Warehouse ID not found for user');
            const result = await stockTransactionModel.getTransactionsByLocation('Warehouse', user.warehouse_id);
            return result.rows;
        } else {
            throw new Error('Unauthorized to view transactions');
        }
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

const stockTransactionModel = require('./stockTransactions.model');
const stockModel = require('./stock.model');
const db = require('../../config/database.config');
const inventoryNotificationsService = require('./inventoryNotifications.service');


const stockTransactionService = {
    // Create new stock transaction
    createStockTransaction: async (transactionData, user) => {
        const { 
            product_id, movement_type, quantity, 
            source_location_type, source_location_id,
            destination_location_type, destination_location_id,
            exchange_product_id 
        } = transactionData;

        // 1. Role-Based Movement Type Validation
        const rolePermissions = {
            'Warehouse Staff': ['ADD', 'TRANSFER', 'DAMAGED', 'MANUAL_ADD', 'MANUAL_REMOVE'],
            'Inventory Staff': ['TRANSFER', 'DAMAGED', 'RETURN', 'EXCHANGE', 'MANUAL_ADD', 'MANUAL_REMOVE'],
            'Cashier': ['SELL'],
            'Store Owner': ['ADD', 'SELL', 'RETURN', 'EXCHANGE', 'TRANSFER', 'DAMAGED', 'MANUAL_ADD', 'MANUAL_REMOVE'],
            'Super Admin': ['ADD', 'SELL', 'RETURN', 'EXCHANGE', 'TRANSFER', 'DAMAGED', 'MANUAL_ADD', 'MANUAL_REMOVE'],
            'Store Manager': ['ADD', 'SELL', 'RETURN', 'EXCHANGE', 'TRANSFER', 'DAMAGED', 'MANUAL_ADD', 'MANUAL_REMOVE']
        };

        const allowedMovements = rolePermissions[user.role_name] || [];
        if (!allowedMovements.includes(movement_type)) {
            throw new Error(`Role '${user.role_name}' is not authorized to perform '${movement_type}'`);
        }

        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            let before_qty = 0;
            let after_qty = 0;
            let stock_id = transactionData.stock_id;

            // Define which movements decrease stock from source
            const decreasingMovements = ['SELL', 'TRANSFER', 'DAMAGED', 'MANUAL_REMOVE'];
            // Define which movements increase stock at destination/source
            const increasingMovements = ['ADD', 'RETURN', 'EXCHANGE', 'MANUAL_ADD'];

            // 2. Handle Movements that decrease stock from a source location
            if (decreasingMovements.includes(movement_type)) {
                if (!source_location_type || !source_location_id) {
                    throw new Error(`${movement_type} requires a source location`);
                }

                const currentStockRes = await stockModel.getStockByLocationAndProduct(source_location_type, source_location_id, product_id, client);
                const currentStock = currentStockRes.rows[0];

                if (!currentStock || currentStock.quantity < quantity) {
                    throw new Error('Insufficient stock available at source location');
                }

                before_qty = currentStock.quantity;
                after_qty = before_qty - quantity;
                stock_id = currentStock.id;

                // Update source location stock (decrease)
                await stockModel.upsertStock({
                    product_id,
                    location_type: source_location_type,
                    location_id: source_location_id,
                    quantity: -quantity, // Decrease
                    updated_by: user.id
                }, client);
            }

            // 3. Handle Movements that increase stock at a destination location
            if (increasingMovements.includes(movement_type)) {
                const loc_type = destination_location_type || source_location_type;
                const loc_id = destination_location_id || source_location_id;

                if (!loc_type || !loc_id) {
                    throw new Error(`${movement_type} requires a location`);
                }

                const currentStockRes = await stockModel.getStockByLocationAndProduct(loc_type, loc_id, product_id, client);
                const currentStock = currentStockRes.rows[0];

                before_qty = currentStock ? currentStock.quantity : 0;
                after_qty = before_qty + quantity;

                // Update destination location stock (increase/upsert)
                const upsertRes = await stockModel.upsertStock({
                    product_id,
                    location_type: loc_type,
                    location_id: loc_id,
                    quantity: quantity, // Increase
                    updated_by: user.id
                }, client);
                
                stock_id = upsertRes.rows[0].id;
            }

            // 4. Special Handling for TRANSFER and EXCHANGE
            if (movement_type === 'TRANSFER') {
                if (!destination_location_type || !destination_location_id) {
                    throw new Error('TRANSFER requires a destination location');
                }

                await stockModel.upsertStock({
                    product_id,
                    location_type: destination_location_type,
                    location_id: destination_location_id,
                    quantity: quantity, // Increase destination
                    updated_by: user.id
                }, client);
            }

            if (movement_type === 'EXCHANGE' && exchange_product_id) {
                // For an EXCHANGE, we return the 'product_id' (already handled in step 3)
                // and sell the 'exchange_product_id' (now handle this)
                const loc_type = source_location_type || destination_location_type;
                const loc_id = source_location_id || destination_location_id;

                const exchangeStockRes = await stockModel.getStockByLocationAndProduct(loc_type, loc_id, exchange_product_id, client);
                const exchangeStock = exchangeStockRes.rows[0];

                if (!exchangeStock || exchangeStock.quantity < quantity) {
                    throw new Error('Insufficient stock for the exchange product');
                }

                const exchange_before_qty = exchangeStock.quantity;
                const exchange_after_qty = exchange_before_qty - quantity;

                // Update stock for the new product (Decrease)
                const exchangeUpsertRes = await stockModel.upsertStock({
                    product_id: exchange_product_id,
                    location_type: loc_type,
                    location_id: loc_id,
                    quantity: -quantity, // Decrease (Sale)
                    updated_by: user.id
                }, client);

                // Create the second transaction record (for the issued product)
                await stockTransactionModel.createStockTransaction({
                    ...transactionData,
                    reference_id: transactionData.reference_id || null, // Convert "" or undefined to null
                    product_id: exchange_product_id,
                    stock_id: exchangeUpsertRes.rows[0].id,
                    before_qty: exchange_before_qty,
                    after_qty: exchange_after_qty,
                    exchange_product_id: null, // Don't loop
                    notes: `Exchange: Issued in place of product #${product_id}. ${transactionData.notes || ''}`,
                    created_by: user.id
                }, client);
            }

            // 5. Create Transaction Record
            const transactionRecord = await stockTransactionModel.createStockTransaction({
                ...transactionData,
                reference_id: transactionData.reference_id || null, // Convert "" or undefined to null
                stock_id,
                before_qty,
                after_qty,
                created_by: user.id
            }, client);

            await client.query('COMMIT');
            
            // Asynchronously check for low stock levels to avoid blocking the user
            if (transactionRecord.rows[0]?.stock_id) {
                inventoryNotificationsService.checkAndNotifyLowStock(transactionRecord.rows[0].stock_id);
            }

            return transactionRecord.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw new Error(error.message);
        } finally {
            client.release();
        }
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

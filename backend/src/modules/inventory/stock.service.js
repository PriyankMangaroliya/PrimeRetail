const stockModel = require('./stock.model');
const stockTransactionModel = require('./stockTransactions.model');

const stockService = {
    // Create or Update stock entry (Upsert)
    createStock: async (stockData) => {
        const { product_id, location_type, location_id, quantity, created_by, movement_type, notes } = stockData;
        
        // Find existing stock for this location and product
        const existingStock = await stockModel.getStockByLocationAndProduct(location_type, location_id, product_id);
        
        let stock;
        if (existingStock.rows.length > 0) {
            // Update existing stock
            stock = existingStock.rows[0];
            const newQuantity = stock.quantity + quantity;
            const updateResult = await stockModel.updateStockQuantity(stock.id, newQuantity, created_by);
            stock = updateResult.rows[0];
        } else {
            // Create new stock
            const createResult = await stockModel.createStock(stockData);
            stock = createResult.rows[0];
        }
        
        // Log the transaction
        await stockTransactionModel.createStockTransaction({
            product_id,
            stock_id: stock.id,
            movement_type: movement_type || 'Add',
            quantity: quantity,
            notes: notes || 'Stock addition or refill',
            source_location_type: null,
            source_location_id: null,
            destination_location_type: location_type,
            destination_location_id: location_id,
            created_by
        });

        return stock;
    },

    // Update stock quantity
    updateStockQuantity: async (id, quantity, updated_by) => {
        // Check if stock exists
        const stock = await stockModel.getStockById(id);
        if (stock.rows.length === 0) {
            throw new Error('Stock entry not found');
        }

        const result = await stockModel.updateStockQuantity(id, quantity, updated_by);
        return result.rows[0];
    },

    // Delete stock (soft delete)
    deleteStock: async (id, updated_by) => {
        // Check if stock exists
        const stock = await stockModel.getStockById(id);
        if (stock.rows.length === 0) {
            throw new Error('Stock entry not found');
        }

        const result = await stockModel.deleteStock(id, updated_by);
        return result.rows[0];
    },

    // Get all stock (role-based)
    getAllStock: async (user) => {
        if (user.role_name === 'Store Owner' || user.role_name === 'Super Admin') {
            const result = await stockModel.getAllStock();
            return result.rows;
        } else if (['Store Manager', 'Cashier', 'Inventory Staff'].includes(user.role_name)) {
            if (!user.store_id) throw new Error('Store ID not found for user');
            const result = await stockModel.getStockByStore(user.store_id);
            return result.rows;
        } else if (user.role_name === 'Warehouse Staff') {
            if (!user.warehouse_id) throw new Error('Warehouse ID not found for user');
            const result = await stockModel.getStockByWarehouse(user.warehouse_id);
            return result.rows;
        } else {
            throw new Error('Unauthorized to view stock');
        }
    },

    // Get stock by ID
    getStockById: async (id) => {
        const result = await stockModel.getStockById(id);
        if (result.rows.length === 0) {
            throw new Error('Stock entry not found');
        }
        return result.rows[0];
    },

    // Get stock by product
    getStockByProduct: async (product_id) => {
        const result = await stockModel.getStockByProduct(product_id);
        return result.rows;
    },

    // Get stock by location
    getStockByLocation: async (location_type, location_id) => {
        const result = await stockModel.getStockByLocation(location_type, location_id);
        return result.rows;
    },

    // Get stock by store
    getStockByStore: async (store_id) => {
        const result = await stockModel.getStockByStore(store_id);
        return result.rows;
    },

    // Get stock by warehouse
    getStockByWarehouse: async (warehouse_id) => {
        const result = await stockModel.getStockByWarehouse(warehouse_id);
        return result.rows;
    },

    // Get low stock products
    getLowStockProducts: async (threshold) => {
        const result = await stockModel.getLowStockProducts(threshold);
        return result.rows;
    },

    // Get all active locations (Stores and Warehouses) for an owner
    getActiveLocations: async (user) => {
        const db = require('../../config/database.config');
        let ownerId;

        // Determine owner_id based on role
        if (user.role_name === 'Store Owner' || user.role_name === 'Super Admin') {
            ownerId = user.id;
        } else if (user.role_name === 'Warehouse Staff' && user.warehouse_id) {
            const result = await db.query('SELECT owner_id FROM warehouse_master WHERE id = $1', [user.warehouse_id]);
            ownerId = result.rows[0]?.owner_id;
        } else if (user.store_id) {
            const result = await db.query('SELECT owner_id FROM store_master WHERE id = $1', [user.store_id]);
            ownerId = result.rows[0]?.owner_id;
        }

        if (!ownerId) return [];

        // Fetch active stores and warehouses for this owner
        const storesQuery = `
            SELECT id, store_name as name, store_code as code, 'Store' as type 
            FROM store_master 
            WHERE owner_id = $1 AND is_active = true AND is_deleted = false 
            ORDER BY name ASC`;
        
        const warehousesQuery = `
            SELECT id, warehouse_name as name, warehouse_code as code, 'Warehouse' as type 
            FROM warehouse_master 
            WHERE owner_id = $1 AND is_active = true AND is_deleted = false 
            ORDER BY name ASC`;

        const [stores, warehouses] = await Promise.all([
            db.query(storesQuery, [ownerId]),
            db.query(warehousesQuery, [ownerId])
        ]);

        return [...stores.rows, ...warehouses.rows];
    }
};

module.exports = stockService;

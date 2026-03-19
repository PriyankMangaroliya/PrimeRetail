const stockModel = require('./stock.model');

const stockService = {
    // Create new stock entry
    createStock: async (stockData) => {
        const result = await stockModel.createStock(stockData);
        return result.rows[0];
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
    }
};

module.exports = stockService;

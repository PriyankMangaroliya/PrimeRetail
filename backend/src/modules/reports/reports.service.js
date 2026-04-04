const reportsModel = require('./reports.model');

const reportsService = {
    /**
     * Get Store Owners Report
     */
    getStoreOwnersReport: async (filters = {}) => {
        try {
            const result = await reportsModel.getStoreOwnersReport(filters);
            return result.rows;
        } catch (error) {
            console.error('Error in getStoreOwnersReport service:', error);
            throw error;
        }
    },

    /**
     * Get Stores Report
     */
    getStoresReport: async (filters = {}) => {
        try {
            const result = await reportsModel.getStoresReport(filters);
            return result.rows;
        } catch (error) {
            console.error('Error in getStoresReport service:', error);
            throw error;
        }
    },

    /**
     * Get Warehouses Report
     */
    getWarehousesReport: async (filters = {}) => {
        try {
            const result = await reportsModel.getWarehousesReport(filters);
            return result.rows;
        } catch (error) {
            console.error('Error in getWarehousesReport service:', error);
            throw error;
        }
    },

    /**
     * Get Roles Report
     */
    getRolesReport: async (filters = {}) => {
        try {
            const result = await reportsModel.getRolesReport(filters);
            return result.rows;
        } catch (error) {
            console.error('Error in getRolesReport service:', error);
            throw error;
        }
    },

    /**
     * Get Taxes Report
     */
    getTaxesReport: async (filters = {}) => {
        try {
            const result = await reportsModel.getTaxesReport(filters);
            return result.rows;
        } catch (error) {
            console.error('Error in getTaxesReport service:', error);
            throw error;
        }
    },

    /**
     * Get Payment Methods Report
     */
    getPaymentMethodsReport: async (filters = {}) => {
        try {
            const result = await reportsModel.getPaymentMethodsReport(filters);
            return result.rows;
        } catch (error) {
            console.error('Error in getPaymentMethodsReport service:', error);
            throw error;
        }
    },

    /**
     * Get Warehouse Stock Report
     */
    getWarehouseStockReport: async (warehouseId, filters = {}) => {
        try {
            const result = await reportsModel.getWarehouseStockReport(warehouseId, filters);
            return result.rows;
        } catch (error) {
            console.error('Error in getWarehouseStockReport service:', error);
            throw error;
        }
    },

    /**
     * Get Warehouse Transactions Report
     */
    getWarehouseTransactionsReport: async (warehouseId, filters = {}) => {
        try {
            const result = await reportsModel.getWarehouseTransactionsReport(warehouseId, filters);
            return result.rows;
        } catch (error) {
            console.error('Error in getWarehouseTransactionsReport service:', error);
            throw error;
        }
    },

    /**
     * Get Inventory Stock Report
     */
    getInventoryStockReport: async (storeId, filters = {}) => {
        try {
            const result = await reportsModel.getInventoryStockReport(storeId, filters);
            return result.rows;
        } catch (error) {
            console.error('Error in getInventoryStockReport service:', error);
            throw error;
        }
    },

    /**
     * Get Inventory Transactions Report
     */
    getInventoryTransactionsReport: async (storeId, filters = {}) => {
        try {
            const result = await reportsModel.getInventoryTransactionsReport(storeId, filters);
            return result.rows;
        } catch (error) {
            console.error('Error in getInventoryTransactionsReport service:', error);
            throw error;
        }
    },

    /**
     * Get Cashier Invoices Report
     */
    getCashierInvoicesReport: async (cashierId, filters = {}) => {
        try {
            const result = await reportsModel.getCashierInvoicesReport(cashierId, filters);
            return result.rows;
        } catch (error) {
            console.error('Error in getCashierInvoicesReport service:', error);
            throw error;
        }
    },

    /**
     * Get Cashier Payments Report
     */
    getCashierPaymentsReport: async (cashierId, filters = {}) => {
        try {
            const result = await reportsModel.getCashierPaymentsReport(cashierId, filters);
            return result.rows;
        } catch (error) {
            console.error('Error in getCashierPaymentsReport service:', error);
            throw error;
        }
    },

    /**
     * Get Store Products Report
     */
    getStoreProductsReport: async (storeId, filters = {}) => {
        try {
            const result = await reportsModel.getStoreProductsReport(storeId, filters);
            return result;
        } catch (error) {
            console.error('Error in getStoreProductsReport service:', error);
            throw error;
        }
    },

    /**
     * Get Store Invoices Report
     */
    getStoreInvoicesReport: async (storeId, filters = {}) => {
        try {
            const result = await reportsModel.getStoreInvoicesReport(storeId, filters);
            return result.rows;
        } catch (error) {
            console.error('Error in getStoreInvoicesReport service:', error);
            throw error;
        }
    },

    /**
     * Get Store Payments Report
     */
    getStorePaymentsReport: async (storeId, filters = {}) => {
        try {
            const result = await reportsModel.getStorePaymentsReport(storeId, filters);
            return result.rows;
        } catch (error) {
            console.error('Error in getStorePaymentsReport service:', error);
            throw error;
        }
    },

    getStoreStaff: async (storeId) => {
        try {
            const result = await reportsModel.getStoreStaff(storeId);
            return result.rows;
        } catch (error) {
            console.error('Error in getStoreStaff service:', error);
            throw error;
        }
    },

    /**
     * STORE OWNER REPORTS
     */

    getOwnerTopRevenueStores: async (ownerId, filters = {}) => {
        try {
            const result = await reportsModel.getOwnerTopRevenueStores(ownerId, filters);
            return result.rows;
        } catch (error) {
            console.error('Error in getOwnerTopRevenueStores service:', error);
            throw error;
        }
    },

    getOwnerTopRevenueProducts: async (ownerId, filters = {}) => {
        try {
            const result = await reportsModel.getOwnerTopRevenueProducts(ownerId, filters);
            return result.rows;
        } catch (error) {
            console.error('Error in getOwnerTopRevenueProducts service:', error);
            throw error;
        }
    },

    getOwnerTopSellingProducts: async (ownerId, filters = {}) => {
        try {
            const result = await reportsModel.getOwnerTopSellingProducts(ownerId, filters);
            return result.rows;
        } catch (error) {
            console.error('Error in getOwnerTopSellingProducts service:', error);
            throw error;
        }
    },

    getOwnerStockReport: async (ownerId, filters = {}) => {
        try {
            const result = await reportsModel.getOwnerStockReport(ownerId, filters);
            return result.rows;
        } catch (error) {
            console.error('Error in getOwnerStockReport service:', error);
            throw error;
        }
    },

    getOwnerInvoicesReport: async (ownerId, filters = {}) => {
        try {
            const result = await reportsModel.getOwnerInvoicesReport(ownerId, filters);
            return result.rows;
        } catch (error) {
            console.error('Error in getOwnerInvoicesReport service:', error);
            throw error;
        }
    },

    getOwnerPaymentsReport: async (ownerId, filters = {}) => {
        try {
            const result = await reportsModel.getOwnerPaymentsReport(ownerId, filters);
            return result.rows;
        } catch (error) {
            console.error('Error in getOwnerPaymentsReport service:', error);
            throw error;
        }
    },

    getOwnerLowStockReport: async (ownerId, filters = {}) => {
        try {
            const result = await reportsModel.getOwnerLowStockReport(ownerId, filters);
            return result.rows;
        } catch (error) {
            console.error('Error in getOwnerLowStockReport service:', error);
            throw error;
        }
    },

    getOwnerLocations: async (ownerId, filters = {}) => {
        try {
            const result = await reportsModel.getOwnerLocations(ownerId, filters);
            return result.rows;
        } catch (error) {
            console.error('Error in getOwnerLocations service:', error);
            throw error;
        }
    }
};

module.exports = reportsService;

const reportsService = require('./reports.service');
const ResponseUtils = require('../../utils/response.utils');

const reportsController = {
    /**
     * Get Store Owners Report
     */
    getStoreOwnersReport: async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            const filters = { startDate, endDate };
            
            const data = await reportsService.getStoreOwnersReport(filters);
            return ResponseUtils.success(res, 200, 'Store Owners report fetched successfully', data);
        } catch (error) {
            console.error('Error in getStoreOwnersReport controller:', error);
            return ResponseUtils.error(res, 500, 'Failed to fetch Store Owners report', error.message);
        }
    },

    /**
     * Get Stores Report
     */
    getStoresReport: async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            const filters = { startDate, endDate };
            
            const data = await reportsService.getStoresReport(filters);
            return ResponseUtils.success(res, 200, 'Stores report fetched successfully', data);
        } catch (error) {
            console.error('Error in getStoresReport controller:', error);
            return ResponseUtils.error(res, 500, 'Failed to fetch Stores report', error.message);
        }
    },

    /**
     * Get Warehouses Report
     */
    getWarehousesReport: async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            const filters = { startDate, endDate };
            
            const data = await reportsService.getWarehousesReport(filters);
            return ResponseUtils.success(res, 200, 'Warehouses report fetched successfully', data);
        } catch (error) {
            console.error('Error in getWarehousesReport controller:', error);
            return ResponseUtils.error(res, 500, 'Failed to fetch Warehouses report', error.message);
        }
    },

    /**
     * Get Roles Report
     */
    getRolesReport: async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            const filters = { startDate, endDate };
            
            const data = await reportsService.getRolesReport(filters);
            return ResponseUtils.success(res, 200, 'Roles report fetched successfully', data);
        } catch (error) {
            console.error('Error in getRolesReport controller:', error);
            return ResponseUtils.error(res, 500, 'Failed to fetch Roles report', error.message);
        }
    },

    /**
     * Get Taxes Report
     */
    getTaxesReport: async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            const filters = { startDate, endDate };
            
            const data = await reportsService.getTaxesReport(filters);
            return ResponseUtils.success(res, 200, 'Taxes report fetched successfully', data);
        } catch (error) {
            console.error('Error in getTaxesReport controller:', error);
            return ResponseUtils.error(res, 500, 'Failed to fetch Taxes report', error.message);
        }
    },

    /**
     * Get Payment Methods Report
     */
    getPaymentMethodsReport: async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            const filters = { startDate, endDate };
            
            const data = await reportsService.getPaymentMethodsReport(filters);
            return ResponseUtils.success(res, 200, 'Payment Methods report fetched successfully', data);
        } catch (error) {
            console.error('Error in getPaymentMethodsReport controller:', error);
            return ResponseUtils.error(res, 500, 'Failed to fetch Payment Methods report', error.message);
        }
    },

    /**
     * Get Warehouse Stock Report
     */
    getWarehouseStockReport: async (req, res) => {
        try {
            const warehouseId = req.user.warehouse_id;
            if (!warehouseId) return ResponseUtils.error(res, 403, 'Unauthorized access to warehouse data.');

            const { startDate, endDate, stockStatus, search } = req.query;
            const filters = { startDate, endDate, stockStatus, search };
            
            const data = await reportsService.getWarehouseStockReport(warehouseId, filters);
            return ResponseUtils.success(res, 200, 'Warehouse Stock report fetched', data);
        } catch (error) {
            console.error('Error in getWarehouseStockReport controller:', error);
            return ResponseUtils.error(res, 500, 'Failed to fetch Warehouse Stock report', error.message);
        }
    },

    /**
     * Get Warehouse Transactions Report
     */
    getWarehouseTransactionsReport: async (req, res) => {
        try {
            const warehouseId = req.user.warehouse_id;
            if (!warehouseId) return ResponseUtils.error(res, 403, 'Unauthorized access to warehouse data.');

            const { startDate, endDate, transactionType, search } = req.query;
            const filters = { startDate, endDate, transactionType, search };
            
            const data = await reportsService.getWarehouseTransactionsReport(warehouseId, filters);
            return ResponseUtils.success(res, 200, 'Warehouse Transactions report fetched', data);
        } catch (error) {
            console.error('Error in getWarehouseTransactionsReport controller:', error);
            return ResponseUtils.error(res, 500, 'Failed to fetch Warehouse Transactions report', error.message);
        }
    },

    /**
     * Get Inventory Stock Report
     */
    getInventoryStockReport: async (req, res) => {
        try {
            const storeId = req.user.store_id;
            if (!storeId) return ResponseUtils.error(res, 403, 'Unauthorized access to store data.');

            const { startDate, endDate, stockStatus, search } = req.query;
            const filters = { startDate, endDate, stockStatus, search };
            
            const data = await reportsService.getInventoryStockReport(storeId, filters);
            return ResponseUtils.success(res, 200, 'Inventory Stock report fetched', data);
        } catch (error) {
            console.error('Error in getInventoryStockReport controller:', error);
            return ResponseUtils.error(res, 500, 'Failed to fetch Inventory Stock report', error.message);
        }
    },

    /**
     * Get Inventory Transactions Report
     */
    getInventoryTransactionsReport: async (req, res) => {
        try {
            const storeId = req.user.store_id;
            if (!storeId) return ResponseUtils.error(res, 403, 'Unauthorized access to store data.');

            const { startDate, endDate, transactionType, search } = req.query;
            const filters = { startDate, endDate, transactionType, search };
            
            const data = await reportsService.getInventoryTransactionsReport(storeId, filters);
            return ResponseUtils.success(res, 200, 'Inventory Transactions report fetched', data);
        } catch (error) {
            console.error('Error in getInventoryTransactionsReport controller:', error);
            return ResponseUtils.error(res, 500, 'Failed to fetch Inventory Transactions report', error.message);
        }
    },

    /**
     * Get Cashier Invoices Report
     */
    getCashierInvoicesReport: async (req, res) => {
        try {
            const cashierId = req.user.id;
            const { startDate, endDate, search } = req.query;
            const filters = { startDate, endDate, search };
            
            const data = await reportsService.getCashierInvoicesReport(cashierId, filters);
            return ResponseUtils.success(res, 200, 'Invoices report fetched', data);
        } catch (error) {
            console.error('Invoices Report Error:', error.message);
            return ResponseUtils.error(res, 500, 'Failed to fetch Invoices report', error.message);
        }
    },

    /**
     * Get Cashier Payments Report
     */
    getCashierPaymentsReport: async (req, res) => {
        try {
            const cashierId = req.user.id;
            const { startDate, endDate, search } = req.query;
            const filters = { startDate, endDate, search };
            
            const data = await reportsService.getCashierPaymentsReport(cashierId, filters);
            return ResponseUtils.success(res, 200, 'Payments report fetched', data);
        } catch (error) {
            console.error('Payments Report Error:', error.message);
            return ResponseUtils.error(res, 500, 'Failed to fetch Payments report', error.message);
        }
    },

    /**
     * Get Store Products Analytics (Total Sell)
     */
    getStoreProductsReport: async (req, res) => {
        try {
            const storeId = req.user.store_id;
            if (!storeId) return ResponseUtils.error(res, 403, 'Unauthorized access to store data.');

            const { startDate, endDate, search, sortBy } = req.query;
            const filters = { startDate, endDate, search, sortBy };
            
            const data = await reportsService.getStoreProductsReport(storeId, filters);
            return ResponseUtils.success(res, 200, 'Store Products report fetched', data);
        } catch (error) {
            console.error('Store Products Report Error:', error.message);
            return ResponseUtils.error(res, 500, 'Failed to fetch Store Products report', error.message);
        }
    },

    /**
     * Get Store Invoices Report (All Cashiers)
     */
    getStoreInvoicesReport: async (req, res) => {
        try {
            const storeId = req.user.store_id;
            if (!storeId) return ResponseUtils.error(res, 403, 'Unauthorized access to store data.');

            const { startDate, endDate, search, cashierId } = req.query;
            const filters = { startDate, endDate, search, cashierId };
            
            const data = await reportsService.getStoreInvoicesReport(storeId, filters);
            return ResponseUtils.success(res, 200, 'Store Invoices report fetched', data);
        } catch (error) {
            console.error('Store Invoices Report Error:', error.message);
            return ResponseUtils.error(res, 500, 'Failed to fetch Store Invoices report', error.message);
        }
    },

    /**
     * Get Store Payments Report (All Cashiers)
     */
    getStorePaymentsReport: async (req, res) => {
        try {
            const storeId = req.user.store_id;
            if (!storeId) return ResponseUtils.error(res, 403, 'Unauthorized access to store data.');

            const { startDate, endDate, search, cashierId } = req.query;
            const filters = { startDate, endDate, search, cashierId };
            
            const data = await reportsService.getStorePaymentsReport(storeId, filters);
            return ResponseUtils.success(res, 200, 'Store Payments report fetched', data);
        } catch (error) {
            console.error('Store Payments Report Error:', error.message);
            return ResponseUtils.error(res, 500, 'Failed to fetch Store Payments report', error.message);
        }
    },

    /**
     * Get Store Staff (for filtering)
     */
    getStoreStaff: async (req, res) => {
        try {
            const storeId = req.user.store_id;
            if (!storeId) return ResponseUtils.error(res, 403, 'Unauthorized access to store data.');

            const staff = await reportsService.getStoreStaff(storeId);
            return ResponseUtils.success(res, 200, 'Store staff fetched successfully', staff);
        } catch (error) {
            console.error('Store Staff Error:', error.message);
            return ResponseUtils.error(res, 500, 'Failed to fetch store staff', error.message);
        }
    },

    /**
     * STORE OWNER REPORTS
     */

    getOwnerTopRevenueStores: async (req, res) => {
        try {
            const ownerId = req.user.id;
            const { startDate, endDate, search } = req.query;
            const filters = { startDate, endDate, search };
            
            const data = await reportsService.getOwnerTopRevenueStores(ownerId, filters);
            return ResponseUtils.success(res, 200, 'Top Revenue Stores report fetched', data);
        } catch (error) {
            console.error('Owner Top Revenue Stores Error:', error.message);
            return ResponseUtils.error(res, 500, 'Failed to fetch report', error.message);
        }
    },

    getOwnerTopRevenueProducts: async (req, res) => {
        try {
            const ownerId = req.user.id;
            const { startDate, endDate, search, storeId } = req.query;
            const filters = { startDate, endDate, search, storeId };
            
            const data = await reportsService.getOwnerTopRevenueProducts(ownerId, filters);
            return ResponseUtils.success(res, 200, 'Top Revenue Products report fetched', data);
        } catch (error) {
            console.error('Owner Top Revenue Products Error:', error.message);
            return ResponseUtils.error(res, 500, 'Failed to fetch report', error.message);
        }
    },

    getOwnerTopSellingProducts: async (req, res) => {
        try {
            const ownerId = req.user.id;
            const { startDate, endDate, search, storeId } = req.query;
            const filters = { startDate, endDate, search, storeId };
            
            const data = await reportsService.getOwnerTopSellingProducts(ownerId, filters);
            return ResponseUtils.success(res, 200, 'Top Selling Products report fetched', data);
        } catch (error) {
            console.error('Owner Top Selling Products Error:', error.message);
            return ResponseUtils.error(res, 500, 'Failed to fetch report', error.message);
        }
    },

    getOwnerStockReport: async (req, res) => {
        try {
            const ownerId = req.user.id;
            const { search, locationId, locationType } = req.query;
            const filters = { search, locationId, locationType };
            
            const data = await reportsService.getOwnerStockReport(ownerId, filters);
            return ResponseUtils.success(res, 200, 'Owner Stock report fetched', data);
        } catch (error) {
            console.error('Owner Stock Report Error:', error.message);
            return ResponseUtils.error(res, 500, 'Failed to fetch report', error.message);
        }
    },

    getOwnerInvoicesReport: async (req, res) => {
        try {
            const ownerId = req.user.id;
            const { startDate, endDate, search, storeId } = req.query;
            const filters = { startDate, endDate, search, storeId };
            
            const data = await reportsService.getOwnerInvoicesReport(ownerId, filters);
            return ResponseUtils.success(res, 200, 'Owner Invoices report fetched', data);
        } catch (error) {
            console.error('Owner Invoices Report Error:', error.message);
            return ResponseUtils.error(res, 500, 'Failed to fetch report', error.message);
        }
    },

    getOwnerPaymentsReport: async (req, res) => {
        try {
            const ownerId = req.user.id;
            const { startDate, endDate, search, storeId } = req.query;
            const filters = { startDate, endDate, search, storeId };
            
            const data = await reportsService.getOwnerPaymentsReport(ownerId, filters);
            return ResponseUtils.success(res, 200, 'Owner Payments report fetched', data);
        } catch (error) {
            console.error('Owner Payments Report Error:', error.message);
            return ResponseUtils.error(res, 500, 'Failed to fetch report', error.message);
        }
    },

    getOwnerLowStockReport: async (req, res) => {
        try {
            const ownerId = req.user.id;
            const { search } = req.query;
            const filters = { search };
            
            const data = await reportsService.getOwnerLowStockReport(ownerId, filters);
            return ResponseUtils.success(res, 200, 'Owner Low Stock report fetched', data);
        } catch (error) {
            console.error('Owner Low Stock Report Error:', error.message);
            return ResponseUtils.error(res, 500, 'Failed to fetch report', error.message);
        }
    },

    getOwnerLocations: async (req, res) => {
        try {
            const ownerId = req.user.id;
            const filters = req.query;
            const data = await reportsService.getOwnerLocations(ownerId, filters);
            return ResponseUtils.success(res, 200, 'Owner Locations fetched', data);
        } catch (error) {
            console.error('Owner Locations Error:', error.message);
            return ResponseUtils.error(res, 500, 'Failed to fetch locations', error.message);
        }
    }
};

module.exports = reportsController;

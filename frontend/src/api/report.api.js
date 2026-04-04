import axios from './axios';

const reportApi = {
    /**
     * Get Super Admin Reports
     */
    getStoreOwnersReport: async (params) => {
        try {
            const response = await axios.get('/reports/super-admin/store-owners', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    getStoresReport: async (params) => {
        try {
            const response = await axios.get('/reports/super-admin/stores', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    getWarehousesReport: async (params) => {
        try {
            const response = await axios.get('/reports/super-admin/warehouses', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    getRolesReport: async (params) => {
        try {
            const response = await axios.get('/reports/super-admin/roles', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    getTaxesReport: async (params) => {
        try {
            const response = await axios.get('/reports/super-admin/taxes', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    getPaymentMethodsReport: async (params) => {
        try {
            const response = await axios.get('/reports/super-admin/payment-methods', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    /**
     * Warehouse Staff Reports
     */

    getWarehouseStockReport: async (params) => {
        try {
            const response = await axios.get('/reports/warehouse-staff/stock', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    getWarehouseTransactionsReport: async (params) => {
        try {
            const response = await axios.get('/reports/warehouse-staff/transactions', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    /**
     * Inventory Staff Reports
     */
    getInventoryStockReport: async (params) => {
        try {
            const response = await axios.get('/reports/inventory-staff/stock', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    getInventoryTransactionsReport: async (params) => {
        try {
            const response = await axios.get('/reports/inventory-staff/transactions', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    /**
     * Cashier Reports
     */
    getCashierInvoicesReport: async (params) => {
        try {
            const response = await axios.get('/reports/cashier/invoices', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    getCashierPaymentsReport: async (params) => {
        try {
            const response = await axios.get('/reports/cashier/payments', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    /**
     * Store Manager Reports
     */
    getStoreManagerProductsReport: async (params) => {
        try {
            const response = await axios.get('/reports/store-manager/products', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    getStoreManagerStockReport: async (params) => {
        try {
            const response = await axios.get('/reports/store-manager/stock', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    getStoreManagerTransactionsReport: async (params) => {
        try {
            const response = await axios.get('/reports/store-manager/transactions', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    getStoreManagerInvoicesReport: async (params) => {
        try {
            const response = await axios.get('/reports/store-manager/invoices', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    getStoreManagerPaymentsReport: async (params) => {
        try {
            const response = await axios.get('/reports/store-manager/payments', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    getStoreStaff: async () => {
        try {
            const response = await axios.get('/reports/store-manager/staff');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    /**
     * Store Owner Reports
     */
    getOwnerTopRevenueStoresReport: async (params) => {
        try {
            const response = await axios.get('/reports/store-owner/top-revenue-stores', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    getOwnerTopRevenueProductsReport: async (params) => {
        try {
            const response = await axios.get('/reports/store-owner/top-revenue-products', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    getOwnerTopSellingProductsReport: async (params) => {
        try {
            const response = await axios.get('/reports/store-owner/top-selling-products', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    getOwnerStockReport: async (params) => {
        try {
            const response = await axios.get('/reports/store-owner/stock', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    getOwnerInvoicesReport: async (params) => {
        try {
            const response = await axios.get('/reports/store-owner/invoices', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    getOwnerPaymentsReport: async (params) => {
        try {
            const response = await axios.get('/reports/store-owner/payments', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    getOwnerLowStockReport: async (params) => {
        try {
            const response = await axios.get('/reports/store-owner/low-stock', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    getOwnerLocations: async (params) => {
        try {
            const response = await axios.get('/reports/store-owner/locations', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }
};

export default reportApi;

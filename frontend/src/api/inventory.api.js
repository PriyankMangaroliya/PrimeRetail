import api from './axios';

const inventoryApi = {
    // Stock APIs
    getAllStock: async () => {
        const response = await api.get('/inventory/stock');
        return response.data;
    },
    getStockById: async (id) => {
        const response = await api.get(`/inventory/stock/${id}`);
        return response.data;
    },
    createStock: async (data) => {
        const response = await api.post('/inventory/stock', data);
        return response.data;
    },
    getLowStock: async (threshold) => {
        const response = await api.get(`/inventory/stock/low-stock?threshold=${threshold}`);
        return response.data;
    },
    updateStockQuantity: async (id, quantity) => {
        const response = await api.patch(`/inventory/stock/${id}/quantity`, { quantity });
        return response.data;
    },
    deleteStock: async (id) => {
        const response = await api.delete(`/inventory/stock/${id}`);
        return response.data;
    },
    getActiveLocations: async () => {
        const response = await api.get('/inventory/stock/active-locations');
        return response.data;
    },

    // Transaction APIs
    getAllTransactions: async () => {
        const response = await api.get('/inventory/transactions');
        return response.data;
    },
    createTransaction: async (data) => {
        const response = await api.post('/inventory/transactions', data);
        return response.data;
    },
    getTransactionById: async (id) => {
        const response = await api.get(`/inventory/transactions/${id}`);
        return response.data;
    },
    getTransactionsByProduct: async (productId) => {
        const response = await api.get(`/inventory/transactions/product/${productId}`);
        return response.data;
    },
};

export default inventoryApi;

import axios from './axios';

const dashboardApi = {
    getStats: async () => {
        try {
            const response = await axios.get('/dashboard/stats');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // For Super Admin
    getTrends: async (period = 'monthly') => {
        try {
            const response = await axios.get(`/dashboard/trends?period=${period}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // For Store Owner – same route, role-gated on backend, returns per-store data
    getStoreOwnerTrends: async (period = 'monthly') => {
        try {
            const response = await axios.get(`/dashboard/trends?period=${period}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // For Store Manager & Cashier – returns their single store's revenue trend
    getStoreTrends: async (period = 'monthly') => {
        try {
            const response = await axios.get(`/dashboard/trends?period=${period}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },
};

export default dashboardApi;

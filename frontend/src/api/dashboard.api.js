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
    getTrends: async (period = 'monthly') => {
        try {
            const response = await axios.get(`/dashboard/trends?period=${period}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

export default dashboardApi;

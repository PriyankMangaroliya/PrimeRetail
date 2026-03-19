import axios from './axios';

const discountApi = {
    // Get all discounts (role-based)
    getAllDiscounts: async () => {
        try {
            const response = await axios.get('/discounts');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get discount by ID
    getDiscountById: async (id) => {
        try {
            const response = await axios.get(`/discounts/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get active discounts for dropdown
    getActiveDiscounts: async () => {
        try {
            const response = await axios.get('/discounts/active');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get discount statistics (Store Owner only)
    getDiscountStats: async () => {
        try {
            const response = await axios.get('/discounts/stats');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Create new discount (Store Owner only)
    createDiscount: async (discountData) => {
        try {
            const response = await axios.post('/discounts', discountData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Update discount (Store Owner only)
    updateDiscount: async (id, discountData) => {
        try {
            const response = await axios.put(`/discounts/${id}`, discountData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Delete discount (Store Owner only)
    deleteDiscount: async (id) => {
        try {
            const response = await axios.delete(`/discounts/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Toggle discount status (Store Owner only)
    toggleDiscountStatus: async (id) => {
        try {
            const response = await axios.patch(`/discounts/${id}/toggle-status`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }
};

export default discountApi;

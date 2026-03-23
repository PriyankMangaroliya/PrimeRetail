import axios from './axios';

const discountApi = {
    // Validate discount code for POS
    validateDiscount: async (code, amount) => {
        try {
            const response = await axios.post('/discounts/validate', { code, amount });
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

    // Get all discounts
    getAllDiscounts: async () => {
        try {
            const response = await axios.get('/discounts');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Create a new discount
    createDiscount: async (discountData) => {
        try {
            const response = await axios.post('/discounts', discountData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Update a discount
    updateDiscount: async (id, discountData) => {
        try {
            const response = await axios.put(`/discounts/${id}`, discountData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Toggle discount status
    toggleDiscountStatus: async (id) => {
        try {
            const response = await axios.patch(`/discounts/${id}/toggle-status`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Delete a discount
    deleteDiscount: async (id) => {
        try {
            const response = await axios.delete(`/discounts/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }
};

export default discountApi;

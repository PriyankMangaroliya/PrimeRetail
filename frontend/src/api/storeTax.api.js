import axios from './axios';

const storeTaxApi = {
    // Add tax to store (Store Owner only)
    addStoreTax: async (taxId) => {
        try {
            const response = await axios.post('/owner-taxes', { tax_id: taxId });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Remove tax from store (Store Owner only)
    removeStoreTax: async (id) => {
        try {
            const response = await axios.delete(`/owner-taxes/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get taxes for current store owner
    getStoreTaxes: async () => {
        try {
            const response = await axios.get('/owner-taxes');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Toggle tax status
    toggleStoreTaxStatus: async (id, isActive) => {
        try {
            const response = await axios.patch(`/owner-taxes/${id}/status`, { is_active: isActive });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get tax usage (products)
    getTaxUsage: async (id) => {
        try {
            const response = await axios.get(`/owner-taxes/${id}/usage`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

export default storeTaxApi;

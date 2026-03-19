import axios from './axios';

const storeApi = {
    // Get all stores (role-based)
    getAllStores: async () => {
        try {
            const response = await axios.get('/stores');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get store by ID
    getStoreById: async (id) => {
        try {
            const response = await axios.get(`/stores/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get store dropdown (for forms)
    getStoreDropdown: async () => {
        try {
            const response = await axios.get('/stores/dropdown');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get store statistics
    getStoreStats: async () => {
        try {
            const response = await axios.get('/stores/stats');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Check store code availability
    checkStoreCode: async (store_code, excludeId = null) => {
        try {
            const params = { store_code };
            if (excludeId) params.exclude_id = excludeId;

            const response = await axios.get('/stores/check-code', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Create new store
    createStore: async (storeData) => {
        try {
            const response = await axios.post('/stores', storeData);
            return response.data;
        } catch (error) {
            console.error('Create Store Error:', error.response?.data || error);
            throw error.response?.data || error;
        }
    },

    // Update store
    updateStore: async (id, storeData) => {
        try {
            const response = await axios.put(`/stores/${id}`, storeData);
            return response.data;
        } catch (error) {
            console.error('Update Store Error:', error.response?.data || error);
            throw error.response?.data || error;
        }
    },

    // Delete store
    deleteStore: async (id) => {
        try {
            const response = await axios.delete(`/stores/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Toggle store status
    toggleStoreStatus: async (id) => {
        try {
            const response = await axios.patch(`/stores/${id}/toggle-status`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }
};

export default storeApi;
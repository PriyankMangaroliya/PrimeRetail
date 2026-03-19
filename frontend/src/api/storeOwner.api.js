import axios from './axios';

const storeOwnerApi = {
    // Get all store owners
    getAllStoreOwners: async () => {
        try {
            const response = await axios.get('/store-owners');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get store owner by ID
    getStoreOwnerById: async (id) => {
        try {
            const response = await axios.get(`/store-owners/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Create new store owner
    createStoreOwner: async (ownerData) => {
        try {
            const response = await axios.post('/store-owners', ownerData);
            return response.data;
        } catch (error) {
            console.error('Create Store Owner Error:', error.response?.data || error);
            throw error.response?.data || error;
        }
    },

    // Update store owner
    updateStoreOwner: async (id, ownerData) => {
        try {
            const response = await axios.put(`/store-owners/${id}`, ownerData);
            return response.data;
        } catch (error) {
            console.error('Update Store Owner Error:', error.response?.data || error);
            throw error.response?.data || error;
        }
    },

    // Delete store owner
    deleteStoreOwner: async (id) => {
        try {
            const response = await axios.delete(`/store-owners/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Toggle owner status
    toggleOwnerStatus: async (id) => {
        try {
            const response = await axios.patch(`/store-owners/${id}/toggle-status`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get stores by owner
    getStoresByOwner: async (id) => {
        try {
            const response = await axios.get(`/store-owners/${id}/stores`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }
};

export default storeOwnerApi;
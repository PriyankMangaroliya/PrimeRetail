import axios from './axios';

const categoryApi = {
    // Get all categories (role-based)
    getAllCategories: async () => {
        try {
            const response = await axios.get('/categories');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get category by ID
    getCategoryById: async (id) => {
        try {
            const response = await axios.get(`/categories/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get active categories for dropdown
    getActiveCategories: async () => {
        try {
            const response = await axios.get('/categories/active');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Create new category (Store Owner only)
    createCategory: async (categoryData) => {
        try {
            const response = await axios.post('/categories', categoryData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Update category (Store Owner only)
    updateCategory: async (id, categoryData) => {
        try {
            const response = await axios.put(`/categories/${id}`, categoryData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Delete category (Store Owner only)
    deleteCategory: async (id) => {
        try {
            const response = await axios.delete(`/categories/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Toggle category status (Store Owner only)
    toggleCategoryStatus: async (id) => {
        try {
            const response = await axios.patch(`/categories/${id}/toggle-status`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }
};

export default categoryApi;

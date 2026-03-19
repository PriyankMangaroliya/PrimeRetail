import axios from './axios';

const productApi = {
    // Get all products (role-based)
    getAllProducts: async () => {
        try {
            const response = await axios.get('/products');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get product by ID
    getProductById: async (id) => {
        try {
            const response = await axios.get(`/products/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get product statistics
    getProductStats: async () => {
        try {
            const response = await axios.get('/products/stats');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Check SKU availability (Store Owner only)
    checkSKU: async (sku, excludeId = null) => {
        try {
            const params = { sku };
            if (excludeId) params.exclude_id = excludeId;
            const response = await axios.get('/products/check-sku', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Check barcode availability (Store Owner only)
    checkBarcode: async (barcode, excludeId = null) => {
        try {
            const params = { barcode };
            if (excludeId) params.exclude_id = excludeId;
            const response = await axios.get('/products/check-barcode', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Create new product (Store Owner only)
    createProduct: async (productData) => {
        try {
            const response = await axios.post('/products', productData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Update product (Store Owner only)
    updateProduct: async (id, productData) => {
        try {
            const response = await axios.put(`/products/${id}`, productData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Delete product (Store Owner only)
    deleteProduct: async (id) => {
        try {
            const response = await axios.delete(`/products/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Toggle product status (Store Owner only)
    toggleProductStatus: async (id) => {
        try {
            const response = await axios.patch(`/products/${id}/toggle-status`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }
};

export default productApi;

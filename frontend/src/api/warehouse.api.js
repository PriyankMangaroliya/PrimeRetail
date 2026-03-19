import axios from './axios';

const warehouseApi = {
    // Get all warehouses (Store Owner: their own only)
    getAllWarehouses: async () => {
        try {
            const response = await axios.get('/warehouses');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get warehouse by ID
    getWarehouseById: async (id) => {
        try {
            const response = await axios.get(`/warehouses/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get warehouse dropdown (for forms)
    getWarehouseDropdown: async () => {
        try {
            const response = await axios.get('/warehouses/dropdown');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get warehouse statistics
    getWarehouseStats: async () => {
        try {
            const response = await axios.get('/warehouses/stats');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Check warehouse code availability
    checkWarehouseCode: async (warehouse_code, excludeId = null) => {
        try {
            const params = { warehouse_code };
            if (excludeId) params.exclude_id = excludeId;
            const response = await axios.get('/warehouses/check-code', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Create new warehouse
    createWarehouse: async (warehouseData) => {
        try {
            const response = await axios.post('/warehouses', warehouseData);
            return response.data;
        } catch (error) {
            console.error('Create Warehouse Error:', error.response?.data || error);
            throw error.response?.data || error;
        }
    },

    // Update warehouse
    updateWarehouse: async (id, warehouseData) => {
        try {
            const response = await axios.put(`/warehouses/${id}`, warehouseData);
            return response.data;
        } catch (error) {
            console.error('Update Warehouse Error:', error.response?.data || error);
            throw error.response?.data || error;
        }
    },

    // Delete warehouse
    deleteWarehouse: async (id) => {
        try {
            const response = await axios.delete(`/warehouses/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Toggle warehouse status
    toggleWarehouseStatus: async (id) => {
        try {
            const response = await axios.patch(`/warehouses/${id}/toggle-status`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }
};

export default warehouseApi;

import axios from './axios';

const employeeApi = {
    // Get all employees (Store Owner: all their store + warehouse employees)
    getAllEmployees: async () => {
        try {
            const response = await axios.get('/employees');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get employee by ID
    getEmployeeById: async (id) => {
        try {
            const response = await axios.get(`/employees/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get employees by store
    getEmployeesByStore: async (storeId) => {
        try {
            const response = await axios.get(`/employees/store/${storeId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get employees by warehouse
    getEmployeesByWarehouse: async (warehouseId) => {
        try {
            const response = await axios.get(`/employees/warehouse/${warehouseId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Create new employee
    createEmployee: async (employeeData) => {
        try {
            const response = await axios.post('/employees', employeeData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Update employee
    updateEmployee: async (id, employeeData) => {
        try {
            const response = await axios.put(`/employees/${id}`, employeeData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Delete employee
    deleteEmployee: async (id) => {
        try {
            const response = await axios.delete(`/employees/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Toggle employee status
    toggleEmployeeStatus: async (id) => {
        try {
            const response = await axios.patch(`/employees/${id}/toggle-status`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get employee stats
    getEmployeeStats: async () => {
        try {
            const response = await axios.get('/employees/stats');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }
};

export default employeeApi;

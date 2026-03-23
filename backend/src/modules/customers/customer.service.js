const customerModel = require('./customer.model');

const customerService = {
    // Create new customer
    createCustomer: async (customerData) => {
        try {
            const result = await customerModel.createCustomer(customerData);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Update customer
    updateCustomer: async (id, customerData) => {
        try {
            const result = await customerModel.updateCustomer(id, customerData);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Delete customer
    deleteCustomer: async (id, updated_by) => {
        try {
            const result = await customerModel.deleteCustomer(id, updated_by);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Get all customers
    getAllCustomers: async () => {
        try {
            const result = await customerModel.getAllCustomers();
            return result.rows;
        } catch (error) {
            throw error;
        }
    },

    // Get customer by ID
    getCustomerById: async (id) => {
        try {
            const result = await customerModel.getCustomerById(id);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Get customer by phone
    getCustomerByPhone: async (phone) => {
        try {
            const result = await customerModel.getCustomerByPhone(phone);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Update loyalty points
    updateLoyaltyPoints: async (id, points, updated_by) => {
        try {
            const result = await customerModel.updateLoyaltyPoints(id, points, updated_by);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }
};

module.exports = customerService;

import axios from './axios';

const paymentMethodApi = {
    // Get all payment methods (System Admin only)
    getAllPaymentMethods: async () => {
        try {
            const response = await axios.get('/payment-methods');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get active payment methods only (Cashier, Store Owner, Manager - for selection)
    getActivePaymentMethods: async () => {
        try {
            const response = await axios.get('/payment-methods/active');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get payment method by ID
    getPaymentMethodById: async (id) => {
        try {
            const response = await axios.get(`/payment-methods/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Create new payment method (System Admin only)
    createPaymentMethod: async (methodData) => {
        try {
            const response = await axios.post('/payment-methods', {
                method_name: methodData.method_name,
                description: methodData.description || null
            });
            return response.data;
        } catch (error) {
            console.error('Create Payment Method Error:', error.response?.data || error);
            throw error.response?.data || error;
        }
    },

    // Update payment method (System Admin only)
    updatePaymentMethod: async (id, methodData) => {
        try {
            const updateData = {};
            if (methodData.method_name !== undefined) updateData.method_name = methodData.method_name;
            if (methodData.description !== undefined) updateData.description = methodData.description || null;
            if (methodData.is_active !== undefined) updateData.is_active = methodData.is_active;

            const response = await axios.put(`/payment-methods/${id}`, updateData);
            return response.data;
        } catch (error) {
            console.error('Update Payment Method Error:', error.response?.data || error);
            throw error.response?.data || error;
        }
    },

    // Delete payment method (System Admin only)
    deletePaymentMethod: async (id) => {
        try {
            const response = await axios.delete(`/payment-methods/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Toggle payment method status (System Admin only)
    togglePaymentMethodStatus: async (id) => {
        try {
            const response = await axios.patch(`/payment-methods/${id}/toggle-status`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get payment method statistics (System Admin only)
    getPaymentMethodStats: async () => {
        try {
            const response = await axios.get('/payment-methods/stats');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get payment method usage (System Admin only)
    getPaymentMethodUsage: async (id) => {
        try {
            const response = await axios.get(`/payment-methods/${id}/usage`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }
};

export default paymentMethodApi;
const paymentMethodModel = require('./paymentMethods.model');

const paymentMethodService = {
    // Create new payment method (System Admin only)
    createPaymentMethod: async (methodData) => {
        try {
            // Check if payment method name already exists
            const existingMethod = await paymentMethodModel.checkPaymentMethodNameExists(methodData.method_name);
            if (existingMethod.rows.length > 0) {
                throw new Error('Payment method name already exists');
            }

            const result = await paymentMethodModel.createPaymentMethod(methodData);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Update payment method (System Admin only)
    updatePaymentMethod: async (id, methodData) => {
        try {
            // Check if payment method exists
            const method = await paymentMethodModel.getPaymentMethodById(id);
            if (method.rows.length === 0) {
                throw new Error('Payment method not found');
            }

            // Check if payment method name already exists (if updating)
            if (methodData.method_name && methodData.method_name !== method.rows[0].method_name) {
                const existingMethod = await paymentMethodModel.checkPaymentMethodNameExists(methodData.method_name, id);
                if (existingMethod.rows.length > 0) {
                    throw new Error('Payment method name already exists');
                }
            }

            const result = await paymentMethodModel.updatePaymentMethod(id, methodData);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Delete payment method (System Admin only)
    deletePaymentMethod: async (id) => {
        try {
            // Check if payment method exists
            const method = await paymentMethodModel.getPaymentMethodById(id);
            if (method.rows.length === 0) {
                throw new Error('Payment method not found');
            }

            // Check if payment method is used by any paymentMethods
            const usage = await paymentMethodModel.getPaymentMethodUsage(id);
            if (parseInt(usage.rows[0].usage_count) > 0) {
                throw new Error('Cannot delete payment method as it is used in paymentMethods');
            }

            const result = await paymentMethodModel.deletePaymentMethod(id);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Get all payment methods (System Admin only)
    getAllPaymentMethods: async () => {
        try {
            const result = await paymentMethodModel.getAllPaymentMethods();
            return result.rows;
        } catch (error) {
            throw error;
        }
    },

    // Get active payment methods only (Cashier, Store Owner, Manager - for selection)
    getActivePaymentMethods: async () => {
        try {
            const result = await paymentMethodModel.getActivePaymentMethods();
            return result.rows;
        } catch (error) {
            throw error;
        }
    },

    // Get payment method by ID
    getPaymentMethodById: async (id) => {
        try {
            const result = await paymentMethodModel.getPaymentMethodById(id);
            if (result.rows.length === 0) {
                throw new Error('Payment method not found');
            }
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Get payment method statistics (System Admin only)
    getPaymentMethodStats: async () => {
        try {
            const result = await paymentMethodModel.getPaymentMethodStats();
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Get payment method usage (System Admin only)
    getPaymentMethodUsage: async (id) => {
        try {
            // Check if payment method exists
            const method = await paymentMethodModel.getPaymentMethodById(id);
            if (method.rows.length === 0) {
                throw new Error('Payment method not found');
            }

            const result = await paymentMethodModel.getPaymentMethodUsage(id);
            return {
                method_id: id,
                method_name: method.rows[0].method_name,
                usage_count: parseInt(result.rows[0].usage_count)
            };
        } catch (error) {
            throw error;
        }
    },

    // Toggle payment method status (System Admin only)
    togglePaymentMethodStatus: async (id, updatedBy) => { // ADD updatedBy parameter
        try {
            const method = await paymentMethodModel.getPaymentMethodById(id);
            if (method.rows.length === 0) {
                throw new Error('Payment method not found');
            }

            const newStatus = !method.rows[0].is_active;
            const result = await paymentMethodModel.updatePaymentMethod(id, {
                is_active: newStatus,
                updated_by: updatedBy // ADD updated_by
            });

            return {
                id: result.rows[0].id,
                is_active: result.rows[0].is_active,
                message: `Payment method ${newStatus ? 'activated' : 'deactivated'} successfully`
            };
        } catch (error) {
            throw error;
        }
    }
};

module.exports = paymentMethodService;
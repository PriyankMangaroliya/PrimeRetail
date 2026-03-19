import axios from './axios';

const taxApi = {
    // Get all taxes (System Admin only)
    getAllTaxes: async () => {
        try {
            const response = await axios.get('/taxes');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get active taxes only (Store Owner - for selection)
    getActiveTaxes: async () => {
        try {
            const response = await axios.get('/taxes/active');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get tax by ID
    getTaxById: async (id) => {
        try {
            const response = await axios.get(`/taxes/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Create new tax (System Admin only)
    createTax: async (taxData) => {
        try {
            // Send all fields including created_by
            const response = await axios.post('/taxes', {
                tax_name: taxData.tax_name,
                tax_rate: taxData.tax_rate,
                description: taxData.description || null,
                created_by: taxData.created_by // Add created_by
            });
            return response.data;
        } catch (error) {
            console.error('Create Tax Error:', error.response?.data || error);
            throw error.response?.data || error;
        }
    },

    // Update tax (System Admin only)
    updateTax: async (id, taxData) => {
        try {
            // Build update object with all fields including updated_by
            const updateData = {};
            if (taxData.tax_name !== undefined) updateData.tax_name = taxData.tax_name;
            if (taxData.tax_rate !== undefined) updateData.tax_rate = taxData.tax_rate;
            if (taxData.description !== undefined) updateData.description = taxData.description || null;
            if (taxData.is_active !== undefined) updateData.is_active = taxData.is_active;
            if (taxData.updated_by !== undefined) updateData.updated_by = taxData.updated_by; // Add updated_by

            const response = await axios.put(`/taxes/${id}`, updateData);
            return response.data;
        } catch (error) {
            console.error('Update Tax Error:', error.response?.data || error);
            throw error.response?.data || error;
        }
    },

    // Delete tax (System Admin only)
    deleteTax: async (id) => {
        try {
            const response = await axios.delete(`/taxes/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Toggle tax status (System Admin only)
    toggleTaxStatus: async (id) => {
        try {
            const response = await axios.patch(`/taxes/${id}/toggle-status`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get tax statistics (System Admin only)
    getTaxStats: async () => {
        try {
            const response = await axios.get('/taxes/stats');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }
};

export default taxApi;
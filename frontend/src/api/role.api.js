import axios from './axios';

const roleApi = {
    // Get all roles
    getAllRoles: async () => {
        try {
            const response = await axios.get('/roles');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get role by ID
    getRoleById: async (id) => {
        try {
            const response = await axios.get(`/roles/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get active roles only
    getActiveRoles: async () => {
        try {
            const response = await axios.get('/roles/active');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Create new role
    createRole: async (roleData) => {
        try {
            // Send only the fields the backend expects
            const response = await axios.post('/roles', {
                role_name: roleData.role_name,
                description: roleData.description || null
            });
            return response.data;
        } catch (error) {
            console.error('Create Role API Error:', error.response?.data || error);
            throw error.response?.data || error;
        }
    },

    // Update role
    updateRole: async (id, roleData) => {
        try {
            // Send only the fields that are being updated
            const response = await axios.put(`/roles/${id}`, roleData);
            return response.data;
        } catch (error) {
            console.error('Update Role API Error:', error.response?.data || error);
            throw error.response?.data || error;
        }
    },

    // Delete role
    deleteRole: async (id) => {
        try {
            const response = await axios.delete(`/roles/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }
};

export default roleApi;
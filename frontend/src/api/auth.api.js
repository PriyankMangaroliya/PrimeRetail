import axios from './axios';

const authApi = {
    // Login user
    login: async (email, password) => {
        try {
            const response = await axios.post('/auth/login', { email, password });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Register first admin
    registerFirstAdmin: async (userData) => {
        try {
            const response = await axios.post('/auth/register', userData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get user profile
    getProfile: async () => {
        try {
            const response = await axios.get('/auth/profile');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Update profile
    updateProfile: async (profileData) => {
        try {
            const response = await axios.put('/auth/update-profile', profileData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Change password
    changePassword: async (passwordData) => {
        try {
            const response = await axios.put('/auth/change-password', passwordData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Logout
    logout: async () => {
        try {
            const response = await axios.post('/auth/logout');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Refresh token
    refreshToken: async (refreshToken) => {
        try {
            const response = await axios.post('/auth/refresh-token', { refresh_token: refreshToken });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },
};

export default authApi;
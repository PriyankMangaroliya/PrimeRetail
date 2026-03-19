const authService = require('./auth.service');
const authValidation = require('./auth.validation');
const responseUtils = require('../../utils/response.utils');
const userModel = require('../users/users.model');
const roleModel = require('../roles/roles.model');

const authController = {
    // Register first admin user
    registerFirstAdmin: async (req, res) => {
        try {
            // Check if first admin already exists
            const adminExists = await authService.checkFirstAdminExists();

            if (adminExists) {
                return responseUtils.badRequest(res, 'Admin user already exists. Registration is disabled.');
            }

            // Validate request body
            const { error, value } = authValidation.register.validate(req.body);
            if (error) {
                return responseUtils.validationError(res, 'Validation failed', error.details);
            }

            // Check if email already exists
            const existingUser = await userModel.getUserByEmail(value.email);
            if (existingUser.rows.length) {
                return responseUtils.conflict(res, 'Email already registered');
            }

            // Register first admin
            const result = await authService.registerFirstAdmin(value);

            return responseUtils.success(res, 201, 'Admin user created successfully', {
                user: result.user,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken
            });
        } catch (error) {
            console.error('Register First Admin Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to register admin user');
        }
    },

    // Login
    login: async (req, res) => {
        try {
            // Validate request body
            const { error, value } = authValidation.login.validate(req.body);
            if (error) {
                return responseUtils.validationError(res, 'Validation failed', error.details);
            }

            // Attempt login
            const result = await authService.login(value.email, value.password);

            return responseUtils.success(res, 200, 'Login successful', {
                user: result.user,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken
            });
        } catch (error) {
            console.error('Login Error:', error);

            if (error.message.includes('Invalid') || error.message.includes('deactivated')) {
                return responseUtils.unauthorized(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Login failed');
        }
    },

    // Get profile
    getProfile: async (req, res) => {
        try {
            const userId = req.user.id;

            const profile = await authService.getProfile(userId);

            return responseUtils.success(res, 200, 'Profile retrieved successfully', profile);
        } catch (error) {
            console.error('Get Profile Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to retrieve profile');
        }
    },

    // Update profile
    updateProfile: async (req, res) => {
        try {
            const userId = req.user.id;

            // Validate request body
            const { error, value } = authValidation.updateProfile.validate(req.body);
            if (error) {
                return responseUtils.validationError(res, 'Validation failed', error.details);
            }

            // Check if email is being changed and if it already exists
            if (value.email) {
                const existingUser = await userModel.getUserByEmail(value.email);
                if (existingUser.rows.length && existingUser.rows[0].id !== userId) {
                    return responseUtils.conflict(res, 'Email already registered by another user');
                }
            }

            const updatedProfile = await authService.updateProfile(userId, value);

            return responseUtils.success(res, 200, 'Profile updated successfully', updatedProfile);
        } catch (error) {
            console.error('Update Profile Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to update profile');
        }
    },

    // Change password
    changePassword: async (req, res) => {
        try {
            const userId = req.user.id;

            // Validate request body
            const { error, value } = authValidation.changePassword.validate(req.body);
            if (error) {
                return responseUtils.validationError(res, 'Validation failed', error.details);
            }

            await authService.changePassword(userId, value.old_password, value.new_password);

            return responseUtils.success(res, 200, 'Password changed successfully');
        } catch (error) {
            console.error('Change Password Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }

            if (error.message.includes('incorrect')) {
                return responseUtils.unauthorized(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to change password');
        }
    },

    // Logout
    logout: async (req, res) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];

            if (token) {
                await authService.logout(token);
            }

            return responseUtils.success(res, 200, 'Logged out successfully');
        } catch (error) {
            console.error('Logout Error:', error);
            return responseUtils.error(res, 500, error.message || 'Logout failed');
        }
    },

    // Refresh token
    refreshToken: async (req, res) => {
        try {
            const { refresh_token } = req.body;

            if (!refresh_token) {
                return responseUtils.badRequest(res, 'Refresh token is required');
            }

            // Verify refresh token
            const decoded = authService.verifyRefreshToken(refresh_token);

            // Get user details
            const userResult = await userModel.getUserById(decoded.id);

            if (!userResult.rows.length) {
                return responseUtils.unauthorized(res, 'User not found');
            }

            const user = userResult.rows[0];

            // Check if user is active
            if (!user.is_active) {
                return responseUtils.unauthorized(res, 'Account is deactivated');
            }

            // Get role name
            const roleResult = await roleModel.getRoleById(user.role_id);
            user.role_name = roleResult.rows[0]?.role_name;

            // Remove password
            delete user.password;

            // Generate new tokens
            const tokens = authService.generateTokens(user);

            return responseUtils.success(res, 200, 'Token refreshed successfully', {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            });
        } catch (error) {
            console.error('Refresh Token Error:', error);
            return responseUtils.unauthorized(res, error.message || 'Invalid refresh token');
        }
    }
};

module.exports = authController;
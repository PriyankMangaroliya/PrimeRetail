const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../users/users.model');
const roleModel = require('../roles/roles.model');

const authService = {
    // Hash password
    hashPassword: async (password) => {
        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10);
        return bcrypt.hash(password, salt);
    },

    // Compare password
    comparePassword: async (password, hashedPassword) => {
        return bcrypt.compare(password, hashedPassword);
    },

    // Generate tokens
    generateTokens: (user) => {
        const payload = {
            id: user.id,
            email: user.email,
            role_id: user.role_id,
            role_name: user.role_name,
            store_id: user.store_id,
            warehouse_id: user.warehouse_id
        };

        const accessToken = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        const refreshToken = jwt.sign(
            { id: user.id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
        );

        return { accessToken, refreshToken };
    },

    // Verify access token
    verifyAccessToken: (token) => {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    },

    // Verify refresh token
    verifyRefreshToken: (token) => {
        try {
            return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        } catch (error) {
            throw new Error('Invalid or expired refresh token');
        }
    },

    // Check if first admin user exists
    checkFirstAdminExists: async () => {
        try {
            // Find Super Admin role (match your database role name)
            const roleResult = await roleModel.checkRoleExistsByName('Super Admin');
            if (!roleResult.rows.length) {
                return false;
            }

            const adminRoleId = roleResult.rows[0].id;

            // Check if any user with Super Admin role exists
            const usersResult = await userModel.getUsersByRole(adminRoleId);
            return usersResult.rows.length > 0;
        } catch (error) {
            throw error;
        }
    },

    // Register first admin user
    registerFirstAdmin: async (userData) => {
        try {
            // Find Super Admin role ID
            const roleResult = await roleModel.checkRoleExistsByName('Super Admin');
            let adminRoleId;

            if (!roleResult.rows.length) {
                // If Super Admin role doesn't exist, create it
                const newRole = await roleModel.addRole({
                    role_name: 'Super Admin',
                    description: 'Full system access and control',
                    created_by: 1
                });
                adminRoleId = newRole.rows[0].id;
            } else {
                adminRoleId = roleResult.rows[0].id;
            }

            // Hash password
            const hashedPassword = await authService.hashPassword(userData.password);

            // Create user with Super Admin role
            const newUserData = {
                role_id: adminRoleId,
                name: userData.name,
                email: userData.email,
                password: hashedPassword,
                phone: userData.phone,
                profile_image: userData.profile_image,
                created_by: 1 // System
            };

            const userResult = await userModel.createUser(newUserData);
            const user = userResult.rows[0];

            // Get role name
            const roleResult2 = await roleModel.getRoleById(user.role_id);
            user.role_name = roleResult2.rows[0]?.role_name;

            // Generate tokens
            const tokens = authService.generateTokens(user);

            return { user, ...tokens };
        } catch (error) {
            throw error;
        }
    },

    // Login user - THIS WORKS FOR ALL USERS
    login: async (email, password) => {
        try {
            // Get user by email
            const userResult = await userModel.getUserByEmail(email);

            if (!userResult.rows.length) {
                throw new Error('Invalid email or password');
            }

            const user = userResult.rows[0];

            // Check if user is active
            if (!user.is_active) {
                throw new Error('Account is deactivated. Please contact administrator');
            }

            // Verify password
            const isValidPassword = await authService.comparePassword(password, user.password);
            if (!isValidPassword) {
                throw new Error('Invalid email or password');
            }

            // Get role name - THIS WORKS FOR ALL ROLES
            const roleResult = await roleModel.getRoleById(user.role_id);
            user.role_name = roleResult.rows[0]?.role_name;

            // Remove password from response
            delete user.password;

            // Generate tokens
            const tokens = authService.generateTokens(user);

            return { user, ...tokens };
        } catch (error) {
            throw error;
        }
    },

    // Get user profile
    getProfile: async (userId) => {
        try {
            const userResult = await userModel.getUserById(userId);

            if (!userResult.rows.length) {
                throw new Error('User not found');
            }

            const user = userResult.rows[0];

            // Get role name
            const roleResult = await roleModel.getRoleById(user.role_id);
            user.role_name = roleResult.rows[0]?.role_name;

            // Remove password from response
            delete user.password;

            return user;
        } catch (error) {
            throw error;
        }
    },

    // Update profile
    updateProfile: async (userId, updateData) => {
        try {
            // Check if user exists
            const userResult = await userModel.getUserById(userId);
            if (!userResult.rows.length) {
                throw new Error('User not found');
            }

            // Update user
            const updatedUser = await userModel.updateUser(userId, {
                name: updateData.name,
                email: updateData.email,
                phone: updateData.phone,
                profile_image: updateData.profile_image,
                updated_by: userId
            });

            const user = updatedUser.rows[0];

            // Get role name
            const roleResult = await roleModel.getRoleById(user.role_id);
            user.role_name = roleResult.rows[0]?.role_name;

            // Remove password from response
            delete user.password;

            return user;
        } catch (error) {
            throw error;
        }
    },

    // Change password
    changePassword: async (userId, oldPassword, newPassword) => {
        try {
            // Get user with password
            const userResult = await userModel.getUserById(userId);

            if (!userResult.rows.length) {
                throw new Error('User not found');
            }

            const user = userResult.rows[0];

            // Verify old password
            const isValidPassword = await authService.comparePassword(oldPassword, user.password);
            if (!isValidPassword) {
                throw new Error('Current password is incorrect');
            }

            // Hash new password
            const hashedPassword = await authService.hashPassword(newPassword);

            // Update password
            await userModel.updateUserPassword(userId, hashedPassword, userId);

            return { message: 'Password changed successfully' };
        } catch (error) {
            throw error;
        }
    },

    // Logout
    logout: async (token) => {
        return { message: 'Logged out successfully' };
    }
};

module.exports = authService;
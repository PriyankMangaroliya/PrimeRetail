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
    },

    // Forgot password - Generate and send OTP
    forgotPassword: async (email) => {
        try {
            // Check if user exists
            const userResult = await userModel.getUserByEmail(email);
            if (!userResult.rows.length) {
                throw new Error('User with this email does not exist');
            }

            const userName = userResult.rows[0].name;

            // Generate 6-digit OTP
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

            // Save OTP to database
            const otpModel = require('./otp.model');
            await otpModel.createOTP(email, otpCode, expiresAt);

            // Send Real Email
            const { sendEmail } = require('../../utils/mail.utils');
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                    <div style="background-color: #007bff; color: white; padding: 20px; text-align: center;">
                        <h2 style="margin: 0;">PrimeRetail Security</h2>
                    </div>
                    <div style="padding: 20px; color: #333; line-height: 1.6;">
                        <p>Hello <strong>${userName}</strong>,</p>
                        <p>We received a request to reset your password. Use the verification code below to proceed:</p>
                        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #007bff;">${otpCode}</span>
                        </div>
                        <p style="color: #666; font-size: 14px;">This code is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this email or contact support.</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                        <p style="font-size: 12px; color: #999; text-align: center;">© 2026 PrimeRetail System. All rights reserved.</p>
                    </div>
                </div>
            `;

            await sendEmail({
                to: email,
                subject: 'PrimeRetail - Password Reset OTP Code',
                html: emailHtml
            });

            // MOCK: Still print to console for easier debugging
            console.log(`\n--- [OTP DISPATCHED] ---`);
            console.log(`To: ${email}`);
            console.log(`OTP Code: ${otpCode}`);
            console.log(`--------------------\n`);

            return { message: 'OTP sent successfully to your email' };
        } catch (error) {
            throw error;
        }
    },

    // Verify OTP
    verifyOTP: async (email, otpCode) => {
        try {
            const otpModel = require('./otp.model');

            // Check if OTP matches and is not expired
            const verifiedOTP = await otpModel.verifyOTP(email, otpCode);

            if (!verifiedOTP.rows.length) {
                throw new Error('Invalid or expired OTP');
            }

            return { message: 'OTP verified successfully' };
        } catch (error) {
            throw error;
        }
    },

    // Reset password using verified OTP
    resetPassword: async (email, otpCode, newPassword) => {
        try {
            const otpModel = require('./otp.model');

            // Check if OTP was verified very recently (within last 15 minutes)
            const isVerified = await otpModel.checkIsVerified(email, otpCode);

            if (!isVerified.rows.length) {
                throw new Error('OTP verification session has expired or is invalid');
            }

            // Get user
            const userResult = await userModel.getUserByEmail(email);
            if (!userResult.rows.length) {
                throw new Error('User not found');
            }

            const userId = userResult.rows[0].id;

            // Hash new password
            const hashedPassword = await authService.hashPassword(newPassword);

            // Update password
            await userModel.updateUserPassword(userId, hashedPassword, userId);

            return { message: 'Password reset successfully' };
        } catch (error) {
            throw error;
        }
    }
};

module.exports = authService;
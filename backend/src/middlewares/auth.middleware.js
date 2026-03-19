const authService = require('../modules/auth/auth.service');
const responseUtils = require('../utils/response.utils');

const authMiddleware = {
    // Verify token middleware
    verifyToken: async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return responseUtils.unauthorized(res, 'Access token is required');
            }

            const token = authHeader.split(' ')[1];

            if (!token) {
                return responseUtils.unauthorized(res, 'Access token is required');
            }

            // Verify token
            const decoded = authService.verifyAccessToken(token);

            // Attach user to request
            req.user = decoded;

            next();
        } catch (error) {
            return responseUtils.unauthorized(res, error.message || 'Invalid or expired token');
        }
    },

    // Check if first admin exists middleware
    checkFirstAdmin: async (req, res, next) => {
        try {
            const adminExists = await authService.checkFirstAdminExists();

            // If this is the register route and admin exists, block it
            if (req.path === '/register' && req.method === 'POST' && adminExists) {
                return responseUtils.badRequest(res, 'Admin user already exists. Registration is disabled.');
            }

            // For all other routes, if no admin exists, redirect to register
            if (!adminExists && req.path !== '/register') {
                return responseUtils.notFound(res, 'No admin user found. Please register first.');
            }

            next();
        } catch (error) {
            return responseUtils.error(res, 500, 'Error checking admin status');
        }
    },

    // Optional Auth middleware (doesn't block if no token)
    optionalAuth: async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;

            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];

                if (token) {
                    try {
                        const decoded = authService.verifyAccessToken(token);
                        req.user = decoded;
                    } catch (error) {
                        // Ignore token errors for optional Auth
                    }
                }
            }

            next();
        } catch (error) {
            next();
        }
    }
};

module.exports = authMiddleware;
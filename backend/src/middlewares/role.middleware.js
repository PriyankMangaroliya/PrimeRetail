const responseUtils = require('../utils/response.utils');

// Role constants - EXACTLY as in database
const ROLES = {
    SUPER_ADMIN: 'Super Admin',
    STORE_OWNER: 'Store Owner',
    MANAGER: 'Store Manager',
    CASHIER: 'Cashier',
    INVENTORY_STAFF: 'Inventory Staff',
    WAREHOUSE_STAFF: 'Warehouse Staff'
};

const roleMiddleware = {
    /**
     * Check if user has exact role match
     */
    hasRole: (allowedRoles) => {
        return (req, res, next) => {
            try {
                const user = req.user;

                if (!user) {
                    return responseUtils.unauthorized(res, 'User not authenticated');
                }

                const userRole = user.role_name;
                const allowedRolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

                if (!allowedRolesArray.includes(userRole)) {
                    return responseUtils.forbidden(res, 'You do not have permission to access this resource');
                }

                next();
            } catch (error) {
                console.error('Role Middleware Error:', error);
                return responseUtils.error(res, 500, 'Error checking permissions');
            }
        };
    },

    /**
     * Check if user has store access (for their assigned store only)
     */
    hasStoreAccess: () => {
        return (req, res, next) => {
            try {
                const user = req.user;

                if (!user) {
                    return responseUtils.unauthorized(res, 'User not authenticated');
                }

                // Super Admin and Store Owner can access all stores
                if (user.role_name === ROLES.SUPER_ADMIN || user.role_name === ROLES.STORE_OWNER) {
                    return next();
                }

                // Other roles can only access their assigned store
                if (user.store_id) {
                    const storeId = req.params.storeId || req.body.store_id || req.query.store_id || req.params.id;

                    if (storeId && parseInt(storeId) !== parseInt(user.store_id)) {
                        return responseUtils.forbidden(res, 'You can only access your own store data');
                    }
                    return next();
                }

                return responseUtils.forbidden(res, 'You do not have store access');
            } catch (error) {
                console.error('Store Access Error:', error);
                return responseUtils.error(res, 500, 'Error checking store access');
            }
        };
    },

    /**
     * Check if user has warehouse access (for their assigned warehouse only)
     */
    hasWarehouseAccess: () => {
        return (req, res, next) => {
            try {
                const user = req.user;

                if (!user) {
                    return responseUtils.unauthorized(res, 'User not authenticated');
                }

                // Super Admin and Store Owner can access all warehouses
                if (user.role_name === ROLES.SUPER_ADMIN || user.role_name === ROLES.STORE_OWNER) {
                    return next();
                }

                // Warehouse Staff can only access their assigned warehouse
                if (user.role_name === ROLES.WAREHOUSE_STAFF && user.warehouse_id) {
                    const warehouseId = req.params.warehouseId || req.body.warehouse_id || req.query.warehouse_id || req.params.id;

                    if (warehouseId && parseInt(warehouseId) !== parseInt(user.warehouse_id)) {
                        return responseUtils.forbidden(res, 'You can only access your own warehouse data');
                    }
                    return next();
                }

                return responseUtils.forbidden(res, 'You do not have warehouse access');
            } catch (error) {
                console.error('Warehouse Access Error:', error);
                return responseUtils.error(res, 500, 'Error checking warehouse access');
            }
        };
    },

    // Role check helpers
    isSystemAdmin: () => roleMiddleware.hasRole(ROLES.SUPER_ADMIN),
    isStoreOwner: () => roleMiddleware.hasRole(ROLES.STORE_OWNER),
    isStoreManager: () => roleMiddleware.hasRole(ROLES.MANAGER),
    isCashier: () => roleMiddleware.hasRole(ROLES.CASHIER),
    isInventoryStaff: () => roleMiddleware.hasRole(ROLES.INVENTORY_STAFF),
    isWarehouseStaff: () => roleMiddleware.hasRole(ROLES.WAREHOUSE_STAFF),

    // Export ROLES for use in other files
    ROLES
};

module.exports = roleMiddleware;
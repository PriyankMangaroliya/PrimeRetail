const dashboardService = require('./dashboard.service');
const responseUtils = require('../../utils/response.utils');
const db = require('../../config/database.config');

const dashboardController = {
    getStats: async (req, res) => {
        try {
            const userRole = req.user.role_name;
            const userId = req.user.id;
            const storeId = req.user.store_id;
            const warehouseId = req.user.warehouse_id;

            console.log(`Fetching dashboard stats for user: ${userId}, role: ${userRole}, store: ${storeId}, warehouse: ${warehouseId}`);

            let stats = {};

            switch (userRole) {
                case 'Super Admin':
                    stats = await dashboardService.getSuperAdminStats();
                    break;

                case 'Store Owner':
                    stats = await dashboardService.getStoreOwnerStats(userId);
                    break;

                case 'Store Manager':
                case 'Cashier': {
                    if (!storeId) {
                        return responseUtils.badRequest(res, 'Store ID not found in user profile');
                    }
                    const ownerResult = await db.query('SELECT owner_id FROM store_master WHERE id = $1', [storeId]);
                    if (!ownerResult.rows.length) {
                        return responseUtils.notFound(res, 'Assigned store not found');
                    }
                    const ownerId = ownerResult.rows[0].owner_id;
                    stats = await dashboardService.getStoreSpecificStats(storeId, ownerId);
                    break;
                }

                case 'Inventory Staff': {
                    if (!storeId) {
                        return responseUtils.badRequest(res, 'Store ID not found in user profile');
                    }
                    const ownerResult = await db.query('SELECT owner_id FROM store_master WHERE id = $1', [storeId]);
                    if (!ownerResult.rows.length) {
                        return responseUtils.notFound(res, 'Assigned store not found');
                    }
                    const ownerId = ownerResult.rows[0].owner_id;
                    stats = await dashboardService.getInventoryStats(storeId, ownerId);
                    break;
                }

                case 'Warehouse Staff': {
                    if (!warehouseId) {
                        return responseUtils.badRequest(res, 'Warehouse ID not found in user profile');
                    }
                    const ownerResult = await db.query('SELECT owner_id FROM warehouse_master WHERE id = $1', [warehouseId]);
                    if (!ownerResult.rows.length) {
                        return responseUtils.notFound(res, 'Assigned warehouse not found');
                    }
                    const ownerId = ownerResult.rows[0].owner_id;
                    stats = await dashboardService.getWarehouseStats(warehouseId, ownerId);
                    break;
                }

                default:
                    return responseUtils.forbidden(res, 'You do not have permission to access dashboard stats');
            }

            return responseUtils.success(res, 200, 'Dashboard statistics retrieved successfully', stats);


        } catch (error) {
            console.error('Dashboard Stats Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve dashboard statistics');
        }
    },

    getTrends: async (req, res) => {
        try {
            const userRole = req.user.role_name;
            const { period = 'monthly' } = req.query;

            let trends = {};
            if (userRole === 'Super Admin') {
                trends = await dashboardService.getSuperAdminTrends(period);
            } else if (userRole === 'Store Owner') {
                trends = await dashboardService.getStoreOwnerTrends(req.user.id, period);
            } else {
                return responseUtils.forbidden(res, 'You do not have permission to access trend data');
            }

            return responseUtils.success(res, 200, 'Dashboard trends retrieved successfully', trends);
        } catch (error) {
            console.error('Dashboard Trends Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve dashboard trends');
        }
    }
};

module.exports = dashboardController;


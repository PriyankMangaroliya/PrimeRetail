const dashboardService = require('./dashboard.service');
const responseUtils = require('../../utils/response.utils');

const dashboardController = {
    // Get Dashboard data based on user role
    getDashboard: async (req, res) => {
        try {
            const userId = req.user.id;
            const userRole = req.user.role_name;
            const userStoreId = req.user.store_id;
            const userWarehouseId = req.user.warehouse_id;

            console.log('Dashboard Access - User Role:', userRole);

            let dashboardData;

            // Route to appropriate service based on role
            switch (userRole) {
                case 'Super Admin':
                    dashboardData = await dashboardService.getAdminDashboard(userId);
                    break;
                case 'Store Owner':
                    dashboardData = await dashboardService.getStoreOwnerDashboard(userId, userStoreId);
                    break;
                case 'Store Manager':
                    dashboardData = await dashboardService.getStoreManagerDashboard(userId, userStoreId);
                    break;
                case 'Cashier':
                    dashboardData = await dashboardService.getCashierDashboard(userId, userStoreId);
                    break;
                case 'Inventory Staff':
                    dashboardData = await dashboardService.getInventoryStaffDashboard(userId, userStoreId);
                    break;
                case 'Warehouse Staff':
                    dashboardData = await dashboardService.getWarehouseStaffDashboard(userId, userWarehouseId);
                    break;
                default:
                    console.log('Invalid role:', userRole);
                    return responseUtils.forbidden(res, `Invalid user role: ${userRole}`);
            }

            return responseUtils.success(res, 200, 'Dashboard data retrieved successfully', dashboardData);
        } catch (error) {
            console.error('Dashboard Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve dashboard data');
        }
    },

    // Get summary stats only (for quick view)
    getSummary: async (req, res) => {
        try {
            const userId = req.user.id;
            const userRole = req.user.role_name;
            const userStoreId = req.user.store_id;
            const userWarehouseId = req.user.warehouse_id;

            let summaryData;

            switch (userRole) {
                case 'Super Admin':
                    summaryData = await dashboardService.getAdminSummary(userId);
                    break;
                case 'Store Owner':
                    summaryData = await dashboardService.getStoreOwnerSummary(userId, userStoreId);
                    break;
                case 'Store Manager':
                    summaryData = await dashboardService.getStoreManagerSummary(userId, userStoreId);
                    break;
                case 'Cashier':
                    summaryData = await dashboardService.getCashierSummary(userId, userStoreId);
                    break;
                case 'Inventory Staff':
                    summaryData = await dashboardService.getInventoryStaffSummary(userId, userStoreId);
                    break;
                case 'Warehouse Staff':
                    summaryData = await dashboardService.getWarehouseStaffSummary(userId, userWarehouseId);
                    break;
                default:
                    return responseUtils.forbidden(res, `Invalid user role: ${userRole}`);
            }

            return responseUtils.success(res, 200, 'Summary data retrieved successfully', summaryData);
        } catch (error) {
            console.error('Summary Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve summary data');
        }
    },

    // Get recent activities
    getRecentActivities: async (req, res) => {
        try {
            const userId = req.user.id;
            const userRole = req.user.role_name;
            const userStoreId = req.user.store_id;
            const userWarehouseId = req.user.warehouse_id;

            const activities = await dashboardService.getRecentActivities(userRole, userStoreId, userWarehouseId);

            return responseUtils.success(res, 200, 'Recent activities retrieved successfully', { activities });
        } catch (error) {
            console.error('Recent Activities Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve activities');
        }
    }
};

module.exports = dashboardController;
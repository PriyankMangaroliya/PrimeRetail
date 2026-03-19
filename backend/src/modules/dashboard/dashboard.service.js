const db = require('../../config/database.config');
const dashboardQueries = require('./dashboard.model');

const dashboardService = {
    // Admin Dashboard - Full System View
    getAdminDashboard: async (userId) => {
        try {
            const [
                storesResult,
                warehousesResult,
                usersResult,
                productsResult,
                todaySalesResult,
                monthlySalesResult,
                lowStockResult,
                recentInvoicesResult
            ] = await Promise.all([
                db.query(dashboardQueries.getTotalStores),
                db.query(dashboardQueries.getTotalWarehouses),
                db.query(dashboardQueries.getTotalUsers),
                db.query(dashboardQueries.getTotalProducts),
                db.query(dashboardQueries.getTodaySales),
                db.query(dashboardQueries.getMonthlySales),
                db.query(dashboardQueries.getLowStockProducts, [10]),
                db.query(dashboardQueries.getRecentInvoices, [5])
            ]);

            return {
                summary: {
                    total_stores: parseInt(storesResult.rows[0]?.count) || 0,
                    total_warehouses: parseInt(warehousesResult.rows[0]?.count) || 0,
                    total_users: parseInt(usersResult.rows[0]?.count) || 0,
                    total_products: parseInt(productsResult.rows[0]?.count) || 0,
                    today_sales: parseFloat(todaySalesResult.rows[0]?.total_sales) || 0,
                    today_invoices: parseInt(todaySalesResult.rows[0]?.total_invoices) || 0,
                    monthly_sales: parseFloat(monthlySalesResult.rows[0]?.total_sales) || 0,
                    monthly_invoices: parseInt(monthlySalesResult.rows[0]?.total_invoices) || 0,
                    low_stock_count: parseInt(lowStockResult.rows[0]?.count) || 0
                },
                recent_invoices: recentInvoicesResult.rows,
                charts: {
                    sales_last_7_days: await dashboardService.getSalesLast7Days(),
                    top_selling_products: await dashboardService.getTopSellingProducts(5),
                    sales_by_store: await dashboardService.getSalesByStore()
                }
            };
        } catch (error) {
            throw error;
        }
    },

    // Store Owner Dashboard - Own Stores View
    getStoreOwnerDashboard: async (userId, storeId) => {
        try {
            // Get all stores owned by this owner
            const storesResult = await db.query(
                'SELECT id, store_name FROM store_master WHERE owner_id = $1 AND is_deleted = false',
                [userId]
            );
            const storeIds = storesResult.rows.map(s => s.id);

            if (storeIds.length === 0) {
                return {
                    summary: {
                        total_stores: 0,
                        total_warehouses: 0,
                        total_employees: 0,
                        total_products: 0,
                        today_sales: 0,
                        monthly_sales: 0
                    },
                    stores: [],
                    recent_invoices: []
                };
            }

            const [
                storesCountResult,
                warehousesResult,
                employeesResult,
                productsResult,
                todaySalesResult,
                monthlySalesResult,
                lowStockResult,
                recentInvoicesResult,
                salesByStoreResult
            ] = await Promise.all([
                db.query(dashboardQueries.getOwnerTotalStores, [userId]),
                db.query(dashboardQueries.getOwnerTotalWarehouses, [userId]),
                db.query(dashboardQueries.getOwnerTotalEmployees, [userId]),
                db.query(dashboardQueries.getOwnerTotalProducts, [userId]),
                db.query(dashboardQueries.getOwnerTodaySales, [userId]),
                db.query(dashboardQueries.getOwnerMonthlySales, [userId]),
                db.query(dashboardQueries.getOwnerLowStockProducts, [userId, 10]),
                db.query(dashboardQueries.getOwnerRecentInvoices, [userId, 5]),
                db.query(dashboardQueries.getSalesByOwnerStores, [userId])
            ]);

            return {
                summary: {
                    total_stores: parseInt(storesCountResult.rows[0]?.count) || 0,
                    total_warehouses: parseInt(warehousesResult.rows[0]?.count) || 0,
                    total_employees: parseInt(employeesResult.rows[0]?.count) || 0,
                    total_products: parseInt(productsResult.rows[0]?.count) || 0,
                    today_sales: parseFloat(todaySalesResult.rows[0]?.total_sales) || 0,
                    today_invoices: parseInt(todaySalesResult.rows[0]?.total_invoices) || 0,
                    monthly_sales: parseFloat(monthlySalesResult.rows[0]?.total_sales) || 0,
                    monthly_invoices: parseInt(monthlySalesResult.rows[0]?.total_invoices) || 0,
                    low_stock_count: parseInt(lowStockResult.rows[0]?.count) || 0
                },
                stores: storesResult.rows,
                sales_by_store: salesByStoreResult.rows,
                recent_invoices: recentInvoicesResult.rows
            };
        } catch (error) {
            throw error;
        }
    },

    // Store Manager Dashboard - Single Store View
    getStoreManagerDashboard: async (userId, storeId) => {
        try {
            if (!storeId) {
                throw new Error('No store assigned');
            }

            const [
                storeResult,
                employeesResult,
                productsResult,
                todaySalesResult,
                monthlySalesResult,
                lowStockResult,
                recentInvoicesResult,
                topProductsResult
            ] = await Promise.all([
                db.query('SELECT id, store_name, address, city FROM store_master WHERE id = $1', [storeId]),
                db.query(dashboardQueries.getStoreTotalEmployees, [storeId]),
                db.query(dashboardQueries.getStoreTotalProducts, [storeId]),
                db.query(dashboardQueries.getStoreTodaySales, [storeId]),
                db.query(dashboardQueries.getStoreMonthlySales, [storeId]),
                db.query(dashboardQueries.getStoreLowStockProducts, [storeId, 10]),
                db.query(dashboardQueries.getStoreRecentInvoices, [storeId, 5]),
                db.query(dashboardQueries.getStoreTopProducts, [storeId, 5])
            ]);

            return {
                store_info: storeResult.rows[0] || {},
                summary: {
                    total_employees: parseInt(employeesResult.rows[0]?.count) || 0,
                    total_products: parseInt(productsResult.rows[0]?.count) || 0,
                    today_sales: parseFloat(todaySalesResult.rows[0]?.total_sales) || 0,
                    today_invoices: parseInt(todaySalesResult.rows[0]?.total_invoices) || 0,
                    monthly_sales: parseFloat(monthlySalesResult.rows[0]?.total_sales) || 0,
                    monthly_invoices: parseInt(monthlySalesResult.rows[0]?.total_invoices) || 0,
                    low_stock_count: parseInt(lowStockResult.rows[0]?.count) || 0
                },
                recent_invoices: recentInvoicesResult.rows,
                top_products: topProductsResult.rows
            };
        } catch (error) {
            throw error;
        }
    },

    // Cashier Dashboard - Sales Focused
    getCashierDashboard: async (userId, storeId) => {
        try {
            if (!storeId) {
                throw new Error('No store assigned');
            }

            const [
                todaySalesResult,
                recentInvoicesResult,
                pendingInvoicesResult,
                topProductsResult
            ] = await Promise.all([
                db.query(dashboardQueries.getCashierTodaySales, [userId, storeId]),
                db.query(dashboardQueries.getCashierRecentInvoices, [userId, storeId, 5]),
                db.query(dashboardQueries.getStorePendingInvoices, [storeId]),
                db.query(dashboardQueries.getStoreTopProducts, [storeId, 5])
            ]);

            return {
                summary: {
                    today_sales: parseFloat(todaySalesResult.rows[0]?.total_sales) || 0,
                    today_invoices: parseInt(todaySalesResult.rows[0]?.total_invoices) || 0,
                    pending_invoices: parseInt(pendingInvoicesResult.rows[0]?.count) || 0
                },
                my_recent_invoices: recentInvoicesResult.rows,
                popular_products: topProductsResult.rows
            };
        } catch (error) {
            throw error;
        }
    },

    // Inventory Staff Dashboard - Stock Focused
    getInventoryStaffDashboard: async (userId, storeId) => {
        try {
            if (!storeId) {
                throw new Error('No store assigned');
            }

            const [
                totalStockResult,
                lowStockResult,
                outOfStockResult,
                recentTransactionsResult,
                categoryStockResult
            ] = await Promise.all([
                db.query(dashboardQueries.getStoreTotalStock, [storeId]),
                db.query(dashboardQueries.getStoreLowStockProducts, [storeId, 10]),
                db.query(dashboardQueries.getStoreOutOfStock, [storeId]),
                db.query(dashboardQueries.getStoreRecentStockTransactions, [storeId, 5]),
                db.query(dashboardQueries.getStockByCategory, [storeId])
            ]);

            return {
                summary: {
                    total_stock_items: parseInt(totalStockResult.rows[0]?.count) || 0,
                    total_quantity: parseInt(totalStockResult.rows[0]?.total_quantity) || 0,
                    low_stock_count: parseInt(lowStockResult.rows.length) || 0,
                    out_of_stock_count: parseInt(outOfStockResult.rows[0]?.count) || 0
                },
                low_stock_products: lowStockResult.rows,
                recent_transactions: recentTransactionsResult.rows,
                stock_by_category: categoryStockResult.rows
            };
        } catch (error) {
            throw error;
        }
    },

    // Warehouse Staff Dashboard - Warehouse Focused
    getWarehouseStaffDashboard: async (userId, warehouseId) => {
        try {
            if (!warehouseId) {
                throw new Error('No warehouse assigned');
            }

            const [
                warehouseResult,
                totalStockResult,
                lowStockResult,
                recentTransactionsResult,
                pendingTransfersResult,
                categoryStockResult
            ] = await Promise.all([
                db.query('SELECT id, warehouse_name, location FROM warehouse_master WHERE id = $1', [warehouseId]),
                db.query(dashboardQueries.getWarehouseTotalStock, [warehouseId]),
                db.query(dashboardQueries.getWarehouseLowStock, [warehouseId, 10]),
                db.query(dashboardQueries.getWarehouseRecentTransactions, [warehouseId, 5]),
                db.query(dashboardQueries.getWarehousePendingTransfers, [warehouseId]),
                db.query(dashboardQueries.getWarehouseStockByCategory, [warehouseId])
            ]);

            return {
                warehouse_info: warehouseResult.rows[0] || {},
                summary: {
                    total_stock_items: parseInt(totalStockResult.rows[0]?.count) || 0,
                    total_quantity: parseInt(totalStockResult.rows[0]?.total_quantity) || 0,
                    low_stock_count: parseInt(lowStockResult.rows.length) || 0,
                    pending_transfers: parseInt(pendingTransfersResult.rows[0]?.count) || 0
                },
                low_stock_products: lowStockResult.rows,
                recent_transactions: recentTransactionsResult.rows,
                stock_by_category: categoryStockResult.rows
            };
        } catch (error) {
            throw error;
        }
    },

    // Summary Methods (Simplified version for quick view)
    getAdminSummary: async (userId) => {
        const dashboard = await dashboardService.getAdminDashboard(userId);
        return dashboard.summary;
    },

    getStoreOwnerSummary: async (userId, storeId) => {
        const dashboard = await dashboardService.getStoreOwnerDashboard(userId, storeId);
        return dashboard.summary;
    },

    getStoreManagerSummary: async (userId, storeId) => {
        const dashboard = await dashboardService.getStoreManagerDashboard(userId, storeId);
        return dashboard.summary;
    },

    getCashierSummary: async (userId, storeId) => {
        const dashboard = await dashboardService.getCashierDashboard(userId, storeId);
        return dashboard.summary;
    },

    getInventoryStaffSummary: async (userId, storeId) => {
        const dashboard = await dashboardService.getInventoryStaffDashboard(userId, storeId);
        return dashboard.summary;
    },

    getWarehouseStaffSummary: async (userId, warehouseId) => {
        const dashboard = await dashboardService.getWarehouseStaffDashboard(userId, warehouseId);
        return dashboard.summary;
    },

    // Helper methods for charts
    getSalesLast7Days: async () => {
        const query = `
            SELECT 
                DATE(created_at) as date,
                COALESCE(SUM(grand_total), 0) as total_sales,
                COUNT(*) as invoice_count
            FROM invoice_master
            WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
                AND is_deleted = false
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `;
        const result = await db.query(query);
        return result.rows;
    },

    getTopSellingProducts: async (limit = 5) => {
        const query = `
            SELECT 
                p.id,
                p.product_name,
                p.sku,
                SUM(ii.quantity) as total_quantity_sold,
                SUM(ii.total_price) as total_revenue
            FROM invoice_items ii
            JOIN product_master p ON ii.product_id = p.id
            JOIN invoice_master i ON ii.invoice_id = i.id
            WHERE i.created_at >= CURRENT_DATE - INTERVAL '30 days'
                AND i.is_deleted = false
            GROUP BY p.id, p.product_name, p.sku
            ORDER BY total_quantity_sold DESC
            LIMIT $1
        `;
        const result = await db.query(query, [limit]);
        return result.rows;
    },

    getSalesByStore: async () => {
        const query = `
            SELECT 
                s.id,
                s.store_name,
                COALESCE(SUM(i.grand_total), 0) as total_sales,
                COUNT(i.id) as invoice_count
            FROM store_master s
            LEFT JOIN invoice_master i ON s.id = i.store_id 
                AND i.created_at >= CURRENT_DATE - INTERVAL '30 days'
                AND i.is_deleted = false
            WHERE s.is_deleted = false
            GROUP BY s.id, s.store_name
            ORDER BY total_sales DESC
        `;
        const result = await db.query(query);
        return result.rows;
    },

    // Recent Activities
    getRecentActivities: async (role, storeId, warehouseId) => {
        let query;
        let params = [];

        if (role === 'Admin') {
            query = `
                (SELECT 'invoice' as type, id, 'New invoice created' as description, created_at 
                 FROM invoice_master WHERE is_deleted = false)
                UNION ALL
                (SELECT 'stock' as type, id, 'Stock updated' as description, created_at 
                 FROM stock_transactions)
                UNION ALL
                (SELECT 'user' as type, id, 'New user added' as description, created_at 
                 FROM user_master WHERE is_deleted = false)
                ORDER BY created_at DESC
                LIMIT 10
            `;
        } else if (storeId) {
            params = [storeId];
            query = `
                (SELECT 'invoice' as type, i.id, 'New invoice created' as description, i.created_at 
                 FROM invoice_master i WHERE i.store_id = $1 AND i.is_deleted = false)
                UNION ALL
                (SELECT 'stock' as type, st.id, 'Stock updated' as description, st.created_at 
                 FROM stock_transactions st
                 JOIN stock_master s ON st.stock_id = s.id
                 WHERE s.location_type = 'Store' AND s.location_id = $1)
                ORDER BY created_at DESC
                LIMIT 10
            `;
        } else if (warehouseId) {
            params = [warehouseId];
            query = `
                SELECT 'stock_transfer' as type, id, 
                       CASE 
                           WHEN source_location_id = $1 THEN 'Outgoing transfer'
                           ELSE 'Incoming transfer'
                       END as description,
                       created_at
                FROM stock_transactions
                WHERE source_location_id = $1 OR destination_location_id = $1
                ORDER BY created_at DESC
                LIMIT 10
            `;
        }

        const result = await db.query(query, params);
        return result.rows;
    }
};

module.exports = dashboardService;
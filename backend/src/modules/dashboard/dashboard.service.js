const db = require('../../config/database.config');

const dashboardService = {
    getSuperAdminStats: async () => {
        const queries = {
            totalStoreOwners: `SELECT COUNT(*) FROM user_master u 
                               JOIN role_master r ON u.role_id = r.id 
                               WHERE r.role_name = 'Store Owner' 
                               AND u.is_deleted = false AND u.is_active = true`,
            totalUsers: `SELECT COUNT(*) FROM user_master u 
                         JOIN role_master r ON u.role_id = r.id 
                         WHERE r.role_name != 'Super Admin' AND r.role_name != 'Store Owner' 
                         AND u.is_deleted = false AND u.is_active = true`,
            totalStores: `SELECT COUNT(*) FROM store_master WHERE is_deleted = false AND is_active = true`,
            totalWarehouses: `SELECT COUNT(*) FROM warehouse_master WHERE is_deleted = false AND is_active = true`
        };

        const results = await Promise.all([
            db.query(queries.totalStoreOwners),
            db.query(queries.totalUsers),
            db.query(queries.totalStores),
            db.query(queries.totalWarehouses)
        ]);

        return {
            totalStoreOwners: parseInt(results[0].rows[0]?.count || 0),
            totalUsers: parseInt(results[1].rows[0]?.count || 0),
            totalStores: parseInt(results[2].rows[0]?.count || 0),
            totalWarehouses: parseInt(results[3].rows[0]?.count || 0)
        };
    },

    getSuperAdminTrends: async (period) => {
        let dateSeriesQuery = '';
        let selectFormat = '';
        let truncLabel = '';

        switch (period) {
            case 'monthly':
                // All days of current month
                dateSeriesQuery = `SELECT generate_series(DATE_TRUNC('month', CURRENT_DATE), (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day'), '1 day'::interval)::date AS d`;
                selectFormat = "TO_CHAR(ds.d, 'DD Mon')";
                truncLabel = 'day';
                break;
            case 'yearly':
                // All 12 months of current year
                dateSeriesQuery = `SELECT generate_series(DATE_TRUNC('year', CURRENT_DATE), (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '11 months'), '1 month'::interval)::date AS d`;
                selectFormat = "TO_CHAR(ds.d, 'Mon YYYY')";
                truncLabel = 'month';
                break;
            case 'all':
            default:
                // Years from earliest record - 1 year to now + 1 year
                const earliestSubQuery = `COALESCE((SELECT MIN(created_at) FROM user_master WHERE is_active = true AND is_deleted = false), '2024-01-01'::timestamp)`;
                dateSeriesQuery = `SELECT generate_series(DATE_TRUNC('year', ${earliestSubQuery}) - INTERVAL '1 year', DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year', '1 year'::interval)::date AS d`;
                selectFormat = "TO_CHAR(ds.d, 'YYYY')";
                truncLabel = 'year';
                break;
        }

        const query = `
            WITH date_series AS (${dateSeriesQuery}),
            owner_counts AS (
                SELECT DATE_TRUNC('${truncLabel}', u.created_at)::date as d, COUNT(*) as count 
                FROM user_master u
                JOIN role_master r ON u.role_id = r.id
                WHERE r.role_name = 'Store Owner'
                AND u.is_active = true AND u.is_deleted = false
                GROUP BY 1
            ),
            store_counts AS (
                SELECT DATE_TRUNC('${truncLabel}', created_at)::date as d, COUNT(*) as count 
                FROM store_master 
                WHERE is_active = true AND is_deleted = false
                GROUP BY 1
            ),
            warehouse_counts AS (
                SELECT DATE_TRUNC('${truncLabel}', created_at)::date as d, COUNT(*) as count 
                FROM warehouse_master 
                WHERE is_active = true AND is_deleted = false
                GROUP BY 1
            )
            SELECT 
                ${selectFormat} as name,
                COALESCE(oc.count, 0)::int as "storeOwners",
                COALESCE(sc.count, 0)::int as stores,
                COALESCE(wc.count, 0)::int as warehouses
            FROM date_series ds
            LEFT JOIN owner_counts oc ON ds.d = oc.d
            LEFT JOIN store_counts sc ON ds.d = sc.d
            LEFT JOIN warehouse_counts wc ON ds.d = wc.d
            ORDER BY ds.d ASC
        `;

        const result = await db.query(query);
        return result.rows;
    },

    getStoreOwnerStats: async (ownerId) => {
        const queries = {
            totalUsers: `SELECT COUNT(*) FROM user_master 
                         WHERE (store_id IN (SELECT id FROM store_master WHERE owner_id = $1 AND is_deleted = false) 
                            OR warehouse_id IN (SELECT id FROM warehouse_master WHERE owner_id = $1 AND is_deleted = false)
                            OR created_by = $1) 
                            AND id != $1 AND is_deleted = false AND is_active = true`,
            totalStores: `SELECT COUNT(*) FROM store_master WHERE owner_id = $1 AND is_deleted = false AND is_active = true`,
            totalWarehouses: `SELECT COUNT(*) FROM warehouse_master WHERE owner_id = $1 AND is_deleted = false AND is_active = true`,
            totalProducts: `SELECT COUNT(*) FROM product_master WHERE owner_id = $1 AND is_deleted = false AND is_active = true`,
            totalStock: `SELECT COALESCE(SUM(s.quantity), 0) as count FROM stock_master s 
                         JOIN product_master p ON s.product_id = p.id 
                         WHERE p.owner_id = $1 AND p.is_deleted = false AND p.is_active = true`,
            totalOffers: `SELECT COUNT(*) FROM discount_master WHERE owner_id = $1 AND is_deleted = false AND is_active = true`,
            totalInvoices: `SELECT COUNT(*) FROM invoice_master i
                            JOIN store_master s ON i.store_id = s.id
                            WHERE s.owner_id = $1`,
            totalPayments: `SELECT COALESCE(SUM(p.amount), 0) as sum FROM payment_master p
                            JOIN invoice_master i ON p.invoice_id = i.id
                            JOIN store_master s ON i.store_id = s.id
                            WHERE s.owner_id = $1 AND p.payment_status = 'COMPLETED'`
        };

        const results = await Promise.all([
            db.query(queries.totalUsers, [ownerId]),
            db.query(queries.totalStores, [ownerId]),
            db.query(queries.totalWarehouses, [ownerId]),
            db.query(queries.totalProducts, [ownerId]),
            db.query(queries.totalStock, [ownerId]),
            db.query(queries.totalOffers, [ownerId]),
            db.query(queries.totalInvoices, [ownerId]),
            db.query(queries.totalPayments, [ownerId])
        ]);

        return {
            totalUsers: parseInt(results[0].rows[0]?.count || 0),
            totalStores: parseInt(results[1].rows[0]?.count || 0),
            totalWarehouses: parseInt(results[2].rows[0]?.count || 0),
            totalProducts: parseInt(results[3].rows[0]?.count || 0),
            totalStock: parseInt(results[4].rows[0]?.count || 0),
            totalOffers: parseInt(results[5].rows[0]?.count || 0),
            totalInvoices: parseInt(results[6].rows[0]?.count || 0),
            totalPayments: parseFloat(results[7].rows[0]?.sum || 0)
        };
    },

    getStoreSpecificStats: async (storeId, ownerId) => {
        const queries = {
            totalProducts: `SELECT COUNT(*) FROM product_master WHERE owner_id = $1 AND is_deleted = false AND is_active = true`,
            totalStock: `SELECT COALESCE(SUM(s.quantity), 0) as count FROM stock_master s 
                         JOIN product_master p ON s.product_id = p.id 
                         WHERE s.location_type = 'Store' AND s.location_id = $1 
                         AND p.is_deleted = false AND p.is_active = true`,
            totalInvoices: `SELECT COUNT(*) FROM invoice_master WHERE store_id = $1`,
            totalPayments: `SELECT COALESCE(SUM(p.amount), 0) as sum FROM payment_master p
                            JOIN invoice_master i ON p.invoice_id = i.id
                            WHERE i.store_id = $1 AND p.payment_status = 'COMPLETED'`
        };

        const results = await Promise.all([
            db.query(queries.totalProducts, [ownerId]),
            db.query(queries.totalStock, [storeId]),
            db.query(queries.totalInvoices, [storeId]),
            db.query(queries.totalPayments, [storeId])
        ]);

        return {
            totalProducts: parseInt(results[0].rows[0]?.count || 0),
            totalStock: parseInt(results[1].rows[0]?.count || 0),
            totalInvoices: parseInt(results[2].rows[0]?.count || 0),
            totalPayments: parseFloat(results[3].rows[0]?.sum || 0)
        };
    },

    getInventoryStats: async (storeId, ownerId) => {
        const queries = {
            totalProducts: `SELECT COUNT(*) FROM product_master WHERE owner_id = $1 AND is_deleted = false AND is_active = true`,
            totalStock: `SELECT COALESCE(SUM(s.quantity), 0) as count FROM stock_master s 
                         JOIN product_master p ON s.product_id = p.id 
                         WHERE s.location_type = 'Store' AND s.location_id = $1 
                         AND p.is_deleted = false AND p.is_active = true`,
            totalLowStock: `SELECT COUNT(*) FROM stock_master s 
                            JOIN product_master p ON s.product_id = p.id 
                            WHERE s.location_type = 'Store' AND s.location_id = $1 
                            AND s.quantity <= p.min_stock AND s.quantity > 0 
                            AND p.is_deleted = false AND p.is_active = true`,
            totalOutOfStock: `SELECT COUNT(*) FROM stock_master s 
                              JOIN product_master p ON s.product_id = p.id 
                              WHERE s.location_type = 'Store' AND s.location_id = $1 
                              AND s.quantity = 0 
                              AND p.is_deleted = false AND p.is_active = true`,
            lowStockProducts: `SELECT p.id as product_id, s.id as stock_id, p.product_name, p.sku, s.quantity 
                               FROM stock_master s 
                               JOIN product_master p ON s.product_id = p.id 
                               WHERE s.location_type = 'Store' AND s.location_id = $1 
                               AND s.quantity <= p.min_stock AND s.quantity > 0 
                               AND p.is_deleted = false AND p.is_active = true 
                               LIMIT 5`,
            outOfStockProducts: `SELECT p.id as product_id, s.id as stock_id, p.product_name, p.sku, s.quantity 
                                 FROM stock_master s 
                                 JOIN product_master p ON s.product_id = p.id 
                                 WHERE s.location_type = 'Store' AND s.location_id = $1 
                                 AND s.quantity = 0 
                                 AND p.is_deleted = false AND p.is_active = true 
                                 LIMIT 5`
        };

        const results = await Promise.all([
            db.query(queries.totalProducts, [ownerId]),
            db.query(queries.totalStock, [storeId]),
            db.query(queries.totalLowStock, [storeId]),
            db.query(queries.totalOutOfStock, [storeId]),
            db.query(queries.lowStockProducts, [storeId]),
            db.query(queries.outOfStockProducts, [storeId])
        ]);

        return {
            totalProducts: parseInt(results[0].rows[0]?.count || 0),
            totalStock: parseInt(results[1].rows[0]?.count || 0),
            totalLowStock: parseInt(results[2].rows[0]?.count || 0),
            totalOutOfStock: parseInt(results[3].rows[0]?.count || 0),
            lowStockProducts: results[4].rows,
            outOfStockProducts: results[5].rows
        };
    },

    getWarehouseStats: async (warehouseId, ownerId) => {
        const queries = {
            totalProducts: `SELECT COUNT(*) FROM product_master WHERE owner_id = $1 AND is_deleted = false AND is_active = true`,
            totalStock: `SELECT COALESCE(SUM(s.quantity), 0) as count FROM stock_master s 
                         JOIN product_master p ON s.product_id = p.id 
                         WHERE s.location_type = 'Warehouse' AND s.location_id = $1 
                         AND p.is_deleted = false AND p.is_active = true`,
            totalLowStock: `SELECT COUNT(*) FROM stock_master s 
                            JOIN product_master p ON s.product_id = p.id 
                            WHERE s.location_type = 'Warehouse' AND s.location_id = $1 
                            AND s.quantity <= p.min_stock AND s.quantity > 0 
                            AND p.is_deleted = false AND p.is_active = true`,
            totalOutOfStock: `SELECT COUNT(*) FROM stock_master s 
                              JOIN product_master p ON s.product_id = p.id 
                              WHERE s.location_type = 'Warehouse' AND s.location_id = $1 
                              AND s.quantity = 0 
                              AND p.is_deleted = false AND p.is_active = true`,
            lowStockProducts: `SELECT p.id as product_id, s.id as stock_id, p.product_name, p.sku, s.quantity 
                               FROM stock_master s 
                               JOIN product_master p ON s.product_id = p.id 
                               WHERE s.location_type = 'Warehouse' AND s.location_id = $1 
                               AND s.quantity <= p.min_stock AND s.quantity > 0 
                               AND p.is_deleted = false AND p.is_active = true 
                               LIMIT 5`,
            outOfStockProducts: `SELECT p.id as product_id, s.id as stock_id, p.product_name, p.sku, s.quantity 
                                 FROM stock_master s 
                                 JOIN product_master p ON s.product_id = p.id 
                                 WHERE s.location_type = 'Warehouse' AND s.location_id = $1 
                                 AND s.quantity = 0 
                                 AND p.is_deleted = false AND p.is_active = true 
                                 LIMIT 5`
        };

        const results = await Promise.all([
            db.query(queries.totalProducts, [ownerId]),
            db.query(queries.totalStock, [warehouseId]),
            db.query(queries.totalLowStock, [warehouseId]),
            db.query(queries.totalOutOfStock, [warehouseId]),
            db.query(queries.lowStockProducts, [warehouseId]),
            db.query(queries.outOfStockProducts, [warehouseId])
        ]);

        return {
            totalProducts: parseInt(results[0].rows[0]?.count || 0),
            totalStock: parseInt(results[1].rows[0]?.count || 0),
            totalLowStock: parseInt(results[2].rows[0]?.count || 0),
            totalOutOfStock: parseInt(results[3].rows[0]?.count || 0),
            lowStockProducts: results[4].rows,
            outOfStockProducts: results[5].rows
        };
    },

    getStoreOwnerTrends: async (ownerId, period) => {
        let dateSeriesQuery = '';
        let selectFormat = '';
        let truncLabel = '';

        if (period === 'monthly') {
            dateSeriesQuery = `SELECT generate_series(DATE_TRUNC('month', CURRENT_DATE), (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day'), '1 day'::interval)::date AS d`;
            selectFormat = "TO_CHAR(ds.d, 'DD Mon')";
            truncLabel = 'day';
        } else if (period === 'yearly') {
            dateSeriesQuery = `SELECT generate_series(DATE_TRUNC('year', CURRENT_DATE), (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '11 months'), '1 month'::interval)::date AS d`;
            selectFormat = "TO_CHAR(ds.d, 'Mon YYYY')";
            truncLabel = 'month';
        } else {
            dateSeriesQuery = `SELECT generate_series(DATE_TRUNC('month', CURRENT_DATE), (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day'), '1 day'::interval)::date AS d`;
            selectFormat = "TO_CHAR(ds.d, 'DD Mon')";
            truncLabel = 'day';
        }

        const query = `
            WITH date_series AS (${dateSeriesQuery}),
            owner_stores AS (
                SELECT id, store_name 
                FROM store_master 
                WHERE owner_id = $1 AND is_deleted = false AND is_active = true
            ),
            revenue_stats AS (
                SELECT 
                    i.store_id,
                    DATE_TRUNC('${truncLabel}', p.created_at)::date as d,
                    SUM(p.amount) as revenue
                FROM payment_master p
                JOIN invoice_master i ON p.invoice_id = i.id
                JOIN store_master s ON i.store_id = s.id
                WHERE p.payment_status = 'COMPLETED' AND s.owner_id = $1
                GROUP BY 1, 2
            ),
            invoice_stats AS (
                SELECT 
                    i.store_id,
                    DATE_TRUNC('${truncLabel}', i.created_at)::date as d,
                    COUNT(i.id) as count
                FROM invoice_master i
                JOIN store_master s ON i.store_id = s.id
                WHERE s.owner_id = $1
                GROUP BY 1, 2
            )
            SELECT 
                ${selectFormat} as name,
                os.store_name as "storeName",
                COALESCE(rs.revenue, 0)::float as revenue,
                COALESCE(ins.count, 0)::int as invoices
            FROM date_series ds
            CROSS JOIN owner_stores os
            LEFT JOIN revenue_stats rs ON ds.d = rs.d AND os.id = rs.store_id
            LEFT JOIN invoice_stats ins ON ds.d = ins.d AND os.id = ins.store_id
            ORDER BY ds.d ASC, os.store_name ASC
        `;

        const result = await db.query(query, [ownerId]);
        return result.rows;
    }
};

module.exports = dashboardService;

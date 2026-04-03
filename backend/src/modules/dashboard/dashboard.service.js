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

    getSuperAdminTrends: async (period) => {
        let dateSeriesQuery = '';
        let selectFormat = '';
        let truncLabel = '';

        switch (period) {
            case 'monthly':
                // Last 30 days including today
                dateSeriesQuery = `SELECT generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, '1 day'::interval)::date AS d`;
                selectFormat = "TO_CHAR(ds.d, 'DD Mon')";
                truncLabel = 'day';
                break;
            case 'yearly':
                // Last 12 months including current month
                dateSeriesQuery = `SELECT generate_series(DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months', DATE_TRUNC('month', CURRENT_DATE), '1 month'::interval)::date AS d`;
                selectFormat = "TO_CHAR(ds.d, 'Mon YYYY')";
                truncLabel = 'month';
                break;
            case 'all':
            default:
                // Last 5 years
                dateSeriesQuery = `SELECT generate_series(DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '4 years', DATE_TRUNC('year', CURRENT_DATE), '1 year'::interval)::date AS d`;
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


    // Single-store revenue + invoice trend (for Store Manager & Cashier)
    getStoreTrends: async (storeId, period) => {
        let dateSeriesQuery = '';
        let selectFormat = '';
        let truncLabel = '';

        switch (period) {
            case 'yearly':
                dateSeriesQuery = `SELECT generate_series(
                    DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months',
                    DATE_TRUNC('month', CURRENT_DATE),
                    '1 month'::interval
                )::date AS d`;
                selectFormat = "TO_CHAR(ds.d, 'Mon YYYY')";
                truncLabel = 'month';
                break;
            case 'monthly':
            default:
                dateSeriesQuery = `SELECT generate_series(
                    CURRENT_DATE - INTERVAL '29 days',
                    CURRENT_DATE,
                    '1 day'::interval
                )::date AS d`;
                selectFormat = "TO_CHAR(ds.d, 'DD Mon')";
                truncLabel = 'day';
                break;
        }

        const query = `
            WITH date_series AS (${dateSeriesQuery}),
            store_data AS (
                SELECT
                    DATE_TRUNC('${truncLabel}', i.created_at)::date AS d,
                    COALESCE(COUNT(i.id), 0)::int               AS invoice_count,
                    COALESCE(SUM(p.amount), 0)::numeric          AS revenue
                FROM invoice_master i
                LEFT JOIN payment_master p
                    ON p.invoice_id = i.id AND p.payment_status = 'COMPLETED'
                WHERE i.store_id = $1
                GROUP BY DATE_TRUNC('${truncLabel}', i.created_at)::date
            )
            SELECT
                ${selectFormat}                             AS name,
                COALESCE(sd.invoice_count, 0)              AS invoices,
                COALESCE(sd.revenue, 0)                    AS revenue
            FROM date_series ds
            LEFT JOIN store_data sd ON sd.d = ds.d
            ORDER BY ds.d ASC
        `;

        const result = await db.query(query, [storeId]);
        return result.rows;
    },


    getStoreOwnerTrends: async (ownerId, period) => {
        let dateSeriesQuery = '';
        let selectFormat = '';
        let truncLabel = '';

        switch (period) {
            case 'yearly':
                // Last 12 months including current month
                dateSeriesQuery = `SELECT generate_series(
                    DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months',
                    DATE_TRUNC('month', CURRENT_DATE),
                    '1 month'::interval
                )::date AS d`;
                selectFormat = "TO_CHAR(ds.d, 'Mon YYYY')";
                truncLabel = 'month';
                break;
            case 'monthly':
            default:
                // Last 30 days including today
                dateSeriesQuery = `SELECT generate_series(
                    CURRENT_DATE - INTERVAL '29 days',
                    CURRENT_DATE,
                    '1 day'::interval
                )::date AS d`;
                selectFormat = "TO_CHAR(ds.d, 'DD Mon')";
                truncLabel = 'day';
                break;
        }

        // Step 1: Get all stores for this owner
        const storesResult = await db.query(
            `SELECT id, store_name FROM store_master WHERE owner_id = $1 AND is_deleted = false AND is_active = true ORDER BY store_name`,
            [ownerId]
        );
        const ownerStores = storesResult.rows;

        if (ownerStores.length === 0) {
            return [];
        }

        const storeIds = ownerStores.map(s => s.id);
        // Placeholders $1, $2, ... mapped directly to storeIds
        const storePlaceholders = storeIds.map((_, i) => `$${i + 1}`).join(', ');

        // Step 2: Aggregate revenue and invoices per store, per period
        // CROSS JOIN date_series x store ensures every (date, store) row exists.
        // COALESCE guarantees NULL → 0 for any date a store had no activity.
        const query = `
            WITH date_series AS (${dateSeriesQuery}),
            invoice_data AS (
                SELECT
                    i.store_id,
                    DATE_TRUNC('${truncLabel}', i.created_at)::date AS d,
                    COALESCE(COUNT(i.id), 0)::int     AS invoice_count,
                    COALESCE(SUM(p.amount), 0)::numeric AS revenue
                FROM invoice_master i
                LEFT JOIN payment_master p
                    ON p.invoice_id = i.id AND p.payment_status = 'COMPLETED'
                WHERE i.store_id IN (${storePlaceholders})
                GROUP BY i.store_id, DATE_TRUNC('${truncLabel}', i.created_at)::date
            )
            SELECT
                ${selectFormat} AS name,
                sm.store_name AS "storeName",
                sm.id         AS "storeId",
                COALESCE(id_agg.invoice_count, 0) AS invoices,
                COALESCE(id_agg.revenue, 0)       AS revenue
            FROM date_series ds
            CROSS JOIN store_master sm
            LEFT JOIN invoice_data id_agg
                ON id_agg.d = ds.d AND id_agg.store_id = sm.id
            WHERE sm.id IN (${storePlaceholders})
            ORDER BY ds.d ASC, sm.store_name ASC
        `;

        const result = await db.query(query, [...storeIds]);
        return result.rows;
    },

};

module.exports = dashboardService;

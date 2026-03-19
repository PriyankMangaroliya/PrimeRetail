const dashboardQueries = {
    // Admin Queries
    getTotalStores: `SELECT COUNT(*) as count FROM store_master WHERE is_deleted = false`,
    getTotalWarehouses: `SELECT COUNT(*) as count FROM warehouse_master WHERE is_deleted = false`,
    getTotalUsers: `SELECT COUNT(*) as count FROM user_master WHERE is_deleted = false`,
    getTotalProducts: `SELECT COUNT(*) as count FROM product_master WHERE is_deleted = false`,
    getTodaySales: `
        SELECT 
            COALESCE(SUM(grand_total), 0) as total_sales,
            COUNT(*) as total_invoices
        FROM invoice_master 
        WHERE DATE(created_at) = CURRENT_DATE 
            AND is_deleted = false
    `,
    getMonthlySales: `
        SELECT 
            COALESCE(SUM(grand_total), 0) as total_sales,
            COUNT(*) as total_invoices
        FROM invoice_master 
        WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
            AND is_deleted = false
    `,
    getLowStockProducts: `
        SELECT COUNT(*) as count
        FROM stock_master s
        JOIN product_master p ON s.product_id = p.id
        WHERE s.quantity <= $1 AND s.is_deleted = false
    `,
    getRecentInvoices: `
        SELECT 
            i.id,
            i.invoice_no,
            s.store_name,
            i.grand_total,
            i.created_at,
            u.name as cashier_name
        FROM invoice_master i
        JOIN store_master s ON i.store_id = s.id
        JOIN user_master u ON i.cashier_id = u.id
        WHERE i.is_deleted = false
        ORDER BY i.created_at DESC
        LIMIT $1
    `,

    // Store Owner Queries
    getOwnerTotalStores: `SELECT COUNT(*) as count FROM store_master WHERE owner_id = $1 AND is_deleted = false`,
    getOwnerTotalWarehouses: `SELECT COUNT(*) as count FROM warehouse_master WHERE owner_id = $1 AND is_deleted = false`,
    getOwnerTotalEmployees: `
        SELECT COUNT(*) as count 
        FROM user_master 
        WHERE (store_id IN (SELECT id FROM store_master WHERE owner_id = $1) 
            OR warehouse_id IN (SELECT id FROM warehouse_master WHERE owner_id = $1))
            AND is_deleted = false
    `,
    getOwnerTotalProducts: `
        SELECT COUNT(*) as count 
        FROM product_master 
        WHERE owner_id = $1 AND is_deleted = false
    `,
    getOwnerTodaySales: `
        SELECT 
            COALESCE(SUM(i.grand_total), 0) as total_sales,
            COUNT(i.id) as total_invoices
        FROM invoice_master i
        JOIN store_master s ON i.store_id = s.id
        WHERE s.owner_id = $1 
            AND DATE(i.created_at) = CURRENT_DATE
            AND i.is_deleted = false
    `,
    getOwnerMonthlySales: `
        SELECT 
            COALESCE(SUM(i.grand_total), 0) as total_sales,
            COUNT(i.id) as total_invoices
        FROM invoice_master i
        JOIN store_master s ON i.store_id = s.id
        WHERE s.owner_id = $1 
            AND EXTRACT(MONTH FROM i.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM i.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
            AND i.is_deleted = false
    `,
    getOwnerLowStockProducts: `
        SELECT COUNT(DISTINCT s.product_id) as count
        FROM stock_master s
        JOIN product_master p ON s.product_id = p.id
        WHERE p.owner_id = $1 
            AND s.quantity <= $2 
            AND s.is_deleted = false
    `,
    getOwnerRecentInvoices: `
        SELECT 
            i.id,
            i.invoice_no,
            s.store_name,
            i.grand_total,
            i.created_at,
            u.name as cashier_name
        FROM invoice_master i
        JOIN store_master s ON i.store_id = s.id
        JOIN user_master u ON i.cashier_id = u.id
        WHERE s.owner_id = $1 AND i.is_deleted = false
        ORDER BY i.created_at DESC
        LIMIT $2
    `,
    getSalesByOwnerStores: `
        SELECT 
            s.id,
            s.store_name,
            COALESCE(SUM(i.grand_total), 0) as total_sales,
            COUNT(i.id) as invoice_count
        FROM store_master s
        LEFT JOIN invoice_master i ON s.id = i.store_id 
            AND i.created_at >= CURRENT_DATE - INTERVAL '30 days'
            AND i.is_deleted = false
        WHERE s.owner_id = $1 AND s.is_deleted = false
        GROUP BY s.id, s.store_name
        ORDER BY total_sales DESC
    `,

    // Store Manager Queries
    getStoreTotalEmployees: `
        SELECT COUNT(*) as count 
        FROM user_master 
        WHERE store_id = $1 AND is_deleted = false
    `,
    getStoreTotalProducts: `
        SELECT COUNT(*) as count 
        FROM product_master 
        WHERE owner_id = (SELECT owner_id FROM store_master WHERE id = $1)
            AND is_deleted = false
    `,
    getStoreTodaySales: `
        SELECT 
            COALESCE(SUM(grand_total), 0) as total_sales,
            COUNT(*) as total_invoices
        FROM invoice_master 
        WHERE store_id = $1 
            AND DATE(created_at) = CURRENT_DATE
            AND is_deleted = false
    `,
    getStoreMonthlySales: `
        SELECT 
            COALESCE(SUM(grand_total), 0) as total_sales,
            COUNT(*) as total_invoices
        FROM invoice_master 
        WHERE store_id = $1 
            AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
            AND is_deleted = false
    `,
    getStoreLowStockProducts: `
        SELECT 
            p.id,
            p.product_name,
            p.sku,
            s.quantity,
            p.unit
        FROM stock_master s
        JOIN product_master p ON s.product_id = p.id
        WHERE s.location_type = 'Store' 
            AND s.location_id = $1 
            AND s.quantity <= $2
            AND s.is_deleted = false
        ORDER BY s.quantity ASC
    `,
    getStoreRecentInvoices: `
        SELECT 
            i.id,
            i.invoice_no,
            i.grand_total,
            i.created_at,
            c.name as customer_name,
            u.name as cashier_name
        FROM invoice_master i
        LEFT JOIN customer_master c ON i.customer_id = c.id
        JOIN user_master u ON i.cashier_id = u.id
        WHERE i.store_id = $1 AND i.is_deleted = false
        ORDER BY i.created_at DESC
        LIMIT $2
    `,
    getStoreTopProducts: `
        SELECT 
            p.id,
            p.product_name,
            p.sku,
            SUM(ii.quantity) as quantity_sold,
            SUM(ii.total_price) as revenue
        FROM invoice_items ii
        JOIN product_master p ON ii.product_id = p.id
        JOIN invoice_master i ON ii.invoice_id = i.id
        WHERE i.store_id = $1 
            AND i.created_at >= CURRENT_DATE - INTERVAL '30 days'
            AND i.is_deleted = false
        GROUP BY p.id, p.product_name, p.sku
        ORDER BY quantity_sold DESC
        LIMIT $2
    `,
    getStorePendingInvoices: `
        SELECT COUNT(*) as count
        FROM invoice_master
        WHERE store_id = $1 AND status = 'Pending' AND is_deleted = false
    `,

    // Cashier Queries
    getCashierTodaySales: `
        SELECT 
            COALESCE(SUM(grand_total), 0) as total_sales,
            COUNT(*) as total_invoices
        FROM invoice_master 
        WHERE cashier_id = $1 
            AND store_id = $2
            AND DATE(created_at) = CURRENT_DATE
            AND is_deleted = false
    `,
    getCashierRecentInvoices: `
        SELECT 
            id,
            invoice_no,
            grand_total,
            created_at
        FROM invoice_master 
        WHERE cashier_id = $1 AND store_id = $2 AND is_deleted = false
        ORDER BY created_at DESC
        LIMIT $3
    `,

    // Inventory Staff Queries
    getStoreTotalStock: `
        SELECT 
            COUNT(*) as count,
            COALESCE(SUM(quantity), 0) as total_quantity
        FROM stock_master
        WHERE location_type = 'Store' AND location_id = $1 AND is_deleted = false
    `,
    getStoreOutOfStock: `
        SELECT COUNT(*) as count
        FROM stock_master
        WHERE location_type = 'Store' 
            AND location_id = $1 
            AND quantity = 0 
            AND is_deleted = false
    `,
    getStoreRecentStockTransactions: `
        SELECT 
            st.id,
            p.product_name,
            st.movement_type,
            st.quantity,
            st.created_at
        FROM stock_transactions st
        JOIN product_master p ON st.product_id = p.id
        WHERE (st.source_location_type = 'Store' AND st.source_location_id = $1)
            OR (st.destination_location_type = 'Store' AND st.destination_location_id = $1)
        ORDER BY st.created_at DESC
        LIMIT $2
    `,
    getStockByCategory: `
        SELECT 
            c.category_name,
            COUNT(DISTINCT s.product_id) as product_count,
            COALESCE(SUM(s.quantity), 0) as total_quantity
        FROM stock_master s
        JOIN product_master p ON s.product_id = p.id
        JOIN category_master c ON p.category_id = c.id
        WHERE s.location_type = 'Store' 
            AND s.location_id = $1 
            AND s.is_deleted = false
        GROUP BY c.category_name
        ORDER BY total_quantity DESC
    `,

    // Warehouse Staff Queries
    getWarehouseTotalStock: `
        SELECT 
            COUNT(*) as count,
            COALESCE(SUM(quantity), 0) as total_quantity
        FROM stock_master
        WHERE location_type = 'Warehouse' AND location_id = $1 AND is_deleted = false
    `,
    getWarehouseLowStock: `
        SELECT 
            p.id,
            p.product_name,
            p.sku,
            s.quantity,
            p.unit
        FROM stock_master s
        JOIN product_master p ON s.product_id = p.id
        WHERE s.location_type = 'Warehouse' 
            AND s.location_id = $1 
            AND s.quantity <= $2
            AND s.is_deleted = false
        ORDER BY s.quantity ASC
    `,
    getWarehouseRecentTransactions: `
        SELECT 
            st.id,
            p.product_name,
            st.movement_type,
            CASE 
                WHEN st.source_location_id = $1 THEN 'Outgoing'
                WHEN st.destination_location_id = $1 THEN 'Incoming'
            END as direction,
            st.quantity,
            st.created_at
        FROM stock_transactions st
        JOIN product_master p ON st.product_id = p.id
        WHERE st.source_location_id = $1 OR st.destination_location_id = $1
        ORDER BY st.created_at DESC
        LIMIT $2
    `,
    getWarehousePendingTransfers: `
        SELECT COUNT(*) as count
        FROM stock_transactions
        WHERE movement_type = 'Transfer' 
            AND source_location_id = $1
            AND created_at >= CURRENT_DATE
    `,
    getWarehouseStockByCategory: `
        SELECT 
            c.category_name,
            COUNT(DISTINCT s.product_id) as product_count,
            COALESCE(SUM(s.quantity), 0) as total_quantity
        FROM stock_master s
        JOIN product_master p ON s.product_id = p.id
        JOIN category_master c ON p.category_id = c.id
        WHERE s.location_type = 'Warehouse' 
            AND s.location_id = $1 
            AND s.is_deleted = false
        GROUP BY c.category_name
        ORDER BY total_quantity DESC
    `
};

module.exports = dashboardQueries;
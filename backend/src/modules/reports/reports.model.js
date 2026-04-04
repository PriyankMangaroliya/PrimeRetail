const db = require('../../config/database.config');

const reportsModel = {
    /**
     * Get Store Owners Report
     * Lists store owners with counts of their stores and warehouses
     */
    getStoreOwnersReport: (filters = {}) => {
        const { startDate, endDate } = filters;
        let queryText = `
            SELECT u.id, u.name, u.email, u.phone, u.is_active, u.created_at,
                   COUNT(DISTINCT s.id) as store_count,
                   COUNT(DISTINCT w.id) as warehouse_count
            FROM user_master u
            LEFT JOIN store_master s ON u.id = s.owner_id AND s.is_deleted = false
            LEFT JOIN warehouse_master w ON u.id = w.owner_id AND w.is_deleted = false
            WHERE u.role_id = (SELECT id FROM role_master WHERE role_name = 'Store Owner')
              AND u.is_deleted = false
        `;

        const queryParams = [];
        if (startDate && endDate) {
            queryParams.push(startDate, endDate);
            queryText += ` AND u.created_at BETWEEN $1 AND $2 `;
        }

        queryText += ` GROUP BY u.id ORDER BY u.name ASC `;

        return db.query(queryText, queryParams);
    },

    /**
     * Get Stores Report
     * Lists all stores with their owner names
     */
    getStoresReport: (filters = {}) => {
        const { startDate, endDate } = filters;
        let queryText = `
            SELECT s.id, s.store_name, s.store_code, s.city, s.is_active, s.created_at,
                   u.name as owner_name, u.email as owner_email
            FROM store_master s
            LEFT JOIN user_master u ON s.owner_id = u.id
            WHERE s.is_deleted = false
        `;

        const queryParams = [];
        if (startDate && endDate) {
            queryParams.push(startDate, endDate);
            queryText += ` AND s.created_at BETWEEN $1 AND $2 `;
        }

        queryText += ` ORDER BY s.store_name ASC `;

        return db.query(queryText, queryParams);
    },

    /**
     * Get Warehouses Report
     * Lists all warehouses with their owner names
     */
    getWarehousesReport: (filters = {}) => {
        const { startDate, endDate } = filters;
        let queryText = `
            SELECT w.id, w.warehouse_name, w.warehouse_code, w.location as city, w.is_active, w.created_at,
                   u.name as owner_name, u.email as owner_email
            FROM warehouse_master w
            LEFT JOIN user_master u ON w.owner_id = u.id
            WHERE w.is_deleted = false
        `;

        const queryParams = [];
        if (startDate && endDate) {
            queryParams.push(startDate, endDate);
            queryText += ` AND w.created_at BETWEEN $1 AND $2 `;
        }

        queryText += ` ORDER BY w.warehouse_name ASC `;

        return db.query(queryText, queryParams);
    },

    /**
     * Get Roles Report
     * Lists roles and calculates the number of associated users
     */
    getRolesReport: (filters = {}) => {
        const { startDate, endDate } = filters;
        let queryText = `
            SELECT r.id, r.role_name, r.description, r.is_active, r.created_at,
                   COUNT(u.id) as user_count,
                   COUNT(CASE WHEN u.is_active = true THEN 1 END) as active_user_count
            FROM role_master r
            LEFT JOIN user_master u ON r.id = u.role_id AND u.is_deleted = false
            WHERE r.is_deleted = false
        `;

        const queryParams = [];
        if (startDate && endDate) {
            queryParams.push(startDate, endDate);
            queryText += ` AND r.created_at BETWEEN $1 AND $2 `;
        }

        queryText += ` GROUP BY r.id ORDER BY r.role_name ASC `;

        return db.query(queryText, queryParams);
    },

    /**
     * Get Taxes Report
     * Lists all system taxes and dynamic usage counts across items
     */
    getTaxesReport: (filters = {}) => {
        const { startDate, endDate } = filters;
        let queryText = `
            SELECT t.id, t.tax_name, t.tax_rate, t.description, t.is_active, t.created_at,
                   (SELECT COUNT(*) FROM product_master p JOIN store_taxes st ON p.tax_id = st.id WHERE st.tax_id = t.id AND p.is_deleted = false) + 
                   (SELECT COUNT(*) FROM store_taxes WHERE tax_id = t.id AND is_active = true) as usage_count
            FROM tax_master t
            WHERE t.is_deleted = false
        `;

        const queryParams = [];
        if (startDate && endDate) {
            queryParams.push(startDate, endDate);
            queryText += ` AND t.created_at BETWEEN $1 AND $2 `;
        }

        queryText += ` ORDER BY t.tax_name ASC `;

        return db.query(queryText, queryParams);
    },

    /**
     * Get Payment Methods Report
     * Lists payment systems and overall usage counts via transactions
     */
    getPaymentMethodsReport: (filters = {}) => {
        const { startDate, endDate } = filters;
        let queryText = `
            SELECT p.id, p.method_name, p.description, p.is_active, p.created_at,
                   (SELECT COUNT(*) FROM payment_master WHERE payment_method_id = p.id) as usage_count
            FROM payment_method_master p
            WHERE p.is_deleted = false
        `;

        const queryParams = [];
        if (startDate && endDate) {
            queryParams.push(startDate, endDate);
            queryText += ` AND p.created_at BETWEEN $1 AND $2 `;
        }

        queryText += ` ORDER BY p.method_name ASC `;

        return db.query(queryText, queryParams);
    },

    /**
     * Get Warehouse Stock Report
     */
    getWarehouseStockReport: (warehouseId, filters = {}) => {
        const { startDate, endDate, stockStatus, search } = filters;
        let queryText = `
            SELECT s.id, s.quantity, s.updated_at, p.product_name, p.sku, p.min_stock
            FROM stock_master s
            INNER JOIN product_master p ON s.product_id = p.id
            WHERE s.location_type = 'Warehouse' AND s.location_id = $1 AND p.is_deleted = false
        `;

        const queryParams = [warehouseId];
        let paramCount = 2;

        if (stockStatus === 'current_stock') {
            queryText += ` AND s.quantity > 0 `;
        } else if (stockStatus === 'out_of_stock') {
            queryText += ` AND s.quantity = 0 `;
        } else if (stockStatus === 'low_stock') {
            queryText += ` AND s.quantity > 0 AND s.quantity <= p.min_stock `;
        }

        if (startDate && endDate) {
            queryParams.push(startDate, endDate);
            queryText += ` AND s.updated_at BETWEEN $${paramCount} AND $${paramCount + 1} `;
            paramCount += 2;
        }

        if (search) {
            queryParams.push(`%${search}%`);
            queryText += ` AND (p.product_name ILIKE $${paramCount} OR p.sku ILIKE $${paramCount}) `;
            paramCount++;
        }

        queryText += ` ORDER BY p.product_name ASC `;
        return db.query(queryText, queryParams);
    },

    /**
     * Get Warehouse Transactions Report
     */
    getWarehouseTransactionsReport: (warehouseId, filters = {}) => {
        const { startDate, endDate, transactionType, search } = filters;
        let queryText = `
            SELECT t.id, t.movement_type, t.quantity, t.before_qty, t.after_qty, t.created_at, t.notes,
                   p.product_name, p.sku,
                   CASE WHEN t.source_location_type = 'Warehouse' AND t.source_location_id = $1 THEN 'OUT' ELSE 'IN' END as direction
            FROM stock_transactions t
            INNER JOIN product_master p ON t.product_id = p.id
            WHERE ((t.source_location_type = 'Warehouse' AND t.source_location_id = $1)
               OR (t.destination_location_type = 'Warehouse' AND t.destination_location_id = $1))
        `;

        const queryParams = [warehouseId];
        let paramCount = 2;

        if (transactionType && transactionType !== 'all') {
            queryParams.push(transactionType);
            queryText += ` AND t.movement_type = $${paramCount} `;
            paramCount++;
        }

        if (startDate && endDate) {
            queryParams.push(startDate, endDate);
            queryText += ` AND t.created_at BETWEEN $${paramCount} AND $${paramCount + 1} `;
            paramCount += 2;
        }

        if (search) {
            queryParams.push(`%${search}%`);
            queryText += ` AND (p.product_name ILIKE $${paramCount} OR p.sku ILIKE $${paramCount}) `;
            paramCount++;
        }

        queryText += ` ORDER BY t.created_at DESC `;
        return db.query(queryText, queryParams);
    },

    /**
     * Get Inventory Stock Report (Store scoped)
     */
    getInventoryStockReport: (storeId, filters = {}) => {
        const { startDate, endDate, stockStatus, search } = filters;
        let queryText = `
            SELECT s.id, s.quantity, s.updated_at, p.product_name, p.sku, p.min_stock
            FROM stock_master s
            INNER JOIN product_master p ON s.product_id = p.id
            WHERE s.location_type = 'Store' AND s.location_id = $1 AND p.is_deleted = false
        `;

        const queryParams = [storeId];
        let paramCount = 2;

        if (stockStatus === 'out_of_stock') {
            queryText += ` AND s.quantity = 0 `;
        } else if (stockStatus === 'low_stock') {
            queryText += ` AND s.quantity > 0 AND s.quantity <= p.min_stock `;
        }

        if (startDate && endDate) {
            queryParams.push(startDate, endDate);
            queryText += ` AND s.updated_at BETWEEN $${paramCount} AND $${paramCount + 1} `;
            paramCount += 2;
        }

        if (search) {
            queryParams.push(`%${search}%`);
            queryText += ` AND (p.product_name ILIKE $${paramCount} OR p.sku ILIKE $${paramCount}) `;
            paramCount++;
        }

        queryText += ` ORDER BY p.product_name ASC `;
        return db.query(queryText, queryParams);
    },

    /**
     * Get Inventory Transactions Report (Store scoped)
     */
    getInventoryTransactionsReport: (storeId, filters = {}) => {
        const { startDate, endDate, transactionType, search } = filters;
        let queryText = `
            SELECT t.id, t.movement_type, t.quantity, t.before_qty, t.after_qty, t.created_at, t.notes,
                   p.product_name, p.sku,
                   CASE WHEN t.source_location_type = 'Store' AND t.source_location_id = $1 THEN 'OUT' ELSE 'IN' END as direction
            FROM stock_transactions t
            INNER JOIN product_master p ON t.product_id = p.id
            WHERE ((t.source_location_type = 'Store' AND t.source_location_id = $1)
               OR (t.destination_location_type = 'Store' AND t.destination_location_id = $1))
        `;

        const queryParams = [storeId];
        let paramCount = 2;

        if (transactionType && transactionType !== 'all') {
            queryParams.push(transactionType);
            queryText += ` AND t.movement_type = $${paramCount} `;
            paramCount++;
        }

        if (startDate && endDate) {
            queryParams.push(startDate, endDate);
            queryText += ` AND t.created_at BETWEEN $${paramCount} AND $${paramCount + 1} `;
            paramCount += 2;
        }

        if (search) {
            queryParams.push(`%${search}%`);
            queryText += ` AND (p.product_name ILIKE $${paramCount} OR p.sku ILIKE $${paramCount}) `;
            paramCount++;
        }

        queryText += ` ORDER BY t.created_at DESC `;
        return db.query(queryText, queryParams);
    },

    /**
     * Get Cashier Invoices Report
     */
    getCashierInvoicesReport: (cashierId, filters = {}) => {
        const { startDate, endDate, search } = filters;
        let queryText = `
            SELECT i.id, i.invoice_no, i.grand_total, i.created_at, i.invoice_type,
                   c.name as customer_name, c.phone as customer_phone
            FROM invoice_master i
            LEFT JOIN customer_master c ON i.customer_id = c.id
            WHERE i.cashier_id = $1 
        `;

        const queryParams = [cashierId];
        let paramCount = 2;

        if (startDate && endDate) {
            queryParams.push(startDate, endDate);
            queryText += ` AND i.created_at BETWEEN $${paramCount} AND $${paramCount + 1} `;
            paramCount += 2;
        }

        if (search) {
            queryParams.push(`%${search}%`);
            queryText += ` AND (i.invoice_no ILIKE $${paramCount} OR c.name ILIKE $${paramCount} OR c.phone ILIKE $${paramCount}) `;
            paramCount++;
        }

        queryText += ` ORDER BY i.created_at DESC `;
        return db.query(queryText, queryParams);
    },

    /**
     * Get Cashier Payments Report
     */
    getCashierPaymentsReport: (cashierId, filters = {}) => {
        const { startDate, endDate, search, intakeType } = filters;
        let queryText = `
            SELECT p.id, p.amount, p.payment_status, p.payment_date, p.payment_type, p.transaction_reference,
                   pm.method_name, i.invoice_no
            FROM payment_master p
            LEFT JOIN payment_method_master pm ON p.payment_method_id = pm.id
            LEFT JOIN invoice_master i ON p.invoice_id = i.id
            WHERE p.created_by = $1 
        `;

        const queryParams = [cashierId];
        let paramCount = 2;

        if (startDate && endDate) {
            queryParams.push(startDate, endDate);
            queryText += ` AND p.payment_date BETWEEN $${paramCount} AND $${paramCount + 1} `;
            paramCount += 2;
        }

        if (search) {
            queryParams.push(`%${search}%`);
            queryText += ` AND (i.invoice_no ILIKE $${paramCount} OR p.transaction_reference ILIKE $${paramCount}) `;
            paramCount++;
        }

        queryText += ` ORDER BY p.payment_date DESC `;
        return db.query(queryText, queryParams);
    },

    getStoreProductsReport: async (storeId, filters = {}) => {
        const { startDate, endDate, search, sortBy = 'total_selling' } = filters;
        
        // 1. Get the products performance data
        let queryText = `
            SELECT p.id, p.product_name, p.sku, p.price,
                   COALESCE(SUM(ii.quantity), 0) as total_sold,
                   COALESCE(SUM(ii.total_price), 0) as total_revenue
            FROM product_master p
            INNER JOIN invoice_items ii ON p.id = ii.product_id
            INNER JOIN invoice_master i ON ii.invoice_id = i.id
            WHERE i.store_id = $1 AND p.is_deleted = false
        `;

        const queryParams = [storeId];
        let paramCount = 2;

        if (startDate && endDate) {
            queryParams.push(startDate, endDate);
            queryText += ` AND i.created_at BETWEEN $${paramCount} AND $${paramCount + 1} `;
            paramCount += 2;
        }

        if (search) {
            queryParams.push(`%${search}%`);
            queryText += ` AND (p.product_name ILIKE $${paramCount} OR p.sku ILIKE $${paramCount}) `;
            paramCount++;
        }

        const sortColumn = sortBy === 'top_revenue' ? 'total_revenue' : 'total_sold';
        queryText += ` GROUP BY p.id ORDER BY ${sortColumn} DESC `;
        
        const productsResult = await db.query(queryText, queryParams);

        // 2. Get total active products for the owner of this store
        const countQuery = `
            SELECT COUNT(*) FROM product_master p
            WHERE p.owner_id = (SELECT owner_id FROM store_master WHERE id = $1)
            AND p.is_active = true AND p.is_deleted = false
        `;
        const countResult = await db.query(countQuery, [storeId]);

        return {
            rows: productsResult.rows,
            totalActiveProducts: parseInt(countResult.rows[0].count)
        };
    },

    /**
     * Get Store Invoices Report (All Cashiers)
     */
    getStoreInvoicesReport: (storeId, filters = {}) => {
        const { startDate, endDate, search, cashierId } = filters;
        let queryText = `
            SELECT i.id, i.invoice_no, i.grand_total, i.created_at, i.invoice_type,
                   c.name as customer_name, u.name as cashier_name
            FROM invoice_master i
            LEFT JOIN customer_master c ON i.customer_id = c.id
            LEFT JOIN user_master u ON i.cashier_id = u.id
            WHERE i.store_id = $1
        `;

        const queryParams = [storeId];
        let paramCount = 2;

        if (cashierId && cashierId !== 'all') {
            queryParams.push(cashierId);
            queryText += ` AND i.cashier_id = $${paramCount} `;
            paramCount++;
        }

        if (startDate && endDate) {
            queryParams.push(startDate, endDate);
            queryText += ` AND i.created_at BETWEEN $${paramCount} AND $${paramCount + 1} `;
            paramCount += 2;
        }

        if (search) {
            queryParams.push(`%${search}%`);
            queryText += ` AND (i.invoice_no ILIKE $${paramCount} OR c.name ILIKE $${paramCount} OR u.name ILIKE $${paramCount}) `;
            paramCount++;
        }

        queryText += ` ORDER BY i.created_at DESC `;
        return db.query(queryText, queryParams);
    },

    /**
     * Get Store Payments Report (All Cashiers)
     */
    getStorePaymentsReport: (storeId, filters = {}) => {
        const { startDate, endDate, search, cashierId } = filters;
        let queryText = `
            SELECT p.id, p.amount, p.payment_date, p.payment_type, pm.method_name,
                   i.invoice_no, u.name as cashier_name
            FROM payment_master p
            INNER JOIN invoice_master i ON p.invoice_id = i.id
            LEFT JOIN payment_method_master pm ON p.payment_method_id = pm.id
            LEFT JOIN user_master u ON p.created_by = u.id
            WHERE i.store_id = $1
        `;

        const queryParams = [storeId];
        let paramCount = 2;

        if (cashierId && cashierId !== 'all') {
            queryParams.push(cashierId);
            queryText += ` AND p.created_by = $${paramCount} `;
            paramCount++;
        }

        if (startDate && endDate) {
            queryParams.push(startDate, endDate);
            queryText += ` AND p.payment_date BETWEEN $${paramCount} AND $${paramCount + 1} `;
            paramCount += 2;
        }

        if (search) {
            queryParams.push(`%${search}%`);
            queryText += ` AND (i.invoice_no ILIKE $${paramCount} OR u.name ILIKE $${paramCount}) `;
            paramCount++;
        }

        queryText += ` ORDER BY p.payment_date DESC `;
        return db.query(queryText, queryParams);
    },

    getStoreStaff: (store_id) => {
        const queryText = `
            SELECT u.id, u.name, r.role_name
            FROM user_master u
            INNER JOIN role_master r ON u.role_id = r.id
            WHERE u.store_id = $1 
              AND u.is_deleted = false 
              AND u.is_active = true
              AND r.role_name = 'Cashier'
            ORDER BY u.name ASC
        `;
        return db.query(queryText, [store_id]);
    },

    /**
     * STORE OWNER REPORTS
     */

    /**
     * Get Top Revenue Stores for an owner
     */
    getOwnerTopRevenueStores: (ownerId, filters = {}) => {
        const { startDate, endDate } = filters;
        let queryText = `
            SELECT s.id, s.store_name, s.store_code, s.city,
                   COALESCE(SUM(i.grand_total), 0) as total_revenue,
                   COUNT(i.id) as invoice_count
            FROM store_master s
            LEFT JOIN invoice_master i ON s.id = i.store_id
        `;

        const queryParams = [ownerId];
        queryText += ` WHERE s.owner_id = $1 AND s.is_deleted = false `;
        let paramCount = 2;

        if (startDate && endDate) {
            queryParams.push(startDate, endDate);
            queryText += ` AND (i.created_at BETWEEN $${paramCount} AND $${paramCount + 1} OR i.id IS NULL) `;
            paramCount += 2;
        }

        if (filters.search) {
            queryParams.push(`%${filters.search}%`);
            queryText += ` AND (s.store_name ILIKE $${paramCount} OR s.store_code ILIKE $${paramCount}) `;
            paramCount += 1;
        }

        queryText += ` GROUP BY s.id ORDER BY total_revenue DESC `;
        return db.query(queryText, queryParams);
    },

    /**
     * Get Top Revenue Products for an owner (Across all stores)
     */
    getOwnerTopRevenueProducts: (ownerId, filters = {}) => {
        const { startDate, endDate, search } = filters;
        let queryText = `
            SELECT p.id, p.product_name, p.sku,
                   COALESCE(SUM(ii.total_price), 0) as total_revenue,
                   COALESCE(SUM(ii.quantity), 0) as total_sold
            FROM product_master p
            INNER JOIN invoice_items ii ON p.id = ii.product_id
            INNER JOIN invoice_master i ON ii.invoice_id = i.id
            INNER JOIN store_master s ON i.store_id = s.id
            WHERE s.owner_id = $1 AND p.is_deleted = false
        `;

        const queryParams = [ownerId];
        let paramCount = 2;

        if (startDate && endDate) {
            queryParams.push(startDate, endDate);
            queryText += ` AND i.created_at BETWEEN $${paramCount} AND $${paramCount + 1} `;
            paramCount += 2;
        }

        if (search) {
            queryParams.push(`%${search}%`);
            queryText += ` AND (p.product_name ILIKE $${paramCount} OR p.sku ILIKE $${paramCount}) `;
            paramCount++;
        }

        if (filters.storeId && filters.storeId !== 'all') {
            queryParams.push(filters.storeId);
            queryText += ` AND i.store_id = $${paramCount} `;
            paramCount++;
        }

        queryText += ` GROUP BY p.id ORDER BY total_revenue DESC `;
        return db.query(queryText, queryParams);
    },

    /**
     * Get Top Selling Products for an owner (Across all stores)
     */
    getOwnerTopSellingProducts: (ownerId, filters = {}) => {
        const { startDate, endDate, search } = filters;
        let queryText = `
            SELECT p.id, p.product_name, p.sku,
                   COALESCE(SUM(ii.quantity), 0) as total_sold,
                   COALESCE(SUM(ii.total_price), 0) as total_revenue
            FROM product_master p
            INNER JOIN invoice_items ii ON p.id = ii.product_id
            INNER JOIN invoice_master i ON ii.invoice_id = i.id
            INNER JOIN store_master s ON i.store_id = s.id
            WHERE s.owner_id = $1 AND p.is_deleted = false
        `;

        const queryParams = [ownerId];
        let paramCount = 2;

        if (startDate && endDate) {
            queryParams.push(startDate, endDate);
            queryText += ` AND i.created_at BETWEEN $${paramCount} AND $${paramCount + 1} `;
            paramCount += 2;
        }

        if (search) {
            queryParams.push(`%${search}%`);
            queryText += ` AND (p.product_name ILIKE $${paramCount} OR p.sku ILIKE $${paramCount}) `;
            paramCount++;
        }

        if (filters.storeId && filters.storeId !== 'all') {
            queryParams.push(filters.storeId);
            queryText += ` AND i.store_id = $${paramCount} `;
            paramCount++;
        }

        queryText += ` GROUP BY p.id ORDER BY total_sold DESC `;
        return db.query(queryText, queryParams);
    },

    /**
     * Get Consolidated Stock Report for an owner
     */
    getOwnerStockReport: (ownerId, filters = {}) => {
        const { search, locationId, locationType } = filters;
        let queryText = `
            SELECT p.product_name, p.sku, p.min_stock, p.price, st.quantity, st.location_type, st.location_id,
                   CASE 
                     WHEN st.location_type = 'Store' THEN s.store_name 
                     WHEN st.location_type = 'Warehouse' THEN w.warehouse_name 
                   END as location_name
            FROM stock_master st
            INNER JOIN product_master p ON st.product_id = p.id
            LEFT JOIN store_master s ON st.location_type = 'Store' AND st.location_id = s.id
            LEFT JOIN warehouse_master w ON st.location_type = 'Warehouse' AND st.location_id = w.id
            WHERE (s.owner_id = $1 OR w.owner_id = $1) AND p.is_deleted = false
        `;

        const queryParams = [ownerId];
        let paramCount = 2;

        if (locationId && locationType) {
            queryParams.push(locationId, locationType);
            queryText += ` AND st.location_id = $${paramCount} AND st.location_type = $${paramCount + 1} `;
            paramCount += 2;
        }

        if (search) {
            queryParams.push(`%${search}%`);
            queryText += ` AND (p.product_name ILIKE $${paramCount} OR p.sku ILIKE $${paramCount}) `;
            paramCount++;
        }

        queryText += ` ORDER BY location_name ASC, p.product_name ASC `;
        return db.query(queryText, queryParams);
    },

    /**
     * Get Consolidated Invoices Report for an owner
     */
    getOwnerInvoicesReport: (ownerId, filters = {}) => {
        const { startDate, endDate, search, storeId } = filters;
        let queryText = `
            SELECT i.id, i.invoice_no, i.grand_total, i.created_at, i.invoice_type,
                   c.name as customer_name, s.store_name, u.name as cashier_name
            FROM invoice_master i
            INNER JOIN store_master s ON i.store_id = s.id
            LEFT JOIN customer_master c ON i.customer_id = c.id
            LEFT JOIN user_master u ON i.cashier_id = u.id
            WHERE s.owner_id = $1
        `;

        const queryParams = [ownerId];
        let paramCount = 2;

        if (storeId && storeId !== 'all') {
            queryParams.push(storeId);
            queryText += ` AND i.store_id = $${paramCount} `;
            paramCount++;
        }

        if (startDate && endDate) {
            queryParams.push(startDate, endDate);
            queryText += ` AND i.created_at BETWEEN $${paramCount} AND $${paramCount + 1} `;
            paramCount += 2;
        }

        if (search) {
            queryParams.push(`%${search}%`);
            queryText += ` AND (i.invoice_no ILIKE $${paramCount} OR c.name ILIKE $${paramCount} OR s.store_name ILIKE $${paramCount}) `;
            paramCount++;
        }

        queryText += ` ORDER BY i.created_at DESC `;
        return db.query(queryText, queryParams);
    },

    /**
     * Get Consolidated Payments Report for an owner
     */
    getOwnerPaymentsReport: (ownerId, filters = {}) => {
        const { startDate, endDate, search, storeId } = filters;
        let queryText = `
            SELECT p.id, p.amount, p.payment_date, p.payment_type, pm.method_name,
                   i.invoice_no, s.store_name, u.name as cashier_name
            FROM payment_master p
            INNER JOIN invoice_master i ON p.invoice_id = i.id
            INNER JOIN store_master s ON i.store_id = s.id
            LEFT JOIN payment_method_master pm ON p.payment_method_id = pm.id
            LEFT JOIN user_master u ON p.created_by = u.id
            WHERE s.owner_id = $1
        `;

        const queryParams = [ownerId];
        let paramCount = 2;

        if (storeId && storeId !== 'all') {
            queryParams.push(storeId);
            queryText += ` AND i.store_id = $${paramCount} `;
            paramCount++;
        }

        if (startDate && endDate) {
            queryParams.push(startDate, endDate);
            queryText += ` AND p.payment_date BETWEEN $${paramCount} AND $${paramCount + 1} `;
            paramCount += 2;
        }

        if (search) {
            queryParams.push(`%${search}%`);
            queryText += ` AND (i.invoice_no ILIKE $${paramCount} OR s.store_name ILIKE $${paramCount}) `;
            paramCount++;
        }

        queryText += ` ORDER BY p.payment_date DESC `;
        return db.query(queryText, queryParams);
    },

    /**
     * Get Low Stock Alerts for an owner
     */
    getOwnerLowStockReport: (ownerId, filters = {}) => {
        const { search } = filters;
        let queryText = `
            SELECT p.product_name, p.sku, p.min_stock, st.quantity, st.location_type,
                   CASE 
                     WHEN st.location_type = 'Store' THEN s.store_name 
                     WHEN st.location_type = 'Warehouse' THEN w.warehouse_name 
                   END as location_name
            FROM stock_master st
            INNER JOIN product_master p ON st.product_id = p.id
            LEFT JOIN store_master s ON st.location_type = 'Store' AND st.location_id = s.id
            LEFT JOIN warehouse_master w ON st.location_type = 'Warehouse' AND st.location_id = w.id
            WHERE (s.owner_id = $1 OR w.owner_id = $1)
              AND st.quantity <= p.min_stock AND p.is_deleted = false
        `;

        const queryParams = [ownerId];
        let paramCount = 2;

        if (search) {
            queryParams.push(`%${search}%`);
            queryText += ` AND (p.product_name ILIKE $${paramCount} OR p.sku ILIKE $${paramCount}) `;
            paramCount++;
        }

        queryText += ` ORDER BY st.quantity ASC `;
        return db.query(queryText, queryParams);
    },

    /**
     * Get Locations Overview for an owner
     */
    getOwnerLocations: (ownerId, filters = {}) => {
        let queryText = `
            (SELECT 'Store' as type, id, store_name as name, store_code as code, city as location, is_active
             FROM store_master
             WHERE owner_id = $1 AND is_deleted = false)
            UNION ALL
            (SELECT 'Warehouse' as type, id, warehouse_name as name, warehouse_code as code, location as location, is_active
             FROM warehouse_master
             WHERE owner_id = $1 AND is_deleted = false)
        `;
        const queryParams = [ownerId];
        
        if (filters.search) {
            queryParams.push(`%${filters.search}%`);
            queryText = `
                SELECT * FROM (${queryText}) as combined
                WHERE name ILIKE $2 OR code ILIKE $2
            `;
        }

        queryText += ` ORDER BY type DESC, name ASC `;
        return db.query(queryText, queryParams);
    }
};

module.exports = reportsModel;

const db = require('../../config/database.config');

const invoiceModel = {
    // Create new invoice
    createInvoice: (invoiceData) => {
        const { store_id, invoice_no, cashier_id, customer_id, total_amount, tax_amount,
            discount_amount, grand_total, status, created_by } = invoiceData;
        const query = {
            text: `INSERT INTO invoice_master 
             (store_id, invoice_no, cashier_id, customer_id, total_amount, tax_amount, 
              discount_amount, grand_total, status, created_by, updated_by) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10) RETURNING *`,
            values: [store_id, invoice_no, cashier_id, customer_id, total_amount, tax_amount,
                discount_amount, grand_total, status, created_by]
        };
        return db.query(query);
    },

    // Update invoice
    updateInvoice: (id, invoiceData) => {
        const { total_amount, tax_amount, discount_amount, grand_total, status, updated_by } = invoiceData;
        const query = {
            text: `UPDATE invoice_master 
             SET total_amount = COALESCE($1, total_amount),
                 tax_amount = COALESCE($2, tax_amount),
                 discount_amount = COALESCE($3, discount_amount),
                 grand_total = COALESCE($4, grand_total),
                 status = COALESCE($5, status),
                 updated_by = $6,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $7 AND is_deleted = false RETURNING *`,
            values: [total_amount, tax_amount, discount_amount, grand_total, status, updated_by, id]
        };
        return db.query(query);
    },

    // Soft delete invoice
    deleteInvoice: (id, updated_by) => {
        const query = {
            text: `UPDATE invoice_master 
             SET is_deleted = true, 
                 updated_by = $1, 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 AND is_deleted = false RETURNING *`,
            values: [updated_by, id]
        };
        return db.query(query);
    },

    // Get all invoices
    getAllInvoices: () => {
        const query = {
            text: `SELECT i.*, s.store_name, c.name as customer_name, u.name as cashier_name 
             FROM invoice_master i
             LEFT JOIN store_master s ON i.store_id = s.id
             LEFT JOIN customer_master c ON i.customer_id = c.id
             LEFT JOIN user_master u ON i.cashier_id = u.id
             WHERE i.is_deleted = false 
             ORDER BY i.id DESC`
        };
        return db.query(query);
    },

    // Get invoice by ID
    getInvoiceById: (id) => {
        const query = {
            text: `SELECT i.*, s.store_name, c.name as customer_name, c.phone, u.name as cashier_name 
             FROM invoice_master i
             LEFT JOIN store_master s ON i.store_id = s.id
             LEFT JOIN customer_master c ON i.customer_id = c.id
             LEFT JOIN user_master u ON i.cashier_id = u.id
             WHERE i.id = $1 AND i.is_deleted = false`,
            values: [id]
        };
        return db.query(query);
    },

    // Get invoice by invoice number
    getInvoiceByNumber: (invoice_no) => {
        const query = {
            text: `SELECT * FROM invoice_master 
             WHERE invoice_no = $1 AND is_deleted = false`,
            values: [invoice_no]
        };
        return db.query(query);
    },

    // Get invoices by store
    getInvoicesByStore: (store_id) => {
        const query = {
            text: `SELECT * FROM invoice_master 
             WHERE store_id = $1 AND is_deleted = false 
             ORDER BY id DESC`,
            values: [store_id]
        };
        return db.query(query);
    },

    // Get invoices by customer
    getInvoicesByCustomer: (customer_id) => {
        const query = {
            text: `SELECT * FROM invoice_master 
             WHERE customer_id = $1 AND is_deleted = false 
             ORDER BY id DESC`,
            values: [customer_id]
        };
        return db.query(query);
    },

    // Get invoices by cashier
    getInvoicesByCashier: (cashier_id) => {
        const query = {
            text: `SELECT * FROM invoice_master 
             WHERE cashier_id = $1 AND is_deleted = false 
             ORDER BY id DESC`,
            values: [cashier_id]
        };
        return db.query(query);
    },

    // Get invoices by date range
    getInvoicesByDate: (start_date, end_date) => {
        const query = {
            text: `SELECT * FROM invoice_master 
             WHERE DATE(created_at) BETWEEN $1 AND $2 
               AND is_deleted = false 
             ORDER BY id DESC`,
            values: [start_date, end_date]
        };
        return db.query(query);
    },

    // Get daily sales
    getDailySales: (date) => {
        const query = {
            text: `SELECT COALESCE(SUM(grand_total), 0) as total_sales,
                    COUNT(*) as total_invoices
             FROM invoice_master 
             WHERE DATE(created_at) = $1 AND is_deleted = false`,
            values: [date]
        };
        return db.query(query);
    },

    // Get monthly sales
    getMonthlySales: (year, month) => {
        const query = {
            text: `SELECT COALESCE(SUM(grand_total), 0) as total_sales,
                    COUNT(*) as total_invoices
             FROM invoice_master 
             WHERE EXTRACT(YEAR FROM created_at) = $1 
               AND EXTRACT(MONTH FROM created_at) = $2 
               AND is_deleted = false`,
            values: [year, month]
        };
        return db.query(query);
    },

    // Get yearly sales
    getYearlySales: (year) => {
        const query = {
            text: `SELECT COALESCE(SUM(grand_total), 0) as total_sales,
                    COUNT(*) as total_invoices
             FROM invoice_master 
             WHERE EXTRACT(YEAR FROM created_at) = $1 
               AND is_deleted = false`,
            values: [year]
        };
        return db.query(query);
    }
};

module.exports = invoiceModel;
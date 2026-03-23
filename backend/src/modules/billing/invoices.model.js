const db = require('../../config/database.config');

const invoiceModel = {
    // Create new invoice
    createInvoice: (invoiceData) => {
        const { store_id, invoice_no, cashier_id, customer_id, total_amount, tax_amount,
            discount_amount, round_off, grand_total, invoice_type, created_by } = invoiceData;
        const query = {
            text: `INSERT INTO invoice_master 
             (store_id, invoice_no, cashier_id, customer_id, total_amount, tax_amount, 
              discount_amount, round_off, grand_total, invoice_type, created_by, updated_by) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11) RETURNING *`,
            values: [store_id, invoice_no, cashier_id, customer_id, total_amount, tax_amount,
                discount_amount, round_off, grand_total, invoice_type || 'SALE', created_by]
        };
        return db.query(query);
    },

    // Update invoice
    updateInvoice: (id, invoiceData) => {
        const { total_amount, tax_amount, discount_amount, round_off, grand_total, invoice_type, updated_by } = invoiceData;
        const query = {
            text: `UPDATE invoice_master 
             SET total_amount = COALESCE($1, total_amount),
                 tax_amount = COALESCE($2, tax_amount),
                 discount_amount = COALESCE($3, discount_amount),
                 round_off = COALESCE($4, round_off),
                 grand_total = COALESCE($5, grand_total),
                 invoice_type = COALESCE($6, invoice_type),
                 updated_by = $7,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $8 AND is_deleted = false RETURNING *`,
            values: [total_amount, tax_amount, discount_amount, round_off, grand_total, invoice_type, updated_by, id]
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
    getAllInvoices: (user) => {
        let text = `SELECT i.*, s.store_name, s.store_code, c.name as customer_name, c.phone as customer_phone, u.name as cashier_name 
             FROM invoice_master i
             LEFT JOIN store_master s ON i.store_id = s.id
             LEFT JOIN customer_master c ON i.customer_id = c.id
             LEFT JOIN user_master u ON i.cashier_id = u.id `;
        let values = [];

        if (user && user.role_name === 'Store Owner') {
            text += `WHERE s.owner_id = $1 `;
            values.push(user.id);
        } else if (user && user.role_name !== 'Super Admin') {
            text += `WHERE i.store_id = $1 `;
            values.push(user.store_id);
        }

        text += `ORDER BY i.id DESC`;
        
        const query = { text, values };
        return db.query(query);
    },

    // Get invoice by ID
    getInvoiceById: (id) => {
        const query = {
            text: `SELECT i.*, s.store_name, s.store_code, c.name as customer_name, c.phone, c.address, c.gst_number as customer_gst, u.name as cashier_name 
             FROM invoice_master i
             LEFT JOIN store_master s ON i.store_id = s.id
             LEFT JOIN customer_master c ON i.customer_id = c.id
             LEFT JOIN user_master u ON i.cashier_id = u.id
             WHERE i.id = $1`,
            values: [id]
        };
        return db.query(query);
    },

    // Get invoice by invoice number
    getInvoiceByNumber: (invoice_no) => {
        const query = {
            text: `SELECT * FROM invoice_master 
             WHERE invoice_no = $1`,
            values: [invoice_no]
        };
        return db.query(query);
    },

    // Get invoices by store
    getInvoicesByStore: (store_id) => {
        const query = {
            text: `SELECT i.*, c.name as customer_name, u.name as cashier_name 
             FROM invoice_master i
             LEFT JOIN customer_master c ON i.customer_id = c.id
             LEFT JOIN user_master u ON i.cashier_id = u.id
             WHERE i.store_id = $1 
             ORDER BY i.id DESC`,
            values: [store_id]
        };
        return db.query(query);
    },

    // Get invoices by customer
    getInvoicesByCustomer: (customer_id) => {
        const query = {
            text: `SELECT * FROM invoice_master 
             WHERE customer_id = $1 
             ORDER BY id DESC`,
            values: [customer_id]
        };
        return db.query(query);
    },

    // Get invoices by cashier
    getInvoicesByCashier: (cashier_id) => {
        const query = {
            text: `SELECT * FROM invoice_master 
             WHERE cashier_id = $1 
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
               AND 1=1 
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
             WHERE DATE(created_at) = $1`,
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
             WHERE EXTRACT(YEAR FROM created_at) = $1`,
            values: [year]
        };
        return db.query(query);
    }
};

module.exports = invoiceModel;
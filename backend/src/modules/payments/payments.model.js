const db = require('../../config/database.config');

const paymentModel = {
    // Create new payment
    createPayment: (paymentData) => {
        const { invoice_id, payment_method_id, payment_type, amount, received_amount, change_amount, transaction_reference, payment_status, created_by } = paymentData;
        const query = {
            text: `INSERT INTO payment_master 
             (invoice_id, payment_method_id, payment_type, amount, received_amount, change_amount, transaction_reference, payment_status, created_by) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            values: [invoice_id, payment_method_id, payment_type || 'FULL', amount, received_amount, change_amount, transaction_reference, payment_status || 'COMPLETED', created_by]
        };
        return db.query(query);
    },

    // Update payment status
    updatePaymentStatus: (id, payment_status, updated_by) => {
        const query = {
            text: `UPDATE payment_master 
             SET payment_status = $1, 
                 updated_by = $2, 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $3 RETURNING *`,
            values: [payment_status, updated_by, id]
        };
        return db.query(query);
    },

    getAllPayments: (user) => {
        let text = `SELECT p.*, pm.method_name, i.invoice_no, s.store_name, s.store_code 
             FROM payment_master p
             LEFT JOIN payment_method_master pm ON p.payment_method_id = pm.id
             LEFT JOIN invoice_master i ON p.invoice_id = i.id
             LEFT JOIN store_master s ON i.store_id = s.id `;
        let values = [];

        if (user && user.role_name === 'Store Owner') {
            text += `WHERE s.owner_id = $1 `;
            values.push(user.id);
        } else if (user && user.role_name !== 'Super Admin') {
            text += `WHERE i.store_id = $1 `;
            values.push(user.store_id);
        }

        text += `ORDER BY p.id DESC`;
        
        const query = { text, values };
        return db.query(query);
    },

    // Get payment by ID
    getPaymentById: (id) => {
        const query = {
            text: `SELECT p.*, pm.method_name, i.invoice_no, i.grand_total 
             FROM payment_master p
             LEFT JOIN payment_method_master pm ON p.payment_method_id = pm.id
             LEFT JOIN invoice_master i ON p.invoice_id = i.id
             WHERE p.id = $1`,
            values: [id]
        };
        return db.query(query);
    },

    // Get payments by invoice
    getPaymentsByInvoice: (invoice_id) => {
        const query = {
            text: `SELECT p.*, pm.method_name 
             FROM payment_master p
             LEFT JOIN payment_method_master pm ON p.payment_method_id = pm.id
             WHERE p.invoice_id = $1 
             ORDER BY p.id DESC`,
            values: [invoice_id]
        };
        return db.query(query);
    },

    // Get payments by store (through invoice)
    getPaymentsByStore: (store_id) => {
        const query = {
            text: `SELECT p.*, pm.method_name, i.invoice_no 
             FROM payment_master p
             LEFT JOIN payment_method_master pm ON p.payment_method_id = pm.id
             INNER JOIN invoice_master i ON p.invoice_id = i.id
             WHERE i.store_id = $1 
             ORDER BY p.id DESC`,
            values: [store_id]
        };
        return db.query(query);
    },

    // Get payments by date range
    getPaymentsByDate: (start_date, end_date) => {
        const query = {
            text: `SELECT p.*, pm.method_name, i.invoice_no 
             FROM payment_master p
             LEFT JOIN payment_method_master pm ON p.payment_method_id = pm.id
             LEFT JOIN invoice_master i ON p.invoice_id = i.id
             WHERE DATE(p.payment_date) BETWEEN $1 AND $2 
             ORDER BY p.id DESC`,
            values: [start_date, end_date]
        };
        return db.query(query);
    }
};

module.exports = paymentModel;
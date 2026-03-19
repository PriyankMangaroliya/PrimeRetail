const db = require('../../config/database.config');

const invoiceItemModel = {
    // Add item to invoice
    addInvoiceItem: (itemData) => {
        const { invoice_id, product_id, quantity, price, tax_amount, discount_amount, total_price } = itemData;
        const query = {
            text: `INSERT INTO invoice_items 
             (invoice_id, product_id, quantity, price, tax_amount, discount_amount, total_price) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            values: [invoice_id, product_id, quantity, price, tax_amount, discount_amount, total_price]
        };
        return db.query(query);
    },

    // Update invoice item
    updateInvoiceItem: (id, itemData) => {
        const { quantity, price, tax_amount, discount_amount, total_price } = itemData;
        const query = {
            text: `UPDATE invoice_items 
             SET quantity = COALESCE($1, quantity),
                 price = COALESCE($2, price),
                 tax_amount = COALESCE($3, tax_amount),
                 discount_amount = COALESCE($4, discount_amount),
                 total_price = COALESCE($5, total_price)
             WHERE id = $6 RETURNING *`,
            values: [quantity, price, tax_amount, discount_amount, total_price, id]
        };
        return db.query(query);
    },

    // Delete invoice item
    deleteInvoiceItem: (id) => {
        const query = {
            text: `DELETE FROM invoice_items WHERE id = $1 RETURNING *`,
            values: [id]
        };
        return db.query(query);
    },

    // Get items by invoice
    getItemsByInvoice: (invoice_id) => {
        const query = {
            text: `SELECT i.*, p.product_name, p.sku, p.unit 
             FROM invoice_items i
             INNER JOIN product_master p ON i.product_id = p.id
             WHERE i.invoice_id = $1`,
            values: [invoice_id]
        };
        return db.query(query);
    },

    // Get invoice item by ID
    getInvoiceItemById: (id) => {
        const query = {
            text: `SELECT i.*, p.product_name 
             FROM invoice_items i
             INNER JOIN product_master p ON i.product_id = p.id
             WHERE i.id = $1`,
            values: [id]
        };
        return db.query(query);
    }
};

module.exports = invoiceItemModel;
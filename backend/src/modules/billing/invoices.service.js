const invoiceModel = require('./invoices.model');
const invoiceItemModel = require('./invoiceItems.model');
const stockModel = require('../inventory/stock.model');
const stockTransactionModel = require('../inventory/stockTransactions.model');
const db = require('../../config/database.config');

const invoiceService = {
    // Create new invoice with items
    createInvoice: async (invoiceData) => {
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            const { items, ...invoiceMasterData } = invoiceData;

            // 1. Create Invoice Master
            const invoiceResult = await client.query(
                `INSERT INTO invoice_master 
                 (store_id, invoice_no, cashier_id, customer_id, total_amount, tax_amount, 
                  discount_amount, round_off, grand_total, invoice_type, created_by, updated_by) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11) RETURNING *`,
                [
                    invoiceMasterData.store_id,
                    invoiceMasterData.invoice_no,
                    invoiceMasterData.cashier_id,
                    invoiceMasterData.customer_id,
                    invoiceMasterData.total_amount,
                    invoiceMasterData.tax_amount,
                    invoiceMasterData.discount_amount,
                    invoiceMasterData.round_off || 0,
                    invoiceMasterData.grand_total,
                    invoiceMasterData.invoice_type || 'SALE',
                    invoiceMasterData.created_by
                ]
            );

            const invoiceId = invoiceResult.rows[0].id;

            // 2. Create Invoice Items and Update Stock
            for (const item of items) {
                // Add invoice_id to item
                await client.query(
                    `INSERT INTO invoice_items 
                     (invoice_id, product_id, quantity, unit_price, tax_percentage, tax_amount, discount_amount, final_price, total_price) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                    [
                        invoiceId, 
                        item.product_id, 
                        item.quantity, 
                        item.unit_price, 
                        item.tax_percentage, 
                        item.tax_amount, 
                        item.discount_amount, 
                        item.final_price, 
                        item.total_price
                    ]
                );

                // Update Stock (Decrement)
                const stockResult = await client.query(
                    `SELECT id, quantity FROM stock_master 
                     WHERE product_id = $1 AND location_type = 'Store' AND location_id = $2 AND is_deleted = false`,
                    [item.product_id, invoiceMasterData.store_id]
                );

                if (stockResult.rows.length === 0) {
                    throw new Error(`Stock not found for product ID ${item.product_id} in store ${invoiceMasterData.store_id}`);
                }

                const currentStock = stockResult.rows[0];
                if (currentStock.quantity < item.quantity) {
                    throw new Error(`Insufficient stock for product ID ${item.product_id}`);
                }

                const newQuantity = currentStock.quantity - item.quantity;

                // Update stock master
                await client.query(
                    `UPDATE stock_master SET quantity = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
                    [newQuantity, invoiceMasterData.created_by, currentStock.id]
                );

                // Record stock transaction
                await client.query(
                    `INSERT INTO stock_transactions 
                     (product_id, stock_id, movement_type, source_location_type, source_location_id, 
                      quantity, before_qty, after_qty, reference_type, reference_id, notes, created_by) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                    [
                        item.product_id,
                        currentStock.id,
                        'SELL',
                        'Store',
                        invoiceMasterData.store_id,
                        item.quantity,
                        currentStock.quantity,
                        newQuantity,
                        'Invoice',
                        invoiceId,
                        `Sales Invoice: ${invoiceMasterData.invoice_no}`,
                        invoiceMasterData.created_by
                    ]
                );
            }

            await client.query('COMMIT');
            return invoiceResult.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    // Update invoice status
    updateInvoiceStatus: async (id, status, updated_by) => {
        const result = await invoiceModel.updateInvoice(id, { status, updated_by });
        if (result.rows.length === 0) {
            throw new Error('Invoice not found');
        }
        return result.rows[0];
    },

    // Get all invoices
    getAllInvoices: async (user) => {
        const result = await invoiceModel.getAllInvoices(user);
        return result.rows;
    },

    // Get invoice by ID
    getInvoiceById: async (id) => {
        const result = await invoiceModel.getInvoiceById(id);
        if (result.rows.length === 0) {
            throw new Error('Invoice not found');
        }
        
        // Get items for this invoice
        const itemsResult = await invoiceItemModel.getItemsByInvoice(id);
        
        return {
            ...result.rows[0],
            items: itemsResult.rows
        };
    },

    // Get invoices by store
    getInvoicesByStore: async (store_id) => {
        const result = await invoiceModel.getInvoicesByStore(store_id);
        return result.rows;
    },

    // Get invoices by date range
    getInvoicesByDate: async (start_date, end_date) => {
        const result = await invoiceModel.getInvoicesByDate(start_date, end_date);
        return result.rows;
    },

    // Get sales summary
    getSalesSummary: async (period, dateParams) => {
        let result;
        if (period === 'daily') {
            result = await invoiceModel.getDailySales(dateParams.date);
        } else if (period === 'monthly') {
            result = await invoiceModel.getMonthlySales(dateParams.year, dateParams.month);
        } else if (period === 'yearly') {
            result = await invoiceModel.getYearlySales(dateParams.year);
        }
        return result.rows[0];
    }
};

module.exports = invoiceService;

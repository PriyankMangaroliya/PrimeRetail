const paymentModel = require('./payments.model');
const invoiceModel = require('../billing/invoices.model');

const paymentService = {
    // Create new payment
    createPayment: async (paymentData) => {
        const { invoice_id, amount, payment_status } = paymentData;

        // 1. Check if invoice exists
        const invoiceResult = await invoiceModel.getInvoiceById(invoice_id);
        if (invoiceResult.rows.length === 0) {
            throw new Error('Invoice not found');
        }

        const invoice = invoiceResult.rows[0];

        // 2. Create the payment
        const result = await paymentModel.createPayment(paymentData);

        // 3. If payment is completed, potential logic to update invoice status
        // (Though usually invoices are created as 'Paid' or 'Pending' and payment is a separate record)
        if (payment_status === 'Completed') {
            // Update invoice status if it was pending
            if (invoice.status === 'Pending') {
                await invoiceModel.updateInvoice(invoice_id, { status: 'Paid', updated_by: paymentData.created_by });
            }
        }

        return result.rows[0];
    },

    // Update payment status
    updatePaymentStatus: async (id, status, updated_by) => {
        const result = await paymentModel.updatePaymentStatus(id, status, updated_by);
        if (result.rows.length === 0) {
            throw new Error('Payment record not found');
        }
        return result.rows[0];
    },

    // Get all payments
    getAllPayments: async () => {
        const result = await paymentModel.getAllPayments();
        return result.rows;
    },

    // Get payment by ID
    getPaymentById: async (id) => {
        const result = await paymentModel.getPaymentById(id);
        if (result.rows.length === 0) {
            throw new Error('Payment record not found');
        }
        return result.rows[0];
    },

    // Get payments by invoice
    getPaymentsByInvoice: async (invoice_id) => {
        const result = await paymentModel.getPaymentsByInvoice(invoice_id);
        return result.rows;
    },

    // Get payments by store
    getPaymentsByStore: async (store_id) => {
        const result = await paymentModel.getPaymentsByStore(store_id);
        return result.rows;
    },

    // Get payments by date range
    getPaymentsByDate: async (start_date, end_date) => {
        const result = await paymentModel.getPaymentsByDate(start_date, end_date);
        return result.rows;
    }
};

module.exports = paymentService;

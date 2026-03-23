import axios from './axios';

const billingApi = {
    createInvoice: (invoiceData) => axios.post('/billing', invoiceData),
    getAllInvoices: () => axios.get('/billing'),
    getInvoiceById: (id) => axios.get(`/billing/${id}`),
    getInvoicesByStore: (storeId) => axios.get(`/billing/store/${storeId}`),
    getInvoicesByDate: (startDate, endDate) => axios.get('/billing/date-range', { params: { start_date: startDate, end_date: endDate } }),
    getSalesSummary: (period, params) => axios.get(`/billing/summary/${period}`, { params })
};

export default billingApi;

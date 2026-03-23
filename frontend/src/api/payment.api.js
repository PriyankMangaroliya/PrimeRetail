import axios from './axios';

const paymentApi = {
    createPayment: (paymentData) => axios.post('/payments', paymentData),
    getAllPayments: () => axios.get('/payments'),
    getPaymentById: (id) => axios.get(`/payments/${id}`),
    getPaymentsByInvoice: (invoiceId) => axios.get(`/payments/invoice/${invoiceId}`),
    getPaymentsByStore: (storeId) => axios.get(`/payments/store/${storeId}`),
    updatePaymentStatus: (id, statusData) => axios.put(`/payments/${id}/status`, statusData)
};

export default paymentApi;

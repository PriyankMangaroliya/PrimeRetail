import axios from './axios';

const customerApi = {
    createCustomer: async (customerData) => {
        const response = await axios.post('/customers', customerData);
        return response.data;
    },
    updateCustomer: async (id, customerData) => {
        const response = await axios.put(`/customers/${id}`, customerData);
        return response.data;
    },
    deleteCustomer: async (id, updatedBy) => {
        const response = await axios.delete(`/customers/${id}`, { data: { updated_by: updatedBy } });
        return response.data;
    },
    getAllCustomers: async () => {
        const response = await axios.get('/customers');
        return response.data;
    },
    getCustomerById: async (id) => {
        const response = await axios.get(`/customers/${id}`);
        return response.data;
    },
    getCustomerByPhone: async (phone) => {
        const response = await axios.get(`/customers/phone/${phone}`);
        return response.data;
    }
};

export default customerApi;

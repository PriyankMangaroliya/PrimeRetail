const customerService = require('./customer.service');
const responseUtils = require('../../utils/response.utils');

const customerController = {
    // Create new customer
    createCustomer: async (req, res) => {
        try {
            // Check if customer already exists with the same phone
            const existingCustomer = await customerService.getCustomerByPhone(req.body.phone);
            if (existingCustomer) {
                return responseUtils.conflict(res, 'Customer with this phone number already exists');
            }

            const customer = await customerService.createCustomer({
                ...req.body,
                created_by: req.user.id
            });
            return responseUtils.success(res, 201, 'Customer created successfully', customer);
        } catch (error) {
            console.error('Create Customer Error:', error);
            return responseUtils.error(res, 500, error.message);
        }
    },

    // Update customer
    updateCustomer: async (req, res) => {
        try {
            const customer = await customerService.updateCustomer(req.params.id, {
                ...req.body,
                updated_by: req.user.id
            });
            if (!customer) {
                return responseUtils.notFound(res, 'Customer not found');
            }
            return responseUtils.success(res, 200, 'Customer updated successfully', customer);
        } catch (error) {
            console.error('Update Customer Error:', error);
            return responseUtils.error(res, 500, error.message);
        }
    },

    // Delete customer
    deleteCustomer: async (req, res) => {
        try {
            const customer = await customerService.deleteCustomer(req.params.id, req.user.id);
            if (!customer) {
                return responseUtils.notFound(res, 'Customer not found');
            }
            return responseUtils.success(res, 200, 'Customer deleted successfully');
        } catch (error) {
            console.error('Delete Customer Error:', error);
            return responseUtils.error(res, 500, error.message);
        }
    },

    // Get all customers
    getAllCustomers: async (req, res) => {
        try {
            const customers = await customerService.getAllCustomers();
            return responseUtils.success(res, 200, 'Customers retrieved successfully', customers);
        } catch (error) {
            console.error('Get All Customers Error:', error);
            return responseUtils.error(res, 500, error.message);
        }
    },

    // Get customer by ID
    getCustomerById: async (req, res) => {
        try {
            const customer = await customerService.getCustomerById(req.params.id);
            if (!customer) {
                return responseUtils.notFound(res, 'Customer not found');
            }
            return responseUtils.success(res, 200, 'Customer retrieved successfully', customer);
        } catch (error) {
            console.error('Get Customer By ID Error:', error);
            return responseUtils.error(res, 500, error.message);
        }
    },

    // Get customer by phone
    getCustomerByPhone: async (req, res) => {
        try {
            const customer = await customerService.getCustomerByPhone(req.params.phone);
            if (!customer) {
                return responseUtils.notFound(res, 'Customer not found');
            }
            return responseUtils.success(res, 200, 'Customer retrieved successfully', customer);
        } catch (error) {
            console.error('Get Customer By Phone Error:', error);
            return responseUtils.error(res, 500, error.message);
        }
    }
};

module.exports = customerController;

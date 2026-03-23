const express = require('express');
const router = express.Router();
const customerController = require('./customer.controller');
const customerValidation = require('./customer.validation');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { hasRole } = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');

// All customer routes are protected
router.use(verifyToken);

router.post('/',
    hasRole(['Store Owner', 'Store Manager', 'Cashier']),
    validate(customerValidation.createCustomer),
    customerController.createCustomer
);

router.get('/',
    customerController.getAllCustomers
);

router.get('/:id',
    validate(customerValidation.customerIdParam, 'params'),
    customerController.getCustomerById
);

router.get('/phone/:phone',
    validate(customerValidation.customerPhoneParam, 'params'),
    customerController.getCustomerByPhone
);

router.put('/:id',
    validate(customerValidation.customerIdParam, 'params'),
    validate(customerValidation.updateCustomer),
    customerController.updateCustomer
);

router.delete('/:id',
    validate(customerValidation.customerIdParam, 'params'),
    customerController.deleteCustomer
);

module.exports = router;

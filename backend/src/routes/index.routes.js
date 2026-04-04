const express = require('express');
const router = express.Router();
const responseUtils = require('../utils/response.utils');

// Import all module routes
const authRoutes = require('../modules/auth/auth.routes');
const dashboardRoutes = require('../modules/dashboard/dashboard.routes');
const discountRoutes = require('../modules/discounts/discounts.routes');
const paymentMethodRoutes = require('../modules/paymentMethods/paymentMethods.routes');
const categoryRoutes = require('../modules/products/categories.routes');
const productRoutes = require('../modules/products/products.routes');
const roleRoutes = require('../modules/roles/roles.routes');
const storeOwnerRoutes = require('../modules/storeOwners/storeOwners.routes');
const storeRoutes = require('../modules/stores/stores.routes');
const taxRoutes = require('../modules/taxes/taxes.routes');
const storeTaxRoutes = require('../modules/taxes/storeTaxes.routes');
const userRoutes = require('../modules/users/users.routes');
const warehouseRoutes = require('../modules/warehouses/warehouses.routes');
const stockRoutes = require('../modules/inventory/stock.routes');
const stockTransactionRoutes = require('../modules/inventory/stockTransactions.routes');
const customerRoutes = require('../modules/customers/customer.routes');
const billingRoutes = require('../modules/billing/invoices.routes');
const paymentRoutes = require('../modules/payments/payments.routes');
const reportsRoutes = require('../modules/reports/reports.routes');

// Use routes
router.use('/Auth', authRoutes);
router.use('/Dashboard', dashboardRoutes);
router.use('/discounts', discountRoutes);
router.use('/payment-methods', paymentMethodRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/roles', roleRoutes);
router.use('/store-owners', storeOwnerRoutes);
router.use('/stores', storeRoutes);
router.use('/taxes', taxRoutes);
router.use('/owner-taxes', storeTaxRoutes);
router.use('/employees', userRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/inventory/stock', stockRoutes);
router.use('/inventory/transactions', stockTransactionRoutes);
router.use('/customers', customerRoutes);
router.use('/billing', billingRoutes);
router.use('/payments', paymentRoutes);
router.use('/reports', reportsRoutes);

// Health check route using ResponseUtils
router.get('/health', (req, res) => {
    return responseUtils.success(res, 200, 'Server is healthy', {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API info route
router.get('/info', (req, res) => {
    return responseUtils.success(res, 200, 'API Information', {
        name: 'Retail Management System API',
        version: '1.0.0',
        description: 'Backend API for Retail Management System',
        endpoints: {
            auth: '/api/v1/Auth',
            dashboard: '/api/v1/Dashboard',
            roles: '/api/v1/roles',
            storeOwners: '/api/v1/store-owners',
            stores: '/api/v1/stores',
            warehouses: '/api/v1/warehouses',
            taxes: '/api/v1/taxes',
            storeTaxes: '/api/v1/owner-taxes',
            paymentMethods: '/api/v1/payment-methods',
            employees: '/api/v1/employees',
            categories: '/api/v1/categories',
            products: '/api/v1/products',
            discounts: '/api/v1/discounts',
            customers: '/api/v1/customers',
            billing: '/api/v1/billing',
            payments: '/api/v1/payments',
            reports: '/api/v1/reports',
            health: '/api/v1/health'
        }
    });
});

module.exports = router;
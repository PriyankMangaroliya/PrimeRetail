const express = require('express');
const router = express.Router();
const reportsController = require('./reports.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

// All report routes require authentication
router.use(authMiddleware.verifyToken);

/**
 * Super Admin Reports
 */
router.get('/super-admin/store-owners', roleMiddleware.hasRole(['Super Admin']), reportsController.getStoreOwnersReport);
router.get('/super-admin/stores', roleMiddleware.hasRole(['Super Admin']), reportsController.getStoresReport);
router.get('/super-admin/warehouses', roleMiddleware.hasRole(['Super Admin']), reportsController.getWarehousesReport);
router.get('/super-admin/roles', roleMiddleware.hasRole(['Super Admin']), reportsController.getRolesReport);
router.get('/super-admin/taxes', roleMiddleware.hasRole(['Super Admin']), reportsController.getTaxesReport);
router.get('/super-admin/payment-methods', roleMiddleware.hasRole(['Super Admin']), reportsController.getPaymentMethodsReport);
/**
 * Warehouse Staff Reports
 */
router.get('/warehouse-staff/stock', roleMiddleware.hasRole(['Warehouse Staff']), reportsController.getWarehouseStockReport);
router.get('/warehouse-staff/transactions', roleMiddleware.hasRole(['Warehouse Staff']), reportsController.getWarehouseTransactionsReport);

/**
 * Inventory Staff Reports
 */
router.get('/inventory-staff/stock', roleMiddleware.hasRole(['Inventory Staff']), reportsController.getInventoryStockReport);
router.get('/inventory-staff/transactions', roleMiddleware.hasRole(['Inventory Staff']), reportsController.getInventoryTransactionsReport);

/**
 * Store Manager Reports
 */
router.get('/store-manager/products', roleMiddleware.hasRole(['Store Manager']), reportsController.getStoreProductsReport);
router.get('/store-manager/stock', roleMiddleware.hasRole(['Store Manager']), reportsController.getInventoryStockReport);
router.get('/store-manager/transactions', roleMiddleware.hasRole(['Store Manager']), reportsController.getInventoryTransactionsReport);
router.get('/store-manager/invoices', roleMiddleware.hasRole(['Store Manager']), reportsController.getStoreInvoicesReport);
router.get('/store-manager/payments', roleMiddleware.hasRole(['Store Manager']), reportsController.getStorePaymentsReport);
router.get('/store-manager/staff', roleMiddleware.hasRole(['Store Manager']), reportsController.getStoreStaff);

/**
 * Cashier Reports
 */
router.get('/cashier/invoices', roleMiddleware.hasRole(['Cashier']), reportsController.getCashierInvoicesReport);
router.get('/cashier/payments', roleMiddleware.hasRole(['Cashier']), reportsController.getCashierPaymentsReport);

/**
 * Store Owner Reports
 */
router.get('/store-owner/top-revenue-stores', roleMiddleware.hasRole(['Store Owner']), reportsController.getOwnerTopRevenueStores);
router.get('/store-owner/top-revenue-products', roleMiddleware.hasRole(['Store Owner']), reportsController.getOwnerTopRevenueProducts);
router.get('/store-owner/top-selling-products', roleMiddleware.hasRole(['Store Owner']), reportsController.getOwnerTopSellingProducts);
router.get('/store-owner/stock', roleMiddleware.hasRole(['Store Owner']), reportsController.getOwnerStockReport);
router.get('/store-owner/invoices', roleMiddleware.hasRole(['Store Owner']), reportsController.getOwnerInvoicesReport);
router.get('/store-owner/payments', roleMiddleware.hasRole(['Store Owner']), reportsController.getOwnerPaymentsReport);
router.get('/store-owner/low-stock', roleMiddleware.hasRole(['Store Owner']), reportsController.getOwnerLowStockReport);
router.get('/store-owner/locations', roleMiddleware.hasRole(['Store Owner']), reportsController.getOwnerLocations);

module.exports = router;

const express = require('express');
const router = express.Router();
const stockTransactionController = require('./stockTransactions.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

// All stock transaction routes are protected
router.use(authMiddleware.verifyToken);

// Create stock transaction
router.post('/', roleMiddleware.hasRole(['Store Owner', 'Store Manager', 'Warehouse Staff', 'Inventory Staff', 'Cashier']), stockTransactionController.createStockTransaction);

// Get all transactions
router.get('/', roleMiddleware.hasRole(['Store Owner', 'Store Manager', 'Warehouse Staff', 'Inventory Staff', 'Cashier']), stockTransactionController.getAllStockTransactions);

// Get by product
router.get('/product/:product_id', stockTransactionController.getTransactionsByProduct);

// Get by reference
router.get('/reference', stockTransactionController.getTransactionsByReference);

// Get by ID
router.get('/:id', stockTransactionController.getTransactionById);

module.exports = router;

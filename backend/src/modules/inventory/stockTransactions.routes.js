const express = require('express');
const router = express.Router();
const stockTransactionController = require('./stockTransactions.controller');
const { protect, authorize } = require('../../middlewares/auth.middleware');

// All stock transaction routes are protected
router.use(protect);

// Create stock transaction
router.post('/', authorize('Store Owner', 'Store Manager', 'Warehouse Staff', 'Inventory Staff'), stockTransactionController.createStockTransaction);

// Get all transactions (Store Owner / Manager)
router.get('/', authorize('Store Owner', 'Store Manager'), stockTransactionController.getAllStockTransactions);

// Get by product
router.get('/product/:product_id', stockTransactionController.getTransactionsByProduct);

// Get by reference
router.get('/reference', stockTransactionController.getTransactionsByReference);

// Get by ID
router.get('/:id', stockTransactionController.getTransactionById);

module.exports = router;

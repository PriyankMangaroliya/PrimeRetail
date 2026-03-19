const express = require('express');
const router = express.Router();
const stockController = require('./stock.controller');
const { protect, authorize } = require('../../middlewares/auth.middleware');

// All stock routes are protected
router.use(protect);

// Create stock entry (Store Owner/Warehouse Manager)
router.post('/', authorize('Store Owner', 'Warehouse Staff'), stockController.createStock);

// Get low stock products
router.get('/low-stock', stockController.getLowStockProducts);

// Get stock by ID
router.get('/:id', stockController.getStockById);

// Update stock quantity
router.patch('/:id/quantity', authorize('Store Owner', 'Store Manager', 'Warehouse Staff', 'Inventory Staff'), stockController.updateStockQuantity);

// Delete stock entry
router.delete('/:id', authorize('Store Owner', 'Warehouse Staff'), stockController.deleteStock);

// Get stock by store
router.get('/store/:store_id', stockController.getStockByStore);

// Get stock by warehouse
router.get('/warehouse/:warehouse_id', stockController.getStockByWarehouse);

module.exports = router;

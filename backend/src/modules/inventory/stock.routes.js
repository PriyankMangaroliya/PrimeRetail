const express = require('express');
const router = express.Router();
const stockController = require('./stock.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

// All stock routes are protected
router.use(authMiddleware.verifyToken);

// Create stock entry (Store Owner/Warehouse Manager)
router.post('/', roleMiddleware.hasRole(['Store Owner', 'Warehouse Staff']), stockController.createStock);

// Get all stock (role-based mapped)
router.get('/', stockController.getAllStock);

// Get all active locations for owner (Stores & Warehouses)
router.get('/active-locations', stockController.getActiveLocations);

// Get low stock products
router.get('/low-stock', stockController.getLowStockProducts);

// Get stock by ID
router.get('/:id', stockController.getStockById);

// Update stock quantity
router.patch('/:id/quantity', roleMiddleware.hasRole(['Store Owner', 'Store Manager', 'Warehouse Staff', 'Inventory Staff']), stockController.updateStockQuantity);

// Delete stock entry
router.delete('/:id', roleMiddleware.hasRole(['Store Owner', 'Warehouse Staff']), stockController.deleteStock);

// Get stock by store
router.get('/store/:store_id', stockController.getStockByStore);

// Get stock by warehouse
router.get('/warehouse/:warehouse_id', stockController.getStockByWarehouse);

module.exports = router;

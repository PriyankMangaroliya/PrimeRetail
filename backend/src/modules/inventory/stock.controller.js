const stockService = require('./stock.service');
const stockValidation = require('./stock.validation');
const responseUtils = require('../../utils/response.utils');

const stockController = {
    // Create new stock entry
    createStock: async (req, res) => {
        try {
            const stockData = {
                ...req.body,
                created_by: req.user.id
            };

            // Inject location data for restricted staff
            if (req.user.role_name === 'Warehouse Staff') {
                stockData.location_type = 'Warehouse';
                stockData.location_id = req.user.warehouse_id;
                
                if (!stockData.location_id) {
                    return responseUtils.badRequest(res, 'Warehouse ID missing for user');
                }
            } else if (['Store Owner', 'Store Manager'].includes(req.user.role_name)) {
                // Keep frontend-sent location if privileged
                if (!stockData.location_type || !stockData.location_id) {
                    // It will fail Joi validation below anyway
                }
            }

            // Validate request body
            const { error, value } = stockValidation.createStock.validate(stockData);
            if (error) {
                return responseUtils.validationError(res, 'Validation failed', error.details);
            }

            const stock = await stockService.createStock(value);

            return responseUtils.created(res, 'Stock entry created successfully', stock);
        } catch (error) {
            console.error('Create Stock Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to create stock entry');
        }
    },

    // Get all stock (role-based)
    getAllStock: async (req, res) => {
        try {
            const stock = await stockService.getAllStock(req.user);
            return responseUtils.success(res, 200, 'Stock retrieved successfully', stock);
        } catch (error) {
            console.error('Get All Stock Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve stock');
        }
    },

    // Update stock quantity
    updateStockQuantity: async (req, res) => {
        try {
            const { id } = req.params;
            const { quantity } = req.body;

            // Validate ID param
            const { error: paramError } = stockValidation.stockIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid stock ID', paramError.details);
            }

            // Validate quantity
            const { error, value } = stockValidation.updateStockQuantity.validate({
                quantity,
                updated_by: req.user.id
            });
            if (error) {
                return responseUtils.validationError(res, 'Validation failed', error.details);
            }

            const stock = await stockService.updateStockQuantity(id, value.quantity, value.updated_by);

            return responseUtils.success(res, 200, 'Stock quantity updated successfully', stock);
        } catch (error) {
            console.error('Update Stock Quantity Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to update stock quantity');
        }
    },

    // Delete stock
    deleteStock: async (req, res) => {
        try {
            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = stockValidation.stockIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid stock ID', paramError.details);
            }

            // Verify access ownership
            const existingStock = await stockService.getStockById(id);
            if (req.user.role_name === 'Warehouse Staff' && 
               (existingStock.location_type !== 'Warehouse' || existingStock.location_id !== req.user.warehouse_id)) {
                return responseUtils.forbidden(res, 'Unauthorized to delete stock from this location');
            }

            const updatedBy = req.user.id;
            const stock = await stockService.deleteStock(id, updatedBy);

            return responseUtils.success(res, 200, 'Stock entry deleted successfully', stock);
        } catch (error) {
            console.error('Delete Stock Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to delete stock entry');
        }
    },

    // Get stock by ID
    getStockById: async (req, res) => {
        try {
            const { id } = req.params;

            const { error: paramError } = stockValidation.stockIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid stock ID', paramError.details);
            }

            const stock = await stockService.getStockById(id);
            return responseUtils.success(res, 200, 'Stock entry retrieved successfully', stock);
        } catch (error) {
            console.error('Get Stock By ID Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to retrieve stock entry');
        }
    },

    // Get stock by store
    getStockByStore: async (req, res) => {
        try {
            const { store_id } = req.params;

            const { error: paramError } = stockValidation.storeIdQuery.validate({ store_id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid store ID', paramError.details);
            }

            const stock = await stockService.getStockByStore(store_id);
            return responseUtils.success(res, 200, 'Store stock retrieved successfully', stock);
        } catch (error) {
            console.error('Get Stock By Store Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve store stock');
        }
    },

    // Get stock by warehouse
    getStockByWarehouse: async (req, res) => {
        try {
            const { warehouse_id } = req.params;

            const { error: paramError } = stockValidation.warehouseIdQuery.validate({ warehouse_id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid warehouse ID', paramError.details);
            }

            const stock = await stockService.getStockByWarehouse(warehouse_id);
            return responseUtils.success(res, 200, 'Warehouse stock retrieved successfully', stock);
        } catch (error) {
            console.error('Get Stock By Warehouse Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve warehouse stock');
        }
    },

    // Get low stock products
    getLowStockProducts: async (req, res) => {
        try {
            const { threshold } = req.query;

            const { error, value } = stockValidation.lowStockQuery.validate({ threshold });
            if (error) {
                return responseUtils.validationError(res, 'Invalid threshold', error.details);
            }

            const stock = await stockService.getLowStockProducts(value.threshold);
            return responseUtils.success(res, 200, 'Low stock products retrieved successfully', stock);
        } catch (error) {
            console.error('Get Low Stock Products Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve low stock products');
        }
    },

    // Get all active locations (Stores and Warehouses) for an owner
    getActiveLocations: async (req, res) => {
        try {
            const locations = await stockService.getActiveLocations(req.user);
            return responseUtils.success(res, 200, 'Active locations retrieved successfully', locations);
        } catch (error) {
            console.error('Get Active Locations Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve active locations');
        }
    }
};

module.exports = stockController;

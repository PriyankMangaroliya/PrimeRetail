const stockTransactionService = require('./stockTransactions.service');
const stockTransactionValidation = require('./stockTransactions.validation');
const responseUtils = require('../../utils/response.utils');

const stockTransactionController = {
    // Create new stock transaction
    createStockTransaction: async (req, res) => {
        try {
            // Validate request body
            const { error, value } = stockTransactionValidation.createStockTransaction.validate({
                ...req.body,
                created_by: req.user.id
            });
            if (error) {
                return responseUtils.validationError(res, 'Validation failed', error.details);
            }

            const transaction = await stockTransactionService.createStockTransaction(value, req.user);

            return responseUtils.created(res, 'Stock transaction created successfully', transaction);
        } catch (error) {
            console.error('Create Stock Transaction Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }
            if (error.message.includes('Insufficient stock')) {
                return responseUtils.badRequest(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to create stock transaction');
        }
    },

    // Get all stock transactions
    getAllStockTransactions: async (req, res) => {
        try {
            const transactions = await stockTransactionService.getAllStockTransactions(req.user);
            return responseUtils.success(res, 200, 'Stock transactions retrieved successfully', transactions);
        } catch (error) {
            console.error('Get All Stock Transactions Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve stock transactions');
        }
    },

    // Get transaction by ID
    getTransactionById: async (req, res) => {
        try {
            const { id } = req.params;

            const { error: paramError } = stockTransactionValidation.transactionIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid transaction ID', paramError.details);
            }

            const transaction = await stockTransactionService.getTransactionById(id);
            return responseUtils.success(res, 200, 'Stock transaction retrieved successfully', transaction);
        } catch (error) {
            console.error('Get Transaction By ID Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to retrieve stock transaction');
        }
    },

    // Get transactions by product
    getTransactionsByProduct: async (req, res) => {
        try {
            const { product_id } = req.params;

            const { error: paramError } = stockTransactionValidation.productIdQuery.validate({ product_id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid product ID', paramError.details);
            }

            const transactions = await stockTransactionService.getTransactionsByProduct(product_id);
            return responseUtils.success(res, 200, 'Product transactions retrieved successfully', transactions);
        } catch (error) {
            console.error('Get Transactions By Product Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve product transactions');
        }
    },

    // Get transactions by reference
    getTransactionsByReference: async (req, res) => {
        try {
            const { type, id } = req.query;

            const { error, value } = stockTransactionValidation.referenceQuery.validate({
                reference_type: type,
                reference_id: id
            });
            if (error) {
                return responseUtils.validationError(res, 'Invalid reference', error.details);
            }

            const transactions = await stockTransactionService.getTransactionsByReference(value.reference_type, value.reference_id);
            return responseUtils.success(res, 200, 'Reference transactions retrieved successfully', transactions);
        } catch (error) {
            console.error('Get Transactions By Reference Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve transactions');
        }
    }
};

module.exports = stockTransactionController;

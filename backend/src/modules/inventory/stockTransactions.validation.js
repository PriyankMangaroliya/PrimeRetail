const Joi = require('joi');

const stockTransactionValidation = {
    // Create stock transaction validation
    createStockTransaction: Joi.object({
        product_id: Joi.number().integer().positive().required().messages({
            'number.integer': 'Product ID must be an integer',
            'number.positive': 'Product ID must be a positive number',
            'any.required': 'Product ID is required'
        }),
        stock_id: Joi.number().integer().positive().required().messages({
            'any.required': 'Stock ID is required'
        }),
        movement_type: Joi.string().trim().valid('Transfer', 'Add', 'Remove', 'Damaged').required().messages({
            'any.only': 'Invalid movement type',
            'any.required': 'Movement type is required'
        }),
        source_location_type: Joi.string().trim().valid('Store', 'Warehouse').allow(null).optional(),
        source_location_id: Joi.number().integer().positive().allow(null).optional(),
        destination_location_type: Joi.string().trim().valid('Store', 'Warehouse').allow(null).optional(),
        destination_location_id: Joi.number().integer().positive().allow(null).optional(),
        quantity: Joi.number().integer().min(1).required().messages({
            'number.min': 'Quantity must be at least 1',
            'any.required': 'Quantity is required'
        }),
        reference_type: Joi.string().trim().max(50).allow(null).optional(),
        reference_id: Joi.number().integer().positive().allow(null).optional(),
        notes: Joi.string().trim().max(500).allow(null, '').optional(),
        created_by: Joi.number().integer().positive().required().messages({
            'any.required': 'Creator ID is required'
        })
    }).custom((value, helpers) => {
        // For transfer, both source and destination are required
        if (value.movement_type === 'Transfer') {
            if (!value.source_location_type || !value.source_location_id ||
                !value.destination_location_type || !value.destination_location_id) {
                return helpers.message('Transfer requires both source and destination locations');
            }
        }
        return value;
    }),

    // Transaction ID param validation
    transactionIdParam: Joi.object({
        id: Joi.number().integer().positive().required().messages({
            'number.integer': 'Transaction ID must be an integer',
            'number.positive': 'Transaction ID must be a positive number',
            'any.required': 'Transaction ID is required',
            'number.base': 'Invalid Transaction ID format'
        })
    }),

    // Product ID query validation
    productIdQuery: Joi.object({
        product_id: Joi.number().integer().positive().required().messages({
            'any.required': 'Product ID is required'
        })
    }),

    // Location query validation
    locationQuery: Joi.object({
        location_type: Joi.string().trim().valid('Store', 'Warehouse').required().messages({
            'any.only': 'Location type must be either Store or Warehouse',
            'any.required': 'Location type is required'
        }),
        location_id: Joi.number().integer().positive().required().messages({
            'any.required': 'Location ID is required'
        })
    }),

    // Reference query validation
    referenceQuery: Joi.object({
        reference_type: Joi.string().trim().max(50).required().messages({
            'any.required': 'Reference type is required'
        }),
        reference_id: Joi.number().integer().positive().required().messages({
            'any.required': 'Reference ID is required'
        })
    })
};

module.exports = stockTransactionValidation;
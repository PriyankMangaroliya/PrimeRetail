const Joi = require('joi');

const stockValidation = {
    // Create stock validation
    createStock: Joi.object({
        product_id: Joi.number().integer().positive().required().messages({
            'number.integer': 'Product ID must be an integer',
            'number.positive': 'Product ID must be a positive number',
            'any.required': 'Product ID is required'
        }),
        location_type: Joi.string().trim().valid('Store', 'Warehouse').required().messages({
            'any.only': 'Location type must be either Store or Warehouse',
            'any.required': 'Location type is required'
        }),
        location_id: Joi.number().integer().positive().required().messages({
            'number.integer': 'Location ID must be an integer',
            'number.positive': 'Location ID must be a positive number',
            'any.required': 'Location ID is required'
        }),
        quantity: Joi.number().integer().min(0).required().messages({
            'number.integer': 'Quantity must be an integer',
            'number.min': 'Quantity cannot be negative',
            'any.required': 'Quantity is required'
        }),
        created_by: Joi.number().integer().positive().required().messages({
            'any.required': 'Creator ID is required'
        }),
        movement_type: Joi.string().trim().optional(),
        notes: Joi.string().trim().allow('').optional()
    }),

    // Update stock quantity validation
    updateStockQuantity: Joi.object({
        quantity: Joi.number().integer().min(0).required().messages({
            'number.integer': 'Quantity must be an integer',
            'number.min': 'Quantity cannot be negative',
            'any.required': 'Quantity is required'
        }),
        updated_by: Joi.number().integer().positive().required().messages({
            'any.required': 'Updater ID is required'
        })
    }),

    // Stock ID param validation
    stockIdParam: Joi.object({
        id: Joi.number().integer().positive().required().messages({
            'number.integer': 'Stock ID must be an integer',
            'number.positive': 'Stock ID must be a positive number',
            'any.required': 'Stock ID is required',
            'number.base': 'Invalid Stock ID format'
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

    // Store ID query validation
    storeIdQuery: Joi.object({
        store_id: Joi.number().integer().positive().required().messages({
            'any.required': 'Store ID is required'
        })
    }),

    // Warehouse ID query validation
    warehouseIdQuery: Joi.object({
        warehouse_id: Joi.number().integer().positive().required().messages({
            'any.required': 'Warehouse ID is required'
        })
    }),

    // Low stock query validation
    lowStockQuery: Joi.object({
        threshold: Joi.number().integer().min(1).default(10).optional().messages({
            'number.min': 'Threshold must be at least 1'
        })
    })
};

module.exports = stockValidation;
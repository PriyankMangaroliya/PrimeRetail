const Joi = require('joi');

const productValidation = {
    // Create product validation
    createProduct: Joi.object({
        product_name: Joi.string().trim().max(200).required().messages({
            'string.empty': 'Product name is required',
            'string.max': 'Product name cannot exceed 200 characters',
            'any.required': 'Product name is required'
        }),
        sku: Joi.string().trim().max(100).required().messages({
            'string.empty': 'SKU is required',
            'string.max': 'SKU cannot exceed 100 characters',
            'any.required': 'SKU is required'
        }),
        barcode: Joi.string().trim().max(100).allow(null, '').optional().messages({
            'string.max': 'Barcode cannot exceed 100 characters'
        }),
        category_id: Joi.number().integer().positive().required().messages({
            'number.integer': 'Category ID must be an integer',
            'number.positive': 'Category ID must be a positive number',
            'any.required': 'Category ID is required'
        }),
        tax_id: Joi.number().integer().positive().allow(null).optional().messages({
            'number.integer': 'Tax ID must be an integer'
        }),
        price: Joi.number().precision(2).min(0).required().messages({
            'number.base': 'Price must be a number',
            'number.min': 'Price cannot be negative',
            'any.required': 'Price is required'
        }),
        unit: Joi.string().trim().max(20).required().messages({
            'string.empty': 'Unit is required',
            'string.max': 'Unit cannot exceed 20 characters',
            'any.required': 'Unit is required'
        })
    }),

    // Update product validation
    updateProduct: Joi.object({
        product_name: Joi.string().trim().max(200).optional().messages({
            'string.max': 'Product name cannot exceed 200 characters'
        }),
        sku: Joi.string().trim().max(100).optional().messages({
            'string.max': 'SKU cannot exceed 100 characters'
        }),
        barcode: Joi.string().trim().max(100).allow(null, '').optional(),
        category_id: Joi.number().integer().positive().optional(),
        tax_id: Joi.number().integer().positive().allow(null).optional(),
        price: Joi.number().precision(2).min(0).optional().messages({
            'number.min': 'Price cannot be negative'
        }),
        unit: Joi.string().trim().max(20).optional(),
        is_active: Joi.boolean().optional()
    }),

    // Product ID param validation
    productIdParam: Joi.object({
        id: Joi.number().integer().positive().required().messages({
            'number.integer': 'Product ID must be an integer',
            'number.positive': 'Product ID must be a positive number',
            'any.required': 'Product ID is required',
            'number.base': 'Invalid Product ID format'
        })
    }),

    // SKU query validation
    skuQuery: Joi.object({
        sku: Joi.string().trim().max(100).required().messages({
            'string.empty': 'SKU is required',
            'any.required': 'SKU is required'
        })
    }),

    // Barcode query validation
    barcodeQuery: Joi.object({
        barcode: Joi.string().trim().max(100).required().messages({
            'string.empty': 'Barcode is required',
            'any.required': 'Barcode is required'
        })
    }),

    // Category ID query validation
    categoryIdQuery: Joi.object({
        category_id: Joi.number().integer().positive().required().messages({
            'any.required': 'Category ID is required'
        })
    })
};

module.exports = productValidation;
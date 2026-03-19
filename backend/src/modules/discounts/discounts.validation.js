const Joi = require('joi');

const discountValidation = {
    // Create discount validation
    createDiscount: Joi.object({
        discount_name: Joi.string().trim().max(100).required().messages({
            'string.empty': 'Discount name is required',
            'string.max': 'Discount name cannot exceed 100 characters',
            'any.required': 'Discount name is required'
        }),
        discount_type: Joi.string().valid('Percentage', 'Fixed').required().messages({
            'any.only': 'Discount type must be either Percentage or Fixed',
            'any.required': 'Discount type is required'
        }),
        discount_value: Joi.number().precision(2).min(0).required().messages({
            'number.base': 'Discount value must be a number',
            'number.min': 'Discount value cannot be negative',
            'any.required': 'Discount value is required'
        }),
        description: Joi.string().trim().max(500).allow(null, '').optional().messages({
            'string.max': 'Description cannot exceed 500 characters'
        }),
        start_date: Joi.date().iso().required().messages({
            'date.base': 'Invalid start date format',
            'any.required': 'Start date is required'
        }),
        end_date: Joi.date().iso().min(Joi.ref('start_date')).required().messages({
            'date.base': 'Invalid end date format',
            'date.min': 'End date must be on or after start date',
            'any.required': 'End date is required'
        })
    }).custom((value, helpers) => {
        // Percentage validation
        if (value.discount_type === 'Percentage' && value.discount_value > 100) {
            return helpers.message('Percentage discount cannot exceed 100%');
        }
        return value;
    }),

    // Update discount validation
    updateDiscount: Joi.object({
        discount_name: Joi.string().trim().max(100).optional().messages({
            'string.max': 'Discount name cannot exceed 100 characters'
        }),
        discount_type: Joi.string().valid('Percentage', 'Fixed').optional(),
        discount_value: Joi.number().precision(2).min(0).optional().messages({
            'number.min': 'Discount value cannot be negative'
        }),
        description: Joi.string().trim().max(500).allow(null, '').optional(),
        is_active: Joi.boolean().optional(),
        start_date: Joi.date().iso().optional(),
        end_date: Joi.date().iso().min(Joi.ref('start_date')).optional().messages({
            'date.min': 'End date must be on or after start date'
        })
    }).custom((value, helpers) => {
        if (value.discount_type === 'Percentage' && value.discount_value > 100) {
            return helpers.message('Percentage discount cannot exceed 100%');
        }
        return value;
    }),

    // Discount ID param validation
    discountIdParam: Joi.object({
        id: Joi.number().integer().positive().required().messages({
            'number.integer': 'Discount ID must be an integer',
            'number.positive': 'Discount ID must be a positive number',
            'any.required': 'Discount ID is required',
            'number.base': 'Invalid Discount ID format'
        })
    }),

    // Discount type query validation
    discountTypeQuery: Joi.object({
        type: Joi.string().valid('Percentage', 'Fixed').required().messages({
            'any.only': 'Invalid discount type',
            'any.required': 'Discount type is required'
        })
    })
};

module.exports = discountValidation;
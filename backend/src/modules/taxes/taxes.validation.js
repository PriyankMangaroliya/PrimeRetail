const Joi = require('joi');

const taxValidation = {
    // Create tax validation
    createTax: Joi.object({
        tax_name: Joi.string().trim().max(50).required().messages({
            'string.empty': 'Tax name is required',
            'string.max': 'Tax name cannot exceed 50 characters',
            'any.required': 'Tax name is required'
        }),
        tax_rate: Joi.number().precision(2).min(0).max(100).required().messages({
            'number.base': 'Tax rate must be a number',
            'number.min': 'Tax rate cannot be negative',
            'number.max': 'Tax rate cannot exceed 100%',
            'any.required': 'Tax rate is required'
        }),
        description: Joi.string().trim().max(500).allow(null, '').optional().messages({
            'string.max': 'Description cannot exceed 500 characters'
        }),
        created_by: Joi.number().integer().positive().optional().messages({
            'number.integer': 'Creator ID must be an integer'
        })
    }),

    // Update tax validation
    updateTax: Joi.object({
        tax_name: Joi.string().trim().max(50).optional().messages({
            'string.max': 'Tax name cannot exceed 50 characters'
        }),
        tax_rate: Joi.number().precision(2).min(0).max(100).optional().messages({
            'number.min': 'Tax rate cannot be negative',
            'number.max': 'Tax rate cannot exceed 100%'
        }),
        description: Joi.string().trim().max(500).allow(null, '').optional(),
        is_active: Joi.boolean().optional(),
        updated_by: Joi.number().integer().positive().optional()
    }),

    // Tax ID param validation
    taxIdParam: Joi.object({
        id: Joi.number().integer().positive().required().messages({
            'number.integer': 'Tax ID must be an integer',
            'number.positive': 'Tax ID must be a positive number',
            'any.required': 'Tax ID is required',
            'number.base': 'Invalid Tax ID format'
        })
    })
};

module.exports = taxValidation;
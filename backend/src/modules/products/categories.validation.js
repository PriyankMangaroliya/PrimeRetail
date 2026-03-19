const Joi = require('joi');

const categoryValidation = {
    // Create category validation
    createCategory: Joi.object({
        category_name: Joi.string().trim().max(100).required().messages({
            'string.empty': 'Category name is required',
            'string.max': 'Category name cannot exceed 100 characters',
            'any.required': 'Category name is required'
        }),
        description: Joi.string().trim().max(500).allow(null, '').optional().messages({
            'string.max': 'Description cannot exceed 500 characters'
        })
    }),

    // Update category validation
    updateCategory: Joi.object({
        category_name: Joi.string().trim().max(100).optional().messages({
            'string.max': 'Category name cannot exceed 100 characters'
        }),
        description: Joi.string().trim().max(500).allow(null, '').optional().messages({
            'string.max': 'Description cannot exceed 500 characters'
        }),
        is_active: Joi.boolean().optional()
    }),

    // Category ID param validation
    categoryIdParam: Joi.object({
        id: Joi.number().integer().positive().required().messages({
            'number.integer': 'Category ID must be an integer',
            'number.positive': 'Category ID must be a positive number',
            'any.required': 'Category ID is required',
            'number.base': 'Invalid Category ID format'
        })
    })
};

module.exports = categoryValidation;
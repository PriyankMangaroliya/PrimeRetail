const Joi = require('joi');

const roleValidation = {
    // Create role validation
    createRole: Joi.object({
        role_name: Joi.string().trim().max(50).required().messages({
            'string.empty': 'Role name is required',
            'string.max': 'Role name cannot exceed 50 characters',
            'any.required': 'Role name is required'
        }),
        description: Joi.string().trim().max(500).allow(null, '').optional().messages({
            'string.max': 'Description cannot exceed 500 characters'
        })
    }),

    // Update role validation
    updateRole: Joi.object({
        role_name: Joi.string().trim().max(50).optional().messages({
            'string.max': 'Role name cannot exceed 50 characters'
        }),
        description: Joi.string().trim().max(500).allow(null, '').optional().messages({
            'string.max': 'Description cannot exceed 500 characters'
        }),
        is_active: Joi.boolean().optional()
    }),

    // Role ID param validation
    roleIdParam: Joi.object({
        id: Joi.number().integer().positive().required().messages({
            'number.integer': 'Role ID must be an integer',
            'number.positive': 'Role ID must be a positive number',
            'any.required': 'Role ID is required',
            'number.base': 'Invalid Role ID format'
        })
    })
};

module.exports = roleValidation;
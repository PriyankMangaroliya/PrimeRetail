const Joi = require('joi');

const warehouseValidation = {
    // Create warehouse validation
    createWarehouse: Joi.object({
        owner_id: Joi.number().integer().positive().required().messages({
            'number.integer': 'Owner ID must be an integer',
            'number.positive': 'Owner ID must be a positive number',
            'any.required': 'Owner ID is required'
        }),
        created_by: Joi.number().integer().positive().optional().messages({
            'number.integer': 'Creator ID must be an integer'
        }),
        warehouse_code: Joi.string().trim().max(50).required().messages({
            'string.empty': 'Warehouse code is required',
            'string.max': 'Warehouse code cannot exceed 50 characters',
            'any.required': 'Warehouse code is required'
        }),
        warehouse_name: Joi.string().trim().max(150).required().messages({
            'string.empty': 'Warehouse name is required',
            'string.max': 'Warehouse name cannot exceed 150 characters',
            'any.required': 'Warehouse name is required'
        }),
        location: Joi.string().trim().max(500).allow(null, '').optional().messages({
            'string.max': 'Location cannot exceed 500 characters'
        }),
        contact_number: Joi.string().trim().pattern(/^[0-9]{10}$/).required().messages({
            'string.empty': 'Contact number is required',
            'string.pattern.base': 'Contact number must be exactly 10 digits',
            'any.required': 'Contact number is required'
        })
    }),

    // Update warehouse validation
    updateWarehouse: Joi.object({
        warehouse_name: Joi.string().trim().max(150).optional().messages({
            'string.max': 'Warehouse name cannot exceed 150 characters'
        }),
        location: Joi.string().trim().max(500).allow(null, '').optional().messages({
            'string.max': 'Location cannot exceed 500 characters'
        }),
        contact_number: Joi.string().trim().pattern(/^[0-9]{10}$/).optional().messages({
            'string.pattern.base': 'Contact number must be exactly 10 digits'
        }),
        is_active: Joi.boolean().optional(),
        updated_by: Joi.number().integer().positive().optional()
    }),

    // Warehouse ID param validation
    warehouseIdParam: Joi.object({
        id: Joi.number().integer().positive().required().messages({
            'number.integer': 'Warehouse ID must be an integer',
            'number.positive': 'Warehouse ID must be a positive number',
            'any.required': 'Warehouse ID is required',
            'number.base': 'Invalid Warehouse ID format'
        })
    }),

    // Warehouse code query validation
    warehouseCodeQuery: Joi.object({
        warehouse_code: Joi.string().trim().max(50).required().messages({
            'string.empty': 'Warehouse code is required',
            'any.required': 'Warehouse code is required'
        })
    })
};

module.exports = warehouseValidation;
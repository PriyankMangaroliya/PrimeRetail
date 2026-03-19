const Joi = require('joi');

const storeValidation = {
    // Create store validation
    createStore: Joi.object({
        owner_id: Joi.number().integer().positive().required().messages({
            'number.integer': 'Owner ID must be an integer',
            'number.positive': 'Owner ID must be a positive number',
            'any.required': 'Owner ID is required'
        }),
        store_code: Joi.string().trim().max(50).required().messages({
            'string.empty': 'Store code is required',
            'string.max': 'Store code cannot exceed 50 characters',
            'any.required': 'Store code is required'
        }),
        store_name: Joi.string().trim().max(150).required().messages({
            'string.empty': 'Store name is required',
            'string.max': 'Store name cannot exceed 150 characters',
            'any.required': 'Store name is required'
        }),
        address: Joi.string().trim().max(500).allow(null, '').optional().messages({
            'string.max': 'Address cannot exceed 500 characters'
        }),
        city: Joi.string().trim().max(100).allow(null, '').optional().messages({
            'string.max': 'City name cannot exceed 100 characters'
        }),
        state: Joi.string().trim().max(100).allow(null, '').optional().messages({
            'string.max': 'State name cannot exceed 100 characters'
        }),
        pincode: Joi.string().trim().pattern(/^[0-9]{6}$/).allow(null, '').messages({
            'string.pattern.base': 'Pincode must be exactly 6 digits'
        }),
        contact_number: Joi.string().trim().pattern(/^[0-9]{10}$/).required().messages({
            'string.empty': 'Contact number is required',
            'string.pattern.base': 'Contact number must be exactly 10 digits',
            'any.required': 'Contact number is required'
        }),
        gstin: Joi.string().trim().max(20).allow(null, '').optional().messages({
            'string.max': 'GSTIN cannot exceed 20 characters'
        }),
        created_by: Joi.number().integer().positive().optional().messages({
            'number.integer': 'Creator ID must be an integer'
        })
    }),

    // Update store validation
    updateStore: Joi.object({
        store_name: Joi.string().trim().max(150).optional().messages({
            'string.max': 'Store name cannot exceed 150 characters'
        }),
        address: Joi.string().trim().max(500).allow(null, '').optional(),
        city: Joi.string().trim().max(100).allow(null, '').optional(),
        state: Joi.string().trim().max(100).allow(null, '').optional(),
        pincode: Joi.string().trim().pattern(/^[0-9]{6}$/).allow(null, '').optional().messages({
            'string.pattern.base': 'Pincode must be exactly 6 digits'
        }),
        contact_number: Joi.string().trim().pattern(/^[0-9]{10}$/).optional().messages({
            'string.pattern.base': 'Contact number must be exactly 10 digits'
        }),
        gstin: Joi.string().trim().max(20).allow(null, '').optional(),
        is_active: Joi.boolean().optional(),
        updated_by: Joi.number().integer().positive().required().messages({
            'any.required': 'Updater ID is required'
        })
    }),

    // Store ID param validation
    storeIdParam: Joi.object({
        id: Joi.number().integer().positive().required().messages({
            'number.integer': 'Store ID must be an integer',
            'number.positive': 'Store ID must be a positive number',
            'any.required': 'Store ID is required',
            'number.base': 'Invalid Store ID format'
        })
    }),

    // Store code query validation
    storeCodeQuery: Joi.object({
        store_code: Joi.string().trim().max(50).required().messages({
            'string.empty': 'Store code is required',
            'any.required': 'Store code is required'
        })
    }),

    // GSTIN query validation
    gstinQuery: Joi.object({
        gstin: Joi.string().trim().max(20).required().messages({
            'string.empty': 'GSTIN is required',
            'any.required': 'GSTIN is required'
        })
    })
};

module.exports = storeValidation;
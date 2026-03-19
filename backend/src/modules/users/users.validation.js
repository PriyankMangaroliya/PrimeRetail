const Joi = require('joi');

const userValidation = {
    // Create user validation
    createUser: Joi.object({
        role_id: Joi.number().integer().positive().required().messages({
            'number.base': 'Role ID must be a number',
            'number.integer': 'Role ID must be an integer',
            'number.positive': 'Role ID must be a positive number',
            'any.required': 'Role ID is required'
        }),
        store_id: Joi.number().integer().positive().allow(null).optional().messages({
            'number.base': 'Store ID must be a number',
            'number.integer': 'Store ID must be an integer',
            'number.positive': 'Store ID must be a positive number'
        }),
        warehouse_id: Joi.number().integer().positive().allow(null).optional().messages({
            'number.base': 'Warehouse ID must be a number',
            'number.integer': 'Warehouse ID must be an integer',
            'number.positive': 'Warehouse ID must be a positive number'
        }),
        name: Joi.string().trim().max(100).required().messages({
            'string.base': 'Name must be a string',
            'string.empty': 'Name is required',
            'string.max': 'Name cannot exceed 100 characters',
            'any.required': 'Name is required'
        }),
        email: Joi.string().trim().email().max(100).required().messages({
            'string.base': 'Email must be a string',
            'string.empty': 'Email is required',
            'string.email': 'Please enter a valid email address',
            'string.max': 'Email cannot exceed 100 characters',
            'any.required': 'Email is required'
        }),
        password: Joi.string().min(6).max(255).required().messages({
            'string.base': 'Password must be a string',
            'string.empty': 'Password is required',
            'string.min': 'Password must be at least 6 characters long',
            'string.max': 'Password cannot exceed 255 characters',
            'any.required': 'Password is required'
        }),
        phone: Joi.string().trim().pattern(/^[0-9]{10}$/).allow(null, '').optional().messages({
            'string.pattern.base': 'Phone number must be exactly 10 digits'
        }),
        profile_image: Joi.string().max(255).allow(null, '').optional().messages({
            'string.max': 'Profile image path is too long'
        }),
        created_by: Joi.number().integer().positive().required().messages({
            'any.required': 'Creator ID is required'
        })
    }).custom((value, helpers) => {
        // Check if both store_id and warehouse_id are provided
        if (value.store_id && value.warehouse_id) {
            return helpers.error('any.invalid', { message: 'User cannot be assigned to both store and warehouse' });
        }
        return value;
    }),

    // Update user validation
    updateUser: Joi.object({
        role_id: Joi.number().integer().positive().optional().messages({
            'number.integer': 'Role ID must be an integer',
            'number.positive': 'Role ID must be a positive number'
        }),
        store_id: Joi.number().integer().positive().allow(null).optional().messages({
            'number.integer': 'Store ID must be an integer',
            'number.positive': 'Store ID must be a positive number'
        }),
        warehouse_id: Joi.number().integer().positive().allow(null).optional().messages({
            'number.integer': 'Warehouse ID must be an integer',
            'number.positive': 'Warehouse ID must be a positive number'
        }),
        name: Joi.string().trim().max(100).optional().messages({
            'string.max': 'Name cannot exceed 100 characters'
        }),
        email: Joi.string().trim().email().max(100).optional().messages({
            'string.email': 'Please enter a valid email address',
            'string.max': 'Email cannot exceed 100 characters'
        }),
        phone: Joi.string().trim().pattern(/^[0-9]{10}$/).allow(null, '').optional().messages({
            'string.pattern.base': 'Phone number must be exactly 10 digits'
        }),
        profile_image: Joi.string().max(255).allow(null, '').optional(),
        is_active: Joi.boolean().optional(),
        updated_by: Joi.number().integer().positive().required().messages({
            'any.required': 'Updater ID is required'
        })
    }).custom((value, helpers) => {
        if (value.store_id && value.warehouse_id) {
            return helpers.error('any.invalid', { message: 'User cannot be assigned to both store and warehouse' });
        }
        return value;
    }),

    // User ID param validation
    userIdParam: Joi.object({
        id: Joi.number().integer().positive().required().messages({
            'any.required': 'User ID is required',
            'number.base': 'Invalid User ID format'
        })
    }),

    // Update password validation
    updatePassword: Joi.object({
        password: Joi.string().min(6).max(255).required().messages({
            'string.min': 'Password must be at least 6 characters long',
            'any.required': 'Password is required'
        }),
        updated_by: Joi.number().integer().positive().required()
    }),

    // Update profile image validation
    updateProfileImage: Joi.object({
        profile_image: Joi.string().max(255).required().messages({
            'any.required': 'Profile image is required'
        }),
        updated_by: Joi.number().integer().positive().required()
    }),

    // Email validation
    emailParam: Joi.object({
        email: Joi.string().email().required().messages({
            'string.email': 'Please enter a valid email address',
            'any.required': 'Email is required'
        })
    }),

    // Role ID query validation
    roleIdQuery: Joi.object({
        role_id: Joi.number().integer().positive().required().messages({
            'any.required': 'Role ID is required'
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
    })
};

module.exports = userValidation;
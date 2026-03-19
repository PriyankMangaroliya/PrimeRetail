const Joi = require('joi');

const storeOwnerValidation = {
    // Create store owner validation
    createStoreOwner: Joi.object({
        name: Joi.string().trim().max(100).required().messages({
            'string.empty': 'Name is required',
            'string.max': 'Name cannot exceed 100 characters',
            'any.required': 'Name is required'
        }),
        email: Joi.string().trim().email().max(100).required().messages({
            'string.email': 'Please enter a valid email address',
            'string.empty': 'Email is required',
            'string.max': 'Email cannot exceed 100 characters',
            'any.required': 'Email is required'
        }),
        password: Joi.string().min(6).max(255).required().messages({
            'string.min': 'Password must be at least 6 characters long',
            'string.empty': 'Password is required',
            'string.max': 'Password cannot exceed 255 characters',
            'any.required': 'Password is required'
        }),
        phone: Joi.string().trim().pattern(/^[0-9]{10}$/).allow(null, '').optional().messages({
            'string.pattern.base': 'Phone number must be exactly 10 digits'
        }),
        profile_image: Joi.string().trim().max(255).allow(null, '').optional().messages({
            'string.max': 'Profile image path cannot exceed 255 characters'
        })
    }),

    // Update store owner validation
    updateStoreOwner: Joi.object({
        name: Joi.string().trim().max(100).optional().messages({
            'string.max': 'Name cannot exceed 100 characters'
        }),
        email: Joi.string().trim().email().max(100).optional().messages({
            'string.email': 'Please enter a valid email address',
            'string.max': 'Email cannot exceed 100 characters'
        }),
        password: Joi.string().min(6).max(255).optional().allow(null, '').messages({
            'string.min': 'Password must be at least 6 characters long',
            'string.max': 'Password cannot exceed 255 characters'
        }),
        phone: Joi.string().trim().pattern(/^[0-9]{10}$/).allow(null, '').optional().messages({
            'string.pattern.base': 'Phone number must be exactly 10 digits'
        }),
        profile_image: Joi.string().trim().max(255).allow(null, '').optional(),
        is_active: Joi.boolean().optional()
    }),

    // Store owner ID param validation
    ownerIdParam: Joi.object({
        id: Joi.number().integer().positive().required().messages({
            'number.integer': 'Owner ID must be an integer',
            'number.positive': 'Owner ID must be a positive number',
            'any.required': 'Owner ID is required',
            'number.base': 'Invalid Owner ID format'
        })
    }),

    // Email param validation
    emailParam: Joi.object({
        email: Joi.string().trim().email().required().messages({
            'string.email': 'Please enter a valid email address',
            'any.required': 'Email is required'
        })
    })
};

module.exports = storeOwnerValidation;
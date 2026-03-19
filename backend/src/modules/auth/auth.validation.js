const Joi = require('joi');

const authValidation = {
    // Register first admin validation
    register: Joi.object({
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

    // Login validation
    login: Joi.object({
        email: Joi.string().trim().email().required().messages({
            'string.email': 'Please enter a valid email address',
            'string.empty': 'Email is required',
            'any.required': 'Email is required'
        }),
        password: Joi.string().required().messages({
            'string.empty': 'Password is required',
            'any.required': 'Password is required'
        })
    }),

    // Update profile validation
    updateProfile: Joi.object({
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
        profile_image: Joi.string().trim().max(255).allow(null, '').optional()
    }),

    // Change password validation
    changePassword: Joi.object({
        old_password: Joi.string().required().messages({
            'string.empty': 'Current password is required',
            'any.required': 'Current password is required'
        }),
        new_password: Joi.string().min(6).required().messages({
            'string.min': 'New password must be at least 6 characters long',
            'string.empty': 'New password is required',
            'any.required': 'New password is required'
        }),
        confirm_password: Joi.string().valid(Joi.ref('new_password')).required().messages({
            'any.only': 'Confirm password must match new password',
            'string.empty': 'Confirm password is required',
            'any.required': 'Confirm password is required'
        })
    }),

    // Refresh token validation
    refreshToken: Joi.object({
        refresh_token: Joi.string().required().messages({
            'string.empty': 'Refresh token is required',
            'any.required': 'Refresh token is required'
        })
    })
};

module.exports = authValidation;
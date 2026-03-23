const Joi = require('joi');

const paymentMethodValidation = {
    // Create payment method validation
    createPaymentMethod: Joi.object({
        method_name: Joi.string().trim().max(50).required().messages({
            'string.empty': 'Payment method name is required',
            'string.max': 'Payment method name cannot exceed 50 characters',
            'any.required': 'Payment method name is required'
        }),
        description: Joi.string().trim().max(500).allow(null, '').optional().messages({
            'string.max': 'Description cannot exceed 500 characters'
        }),
        created_by: Joi.number().integer().positive().required().messages({
            'any.required': 'Creator ID is required'
        })
    }),

    // Update payment method validation
    updatePaymentMethod: Joi.object({
        method_name: Joi.string().trim().max(50).optional().messages({
            'string.max': 'Payment method name cannot exceed 50 characters'
        }),
        description: Joi.string().trim().max(500).allow(null, '').optional().messages({
            'string.max': 'Description cannot exceed 500 characters'
        }),
        is_active: Joi.boolean().optional(),
        updated_by: Joi.number().integer().positive().required().messages({
            'any.required': 'Updater ID is required'
        })
    }),

    // Payment method ID param validation
    methodIdParam: Joi.object({
        id: Joi.number().integer().positive().required().messages({
            'number.integer': 'Payment method ID must be an integer',
            'number.positive': 'Payment method ID must be a positive number',
            'any.required': 'Payment method ID is required',
            'number.base': 'Invalid Payment Method ID format'
        })
    })
};

module.exports = paymentMethodValidation;
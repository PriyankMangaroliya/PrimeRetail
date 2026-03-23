const Joi = require('joi');

const customerValidation = {
    // Create customer validation
    createCustomer: Joi.object({
        name: Joi.string().trim().max(100).required().messages({
            'string.empty': 'Name is required',
            'string.max': 'Name cannot exceed 100 characters',
            'any.required': 'Name is required'
        }),
        phone: Joi.string().trim().max(15).required().messages({
            'string.empty': 'Phone number is required',
            'string.max': 'Phone number cannot exceed 15 characters',
            'any.required': 'Phone number is required'
        }),
        email: Joi.string().trim().email().max(100).allow(null, '').optional().messages({
            'string.email': 'Please enter a valid email address',
            'string.max': 'Email cannot exceed 100 characters'
        }),
        address: Joi.string().trim().allow(null, '').optional(),
        gst_number: Joi.string().trim().max(20).allow(null, '').optional().messages({
            'string.max': 'GST number cannot exceed 20 characters'
        }),
        created_by: Joi.number().integer().positive().required()
    }),

    // Update customer validation
    updateCustomer: Joi.object({
        name: Joi.string().trim().max(100).optional(),
        phone: Joi.string().trim().max(15).optional(),
        email: Joi.string().trim().email().max(100).allow(null, '').optional(),
        address: Joi.string().trim().allow(null, '').optional(),
        loyalty_points: Joi.number().integer().min(0).optional(),
        gst_number: Joi.string().trim().max(20).allow(null, '').optional(),
        is_active: Joi.boolean().optional(),
        updated_by: Joi.number().integer().positive().required()
    }),

    // Customer ID param validation
    customerIdParam: Joi.object({
        id: Joi.number().integer().positive().required()
    }),

    // Customer phone query validation
    customerPhoneParam: Joi.object({
        phone: Joi.string().trim().max(15).required()
    })
};

module.exports = customerValidation;

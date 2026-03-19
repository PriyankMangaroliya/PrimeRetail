const Joi = require('joi');

const paymentValidation = {
    // Create payment validation
    createPayment: Joi.object({
        invoice_id: Joi.number().integer().positive().required().messages({
            'number.integer': 'Invoice ID must be an integer',
            'any.required': 'Invoice ID is required'
        }),
        payment_method_id: Joi.number().integer().positive().required().messages({
            'any.required': 'Payment method is required'
        }),
        amount: Joi.number().precision(2).min(0).required().messages({
            'number.min': 'Amount cannot be negative',
            'any.required': 'Amount is required'
        }),
        transaction_reference: Joi.string().trim().max(100).allow(null, '').optional().messages({
            'string.max': 'Reference cannot exceed 100 characters'
        }),
        payment_status: Joi.string().trim().valid('Completed', 'Pending', 'Failed', 'Refunded').default('Completed'),
        created_by: Joi.number().integer().positive().required().messages({
            'any.required': 'Creator ID is required'
        })
    }),

    // Update payment status validation
    updatePaymentStatus: Joi.object({
        payment_status: Joi.string().trim().valid('Completed', 'Pending', 'Failed', 'Refunded').required().messages({
            'any.only': 'Invalid payment status',
            'any.required': 'Payment status is required'
        }),
        updated_by: Joi.number().integer().positive().required().messages({
            'any.required': 'Updater ID is required'
        })
    }),

    // Payment ID param validation
    paymentIdParam: Joi.object({
        id: Joi.number().integer().positive().required().messages({
            'number.integer': 'Payment ID must be an integer',
            'number.positive': 'Payment ID must be a positive number',
            'any.required': 'Payment ID is required',
            'number.base': 'Invalid Payment ID format'
        })
    }),

    // Invoice ID query validation
    invoiceIdQuery: Joi.object({
        invoice_id: Joi.number().integer().positive().required().messages({
            'any.required': 'Invoice ID is required'
        })
    }),

    // Store ID query validation
    storeIdQuery: Joi.object({
        store_id: Joi.number().integer().positive().required().messages({
            'any.required': 'Store ID is required'
        })
    }),

    // Date range validation
    dateRangeQuery: Joi.object({
        start_date: Joi.date().iso().required().messages({
            'date.iso': 'Start date must be a valid ISO date',
            'any.required': 'Start date is required'
        }),
        end_date: Joi.date().iso().min(Joi.ref('start_date')).required().messages({
            'date.min': 'End date cannot be before start date',
            'any.required': 'End date is required'
        })
    })
};

module.exports = paymentValidation;
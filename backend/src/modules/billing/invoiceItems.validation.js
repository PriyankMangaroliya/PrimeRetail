const Joi = require('joi');

const invoiceItemValidation = {
    // Create invoice item validation
    createInvoiceItem: Joi.object({
        invoice_id: Joi.number().integer().positive().required().messages({
            'any.required': 'Invoice ID is required'
        }),
        product_id: Joi.number().integer().positive().required().messages({
            'any.required': 'Product is required'
        }),
        quantity: Joi.number().integer().min(1).required().messages({
            'number.min': 'Quantity must be at least 1',
            'any.required': 'Quantity is required'
        }),
        price: Joi.number().precision(2).min(0).required().messages({
            'number.min': 'Price cannot be negative',
            'any.required': 'Price is required'
        }),
        tax_amount: Joi.number().precision(2).min(0).required().messages({
            'any.required': 'Tax amount is required'
        }),
        discount_amount: Joi.number().precision(2).min(0).default(0),
        total_price: Joi.number().precision(2).min(0).required().messages({
            'any.required': 'Total price is required'
        })
    }).custom((value, helpers) => {
        // Validate total price calculation
        const calculatedTotal = (value.price * value.quantity) + value.tax_amount - value.discount_amount;
        if (Math.abs(calculatedTotal - value.total_price) > 0.01) {
            return helpers.message('Total price does not match calculation');
        }
        return value;
    }),

    // Update invoice item validation
    updateInvoiceItem: Joi.object({
        quantity: Joi.number().integer().min(1).optional().messages({
            'number.min': 'Quantity must be at least 1'
        }),
        price: Joi.number().precision(2).min(0).optional().messages({
            'number.min': 'Price cannot be negative'
        }),
        tax_amount: Joi.number().precision(2).min(0).optional(),
        discount_amount: Joi.number().precision(2).min(0).optional(),
        total_price: Joi.number().precision(2).min(0).optional()
    }),

    // Invoice item ID param validation
    itemIdParam: Joi.object({
        id: Joi.number().integer().positive().required().messages({
            'number.integer': 'Item ID must be an integer',
            'any.required': 'Item ID is required',
            'number.base': 'Invalid Item ID format'
        })
    }),

    // Invoice ID query validation
    invoiceIdQuery: Joi.object({
        invoice_id: Joi.number().integer().positive().required().messages({
            'any.required': 'Invoice ID is required'
        })
    })
};

module.exports = invoiceItemValidation;
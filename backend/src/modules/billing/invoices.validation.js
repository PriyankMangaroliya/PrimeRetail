const Joi = require('joi');

const invoiceValidation = {
    // Create invoice validation
    createInvoice: Joi.object({
        store_id: Joi.number().integer().positive().required().messages({
            'number.integer': 'Store ID must be an integer',
            'number.positive': 'Store ID must be a positive number',
            'any.required': 'Store ID is required'
        }),
        invoice_no: Joi.string().trim().max(100).required().messages({
            'string.empty': 'Invoice number is required',
            'string.max': 'Invoice number cannot exceed 100 characters',
            'any.required': 'Invoice number is required'
        }),
        cashier_id: Joi.number().integer().positive().required().messages({
            'any.required': 'Cashier ID is required'
        }),
        customer_id: Joi.number().integer().positive().allow(null).optional(),
        total_amount: Joi.number().precision(2).min(0).required().messages({
            'number.min': 'Total amount cannot be negative',
            'any.required': 'Total amount is required'
        }),
        tax_amount: Joi.number().precision(2).min(0).required().messages({
            'number.min': 'Tax amount cannot be negative',
            'any.required': 'Tax amount is required'
        }),
        discount_amount: Joi.number().precision(2).min(0).default(0),
        round_off: Joi.number().precision(2).default(0),
        grand_total: Joi.number().precision(2).min(0).required().messages({
            'number.min': 'Grand total cannot be negative',
            'any.required': 'Grand total is required'
        }),
        invoice_type: Joi.string().trim().valid('SALE', 'RETURN', 'EXCHANGE').default('SALE').messages({
            'any.only': 'Invalid invoice type'
        }),
        created_by: Joi.number().integer().positive().required().messages({
            'any.required': 'Creator ID is required'
        }),
        items: Joi.array().min(1).required().items(
            Joi.object({
                product_id: Joi.number().integer().positive().required().messages({
                    'any.required': 'Product ID is required for items'
                }),
                quantity: Joi.number().integer().min(1).required().messages({
                    'number.min': 'Item quantity must be at least 1',
                    'any.required': 'Quantity is required for items'
                }),
                unit_price: Joi.number().precision(2).min(0).required().messages({
                    'any.required': 'Unit price is required'
                }),
                tax_percentage: Joi.number().precision(2).min(0).required(),
                tax_amount: Joi.number().precision(2).min(0).required(),
                discount_amount: Joi.number().precision(2).min(0).default(0),
                final_price: Joi.number().precision(2).min(0).required(),
                total_price: Joi.number().precision(2).min(0).required()
            })
        ).messages({
            'array.min': 'Invoice must have at least one item',
            'any.required': 'Invoice items are required'
        })
    }).custom((value, helpers) => {
        // Validate grand total calculation
        // Grand Total = Total Amount + Tax Amount - Discount Amount + Round Off
        const calculatedTotal = Number((value.total_amount + value.tax_amount - value.discount_amount + value.round_off).toFixed(2));
        if (Math.abs(calculatedTotal - value.grand_total) > 0.01) {
            return helpers.message(`Grand total does not match calculation (Expected: ${calculatedTotal}, Got: ${value.grand_total})`);
        }
        return value;
    }),

    // Update invoice validation
    updateInvoice: Joi.object({
        total_amount: Joi.number().precision(2).min(0).optional(),
        tax_amount: Joi.number().precision(2).min(0).optional(),
        discount_amount: Joi.number().precision(2).min(0).optional(),
        grand_total: Joi.number().precision(2).min(0).optional(),
        status: Joi.string().trim().valid('Paid', 'Pending', 'Cancelled').optional(),
        updated_by: Joi.number().integer().positive().required().messages({
            'any.required': 'Updater ID is required'
        })
    }),

    // Invoice ID param validation
    invoiceIdParam: Joi.object({
        id: Joi.number().integer().positive().required().messages({
            'number.integer': 'Invoice ID must be an integer',
            'number.positive': 'Invoice ID must be a positive number',
            'any.required': 'Invoice ID is required',
            'number.base': 'Invalid Invoice ID format'
        })
    }),

    // Invoice number param validation
    invoiceNoParam: Joi.object({
        invoice_no: Joi.string().trim().max(100).required().messages({
            'string.empty': 'Invoice number is required',
            'any.required': 'Invoice number is required'
        })
    }),

    // Store ID query validation
    storeIdQuery: Joi.object({
        store_id: Joi.number().integer().positive().required().messages({
            'any.required': 'Store ID is required'
        })
    }),

    // Customer ID query validation
    customerIdQuery: Joi.object({
        customer_id: Joi.number().integer().positive().required().messages({
            'any.required': 'Customer ID is required'
        })
    }),

    // Cashier ID query validation
    cashierIdQuery: Joi.object({
        cashier_id: Joi.number().integer().positive().required().messages({
            'any.required': 'Cashier ID is required'
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
    }),

    // Month/Year validation
    monthYearQuery: Joi.object({
        year: Joi.number().integer().min(2000).max(2100).required().messages({
            'any.required': 'Year is required'
        }),
        month: Joi.number().integer().min(1).max(12).optional()
    })
};

module.exports = invoiceValidation;
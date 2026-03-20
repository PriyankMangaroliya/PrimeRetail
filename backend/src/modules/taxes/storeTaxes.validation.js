const Joi = require('joi');

const storeTaxValidation = {
    // Add store tax validation
    addStoreTax: Joi.object({
        owner_id: Joi.number().integer().positive().required().messages({
            'number.integer': 'Owner ID must be an integer',
            'number.positive': 'Owner ID must be a positive number',
            'any.required': 'Owner ID is required'
        }),
        tax_id: Joi.number().integer().positive().required().messages({
            'number.integer': 'Tax ID must be an integer',
            'number.positive': 'Tax ID must be a positive number',
            'any.required': 'Tax ID is required'
        }),
        created_by: Joi.number().integer().positive().required().messages({
            'any.required': 'Creator ID is required'
        })
    }),

    // Store tax ID param validation
    storeTaxIdParam: Joi.object({
        id: Joi.number().integer().positive().required().messages({
            'number.integer': 'Store tax ID must be an integer',
            'number.positive': 'Store tax ID must be a positive number',
            'any.required': 'Store tax ID is required',
            'number.base': 'Invalid Store tax ID format'
        })
    }),

    // Owner ID query validation
    ownerIdQuery: Joi.object({
        owner_id: Joi.number().integer().positive().required().messages({
            'any.required': 'Owner ID is required'
        })
    })
};

module.exports = storeTaxValidation;
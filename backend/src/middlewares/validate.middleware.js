const responseUtils = require('../utils/response.utils');

/**
 * Middleware to validate request data using Joi schema
 * @param {Object} schema - Joi schema object
 * @param {String} source - Request property to validate (body, params, query)
 */
const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[source], {
            abortEarly: false,
            allowUnknown: true,
            stripUnknown: true
        });

        if (error) {
            const errorMessage = error.details.map(detail => detail.message).join(', ');
            return responseUtils.validationError(res, errorMessage, error.details);
        }

        // Replace request data with validated/stripped value
        req[source] = value;
        next();
    };
};

module.exports = validate;

/**
 * Standard API response utility
 * Provides consistent response structure across the application
 */

class ResponseUtils {
    /**
     * Success response formatter
     * @param {Object} res - Express response object
     * @param {Number} statusCode - HTTP status code
     * @param {String} message - Success message
     * @param {Object|Array} data - Response data
     * @param {Object} meta - Additional metadata (pagination, etc.)
     */
    static success(res, statusCode = 200, message = 'Success', data = null, meta = null) {
        const response = {
            success: true,
            message,
            timestamp: new Date().toISOString(),
        };

        if (data !== null) {
            response.data = data;
        }

        if (meta !== null) {
            response.meta = meta;
        }

        // Log success response to console
        console.log(`\n[${new Date().toISOString()}] --- API SUCCESS ---`);
        console.log(`Status: ${statusCode}`);
        console.log(`Message: ${message}`);
        if (data) {
            const dataStr = JSON.stringify(data);
            if (dataStr.length > 500) {
                console.log(`Data (truncated): ${dataStr.substring(0, 500)}...`);
            } else {
                console.log(`Data: ${dataStr}`);
            }
        }

        return res.status(statusCode).json(response);
    }

    /**
     * Error response formatter
     * @param {Object} res - Express response object
     * @param {Number} statusCode - HTTP status code
     * @param {String} message - Error message
     * @param {Object|Array} errors - Detailed error information
     */
    static error(res, statusCode = 500, message = 'Internal Server Error', errors = null) {
        const response = {
            success: false,
            message,
            timestamp: new Date().toISOString(),
        };

        if (errors !== null) {
            response.errors = errors;
        }

        // Log error response to console
        console.error(`\n[${new Date().toISOString()}] --- API ERROR ---`);
        console.error(`Status: ${statusCode}`);
        console.error(`Message: ${message}`);
        if (errors) {
            console.error(`Details: ${JSON.stringify(errors, null, 2)}`);
        }

        return res.status(statusCode).json(response);
    }

    /**
     * Created response (201)
     * @param {Object} res - Express response object
     * @param {String} message - Success message
     * @param {Object} data - Created resource data
     */
    static created(res, message = 'Resource created successfully', data = null) {
        return this.success(res, 201, message, data);
    }

    /**
     * No content response (204)
     * @param {Object} res - Express response object
     */
    static noContent(res) {
        return res.status(204).send();
    }

    /**
     * Bad request response (400)
     * @param {Object} res - Express response object
     * @param {String} message - Error message
     * @param {Object|Array} errors - Validation errors
     */
    static badRequest(res, message = 'Bad Request', errors = null) {
        return this.error(res, 400, message, errors);
    }

    /**
     * Unauthorized response (401)
     * @param {Object} res - Express response object
     * @param {String} message - Error message
     */
    static unauthorized(res, message = 'Unauthorized access') {
        return this.error(res, 401, message);
    }

    /**
     * Forbidden response (403)
     * @param {Object} res - Express response object
     * @param {String} message - Error message
     */
    static forbidden(res, message = 'Forbidden access') {
        return this.error(res, 403, message);
    }

    /**
     * Not found response (404)
     * @param {Object} res - Express response object
     * @param {String} message - Error message
     */
    static notFound(res, message = 'Resource not found') {
        return this.error(res, 404, message);
    }

    /**
     * Conflict response (409)
     * @param {Object} res - Express response object
     * @param {String} message - Error message
     */
    static conflict(res, message = 'Resource already exists') {
        return this.error(res, 409, message);
    }

    /**
     * Validation error response (422)
     * @param {Object} res - Express response object
     * @param {String} message - Error message
     * @param {Object|Array} errors - Validation errors
     */
    static validationError(res, message = 'Validation failed', errors = null) {
        // If errors is an array from Joi, use the first error message as the main message
        let finalMessage = message;
        if (Array.isArray(errors) && errors.length > 0 && errors[0].message) {
            finalMessage = errors[0].message;
        }

        return this.error(res, 422, finalMessage, errors);
    }

    /**
     * Pagination metadata formatter
     * @param {Number} page - Current page
     * @param {Number} limit - Items per page
     * @param {Number} total - Total items
     * @returns {Object} Pagination metadata
     */
    static getPaginationMeta(page, limit, total) {
        const totalPages = Math.ceil(total / limit);

        return {
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        };
    }
}

module.exports = ResponseUtils;
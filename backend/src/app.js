const express = require('express');
const cors = require('cors');
const responseUtils = require('./utils/response.utils');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// API Routes
const indexRoutes = require('./routes/index.routes');
const apiPrefix = process.env.API_PREFIX || '/api/v1';

// Use routes
app.use(apiPrefix, indexRoutes);

// Root route
app.get('/', (req, res) => {
    return responseUtils.success(res, 200, 'Welcome to Retail Management System API', {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

// 404 handler for undefined routes
app.use((req, res) => {
    return responseUtils.notFound(res, `Cannot ${req.method} ${req.originalUrl}`);
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global Error Handler:', err.stack);

    // Handle specific error types
    if (err.type === 'entity.parse.failed') {
        return responseUtils.badRequest(res, 'Invalid JSON payload');
    }

    if (err.name === 'UnauthorizedError') {
        return responseUtils.unauthorized(res, 'Invalid token');
    }

    if (err.code === 'ER_DUP_ENTRY' || err.code === '23505') {
        return responseUtils.conflict(res, 'Duplicate entry found');
    }

    // Default error response
    return responseUtils.error(
        res,
        500,
        process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    );
});

module.exports = app;
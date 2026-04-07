const dotenv = require('dotenv');
const app = require('./app');
const { testConnection } = require('./config/database.config');

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

let server; // Declare server variable in global scope

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);

    try {
        // Close server
        if (server) {
            server.close(() => {
                console.log('HTTP server closed');
            });
        }

        // Close database connection pool
        const { pool } = require('./config/database.config');
        await pool.end();
        console.log('Database connection pool closed');

        console.log('Graceful shutdown completed');
        process.exit(0);
    } catch (error) {
        console.error('Error during graceful shutdown:', error);
        process.exit(1);
    }
};

// Start server
const startServer = async () => {
    try {
        console.log('🚀 Starting Retail Management System API...');
        console.log('📦 Environment:', process.env.NODE_ENV || 'development');

        // Step 1: Test database connection
        console.log('🔌 Testing database connection...');
        await testConnection();
        console.log('✅ Database connection successful');

        // Step 1.1: Ensure otp_master table exists
        const { query } = require('./config/database.config');
        try {
            console.log('🏗️  Initializing database schema...');
            await query(`
                CREATE TABLE IF NOT EXISTS otp_master (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(100) NOT NULL,
                    otp_code VARCHAR(6) NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    is_verified BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_master(email);
            `);
            console.log('✅ Database initialization completed');
        } catch (initError) {
            console.error('❌ Database initialization failed:', initError);
            // Don't exit here, maybe the user doesn't have create table permissions but the table exists
        }

        // Step 2: Start Express server (skip database initialization since tables already exist)
        server = app.listen(PORT, () => {
            console.log(`✅ Server started successfully`);
            console.log(`🌐 Server is running on port ${PORT}`);
            console.log(`📚 API base URL: http://localhost:${PORT}${API_PREFIX}`);
            console.log(`🔑 Auth endpoints: http://localhost:${PORT}${API_PREFIX}/auth`);
            console.log(`📊 Health check: http://localhost:${PORT}${API_PREFIX}/health`);
            console.log(`\n${'-'.repeat(50)}`);
            console.log('✨ System is ready to accept requests');
            console.log(`${'-'.repeat(50)}\n`);
        });

        // Handle server errors
        server.on('error', (error) => {
            console.error('❌ Server error:', error);
            if (error.code === 'EADDRINUSE') {
                console.error(`Port ${PORT} is already in use`);
            }
            process.exit(1);
        });

        // Graceful shutdown handlers
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught Exception:', error);
            gracefulShutdown('Uncaught Exception');
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown('Unhandled Rejection');
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);

        // Provide specific error messages for common issues
        if (error.code === 'ECONNREFUSED') {
            console.error('🔧 Database connection refused. Please check:');
            console.error('   1. PostgreSQL is running');
            console.error('   2. Database credentials in .env file');
            console.error('   3. Database host and port are correct');
        } else if (error.code === '28P01') {
            console.error('🔧 Authentication failed. Check database username and password');
        }

        process.exit(1);
    }
};

// Handle startup errors
try {
    startServer();
} catch (error) {
    console.error('❌ Unexpected error during startup:', error);
    process.exit(1);
}
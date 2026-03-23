const db = require('../../config/database.config');

const paymentMethodModel = {
    // Create new payment method (System Admin only) - ADD created_by
    createPaymentMethod: (methodData) => {
        const { method_name, description, created_by } = methodData;
        const query = {
            text: `INSERT INTO payment_method_master
                       (method_name, description, created_by, updated_by)
                   VALUES ($1, $2, $3, $3) RETURNING *`,
            values: [method_name, description, created_by]
        };
        return db.query(query);
    },

    // Update payment method (System Admin only) - ADD updated_by
    updatePaymentMethod: (id, methodData) => {
        const { method_name, description, is_active, updated_by } = methodData;
        const query = {
            text: `UPDATE payment_method_master
                   SET method_name = COALESCE($1, method_name),
                       description = COALESCE($2, description),
                       is_active = COALESCE($3, is_active),
                       updated_by = $4,
                       updated_at = CURRENT_TIMESTAMP
                   WHERE id = $5 AND is_deleted = false RETURNING *`,
            values: [method_name, description, is_active, updated_by, id]
        };
        return db.query(query);
    },

    // Soft delete payment method (System Admin only)
    deletePaymentMethod: (id) => {
        const query = {
            text: `UPDATE payment_method_master
                   SET is_deleted = true,
                       updated_at = CURRENT_TIMESTAMP
                   WHERE id = $1 AND is_deleted = false RETURNING *`,
            values: [id]
        };
        return db.query(query);
    },

    // Get all payment methods (System Admin only - sees all including inactive)
    getAllPaymentMethods: () => {
        const query = {
            text: `SELECT p.*,
                          u1.name as created_by_name,
                          u2.name as updated_by_name,
                          (SELECT COUNT(*) FROM payment_master WHERE payment_method_id = p.id) as usage_count
                   FROM payment_method_master p
                            LEFT JOIN user_master u1 ON p.created_by = u1.id
                            LEFT JOIN user_master u2 ON p.updated_by = u2.id
                   WHERE p.is_deleted = false
                   ORDER BY p.id DESC`
        };
        return db.query(query);
    },

    // Get active payment methods only (Cashier, Store Owner, Manager, etc. - for selection)
    getActivePaymentMethods: () => {
        const query = {
            text: `SELECT id, method_name, description
                   FROM payment_method_master
                   WHERE is_active = true AND is_deleted = false
                   ORDER BY method_name`
        };
        return db.query(query);
    },

    // Get payment method by ID
    getPaymentMethodById: (id) => {
        const query = {
            text: `SELECT p.*,
                          u1.name as created_by_name,
                          u2.name as updated_by_name
                   FROM payment_method_master p
                            LEFT JOIN user_master u1 ON p.created_by = u1.id
                            LEFT JOIN user_master u2 ON p.updated_by = u2.id
                   WHERE p.id = $1 AND p.is_deleted = false`,
            values: [id]
        };
        return db.query(query);
    },

    // Check if payment method name exists
    checkPaymentMethodNameExists: (method_name, excludeId = null) => {
        let query;
        if (excludeId) {
            query = {
                text: `SELECT id FROM payment_method_master
                       WHERE method_name = $1 AND id != $2 AND is_deleted = false`,
                values: [method_name, excludeId]
            };
        } else {
            query = {
                text: `SELECT id FROM payment_method_master
                       WHERE method_name = $1 AND is_deleted = false`,
                values: [method_name]
            };
        }
        return db.query(query);
    },

    // Get payment method statistics
    getPaymentMethodStats: () => {
        const query = {
            text: `SELECT
                       COUNT(*) as total_methods,
                       COUNT(CASE WHEN is_active THEN 1 END) as active_methods,
                       COUNT(CASE WHEN NOT is_active THEN 1 END) as inactive_methods
                   FROM payment_method_master
                   WHERE is_deleted = false`
        };
        return db.query(query);
    },

    // Get usage count for payment method (how many paymentMethods use this method)
    getPaymentMethodUsage: (id) => {
        const query = {
            text: `SELECT COUNT(*) as usage_count
                   FROM payment_master
                   WHERE payment_method_id = $1`,
            values: [id]
        };
        return db.query(query);
    }
};

module.exports = paymentMethodModel;
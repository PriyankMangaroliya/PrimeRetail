const db = require('../../config/database.config');

const discountModel = {
    // Create new discount (Store Owner only)
    createDiscount: (discountData) => {
        const { owner_id, discount_name, discount_type, discount_value, description, start_date, end_date, created_by } = discountData;
        const query = {
            text: `INSERT INTO discount_master 
                   (owner_id, discount_name, discount_type, discount_value, description, start_date, end_date, created_by, updated_by, is_deleted, created_at, updated_at) 
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`,
            values: [owner_id, discount_name, discount_type, discount_value, description, start_date, end_date, created_by]
        };
        return db.query(query);
    },

    // Update discount (Store Owner only)
    updateDiscount: (id, discountData) => {
        const { discount_name, discount_type, discount_value, description, is_active, start_date, end_date, updated_by } = discountData;
        const query = {
            text: `UPDATE discount_master 
                   SET discount_name = COALESCE($1, discount_name),
                       discount_type = COALESCE($2, discount_type),
                       discount_value = COALESCE($3, discount_value),
                       description = COALESCE($4, description),
                       is_active = COALESCE($5, is_active),
                       start_date = COALESCE($6, start_date),
                       end_date = COALESCE($7, end_date),
                       updated_by = $8,
                       updated_at = CURRENT_TIMESTAMP
                   WHERE id = $9 AND is_deleted = false RETURNING *`,
            values: [discount_name, discount_type, discount_value, description, is_active, start_date, end_date, updated_by, id]
        };
        return db.query(query);
    },

    // Soft delete discount (Store Owner only)
    deleteDiscount: (id) => {
        const query = {
            text: `UPDATE discount_master 
                   SET is_deleted = true, 
                       updated_at = CURRENT_TIMESTAMP 
                   WHERE id = $1 AND is_deleted = false RETURNING *`,
            values: [id]
        };
        return db.query(query);
    },

    // Get all discounts based on user role
    getAllDiscounts: (userRole, ownerId) => {
        let query;

        if (userRole === 'Store Owner') {
            // Store Owner sees all their discounts (including inactive)
            query = {
                text: `SELECT d.*, u1.name as created_by_name, u2.name as updated_by_name 
                       FROM discount_master d
                       LEFT JOIN user_master u1 ON d.created_by = u1.id
                       LEFT JOIN user_master u2 ON d.updated_by = u2.id
                       WHERE d.owner_id = $1 AND d.is_deleted = false 
                       ORDER BY d.id DESC`,
                values: [ownerId]
            };
        } else {
            // Store Manager, Cashier see active discounts only
            query = {
                text: `SELECT d.id, d.discount_name, d.discount_type, d.discount_value, 
                              d.description, d.is_active, d.start_date, d.end_date
                       FROM discount_master d
                       WHERE d.owner_id = $1 AND d.is_active = true AND d.is_deleted = false 
                       ORDER BY d.discount_name`,
                values: [ownerId]
            };
        }

        return db.query(query);
    },

    // Get discount by ID
    getDiscountById: (id, userRole, ownerId) => {
        let query;

        if (userRole === 'Store Owner') {
            query = {
                text: `SELECT d.*, u1.name as created_by_name, u2.name as updated_by_name 
                       FROM discount_master d
                       LEFT JOIN user_master u1 ON d.created_by = u1.id
                       LEFT JOIN user_master u2 ON d.updated_by = u2.id
                       WHERE d.id = $1 AND d.owner_id = $2 AND d.is_deleted = false`,
                values: [id, ownerId]
            };
        } else {
            query = {
                text: `SELECT d.id, d.discount_name, d.discount_type, d.discount_value, 
                              d.description, d.is_active, d.start_date, d.end_date
                       FROM discount_master d
                       WHERE d.id = $1 AND d.owner_id = $2 AND d.is_active = true AND d.is_deleted = false`,
                values: [id, ownerId]
            };
        }

        return db.query(query);
    },

    // Get discount by ID (basic info - for validation)
    getDiscountBasicById: (id) => {
        const query = {
            text: `SELECT id, owner_id, discount_name, discount_type, discount_value, is_active
                   FROM discount_master
                   WHERE id = $1 AND is_deleted = false`,
            values: [id]
        };
        return db.query(query);
    },

    // Check if discount name exists for owner
    checkDiscountNameExists: (owner_id, discount_name, excludeId = null) => {
        let query;
        if (excludeId) {
            query = {
                text: `SELECT id FROM discount_master 
                       WHERE owner_id = $1 AND discount_name = $2 AND id != $3 AND is_deleted = false`,
                values: [owner_id, discount_name, excludeId]
            };
        } else {
            query = {
                text: `SELECT id FROM discount_master 
                       WHERE owner_id = $1 AND discount_name = $2 AND is_deleted = false`,
                values: [owner_id, discount_name]
            };
        }
        return db.query(query);
    },

    // Get active discounts for dropdown (Cashier/Manager view)
    getActiveDiscounts: (ownerId) => {
        const query = {
            text: `SELECT id, discount_name, discount_type, discount_value, description
                   FROM discount_master 
                   WHERE owner_id = $1 AND is_active = true AND is_deleted = false 
                   ORDER BY discount_name`,
            values: [ownerId]
        };
        return db.query(query);
    },

    // Get discount statistics
    getDiscountStats: (ownerId) => {
        const query = {
            text: `SELECT 
                       COUNT(*) as total_discounts,
                       COUNT(CASE WHEN is_active THEN 1 END) as active_discounts,
                       COUNT(CASE WHEN NOT is_active THEN 1 END) as inactive_discounts,
                       COUNT(CASE WHEN discount_type = 'Percentage' THEN 1 END) as percentage_discounts,
                       COUNT(CASE WHEN discount_type = 'Fixed' THEN 1 END) as fixed_discounts,
                       MIN(CASE WHEN discount_type = 'Percentage' THEN discount_value END) as min_percentage,
                       MAX(CASE WHEN discount_type = 'Percentage' THEN discount_value END) as max_percentage,
                       MIN(CASE WHEN discount_type = 'Fixed' THEN discount_value END) as min_fixed,
                       MAX(CASE WHEN discount_type = 'Fixed' THEN discount_value END) as max_fixed
                   FROM discount_master 
                   WHERE owner_id = $1 AND is_deleted = false`,
            values: [ownerId]
        };
        return db.query(query);
    },

    // Get discounts by type
    getDiscountsByType: (ownerId, discount_type) => {
        const query = {
            text: `SELECT * FROM discount_master 
                   WHERE owner_id = $1 AND discount_type = $2 AND is_active = true AND is_deleted = false 
                   ORDER BY discount_name`,
            values: [ownerId, discount_type]
        };
        return db.query(query);
    },

    // Check if discount is used in any invoices
    checkDiscountUsage: (id) => {
        const query = {
            text: `SELECT COUNT(*) as usage_count 
                   FROM invoice_master 
                   WHERE discount_id = $1 AND is_deleted = false`,
            values: [id]
        };
        return db.query(query);
    },

    // Toggle discount status (Store Owner only)
    toggleDiscountStatus: (id, is_active) => {
        const query = {
            text: `UPDATE discount_master 
                   SET is_active = $1, updated_at = CURRENT_TIMESTAMP
                   WHERE id = $2 AND is_deleted = false RETURNING *`,
            values: [is_active, id]
        };
        return db.query(query);
    },

    // Get discount by code (name)
    getDiscountByCode: (code, ownerId) => {
        const query = {
            text: `SELECT id, discount_name, discount_type, discount_value, is_active
                   FROM discount_master
                   WHERE LOWER(discount_name) = LOWER($1) 
                     AND owner_id = $2 
                     AND is_active = true 
                     AND is_deleted = false`,
            values: [code, ownerId]
        };
        return db.query(query);
    }
};

module.exports = discountModel;
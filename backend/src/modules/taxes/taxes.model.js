const db = require('../../config/database.config');

const taxModel = {
    // Create new tax (System Admin only) - ADD created_by
    createTax: (taxData) => {
        const { tax_name, tax_rate, description, created_by } = taxData;
        const query = {
            text: `INSERT INTO tax_master
                       (tax_name, tax_rate, description, created_by, updated_by)
                   VALUES ($1, $2, $3, $4, $4) RETURNING *`,
            values: [tax_name, tax_rate, description, created_by]
        };
        return db.query(query);
    },

    // Update tax (System Admin only) - ADD updated_by
    updateTax: (id, taxData) => {
        const { tax_name, tax_rate, description, is_active, updated_by } = taxData;
        const query = {
            text: `UPDATE tax_master
                   SET tax_name = COALESCE($1, tax_name),
                       tax_rate = COALESCE($2, tax_rate),
                       description = COALESCE($3, description),
                       is_active = COALESCE($4, is_active),
                       updated_by = $5,
                       updated_at = CURRENT_TIMESTAMP
                   WHERE id = $6 AND is_deleted = false RETURNING *`,
            values: [tax_name, tax_rate, description, is_active, updated_by, id]
        };
        return db.query(query);
    },

    // Soft delete tax (System Admin only)
    deleteTax: (id) => {
        const query = {
            text: `UPDATE tax_master
                   SET is_deleted = true,
                       updated_at = CURRENT_TIMESTAMP
                   WHERE id = $1 AND is_deleted = false RETURNING *`,
            values: [id]
        };
        return db.query(query);
    },

    // Get all taxes (System Admin only - sees all including inactive)
    getAllTaxes: () => {
        const query = {
            text: `SELECT t.*,
                          u1.name as created_by_name,
                          u2.name as updated_by_name,
                          (SELECT COUNT(*) FROM product_master WHERE tax_id = t.id AND is_deleted = false) + 
                          (SELECT COUNT(*) FROM store_taxes WHERE tax_id = t.id AND is_active = true) as usage_count
                   FROM tax_master t
                            LEFT JOIN user_master u1 ON t.created_by = u1.id
                            LEFT JOIN user_master u2 ON t.updated_by = u2.id
                   WHERE t.is_deleted = false
                   ORDER BY t.id DESC`
        };
        return db.query(query);
    },

    // Get active taxes only (Store Owner - for selection)
    getActiveTaxes: () => {
        const query = {
            text: `SELECT id, tax_name, tax_rate, description
                   FROM tax_master
                   WHERE is_active = true AND is_deleted = false
                   ORDER BY tax_name`
        };
        return db.query(query);
    },

    // Get tax by ID
    getTaxById: (id) => {
        const query = {
            text: `SELECT t.*,
                          u1.name as created_by_name,
                          u2.name as updated_by_name
                   FROM tax_master t
                            LEFT JOIN user_master u1 ON t.created_by = u1.id
                            LEFT JOIN user_master u2 ON t.updated_by = u2.id
                   WHERE t.id = $1 AND t.is_deleted = false`,
            values: [id]
        };
        return db.query(query);
    },

    // Check if tax name exists
    checkTaxNameExists: (tax_name, excludeId = null) => {
        let query;
        if (excludeId) {
            query = {
                text: `SELECT id FROM tax_master
                       WHERE tax_name = $1 AND id != $2 AND is_deleted = false`,
                values: [tax_name, excludeId]
            };
        } else {
            query = {
                text: `SELECT id FROM tax_master
                       WHERE tax_name = $1 AND is_deleted = false`,
                values: [tax_name]
            };
        }
        return db.query(query);
    },

    // Get tax statistics
    getTaxStats: () => {
        const query = {
            text: `SELECT
                       COUNT(*) as total_taxes,
                       COUNT(CASE WHEN is_active THEN 1 END) as active_taxes,
                       COUNT(CASE WHEN NOT is_active THEN 1 END) as inactive_taxes,
                       MIN(tax_rate) as min_tax_rate,
                       MAX(tax_rate) as max_tax_rate,
                       AVG(tax_rate) as avg_tax_rate
                   FROM tax_master
                   WHERE is_deleted = false`
        };
        return db.query(query);
    }
};

module.exports = taxModel;
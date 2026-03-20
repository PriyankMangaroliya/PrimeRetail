const db = require('../../config/database.config');

const storeTaxModel = {
    // Add tax to store
    addStoreTax: (storeTaxData) => {
        const { owner_id, tax_id, created_by } = storeTaxData;
        const query = {
            text: `INSERT INTO store_taxes
                       (owner_id, tax_id, created_by, updated_by, created_at, updated_at)
                   VALUES ($1, $2, $3, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`,
            values: [owner_id, tax_id, created_by]
        };
        return db.query(query);
    },

    // Remove tax from store (soft delete)
    removeStoreTax: (id, updated_by) => {
        const query = {
            text: `UPDATE store_taxes
                   SET is_deleted = true,
                       updated_by = $2,
                       updated_at = CURRENT_TIMESTAMP
                   WHERE id = $1 AND is_deleted = false RETURNING *`,
            values: [id, updated_by]
        };
        return db.query(query);
    },

    // Toggle store tax status
    toggleStoreTaxStatus: (id, is_active, updated_by) => {
        const query = {
            text: `UPDATE store_taxes
                   SET is_active = $2,
                       updated_by = $3,
                       updated_at = CURRENT_TIMESTAMP
                   WHERE id = $1 AND is_deleted = false RETURNING *`,
            values: [id, is_active, updated_by]
        };
        return db.query(query);
    },

    // Get products using this tax
    getProductsUsingTax: (tax_id, owner_id) => {
        const query = {
            text: `SELECT p.id, p.product_name, p.sku, c.category_name, p.price, p.unit
                   FROM product_master p
                            LEFT JOIN category_master c ON p.category_id = c.id
                   WHERE p.tax_id = $1 AND p.owner_id = $2 AND p.is_deleted = false
                   ORDER BY p.product_name`,
            values: [tax_id, owner_id]
        };
        return db.query(query);
    },

    // Get taxes by owner
    getTaxesByOwner: (owner_id) => {
        const query = {
            text: `SELECT st.id, st.owner_id, st.tax_id, st.is_active,
                          t.tax_name, t.tax_rate, t.description
                   FROM store_taxes st
                             INNER JOIN tax_master t ON st.tax_id = t.id
                   WHERE st.owner_id = $1 AND st.is_deleted = false AND t.is_deleted = false
                   ORDER BY t.tax_name`,
            values: [owner_id]
        };
        return db.query(query);
    },

    // Get store tax by ID
    getStoreTaxById: (id) => {
        const query = {
            text: `SELECT st.*, t.tax_name, t.tax_rate
                   FROM store_taxes st
                             INNER JOIN tax_master t ON st.tax_id = t.id
                   WHERE st.id = $1 AND st.is_deleted = false`,
            values: [id]
        };
        return db.query(query);
    },

    // Check if tax already added to owner
    checkStoreTaxExists: (owner_id, tax_id) => {
        const query = {
            text: `SELECT id FROM store_taxes 
                   WHERE owner_id = $1 AND tax_id = $2 AND is_deleted = false`,
            values: [owner_id, tax_id]
        };
        return db.query(query);
    }
};

module.exports = storeTaxModel;
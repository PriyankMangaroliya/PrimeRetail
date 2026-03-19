const db = require('../../config/database.config');

const storeTaxModel = {
    // Add tax to store
    addStoreTax: (storeTaxData) => {
        const { store_id, tax_id } = storeTaxData;
        const query = {
            text: `INSERT INTO store_taxes
                       (store_id, tax_id)
                   VALUES ($1, $2) RETURNING *`,
            values: [store_id, tax_id]
        };
        return db.query(query);
    },

    // Remove tax from store (soft delete)
    removeStoreTax: (id) => {
        const query = {
            text: `UPDATE store_taxes
                   SET is_active = false,
                       updated_at = CURRENT_TIMESTAMP
                   WHERE id = $1 RETURNING *`,
            values: [id]
        };
        return db.query(query);
    },

    // Get taxes by store
    getTaxesByStore: (store_id) => {
        const query = {
            text: `SELECT st.id, st.store_id, st.tax_id, st.is_active,
                          t.tax_name, t.tax_rate, t.description
                   FROM store_taxes st
                            INNER JOIN tax_master t ON st.tax_id = t.id
                   WHERE st.store_id = $1 AND st.is_active = true AND t.is_deleted = false
                   ORDER BY t.tax_name`,
            values: [store_id]
        };
        return db.query(query);
    },

    // Get store tax by ID
    getStoreTaxById: (id) => {
        const query = {
            text: `SELECT st.*, t.tax_name, t.tax_rate
                   FROM store_taxes st
                            INNER JOIN tax_master t ON st.tax_id = t.id
                   WHERE st.id = $1 AND st.is_active = true`,
            values: [id]
        };
        return db.query(query);
    },

    // Check if tax already added to store
    checkStoreTaxExists: (store_id, tax_id) => {
        const query = {
            text: `SELECT id FROM store_taxes 
                   WHERE store_id = $1 AND tax_id = $2 AND is_active = true`,
            values: [store_id, tax_id]
        };
        return db.query(query);
    }
};

module.exports = storeTaxModel;
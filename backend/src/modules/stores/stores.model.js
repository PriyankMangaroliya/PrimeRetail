const db = require('../../config/database.config');

const storeModel = {
    // Create new store - ADD created_by and updated_by
    createStore: (storeData) => {
        const { owner_id, store_code, store_name, address, city, state, pincode, contact_number, gstin, created_by } = storeData;
        const query = {
            text: `INSERT INTO store_master
                   (owner_id, store_code, store_name, address, city, state, pincode, contact_number, gstin, created_by, updated_by)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10) RETURNING *`,
            values: [owner_id, store_code, store_name, address, city, state, pincode, contact_number, gstin, created_by]
        };
        return db.query(query);
    },

    // Update store - ADD updated_by
    updateStore: (id, storeData) => {
        const { store_name, address, city, state, pincode, contact_number, gstin, is_active, updated_by } = storeData;
        const query = {
            text: `UPDATE store_master
                   SET store_name = COALESCE($1, store_name),
                       address = COALESCE($2, address),
                       city = COALESCE($3, city),
                       state = COALESCE($4, state),
                       pincode = COALESCE($5, pincode),
                       contact_number = COALESCE($6, contact_number),
                       gstin = COALESCE($7, gstin),
                       is_active = COALESCE($8, is_active),
                       updated_by = $9,
                       updated_at = CURRENT_TIMESTAMP
                   WHERE id = $10 AND is_deleted = false RETURNING *`,
            values: [store_name, address, city, state, pincode, contact_number, gstin, is_active, updated_by, id]
        };
        return db.query(query);
    },

    // Soft delete store
    deleteStore: (id) => {
        const query = {
            text: `UPDATE store_master
                   SET is_deleted = true,
                       updated_at = CURRENT_TIMESTAMP
                   WHERE id = $1 AND is_deleted = false RETURNING *`,
            values: [id]
        };
        return db.query(query);
    },

    // Get all stores (for System Admin) - ADD created_by and updated_by info
    getAllStores: () => {
        const query = {
            text: `SELECT s.*,
                          u.name as owner_name,
                          u.email as owner_email,
                          u1.name as created_by_name,
                          u2.name as updated_by_name,
                          COUNT(DISTINCT emp.id) as employee_count,
                          COUNT(DISTINCT p.id) as product_count
                   FROM store_master s
                            LEFT JOIN user_master u ON s.owner_id = u.id
                            LEFT JOIN user_master u1 ON s.created_by = u1.id
                            LEFT JOIN user_master u2 ON s.updated_by = u2.id
                            LEFT JOIN user_master emp ON s.id = emp.store_id AND emp.is_deleted = false
                            LEFT JOIN product_master p ON s.owner_id = p.owner_id AND p.is_deleted = false
                   WHERE s.is_deleted = false
                   GROUP BY s.id, u.name, u.email, u1.name, u2.name
                   ORDER BY s.id DESC`
        };
        return db.query(query);
    },

    // Get stores by owner (for Store Owner) - ADD created_by and updated_by info
    getStoresByOwner: (ownerId) => {
        const query = {
            text: `SELECT s.*,
                          u1.name as created_by_name,
                          u2.name as updated_by_name,
                          COUNT(DISTINCT emp.id) as employee_count,
                          COUNT(DISTINCT p.id) as product_count
                   FROM store_master s
                            LEFT JOIN user_master u1 ON s.created_by = u1.id
                            LEFT JOIN user_master u2 ON s.updated_by = u2.id
                            LEFT JOIN user_master emp ON s.id = emp.store_id AND emp.is_deleted = false
                            LEFT JOIN product_master p ON s.owner_id = p.owner_id AND p.is_deleted = false
                   WHERE s.owner_id = $1 AND s.is_deleted = false
                   GROUP BY s.id, u1.name, u2.name
                   ORDER BY s.id DESC`,
            values: [ownerId]
        };
        return db.query(query);
    },

    // Get store by ID with role-based filtering - ADD created_by and updated_by info
    getStoreById: (id, userRole, userId) => {
        let query;

        if (userRole === 'Super Admin') {
            // Admin can view any store
            query = {
                text: `SELECT s.*,
                              u.name as owner_name,
                              u.email as owner_email,
                              u1.name as created_by_name,
                              u2.name as updated_by_name,
                              JSON_AGG(
                                      JSON_BUILD_OBJECT(
                                              'id', emp.id,
                                              'name', emp.name,
                                              'email', emp.email,
                                              'role', r.role_name
                                      ) ORDER BY emp.id
                              ) FILTER (WHERE emp.id IS NOT NULL) as employees
                       FROM store_master s
                                LEFT JOIN user_master u ON s.owner_id = u.id
                                LEFT JOIN user_master u1 ON s.created_by = u1.id
                                LEFT JOIN user_master u2 ON s.updated_by = u2.id
                                LEFT JOIN user_master emp ON s.id = emp.store_id AND emp.is_deleted = false
                                LEFT JOIN role_master r ON emp.role_id = r.id
                       WHERE s.id = $1 AND s.is_deleted = false
                       GROUP BY s.id, u.name, u.email, u1.name, u2.name`,
                values: [id]
            };
        } else if (userRole === 'Store Owner') {
            // Owner can view their own stores
            query = {
                text: `SELECT s.*,
                              u1.name as created_by_name,
                              u2.name as updated_by_name,
                              JSON_AGG(
                                      JSON_BUILD_OBJECT(
                                              'id', emp.id,
                                              'name', emp.name,
                                              'email', emp.email,
                                              'role', r.role_name
                                      ) ORDER BY emp.id
                              ) FILTER (WHERE emp.id IS NOT NULL) as employees
                       FROM store_master s
                                LEFT JOIN user_master u1 ON s.created_by = u1.id
                                LEFT JOIN user_master u2 ON s.updated_by = u2.id
                                LEFT JOIN user_master emp ON s.id = emp.store_id AND emp.is_deleted = false
                                LEFT JOIN role_master r ON emp.role_id = r.id
                       WHERE s.id = $1 AND s.owner_id = $2 AND s.is_deleted = false
                       GROUP BY s.id, u1.name, u2.name`,
                values: [id, userId]
            };
        } else {
            // Store Manager, Cashier, Inventory Staff can view only their assigned store
            query = {
                text: `SELECT s.*
                       FROM store_master s
                       WHERE s.id = $1 AND s.id = $2 AND s.is_deleted = false`,
                values: [id, userId] // userId is store_id for these roles
            };
        }

        return db.query(query);
    },

    // Get single store by ID (basic info - for dropdowns)
    getStoreBasicById: (id) => {
        const query = {
            text: `SELECT id, store_name, store_code, city, contact_number, is_active
                   FROM store_master
                   WHERE id = $1 AND is_deleted = false`,
            values: [id]
        };
        return db.query(query);
    },

    // Get full store details by assigned store_id (for Store Manager)
    getStoreByAssignedId: (storeId) => {
        const query = {
            text: `SELECT s.*,
                          u1.name as created_by_name,
                          u2.name as updated_by_name,
                          COUNT(DISTINCT emp.id) as employee_count,
                          JSON_AGG(
                              JSON_BUILD_OBJECT(
                                  'id', emp.id,
                                  'name', emp.name,
                                  'email', emp.email,
                                  'role', r.role_name
                              ) ORDER BY emp.id
                          ) FILTER (WHERE emp.id IS NOT NULL) as employees
                   FROM store_master s
                            LEFT JOIN user_master u1 ON s.created_by = u1.id
                            LEFT JOIN user_master u2 ON s.updated_by = u2.id
                            LEFT JOIN user_master emp ON s.id = emp.store_id AND emp.is_deleted = false
                            LEFT JOIN role_master r ON emp.role_id = r.id
                   WHERE s.id = $1 AND s.is_deleted = false
                   GROUP BY s.id, u1.name, u2.name`,
            values: [storeId]
        };
        return db.query(query);
    },

    // Check if store code exists
    checkStoreCodeExists: (store_code, excludeId = null) => {
        let query;
        if (excludeId) {
            query = {
                text: `SELECT id FROM store_master
                       WHERE store_code = $1 AND id != $2 AND is_deleted = false`,
                values: [store_code, excludeId]
            };
        } else {
            query = {
                text: `SELECT id FROM store_master
                       WHERE store_code = $1 AND is_deleted = false`,
                values: [store_code]
            };
        }
        return db.query(query);
    },

    // Check if GSTIN exists
    checkGstinExists: (gstin, excludeId = null) => {
        let query;
        if (excludeId) {
            query = {
                text: `SELECT id FROM store_master
                       WHERE gstin = $1 AND id != $2 AND is_deleted = false`,
                values: [gstin, excludeId]
            };
        } else {
            query = {
                text: `SELECT id FROM store_master
                       WHERE gstin = $1 AND is_deleted = false`,
                values: [gstin]
            };
        }
        return db.query(query);
    },

    // Get store statistics
    getStoreStats: (userRole, userId) => {
        let query;

        if (userRole === 'Super Admin') {
            query = {
                text: `SELECT
                           COUNT(*) as total_stores,
                           COUNT(CASE WHEN is_active THEN 1 END) as active_stores,
                           COUNT(CASE WHEN NOT is_active THEN 1 END) as inactive_stores,
                           SUM(employee_counts.employee_count) as total_employees,
                           AVG(employee_counts.employee_count) as avg_employees_per_store
                       FROM store_master s
                                LEFT JOIN (
                           SELECT store_id, COUNT(*) as employee_count
                           FROM user_master
                           WHERE store_id IS NOT NULL AND is_deleted = false
                           GROUP BY store_id
                       ) employee_counts ON s.id = employee_counts.store_id
                       WHERE s.is_deleted = false`
            };
        } else if (userRole === 'Store Owner') {
            query = {
                text: `SELECT
                           COUNT(*) as total_stores,
                           COUNT(CASE WHEN is_active THEN 1 END) as active_stores,
                           COUNT(CASE WHEN NOT is_active THEN 1 END) as inactive_stores,
                           SUM(employee_counts.employee_count) as total_employees,
                           AVG(employee_counts.employee_count) as avg_employees_per_store
                       FROM store_master s
                                LEFT JOIN (
                           SELECT store_id, COUNT(*) as employee_count
                           FROM user_master
                           WHERE store_id IS NOT NULL AND is_deleted = false
                           GROUP BY store_id
                       ) employee_counts ON s.id = employee_counts.store_id
                       WHERE s.owner_id = $1 AND s.is_deleted = false`,
                values: [userId]
            };
        } else {
            return Promise.resolve({ rows: [{}] }); // No stats for other roles
        }

        return db.query(query);
    },

    // Get store dropdown (for forms)
    // Store Owner: sees their own stores | Store Manager: sees only their assigned store
    getStoreDropdown: (userRole, userId, storeId) => {
        let query;

        if (userRole === 'Store Owner') {
            query = {
                text: `SELECT id, store_name, store_code, city
                       FROM store_master
                       WHERE owner_id = $1 AND is_active = true AND is_deleted = false
                       ORDER BY store_name`,
                values: [userId]
            };
        } else if (userRole === 'Store Manager') {
            // Use the actual store_id assigned to this manager
            if (!storeId) return Promise.resolve({ rows: [] });
            query = {
                text: `SELECT id, store_name, store_code, city
                       FROM store_master
                       WHERE id = $1 AND is_active = true AND is_deleted = false`,
                values: [storeId]
            };
        } else {
            return Promise.resolve({ rows: [] });
        }

        return db.query(query);
    }
};

module.exports = storeModel;
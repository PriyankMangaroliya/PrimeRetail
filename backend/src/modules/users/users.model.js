const db = require('../../config/database.config');

const userModel = {
    // Create new user
    createUser: (userData) => {
        const { role_id, store_id, warehouse_id, name, email, password, phone, profile_image, created_by } = userData;
        const query = {
            text: `INSERT INTO user_master 
             (role_id, store_id, warehouse_id, name, email, password, phone, profile_image, created_by, updated_by) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9) RETURNING id, role_id, store_id, warehouse_id, name, email, phone, profile_image, is_active, created_at`,
            values: [role_id, store_id || null, warehouse_id || null, name, email, password, phone, profile_image, created_by]
        };
        return db.query(query);
    },

    // Update user
    updateUser: (id, userData) => {
        const { role_id, store_id, warehouse_id, name, email, phone, profile_image, is_active, updated_by, password } = userData;
        const query = {
            text: `UPDATE user_master 
             SET role_id = COALESCE($1, role_id),
                 store_id = COALESCE($2, store_id),
                 warehouse_id = COALESCE($3, warehouse_id),
                 name = COALESCE($4, name),
                 email = COALESCE($5, email),
                 phone = COALESCE($6, phone),
                 profile_image = COALESCE($7, profile_image),
                 is_active = COALESCE($8, is_active),
                 password = COALESCE($9, password),
                 updated_by = $10,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $11 AND is_deleted = false 
             RETURNING id, role_id, store_id, warehouse_id, name, email, phone, profile_image, is_active, created_at`,
            values: [role_id, store_id, warehouse_id, name, email, phone, profile_image, is_active, password, updated_by, id]
        };
        return db.query(query);
    },

    // Soft delete user
    deleteUser: (id, updated_by) => {
        const query = {
            text: `UPDATE user_master 
             SET is_deleted = true, 
                 updated_by = $1, 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 AND is_deleted = false RETURNING *`,
            values: [updated_by, id]
        };
        return db.query(query);
    },

    // Get all users
    getAllUsers: () => {
        const query = {
            text: `SELECT u.*, r.role_name, 
                    cb.name as created_by_name, 
                    ub.name as updated_by_name
             FROM user_master u
             LEFT JOIN role_master r ON u.role_id = r.id
             LEFT JOIN user_master cb ON u.created_by = cb.id
             LEFT JOIN user_master ub ON u.updated_by = ub.id
             WHERE u.is_deleted = false 
             ORDER BY u.id DESC`
        };
        return db.query(query);
    },

    // Get user by ID
    getUserById: (id) => {
        const query = {
            text: `SELECT u.*, r.role_name, 
                    s.store_name, s.store_code, 
                    w.warehouse_name, w.warehouse_code,
                    cb.name as created_by_name, 
                    ub.name as updated_by_name
             FROM user_master u
             LEFT JOIN role_master r ON u.role_id = r.id
             LEFT JOIN store_master s ON u.store_id = s.id
             LEFT JOIN warehouse_master w ON u.warehouse_id = w.id
             LEFT JOIN user_master cb ON u.created_by = cb.id
             LEFT JOIN user_master ub ON u.updated_by = ub.id
             WHERE u.id = $1 AND u.is_deleted = false`,
            values: [id]
        };
        return db.query(query);
    },

    // Get user by email
    getUserByEmail: (email) => {
        const query = {
            text: `SELECT u.*, r.role_name, 
                    s.store_name, s.store_code, 
                    w.warehouse_name, w.warehouse_code
             FROM user_master u
             LEFT JOIN role_master r ON u.role_id = r.id
             LEFT JOIN store_master s ON u.store_id = s.id
             LEFT JOIN warehouse_master w ON u.warehouse_id = w.id
             WHERE u.email = $1 AND u.is_deleted = false`,
            values: [email]
        };
        return db.query(query);
    },

    // Get users by role
    getUsersByRole: (role_id) => {
        const query = {
            text: `SELECT * FROM user_master 
             WHERE role_id = $1 AND is_deleted = false 
             ORDER BY id DESC`,
            values: [role_id]
        };
        return db.query(query);
    },

    // Get users by store
    getUsersByStore: (store_id) => {
        const query = {
            text: `SELECT u.*, r.role_name, 
                    cb.name as created_by_name, 
                    ub.name as updated_by_name
             FROM user_master u
             LEFT JOIN role_master r ON u.role_id = r.id
             LEFT JOIN user_master cb ON u.created_by = cb.id
             LEFT JOIN user_master ub ON u.updated_by = ub.id
             WHERE u.store_id = $1 AND u.is_deleted = false 
             ORDER BY u.id DESC`,
            values: [store_id]
        };
        return db.query(query);
    },

    // Get users by warehouse
    getUsersByWarehouse: (warehouse_id) => {
        const query = {
            text: `SELECT u.*, r.role_name, 
                    cb.name as created_by_name, 
                    ub.name as updated_by_name
             FROM user_master u
             LEFT JOIN role_master r ON u.role_id = r.id
             LEFT JOIN user_master cb ON u.created_by = cb.id
             LEFT JOIN user_master ub ON u.updated_by = ub.id
             WHERE u.warehouse_id = $1 AND u.is_deleted = false 
             ORDER BY u.id DESC`,
            values: [warehouse_id]
        };
        return db.query(query);
    },

    // Update user password
    updateUserPassword: (id, password, updated_by) => {
        const query = {
            text: `UPDATE user_master 
             SET password = $1, 
                 updated_by = $2, 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $3 AND is_deleted = false RETURNING *`,
            values: [password, updated_by, id]
        };
        return db.query(query);
    },

    // Update user profile image
    updateUserProfileImage: (id, profile_image, updated_by) => {
        const query = {
            text: `UPDATE user_master 
             SET profile_image = $1, 
                 updated_by = $2, 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $3 AND is_deleted = false RETURNING *`,
            values: [profile_image, updated_by, id]
        };
        return db.query(query);
    },

    // Activate user
    activateUser: (id, updated_by) => {
        const query = {
            text: `UPDATE user_master 
             SET is_active = true, 
                 updated_by = $1, 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 AND is_deleted = false RETURNING *`,
            values: [updated_by, id]
        };
        return db.query(query);
    },

    // Deactivate user
    deactivateUser: (id, updated_by) => {
        const query = {
            text: `UPDATE user_master 
             SET is_active = false, 
                 updated_by = $1, 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 AND is_deleted = false RETURNING *`,
            values: [updated_by, id]
        };
        return db.query(query);
    }
};

module.exports = userModel;
const db = require('../../config/database.config');

const roleModel = {
    // Add new role - REMOVED created_by and updated_by
    addRole: (roleData) => {
        const { role_name, description } = roleData;
        const query = {
            text: `INSERT INTO role_master (role_name, description)
                   VALUES ($1, $2) RETURNING *`,
            values: [role_name, description]
        };
        return db.query(query);
    },

    // Update role - REMOVED updated_by
    updateRole: (id, roleData) => {
        const { role_name, description, is_active } = roleData;
        const query = {
            text: `UPDATE role_master
                   SET role_name = COALESCE($1, role_name),
                       description = COALESCE($2, description),
                       is_active = COALESCE($3, is_active),
                       updated_at = CURRENT_TIMESTAMP
                   WHERE id = $4 AND is_deleted = false RETURNING *`,
            values: [role_name, description, is_active, id]
        };
        return db.query(query);
    },

    // Soft delete role - REMOVED updated_by
    deleteRole: (id) => {
        const query = {
            text: `UPDATE role_master
                   SET is_deleted = true,
                       updated_at = CURRENT_TIMESTAMP
                   WHERE id = $1 AND is_deleted = false RETURNING *`,
            values: [id]
        };
        return db.query(query);
    },

    // Get all roles
    getAllRoles: () => {
        const query = {
            text: `SELECT r.*, COUNT(u.id) as user_count 
                   FROM role_master r
                   LEFT JOIN user_master u ON r.id = u.role_id AND u.is_deleted = false
                   WHERE r.is_deleted = false
                   GROUP BY r.id
                   ORDER BY r.id DESC`
        };
        return db.query(query);
    },

    // Get active roles only
    getActiveRoles: () => {
        const query = {
            text: `SELECT r.*, COUNT(u.id) as user_count 
                   FROM role_master r
                   LEFT JOIN user_master u ON r.id = u.role_id AND u.is_deleted = false
                   WHERE r.is_active = true AND r.is_deleted = false
                   GROUP BY r.id
                   ORDER BY r.id DESC`
        };
        return db.query(query);
    },

    // Get role by ID
    getRoleById: (id) => {
        const query = {
            text: `SELECT * FROM role_master
                   WHERE id = $1 AND is_deleted = false`,
            values: [id]
        };
        return db.query(query);
    },

    // Check if role exists by name
    checkRoleExistsByName: (role_name, excludeId = null) => {
        let query;
        if (excludeId) {
            query = {
                text: `SELECT * FROM role_master
                       WHERE role_name = $1 AND id != $2 AND is_deleted = false`,
                values: [role_name, excludeId]
            };
        } else {
            query = {
                text: `SELECT * FROM role_master
                       WHERE role_name = $1 AND is_deleted = false`,
                values: [role_name]
            };
        }
        return db.query(query);
    }
};

module.exports = roleModel;
const roleModel = require('./roles.model');

const roleService = {
    // Create new role
    createRole: async (roleData) => {
        try {
            // Check if role name already exists
            const existingRole = await roleModel.checkRoleExistsByName(roleData.role_name);
            if (existingRole.rows.length > 0) {
                throw new Error('Role name already exists');
            }

            const result = await roleModel.addRole(roleData);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Update role
    updateRole: async (id, roleData) => {
        try {
            // Check if role exists
            const role = await roleModel.getRoleById(id);
            if (role.rows.length === 0) {
                throw new Error('Role not found');
            }

            // Check if role name already exists (if updating name)
            if (roleData.role_name) {
                const existingRole = await roleModel.checkRoleExistsByName(roleData.role_name, id);
                if (existingRole.rows.length > 0) {
                    throw new Error('Role name already exists');
                }
            }

            const result = await roleModel.updateRole(id, roleData);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Delete role (soft delete)
    deleteRole: async (id) => {
        try {
            // Check if role exists
            const role = await roleModel.getRoleById(id);
            if (role.rows.length === 0) {
                throw new Error('Role not found');
            }

            // Check if role is in use by any users
            const userCheck = await roleService.checkRoleInUse(id);
            if (userCheck) {
                throw new Error('Cannot delete role as it is assigned to users');
            }

            const result = await roleModel.deleteRole(id);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Get all roles
    getAllRoles: async () => {
        try {
            const result = await roleModel.getAllRoles();
            return result.rows;
        } catch (error) {
            throw error;
        }
    },

    // Get role by ID
    getRoleById: async (id) => {
        try {
            const result = await roleModel.getRoleById(id);
            if (result.rows.length === 0) {
                throw new Error('Role not found');
            }
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Get active roles only
    getActiveRoles: async () => {
        try {
            const result = await roleModel.getActiveRoles();
            return result.rows;
        } catch (error) {
            throw error;
        }
    },

    // Check if role is in use by any users
    checkRoleInUse: async (roleId) => {
        try {
            const db = require('../../config/database.config');
            const query = {
                text: `SELECT COUNT(*) as count FROM user_master WHERE role_id = $1 AND is_deleted = false`,
                values: [roleId]
            };
            const result = await db.query(query);
            return parseInt(result.rows[0].count) > 0;
        } catch (error) {
            throw error;
        }
    },

    // Get role statistics
    getRoleStats: async () => {
        try {
            const db = require('../../config/database.config');
            const query = `
                SELECT
                    r.id,
                    r.role_name,
                    COUNT(u.id) as user_count,
                    r.is_active,
                    r.created_at
                FROM role_master r
                         LEFT JOIN user_master u ON r.id = u.role_id AND u.is_deleted = false
                WHERE r.is_deleted = false
                GROUP BY r.id, r.role_name, r.is_active, r.created_at
                ORDER BY r.id
            `;
            const result = await db.query(query);
            return result.rows;
        } catch (error) {
            throw error;
        }
    },

    // Bulk insert roles (for initial setup)
    createDefaultRoles: async () => {
        const defaultRoles = [
            { role_name: 'Super Admin', description: 'Full system access and control' },
            { role_name: 'Store Owner', description: 'Owns and manages stores' },
            { role_name: 'Store Manager', description: 'Manages daily store operations' },
            { role_name: 'Cashier', description: 'Handles billing and payments' },
            { role_name: 'Inventory Staff', description: 'Manages inventory and stock' },
            { role_name: 'Warehouse Staff', description: 'Manages warehouse operations' }
        ];

        const createdRoles = [];
        for (const role of defaultRoles) {
            try {
                const existing = await roleModel.checkRoleExistsByName(role.role_name);
                if (existing.rows.length === 0) {
                    const result = await roleModel.addRole(role);
                    createdRoles.push(result.rows[0]);
                }
            } catch (error) {
                console.error(`Error creating role ${role.role_name}:`, error);
            }
        }
        return createdRoles;
    }
};

module.exports = roleService;
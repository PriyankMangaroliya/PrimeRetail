const bcrypt = require('bcryptjs');
const userModel = require('./users.model');
const roleModel = require('../roles/roles.model');

const userService = {
    // Hash password
    hashPassword: async (password) => {
        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10);
        return bcrypt.hash(password, salt);
    },

    // Create new employee (Store Owner/Manager)
    createEmployee: async (userData, createdBy, userRole, userStoreId) => {
        try {
            // Check if email already exists
            const existingUser = await userModel.getUserByEmail(userData.email);
            if (existingUser.rows.length > 0) {
                throw new Error('Email already registered');
            }

            // Validate role assignment based on who is creating
            const roleResult = await roleModel.getRoleById(userData.role_id);
            if (!roleResult.rows.length) {
                throw new Error('Role not found');
            }

            const roleName = roleResult.rows[0].role_name;

            // Store Owner can create: Store Manager, Cashier, Inventory Staff, Warehouse Staff
            if (userRole === 'Store Owner') {
                const allowedRoles = ['Store Manager', 'Cashier', 'Inventory Staff', 'Warehouse Staff'];
                if (!allowedRoles.includes(roleName)) {
                    throw new Error('You can only create Store Manager, Cashier, Inventory Staff, or Warehouse Staff');
                }

                // For warehouse staff, warehouse_id is required
                if (roleName === 'Warehouse Staff' && !userData.warehouse_id) {
                    throw new Error('Warehouse ID is required for Warehouse Staff');
                }

                // For store roles, store_id is required
                if (['Store Manager', 'Cashier', 'Inventory Staff'].includes(roleName)) {
                    if (!userData.store_id) {
                        throw new Error('Store ID is required for this role');
                    }
                    // Verify store belongs to this owner
                    const db = require('../../config/database.config');
                    const storeCheck = await db.query(
                        'SELECT id FROM store_master WHERE id = $1 AND owner_id = $2',
                        [userData.store_id, createdBy]
                    );
                    if (!storeCheck.rows.length) {
                        throw new Error('Store does not belong to you');
                    }
                }

                // For warehouse staff, verify warehouse belongs to this owner
                if (roleName === 'Warehouse Staff' && userData.warehouse_id) {
                    const db = require('../../config/database.config');
                    const warehouseCheck = await db.query(
                        'SELECT id FROM warehouse_master WHERE id = $1 AND owner_id = $2',
                        [userData.warehouse_id, createdBy]
                    );
                    if (!warehouseCheck.rows.length) {
                        throw new Error('Warehouse does not belong to you');
                    }
                }
            }

            // Store Manager can only create: Cashier, Inventory Staff (for their store)
            if (userRole === 'Store Manager') {
                const allowedRoles = ['Cashier', 'Inventory Staff'];
                if (!allowedRoles.includes(roleName)) {
                    throw new Error('You can only create Cashier or Inventory Staff');
                }

                // Force store_id to be manager's store
                userData.store_id = userStoreId;

                if (!userData.store_id) {
                    throw new Error('Store ID is required');
                }
            }

            // Hash password
            const hashedPassword = await userService.hashPassword(userData.password);

            // Create user
            const newUser = {
                ...userData,
                password: hashedPassword,
                created_by: createdBy
            };

            const result = await userModel.createUser(newUser);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Get all employees based on user role
    getAllEmployees: async (userRole, userId, userStoreId) => {
        try {
            let query;

            if (userRole === 'Super Admin') {
                // Super Admin sees all employees
                const result = await userModel.getAllUsers();
                return result.rows;
            }
            else if (userRole === 'Store Owner') {
                // Store Owner sees employees from their stores and warehouses
                const db = require('../../config/database.config');
                query = {
                    text: `SELECT u.*, r.role_name,
                                  s.store_name,
                                  w.warehouse_name,
                                  cb.name as created_by_name,
                                  ub.name as updated_by_name
                           FROM user_master u
                           LEFT JOIN role_master r ON u.role_id = r.id
                           LEFT JOIN store_master s ON u.store_id = s.id
                           LEFT JOIN warehouse_master w ON u.warehouse_id = w.id
                           LEFT JOIN user_master cb ON u.created_by = cb.id
                           LEFT JOIN user_master ub ON u.updated_by = ub.id
                           WHERE u.is_deleted = false 
                             AND (
                                 u.store_id IN (SELECT id FROM store_master WHERE owner_id = $1)
                                 OR 
                                 u.warehouse_id IN (SELECT id FROM warehouse_master WHERE owner_id = $1)
                             )
                           ORDER BY u.id DESC`,
                    values: [userId]
                };
                const result = await db.query(query);
                return result.rows;
            }
            else if (userRole === 'Store Manager') {
                // Store Manager sees employees from their store only
                const db = require('../../config/database.config');
                query = {
                    text: `SELECT u.*, r.role_name,
                                  cb.name as created_by_name,
                                  ub.name as updated_by_name
                           FROM user_master u
                           LEFT JOIN role_master r ON u.role_id = r.id
                           LEFT JOIN user_master cb ON u.created_by = cb.id
                           LEFT JOIN user_master ub ON u.updated_by = ub.id
                           WHERE u.is_deleted = false 
                             AND u.store_id = $1
                           ORDER BY u.id DESC`,
                    values: [userStoreId]
                };
                const result = await db.query(query);
                return result.rows;
            }

            return [];
        } catch (error) {
            throw error;
        }
    },

    // Get employee by ID with role-based access
    getEmployeeById: async (id, userRole, userId, userStoreId) => {
        try {
            const result = await userModel.getUserById(id);

            if (result.rows.length === 0) {
                throw new Error('Employee not found');
            }

            const employee = result.rows[0];

            // Check access permissions
            if (userRole === 'Super Admin') {
                return employee;
            }
            else if (userRole === 'Store Owner') {
                // Check if employee belongs to owner's store or warehouse
                const db = require('../../config/database.config');
                if (employee.store_id) {
                    const storeCheck = await db.query(
                        'SELECT id FROM store_master WHERE id = $1 AND owner_id = $2',
                        [employee.store_id, userId]
                    );
                    if (storeCheck.rows.length) {
                        return employee;
                    }
                }
                if (employee.warehouse_id) {
                    const warehouseCheck = await db.query(
                        'SELECT id FROM warehouse_master WHERE id = $1 AND owner_id = $2',
                        [employee.warehouse_id, userId]
                    );
                    if (warehouseCheck.rows.length) {
                        return employee;
                    }
                }
                throw new Error('You do not have permission to view this employee');
            }
            else if (userRole === 'Store Manager') {
                // Check if employee belongs to manager's store
                if (parseInt(employee.store_id) === parseInt(userStoreId)) {
                    return employee;
                }
                throw new Error('You do not have permission to view this employee');
            }

            throw new Error('You do not have permission to view this employee');
        } catch (error) {
            throw error;
        }
    },

    // Update employee
    updateEmployee: async (id, userData, updatedBy, userRole, userId, userStoreId) => {
        try {
            // Check if employee exists and user has access
            const employee = await userService.getEmployeeById(id, userRole, userId, userStoreId);

            // If email is being updated, check if it already exists
            if (userData.email && userData.email !== employee.email) {
                const existingUser = await userModel.getUserByEmail(userData.email);
                if (existingUser.rows.length > 0) {
                    throw new Error('Email already registered by another user');
                }
            }

            // Role change restrictions
            if (userData.role_id && userData.role_id !== employee.role_id) {
                const roleResult = await roleModel.getRoleById(userData.role_id);
                if (!roleResult.rows.length) {
                    throw new Error('Role not found');
                }

                const newRoleName = roleResult.rows[0].role_name;

                // Store Owner can assign: Store Manager, Cashier, Inventory Staff, Warehouse Staff
                if (userRole === 'Store Owner') {
                    const allowedRoles = ['Store Manager', 'Cashier', 'Inventory Staff', 'Warehouse Staff'];
                    if (!allowedRoles.includes(newRoleName)) {
                        throw new Error('You can only assign Store Manager, Cashier, Inventory Staff, or Warehouse Staff roles');
                    }
                }

                // Store Manager can only assign: Cashier, Inventory Staff
                if (userRole === 'Store Manager') {
                    const allowedRoles = ['Cashier', 'Inventory Staff'];
                    if (!allowedRoles.includes(newRoleName)) {
                        throw new Error('You can only assign Cashier or Inventory Staff roles');
                    }
                }
            }

            // Hash password if provided
            if (userData.password) {
                userData.password = await userService.hashPassword(userData.password);
            }

            // Add updated_by
            userData.updated_by = updatedBy;

            const result = await userModel.updateUser(id, userData);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Delete employee
    deleteEmployee: async (id, updatedBy, userRole, userId, userStoreId) => {
        try {
            // Check if employee exists and user has access
            await userService.getEmployeeById(id, userRole, userId, userStoreId);

            // Prevent deleting yourself
            if (parseInt(id) === parseInt(updatedBy)) {
                throw new Error('You cannot delete your own account');
            }

            const result = await userModel.deleteUser(id, updatedBy);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Get employees by store
    getEmployeesByStore: async (storeId, userRole, userId) => {
        try {
            // Verify store access
            if (userRole === 'Store Owner') {
                const db = require('../../config/database.config');
                const storeCheck = await db.query(
                    'SELECT id FROM store_master WHERE id = $1 AND owner_id = $2',
                    [storeId, userId]
                );
                if (!storeCheck.rows.length) {
                    throw new Error('Store does not belong to you');
                }
            } else if (userRole === 'Store Manager') {
                if (parseInt(storeId) !== parseInt(userStoreId)) {
                    throw new Error('You can only view your own store employees');
                }
            }

            const result = await userModel.getUsersByStore(storeId);
            return result.rows;
        } catch (error) {
            throw error;
        }
    },

    // Get employees by warehouse
    getEmployeesByWarehouse: async (warehouseId, userRole, userId) => {
        try {
            // Verify warehouse access (only Store Owner)
            if (userRole === 'Store Owner') {
                const db = require('../../config/database.config');
                const warehouseCheck = await db.query(
                    'SELECT id FROM warehouse_master WHERE id = $1 AND owner_id = $2',
                    [warehouseId, userId]
                );
                if (!warehouseCheck.rows.length) {
                    throw new Error('Warehouse does not belong to you');
                }
            } else {
                throw new Error('You do not have permission to view warehouse employees');
            }

            const result = await userModel.getUsersByWarehouse(warehouseId);
            return result.rows;
        } catch (error) {
            throw error;
        }
    },

    // Toggle employee status
    toggleEmployeeStatus: async (id, updatedBy, userRole, userId, userStoreId) => {
        try {
            const employee = await userService.getEmployeeById(id, userRole, userId, userStoreId);

            // Prevent toggling your own status
            if (parseInt(id) === parseInt(updatedBy)) {
                throw new Error('You cannot change your own status');
            }

            const newStatus = !employee.is_active;
            const result = await userModel.updateUser(id, {
                is_active: newStatus,
                updated_by: updatedBy
            });

            return {
                id: result.rows[0].id,
                is_active: result.rows[0].is_active,
                message: `Employee ${newStatus ? 'activated' : 'deactivated'} successfully`
            };
        } catch (error) {
            throw error;
        }
    },

    // Get employee statistics
    getEmployeeStats: async (userRole, userId, userStoreId) => {
        try {
            const db = require('../../config/database.config');
            let query;

            if (userRole === 'Super Admin') {
                query = {
                    text: `SELECT 
                               COUNT(*) as total_employees,
                               COUNT(CASE WHEN is_active THEN 1 END) as active_employees,
                               COUNT(CASE WHEN NOT is_active THEN 1 END) as inactive_employees,
                               r.role_name,
                               COUNT(CASE WHEN u.role_id = r.id THEN 1 END) as role_count
                           FROM user_master u
                           CROSS JOIN role_master r
                           WHERE u.is_deleted = false
                           GROUP BY r.role_name, r.id
                           ORDER BY r.id`
                };
            }
            else if (userRole === 'Store Owner') {
                query = {
                    text: `SELECT 
                               COUNT(*) as total_employees,
                               COUNT(CASE WHEN is_active THEN 1 END) as active_employees,
                               COUNT(CASE WHEN NOT is_active THEN 1 END) as inactive_employees,
                               r.role_name,
                               COUNT(CASE WHEN u.role_id = r.id THEN 1 END) as role_count
                           FROM user_master u
                           CROSS JOIN role_master r
                           WHERE u.is_deleted = false 
                             AND (
                                 u.store_id IN (SELECT id FROM store_master WHERE owner_id = $1)
                                 OR 
                                 u.warehouse_id IN (SELECT id FROM warehouse_master WHERE owner_id = $1)
                             )
                           GROUP BY r.role_name, r.id
                           ORDER BY r.id`,
                    values: [userId]
                };
            }
            else if (userRole === 'Store Manager') {
                query = {
                    text: `SELECT 
                               COUNT(*) as total_employees,
                               COUNT(CASE WHEN is_active THEN 1 END) as active_employees,
                               COUNT(CASE WHEN NOT is_active THEN 1 END) as inactive_employees,
                               r.role_name,
                               COUNT(CASE WHEN u.role_id = r.id THEN 1 END) as role_count
                           FROM user_master u
                           CROSS JOIN role_master r
                           WHERE u.is_deleted = false AND u.store_id = $1
                           GROUP BY r.role_name, r.id
                           ORDER BY r.id`,
                    values: [userStoreId]
                };
            }

            const result = await db.query(query);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = userService;
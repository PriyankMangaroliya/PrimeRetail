const userService = require('./users.service');
const userValidation = require('./users.validation');
const responseUtils = require('../../utils/response.utils');

const userController = {
    // Create new employee
    createEmployee: async (req, res) => {
        try {
            const userRole = req.user.role_name;
            const userId = req.user.id;
            const userStoreId = req.user.store_id;

            // Validate request body
            const { error, value } = userValidation.createUser.validate(req.body);
            if (error) {
                return responseUtils.validationError(res, 'Validation failed', error.details);
            }

            const employee = await userService.createEmployee(value, userId, userRole, userStoreId);

            return responseUtils.created(res, 'Employee created successfully', employee);
        } catch (error) {
            console.error('Create Employee Error:', error);

            if (error.message.includes('already registered')) {
                return responseUtils.conflict(res, error.message);
            }
            if (error.message.includes('not found') || error.message.includes('required') || error.message.includes('only create')) {
                return responseUtils.badRequest(res, error.message);
            }
            if (error.message.includes('does not belong') || error.message.includes('permission')) {
                return responseUtils.forbidden(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to create employee');
        }
    },

    // Get all employees
    getAllEmployees: async (req, res) => {
        try {
            const userRole = req.user.role_name;
            const userId = req.user.id;
            const userStoreId = req.user.store_id;

            const employees = await userService.getAllEmployees(userRole, userId, userStoreId);

            return responseUtils.success(res, 200, 'Employees retrieved successfully', employees);
        } catch (error) {
            console.error('Get All Employees Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve employees');
        }
    },

    // Get employee by ID
    getEmployeeById: async (req, res) => {
        try {
            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = userValidation.userIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid employee ID', paramError.details);
            }

            const userRole = req.user.role_name;
            const userId = req.user.id;
            const userStoreId = req.user.store_id;

            const employee = await userService.getEmployeeById(id, userRole, userId, userStoreId);

            return responseUtils.success(res, 200, 'Employee retrieved successfully', employee);
        } catch (error) {
            console.error('Get Employee By ID Error:', error);

            if (error.message.includes('not found') || error.message.includes('permission')) {
                return responseUtils.notFound(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to retrieve employee');
        }
    },

    // Update employee
    updateEmployee: async (req, res) => {
        try {
            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = userValidation.userIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid employee ID', paramError.details);
            }

            // Validate request body
            const { error, value } = userValidation.updateUser.validate(req.body);
            if (error) {
                return responseUtils.validationError(res, 'Validation failed', error.details);
            }

            const userRole = req.user.role_name;
            const userId = req.user.id;
            const userStoreId = req.user.store_id;

            const employee = await userService.updateEmployee(id, value, userId, userRole, userId, userStoreId);

            return responseUtils.success(res, 200, 'Employee updated successfully', employee);
        } catch (error) {
            console.error('Update Employee Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }
            if (error.message.includes('already registered')) {
                return responseUtils.conflict(res, error.message);
            }
            if (error.message.includes('permission') || error.message.includes('forbidden')) {
                return responseUtils.forbidden(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to update employee');
        }
    },

    // Delete employee
    deleteEmployee: async (req, res) => {
        try {
            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = userValidation.userIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid employee ID', paramError.details);
            }

            const userRole = req.user.role_name;
            const userId = req.user.id;
            const userStoreId = req.user.store_id;

            const result = await userService.deleteEmployee(id, userId, userRole, userId, userStoreId);

            return responseUtils.success(res, 200, 'Employee deleted successfully', result);
        } catch (error) {
            console.error('Delete Employee Error:', error);

            if (error.message.includes('not found') || error.message.includes('permission')) {
                return responseUtils.notFound(res, error.message);
            }
            if (error.message.includes('cannot delete your own')) {
                return responseUtils.badRequest(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to delete employee');
        }
    },

    // Get employees by store
    getEmployeesByStore: async (req, res) => {
        try {
            const { storeId } = req.params;

            const userRole = req.user.role_name;
            const userId = req.user.id;
            const userStoreId = req.user.store_id;

            const employees = await userService.getEmployeesByStore(storeId, userRole, userId, userStoreId);

            return responseUtils.success(res, 200, 'Store employees retrieved successfully', employees);
        } catch (error) {
            console.error('Get Employees By Store Error:', error);

            if (error.message.includes('does not belong') || error.message.includes('permission')) {
                return responseUtils.forbidden(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to retrieve store employees');
        }
    },

    // Get employees by warehouse
    getEmployeesByWarehouse: async (req, res) => {
        try {
            const { warehouseId } = req.params;

            const userRole = req.user.role_name;
            const userId = req.user.id;

            const employees = await userService.getEmployeesByWarehouse(warehouseId, userRole, userId);

            return responseUtils.success(res, 200, 'Warehouse employees retrieved successfully', employees);
        } catch (error) {
            console.error('Get Employees By Warehouse Error:', error);

            if (error.message.includes('does not belong') || error.message.includes('permission')) {
                return responseUtils.forbidden(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to retrieve warehouse employees');
        }
    },

    // Toggle employee status
    toggleEmployeeStatus: async (req, res) => {
        try {
            const { id } = req.params;

            // Validate ID param
            const { error: paramError } = userValidation.userIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid employee ID', paramError.details);
            }

            const userRole = req.user.role_name;
            const userId = req.user.id;
            const userStoreId = req.user.store_id;

            const result = await userService.toggleEmployeeStatus(id, userId, userRole, userId, userStoreId);

            return responseUtils.success(res, 200, result.message, { is_active: result.is_active });
        } catch (error) {
            console.error('Toggle Employee Status Error:', error);

            if (error.message.includes('not found') || error.message.includes('permission')) {
                return responseUtils.notFound(res, error.message);
            }
            if (error.message.includes('cannot change your own')) {
                return responseUtils.badRequest(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to toggle employee status');
        }
    },

    // Get employee statistics
    getEmployeeStats: async (req, res) => {
        try {
            const userRole = req.user.role_name;
            const userId = req.user.id;
            const userStoreId = req.user.store_id;

            const stats = await userService.getEmployeeStats(userRole, userId, userStoreId);

            return responseUtils.success(res, 200, 'Employee statistics retrieved successfully', stats);
        } catch (error) {
            console.error('Get Employee Stats Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve statistics');
        }
    }
};

module.exports = userController;
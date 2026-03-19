const roleService = require('./roles.service');
const roleValidation = require('./roles.validation');
const responseUtils = require('../../utils/response.utils');

const roleController = {
    // Create new role
    createRole: async (req, res) => {
        try {
            // Validate request body
            const { error, value } = roleValidation.createRole.validate(req.body);
            if (error) {
                return responseUtils.validationError(res, 'Validation failed', error.details);
            }

            const role = await roleService.createRole(value);

            return responseUtils.created(res, 'Role created successfully', role);
        } catch (error) {
            console.error('Create Role Error:', error);

            if (error.message.includes('already exists')) {
                return responseUtils.conflict(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to create role');
        }
    },

    // Update role
    updateRole: async (req, res) => {
        try {
            const { id } = req.params;

            // Validate role ID param
            const { error: paramError } = roleValidation.roleIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid role ID', paramError.details);
            }

            // Validate request body
            const { error, value } = roleValidation.updateRole.validate(req.body);
            if (error) {
                return responseUtils.validationError(res, 'Validation failed', error.details);
            }

            const role = await roleService.updateRole(id, value);

            return responseUtils.success(res, 200, 'Role updated successfully', role);
        } catch (error) {
            console.error('Update Role Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }

            if (error.message.includes('already exists')) {
                return responseUtils.conflict(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to update role');
        }
    },

    // Delete role
    deleteRole: async (req, res) => {
        try {
            const { id } = req.params;

            // Validate role ID param
            const { error: paramError } = roleValidation.roleIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid role ID', paramError.details);
            }

            const role = await roleService.deleteRole(id);

            return responseUtils.success(res, 200, 'Role deleted successfully', role);
        } catch (error) {
            console.error('Delete Role Error:', error);

            if (error.message.includes('not found')) {
                return responseUtils.notFound(res, error.message);
            }

            if (error.message.includes('assigned to users')) {
                return responseUtils.conflict(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to delete role');
        }
    },

    // Get all roles
    getAllRoles: async (req, res) => {
        try {
            const roles = await roleService.getAllRoles();
            return responseUtils.success(res, 200, 'Roles retrieved successfully', roles);
        } catch (error) {
            console.error('Get All Roles Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve roles');
        }
    },

    // Get role by ID
    getRoleById: async (req, res) => {
        try {
            const { id } = req.params;

            const { error: paramError } = roleValidation.roleIdParam.validate({ id });
            if (paramError) {
                return responseUtils.validationError(res, 'Invalid role ID', paramError.details);
            }

            const role = await roleService.getRoleById(id);
            return responseUtils.success(res, 200, 'Role retrieved successfully', role);
        } catch (error) {
            console.error('Get Role By ID Error:', error);

            if (error.message === 'Role not found') {
                return responseUtils.notFound(res, error.message);
            }

            return responseUtils.error(res, 500, error.message || 'Failed to retrieve role');
        }
    },

    // Get active roles
    getActiveRoles: async (req, res) => {
        try {
            const roles = await roleService.getActiveRoles();
            return responseUtils.success(res, 200, 'Active roles retrieved successfully', roles);
        } catch (error) {
            console.error('Get Active Roles Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve active roles');
        }
    },

    // Get role statistics
    getRoleStats: async (req, res) => {
        try {
            const stats = await roleService.getRoleStats();
            return responseUtils.success(res, 200, 'Role statistics retrieved successfully', stats);
        } catch (error) {
            console.error('Get Role Stats Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to retrieve role statistics');
        }
    },

    // Create default roles
    createDefaultRoles: async (req, res) => {
        try {
            const roles = await roleService.createDefaultRoles();
            return responseUtils.success(res, 201, 'Default roles created successfully', roles);
        } catch (error) {
            console.error('Create Default Roles Error:', error);
            return responseUtils.error(res, 500, error.message || 'Failed to create default roles');
        }
    }
};

module.exports = roleController;
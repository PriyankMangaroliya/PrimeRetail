const taxModel = require('./taxes.model');

const taxService = {
    // Create new tax (System Admin only)
    createTax: async (taxData) => {
        try {
            // Check if tax name already exists
            const existingTax = await taxModel.checkTaxNameExists(taxData.tax_name);
            if (existingTax.rows.length > 0) {
                throw new Error('Tax name already exists');
            }

            const result = await taxModel.createTax(taxData);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Update tax (System Admin only)
    updateTax: async (id, taxData) => {
        try {
            // Check if tax exists
            const tax = await taxModel.getTaxById(id);
            if (tax.rows.length === 0) {
                throw new Error('Tax not found');
            }

            // Check if tax name already exists (if updating)
            if (taxData.tax_name && taxData.tax_name !== tax.rows[0].tax_name) {
                const existingTax = await taxModel.checkTaxNameExists(taxData.tax_name, id);
                if (existingTax.rows.length > 0) {
                    throw new Error('Tax name already exists');
                }
            }

            const result = await taxModel.updateTax(id, taxData);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Delete tax (System Admin only)
    deleteTax: async (id) => {
        try {
            // Check if tax exists
            const tax = await taxModel.getTaxById(id);
            if (tax.rows.length === 0) {
                throw new Error('Tax not found');
            }

            // Check if tax is used by any products
            const db = require('../../config/database.config');
            const productCheck = await db.query(
                'SELECT COUNT(*) as count FROM product_master WHERE tax_id = $1 AND is_deleted = false',
                [id]
            );

            if (parseInt(productCheck.rows[0].count) > 0) {
                throw new Error('Cannot delete tax as it is assigned to products');
            }

            // Check if tax is used by any stores
            const storeTaxCheck = await db.query(
                'SELECT COUNT(*) as count FROM store_taxes WHERE tax_id = $1 AND is_active = true',
                [id]
            );

            if (parseInt(storeTaxCheck.rows[0].count) > 0) {
                throw new Error('Cannot delete tax as it is assigned to stores');
            }

            const result = await taxModel.deleteTax(id);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Get all taxes (System Admin only)
    getAllTaxes: async () => {
        try {
            const result = await taxModel.getAllTaxes();
            return result.rows;
        } catch (error) {
            throw error;
        }
    },

    // Get active taxes only (Store Owner - for selection)
    getActiveTaxes: async () => {
        try {
            const result = await taxModel.getActiveTaxes();
            return result.rows;
        } catch (error) {
            throw error;
        }
    },

    // Get tax by ID
    getTaxById: async (id) => {
        try {
            const result = await taxModel.getTaxById(id);
            if (result.rows.length === 0) {
                throw new Error('Tax not found');
            }
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Get tax statistics (System Admin only)
    getTaxStats: async () => {
        try {
            const result = await taxModel.getTaxStats();
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Toggle tax status (System Admin only)
    toggleTaxStatus: async (id, updatedBy) => {
        try {
            const tax = await taxModel.getTaxById(id);
            if (tax.rows.length === 0) {
                throw new Error('Tax not found');
            }

            const newStatus = !tax.rows[0].is_active;
            const result = await taxModel.updateTax(id, {
                is_active: newStatus,
                updated_by: updatedBy // Add updated_by
            });

            return {
                id: result.rows[0].id,
                is_active: result.rows[0].is_active,
                message: `Tax ${newStatus ? 'activated' : 'deactivated'} successfully`
            };
        } catch (error) {
            throw error;
        }
    }
};

module.exports = taxService;
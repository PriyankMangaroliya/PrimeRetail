const storeTaxModel = require('./storeTaxes.model');
const taxModel = require('./taxes.model');

const storeTaxService = {
    // Add tax to store
    addStoreTax: async (storeId, taxId) => {
        try {
            // Check if tax exists and is active
            const tax = await taxModel.getTaxById(taxId);
            if (tax.rows.length === 0 || !tax.rows[0].is_active) {
                throw new Error('Tax not found or inactive');
            }

            // Check if tax already added to store
            const existing = await storeTaxModel.checkStoreTaxExists(storeId, taxId);
            if (existing.rows.length > 0) {
                throw new Error('Tax already added to this store');
            }

            const result = await storeTaxModel.addStoreTax({
                store_id: storeId,
                tax_id: taxId
            });

            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Remove tax from store
    removeStoreTax: async (id, storeId) => {
        try {
            // Check if store tax exists and belongs to this store
            const storeTax = await storeTaxModel.getStoreTaxById(id);
            if (storeTax.rows.length === 0) {
                throw new Error('Store tax not found');
            }

            if (storeTax.rows[0].store_id !== storeId) {
                throw new Error('You do not have permission to remove this tax');
            }

            const result = await storeTaxModel.removeStoreTax(id);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Get taxes by store
    getStoreTaxes: async (storeId) => {
        try {
            const result = await storeTaxModel.getTaxesByStore(storeId);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = storeTaxService;
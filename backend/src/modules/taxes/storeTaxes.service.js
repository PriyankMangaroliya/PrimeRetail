const storeTaxModel = require('./storeTaxes.model');
const taxModel = require('./taxes.model');

const storeTaxService = {
    // Add tax to store
    addStoreTax: async (ownerId, taxId) => {
        try {
            // Check if tax exists and is active
            const tax = await taxModel.getTaxById(taxId);
            if (tax.rows.length === 0 || !tax.rows[0].is_active) {
                throw new Error('Tax not found or inactive');
            }

            // Check if tax already added to owner
            const existing = await storeTaxModel.checkStoreTaxExists(ownerId, taxId);
            if (existing.rows.length > 0) {
                throw new Error('Tax already added to this owner');
            }

            const result = await storeTaxModel.addStoreTax({
                owner_id: ownerId,
                tax_id: taxId,
                created_by: ownerId
            });

            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Remove tax from store
    removeStoreTax: async (id, ownerId) => {
        try {
            // Check if store tax exists and belongs to this owner
            const storeTax = await storeTaxModel.getStoreTaxById(id);
            if (storeTax.rows.length === 0) {
                throw new Error('Store tax not found');
            }

            if (storeTax.rows[0].owner_id !== ownerId) {
                throw new Error('You do not have permission to remove this tax');
            }

            // Check if any products are using this tax
            const taxId = storeTax.rows[0].tax_id;
            const usage = await storeTaxModel.getProductsUsingTax(taxId, ownerId);
            if (usage.rows.length > 0) {
                throw new Error(`Cannot remove tax as it is being used by ${usage.rows.length} products. Please deactivate it instead.`);
            }

            const result = await storeTaxModel.removeStoreTax(id, ownerId);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Get taxes by owner
    getStoreTaxes: async (ownerId) => {
        try {
            const result = await storeTaxModel.getTaxesByOwner(ownerId);
            return result.rows;
        } catch (error) {
            throw error;
        }
    },

    // Toggle store tax status
    toggleStoreTaxStatus: async (id, ownerId, is_active) => {
        try {
            const storeTax = await storeTaxModel.getStoreTaxById(id);
            if (storeTax.rows.length === 0) {
                throw new Error('Store tax not found');
            }
            if (storeTax.rows[0].owner_id !== ownerId) {
                throw new Error('Forbidden: You do not own this tax');
            }

            const result = await storeTaxModel.toggleStoreTaxStatus(id, is_active, ownerId);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Get tax usage (products using this tax)
    getTaxUsage: async (id, ownerId) => {
        try {
            const storeTax = await storeTaxModel.getStoreTaxById(id);
            if (storeTax.rows.length === 0) {
                throw new Error('Store tax not found');
            }
            if (storeTax.rows[0].owner_id !== ownerId) {
                throw new Error('Forbidden: You do not own this tax');
            }

            const taxId = storeTax.rows[0].tax_id;
            const products = await storeTaxModel.getProductsUsingTax(taxId, ownerId);

            return {
                tax: storeTax.rows[0],
                products: products.rows
            };
        } catch (error) {
            throw error;
        }
    }
};

module.exports = storeTaxService;
const db = require('../../config/database.config');

const categoryModel = {
    // Create new category (Store Owner only)
    createCategory: (categoryData) => {
        const { owner_id, category_name, description, created_by } = categoryData;
        const query = {
            text: `INSERT INTO category_master
                       (owner_id, category_name, description, created_by, updated_by, is_deleted, created_at, updated_at)
                   VALUES ($1, $2, $3, $4, $4, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`,
            values: [owner_id, category_name, description, created_by]
        };
        return db.query(query);
    },

    // Update category (Store Owner only)
    updateCategory: (id, categoryData) => {
        const { category_name, description, is_active, updated_by } = categoryData;
        const query = {
            text: `UPDATE category_master
                   SET category_name = COALESCE($1, category_name),
                       description = COALESCE($2, description),
                       is_active = COALESCE($3, is_active),
                       updated_by = $4,
                       updated_at = CURRENT_TIMESTAMP
                   WHERE id = $5 AND is_deleted = false RETURNING *`,
            values: [category_name, description, is_active, updated_by, id]
        };
        return db.query(query);
    },

    // Soft delete category (Store Owner only)
    deleteCategory: (id) => {
        const query = {
            text: `UPDATE category_master
                   SET is_deleted = true,
                       updated_at = CURRENT_TIMESTAMP
                   WHERE id = $1 AND is_deleted = false RETURNING *`,
            values: [id]
        };
        return db.query(query);
    },

    // Get all categories (Store Owner - sees their own, others see active only)
    getAllCategories: (userRole, ownerId) => {
        let query;

        if (userRole === 'Store Owner') {
            // Store Owner sees all their categories (including inactive)
            query = {
                text: `SELECT c.*, 
                              COUNT(p.id) as product_count,
                              u1.name as created_by_name, u2.name as updated_by_name
                       FROM category_master c
                       LEFT JOIN product_master p ON c.id = p.category_id AND p.is_deleted = false
                       LEFT JOIN user_master u1 ON c.created_by = u1.id
                       LEFT JOIN user_master u2 ON c.updated_by = u2.id
                       WHERE c.owner_id = $1 AND c.is_deleted = false
                       GROUP BY c.id, u1.name, u2.name
                       ORDER BY c.id DESC`,
                values: [ownerId]
            };
        } else {
            // Other roles (Manager, Cashier, Inventory, Warehouse) see active categories only
            query = {
                text: `SELECT c.id, c.category_name, c.description, c.is_active,
                              COUNT(p.id) as product_count
                       FROM category_master c
                       LEFT JOIN product_master p ON c.id = p.category_id AND p.is_deleted = false
                       WHERE c.is_active = true AND c.is_deleted = false
                       GROUP BY c.id
                       ORDER BY c.category_name`
            };
        }

        return db.query(query);
    },

    // Get category by ID
    getCategoryById: (id, userRole, ownerId) => {
        let query;

        if (userRole === 'Store Owner') {
            query = {
                text: `SELECT c.*, 
                              u1.name as created_by_name, u2.name as updated_by_name,
                              JSON_AGG(
                                  JSON_BUILD_OBJECT(
                                      'id', p.id,
                                      'product_name', p.product_name,
                                      'sku', p.sku,
                                      'price', p.selling_price,
                                      'is_active', p.is_active
                                  ) ORDER BY p.id
                              ) FILTER (WHERE p.id IS NOT NULL) as products
                       FROM category_master c
                       LEFT JOIN product_master p ON c.id = p.category_id AND p.is_deleted = false
                       LEFT JOIN user_master u1 ON c.created_by = u1.id
                       LEFT JOIN user_master u2 ON c.updated_by = u2.id
                       WHERE c.id = $1 AND c.owner_id = $2 AND c.is_deleted = false
                       GROUP BY c.id, u1.name, u2.name`,
                values: [id, ownerId]
            };
        } else {
            query = {
                text: `SELECT c.id, c.category_name, c.description,
                              JSON_AGG(
                                  JSON_BUILD_OBJECT(
                                      'id', p.id,
                                      'product_name', p.product_name,
                                      'sku', p.sku,
                                      'price', p.price
                                  ) ORDER BY p.id
                              ) FILTER (WHERE p.id IS NOT NULL) as products
                       FROM category_master c
                       LEFT JOIN product_master p ON c.id = p.category_id AND p.is_deleted = false
                       WHERE c.id = $1 AND c.is_active = true AND c.is_deleted = false
                       GROUP BY c.id`,
                values: [id]
            };
        }

        return db.query(query);
    },

    // Get category by ID (basic info)
    getCategoryBasicById: (id) => {
        const query = {
            text: `SELECT id, category_name, description, owner_id, is_active
                   FROM category_master
                   WHERE id = $1 AND is_deleted = false`,
            values: [id]
        };
        return db.query(query);
    },

    // Check if category name exists for owner
    checkCategoryNameExists: (owner_id, category_name, excludeId = null) => {
        let query;
        if (excludeId) {
            query = {
                text: `SELECT id FROM category_master 
                       WHERE owner_id = $1 AND category_name = $2 AND id != $3 AND is_deleted = false`,
                values: [owner_id, category_name, excludeId]
            };
        } else {
            query = {
                text: `SELECT id FROM category_master 
                       WHERE owner_id = $1 AND category_name = $2 AND is_deleted = false`,
                values: [owner_id, category_name]
            };
        }
        return db.query(query);
    },

    // Get categories by owner
    getCategoriesByOwner: (ownerId) => {
        const query = {
            text: `SELECT * FROM category_master 
                   WHERE owner_id = $1 AND is_deleted = false 
                   ORDER BY category_name`,
            values: [ownerId]
        };
        return db.query(query);
    },

    // Get active categories for dropdown
    getActiveCategories: (ownerId) => {
        const query = {
            text: `SELECT id, category_name 
                   FROM category_master 
                   WHERE owner_id = $1 AND is_active = true AND is_deleted = false 
                   ORDER BY category_name`,
            values: [ownerId]
        };
        return db.query(query);
    },

    // Get category statistics
    getCategoryStats: (userRole, ownerId) => {
        let query;

        if (userRole === 'Store Owner') {
            query = {
                text: `SELECT 
                           COUNT(*) as total_categories,
                           COUNT(CASE WHEN is_active THEN 1 END) as active_categories,
                           COUNT(CASE WHEN NOT is_active THEN 1 END) as inactive_categories,
                           SUM(product_counts.product_count) as total_products
                       FROM category_master c
                       LEFT JOIN (
                           SELECT category_id, COUNT(*) as product_count
                           FROM product_master
                           WHERE is_deleted = false
                           GROUP BY category_id
                       ) product_counts ON c.id = product_counts.category_id
                       WHERE c.owner_id = $1 AND c.is_deleted = false`,
                values: [ownerId]
            };
        } else {
            query = {
                text: `SELECT 
                           COUNT(*) as total_categories,
                           SUM(product_counts.product_count) as total_products
                       FROM category_master c
                       LEFT JOIN (
                           SELECT category_id, COUNT(*) as product_count
                           FROM product_master
                           WHERE is_deleted = false
                           GROUP BY category_id
                       ) product_counts ON c.id = product_counts.category_id
                       WHERE c.is_active = true AND c.is_deleted = false`
            };
        }

        return db.query(query);
    },

    // Toggle category status (Store Owner only)
    toggleCategoryStatus: (id, is_active) => {
        const query = {
            text: `UPDATE category_master 
                   SET is_active = $1, updated_at = CURRENT_TIMESTAMP
                   WHERE id = $2 AND is_deleted = false RETURNING *`,
            values: [is_active, id]
        };
        return db.query(query);
    }
};

module.exports = categoryModel;
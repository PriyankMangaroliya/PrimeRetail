const db = require('../../config/database.config');

const storeOwnerModel = {
    // Create new store owner (user with Store Owner role)
    createStoreOwner: (ownerData) => {
        const { role_id, name, email, password, phone, profile_image, created_by } = ownerData;
        const query = {
            text: `INSERT INTO user_master 
                   (role_id, name, email, password, phone, profile_image, created_by, updated_by) 
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $7) 
                   RETURNING id, role_id, name, email, phone, profile_image, is_active, created_at`,
            values: [role_id, name, email, password, phone, profile_image, created_by]
        };
        return db.query(query);
    },

    // Get all store owners
    getAllStoreOwners: () => {
        const query = {
            text: `SELECT u.id, u.name, u.email, u.phone, u.profile_image, u.is_active, 
                          u.created_at, u.updated_at, 
                          u.created_by, creator.name as creator_name,
                          u.updated_by, updater.name as updater_name,
                          COUNT(s.id) as store_count
                   FROM user_master u
                   LEFT JOIN store_master s ON u.id = s.owner_id AND s.is_deleted = false
                   LEFT JOIN user_master creator ON u.created_by = creator.id
                   LEFT JOIN user_master updater ON u.updated_by = updater.id
                   WHERE u.role_id = (SELECT id FROM role_master WHERE role_name = 'Store Owner')
                     AND u.is_deleted = false
                   GROUP BY u.id, u.name, u.email, u.phone, u.profile_image, 
                            u.is_active, u.created_at, u.updated_at, 
                            u.created_by, creator.name, u.updated_by, updater.name
                   ORDER BY u.id DESC`
        };
        return db.query(query);
    },

    // Get store owner by ID
    getStoreOwnerById: (id) => {
        const query = {
            text: `SELECT u.id, u.name, u.email, u.phone, u.profile_image, u.is_active,
                          u.created_at, u.updated_at,
                          JSON_AGG(
                              JSON_BUILD_OBJECT(
                                  'id', s.id,
                                  'store_name', s.store_name,
                                  'store_code', s.store_code,
                                  'city', s.city,
                                  'is_active', s.is_active
                              ) ORDER BY s.id
                          ) FILTER (WHERE s.id IS NOT NULL) as stores
                   FROM user_master u
                   LEFT JOIN store_master s ON u.id = s.owner_id AND s.is_deleted = false
                   WHERE u.id = $1 AND u.role_id = (SELECT id FROM role_master WHERE role_name = 'Store Owner')
                     AND u.is_deleted = false
                   GROUP BY u.id, u.name, u.email, u.phone, u.profile_image, 
                            u.is_active, u.created_at, u.updated_at`,
            values: [id]
        };
        return db.query(query);
    },

    // Update store owner
    updateStoreOwner: (id, ownerData) => {
        const { name, email, phone, profile_image, is_active, updated_by, password } = ownerData;
        const query = {
            text: `UPDATE user_master 
                   SET name = COALESCE($1, name),
                       email = COALESCE($2, email),
                       phone = COALESCE($3, phone),
                       profile_image = COALESCE($4, profile_image),
                       is_active = COALESCE($5, is_active),
                       password = COALESCE($6, password),
                       updated_by = $7,
                       updated_at = CURRENT_TIMESTAMP
                   WHERE id = $8 AND role_id = (SELECT id FROM role_master WHERE role_name = 'Store Owner')
                     AND is_deleted = false
                   RETURNING id, role_id, name, email, phone, profile_image, is_active, updated_at`,
            values: [name, email, phone, profile_image, is_active, password, updated_by, id]
        };
        return db.query(query);
    },

    // Soft delete store owner
    deleteStoreOwner: (id, updated_by) => {
        const query = {
            text: `UPDATE user_master 
                   SET is_deleted = true, 
                       updated_by = $1, 
                       updated_at = CURRENT_TIMESTAMP 
                   WHERE id = $2 AND role_id = (SELECT id FROM role_master WHERE role_name = 'Store Owner')
                     AND is_deleted = false
                   RETURNING id`,
            values: [updated_by, id]
        };
        return db.query(query);
    },

    // Get store owner by email
    getStoreOwnerByEmail: (email) => {
        const query = {
            text: `SELECT * FROM user_master 
                   WHERE email = $1 
                     AND role_id = (SELECT id FROM role_master WHERE role_name = 'Store Owner')
                     AND is_deleted = false`,
            values: [email]
        };
        return db.query(query);
    },

    // Get store owner statistics
    getStoreOwnerStats: async () => {
        const query = {
            text: `SELECT 
                       COUNT(DISTINCT u.id) as total_owners,
                       COUNT(DISTINCT s.id) as total_stores,
                       COUNT(DISTINCT CASE WHEN u.is_active THEN u.id END) as active_owners,
                       COUNT(DISTINCT CASE WHEN s.is_active THEN s.id END) as active_stores,
                       COALESCE(AVG(store_counts.store_count), 0) as avg_stores_per_owner
                   FROM user_master u
                   LEFT JOIN store_master s ON u.id = s.owner_id AND s.is_deleted = false
                   LEFT JOIN (
                       SELECT owner_id, COUNT(*) as store_count
                       FROM store_master
                       WHERE is_deleted = false
                       GROUP BY owner_id
                   ) store_counts ON u.id = store_counts.owner_id
                   WHERE u.role_id = (SELECT id FROM role_master WHERE role_name = 'Store Owner')
                     AND u.is_deleted = false`
        };
        return db.query(query);
    },

    // Get stores by owner ID
    getStoresByOwner: (ownerId) => {
        const query = {
            text: `SELECT id, store_name, store_code, address, city, state, 
                          pincode, contact_number, gstin, is_active, created_at
                   FROM store_master
                   WHERE owner_id = $1 AND is_deleted = false
                   ORDER BY id DESC`,
            values: [ownerId]
        };
        return db.query(query);
    }
};

module.exports = storeOwnerModel;
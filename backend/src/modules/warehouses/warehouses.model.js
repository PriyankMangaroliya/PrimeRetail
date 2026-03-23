const db = require('../../config/database.config');

const warehouseModel = {
    // Create new warehouse
    createWarehouse: (warehouseData) => {
        const { owner_id, warehouse_code, warehouse_name, location, contact_number, created_by } = warehouseData;
        const query = {
            text: `INSERT INTO warehouse_master
                       (owner_id, warehouse_code, warehouse_name, location, contact_number, created_by, updated_by)
                   VALUES ($1, $2, $3, $4, $5, $6, $6) RETURNING *`,
            values: [owner_id, warehouse_code, warehouse_name, location, contact_number, created_by]
        };
        return db.query(query);
    },

    // Update warehouse
    updateWarehouse: (id, warehouseData, updatedBy = null) => {
        const { warehouse_name, location, contact_number, is_active } = warehouseData;
        const query = {
            text: `UPDATE warehouse_master
                   SET warehouse_name    = COALESCE($1, warehouse_name),
                       location         = COALESCE($2, location),
                       contact_number   = COALESCE($3, contact_number),
                       is_active        = COALESCE($4, is_active),
                       updated_by       = COALESCE($5, updated_by),
                       updated_at       = CURRENT_TIMESTAMP
                   WHERE id = $6 RETURNING *`,
            values: [warehouse_name, location, contact_number, is_active, updatedBy, id]
        };
        return db.query(query);
    },

    // Delete warehouse (set is_active to false)
    deleteWarehouse: (id) => {
        const query = {
            text: `UPDATE warehouse_master
                   SET is_deleted = True,
                       updated_at = CURRENT_TIMESTAMP
                   WHERE id = $1 RETURNING *`,
            values: [id]
        };
        return db.query(query);
    },

    // Get all warehouses (for Super Admin)
    getAllWarehouses: () => {
        const query = {
            text: `SELECT w.*, u.name as owner_name, u.email as owner_email,
                          COUNT(DISTINCT staff.id) as staff_count,
                          COUNT(DISTINCT s.id) as stock_count
                   FROM warehouse_master w
                            LEFT JOIN user_master u ON w.owner_id = u.id
                            LEFT JOIN user_master staff ON w.id = staff.warehouse_id AND staff.is_deleted = false
                            LEFT JOIN stock_master s ON w.id = s.location_id AND s.location_type = 'Warehouse'
                   GROUP BY w.id, u.name, u.email
                   ORDER BY w.id DESC`
        };
        return db.query(query);
    },

    // Get warehouses by owner (for Store Owner) — includes creator/updater names
    getWarehousesByOwner: (ownerId) => {
        const query = {
            text: `SELECT w.*,
                          uc.name  AS created_by_name,
                          uu.name  AS updated_by_name,
                          COUNT(DISTINCT staff.id) AS staff_count,
                          COUNT(DISTINCT s.id)     AS stock_count
                   FROM warehouse_master w
                            LEFT JOIN user_master uc    ON w.created_by   = uc.id
                            LEFT JOIN user_master uu    ON w.updated_by   = uu.id
                            LEFT JOIN user_master staff ON w.id = staff.warehouse_id AND staff.is_deleted = false
                            LEFT JOIN stock_master s    ON w.id = s.location_id AND s.location_type = 'Warehouse'
                   WHERE w.owner_id = $1 AND w.is_deleted = false
                   GROUP BY w.id, uc.name, uu.name
                   ORDER BY w.id DESC`,
            values: [ownerId]
        };
        return db.query(query);
    },

    // Get active warehouses only
    getActiveWarehouses: (ownerId) => {
        const query = {
            text: `SELECT * FROM warehouse_master
                   WHERE owner_id = $1 AND is_active = true
                   ORDER BY id DESC`,
            values: [ownerId]
        };
        return db.query(query);
    },

    // Get warehouse by ID with role-based filtering
    getWarehouseById: (id, userRole, userId) => {
        let query;

        if (userRole === 'Super Admin') {
            query = {
                text: `SELECT w.*, u.name as owner_name, u.email as owner_email,
                              (
                                  SELECT JSON_AGG(
                                             JSON_BUILD_OBJECT(
                                                     'id', stf.id,
                                                     'name', stf.name,
                                                     'email', stf.email,
                                                     'role', rl.role_name
                                             ) ORDER BY stf.id
                                         )
                                  FROM user_master stf
                                  LEFT JOIN role_master rl ON stf.role_id = rl.id
                                  WHERE stf.warehouse_id = w.id AND stf.is_deleted = false
                              ) as staff,
                              (
                                  SELECT COUNT(DISTINCT s.id)
                                  FROM stock_master s
                                  WHERE s.location_id = w.id AND s.location_type = 'Warehouse'
                              ) as total_stock_items,
                              (
                                  SELECT COALESCE(SUM(s.quantity), 0)
                                  FROM stock_master s
                                  WHERE s.location_id = w.id AND s.location_type = 'Warehouse'
                              ) as total_quantity
                       FROM warehouse_master w
                                LEFT JOIN user_master u ON w.owner_id = u.id
                       WHERE w.id = $1`,
                values: [id]
            };
        } else if (userRole === 'Store Owner') {
            query = {
                text: `SELECT w.*,
                              u.name AS owner_name,
                              u.email AS owner_email,
                              uc.name AS created_by_name,
                              uu.name AS updated_by_name,
                              (
                                  SELECT JSON_AGG(
                                             JSON_BUILD_OBJECT(
                                                     'id', stf.id,
                                                     'name', stf.name,
                                                     'email', stf.email,
                                                     'role', rl.role_name
                                             ) ORDER BY stf.id
                                         )
                                  FROM user_master stf
                                  LEFT JOIN role_master rl ON stf.role_id = rl.id
                                  WHERE stf.warehouse_id = w.id AND stf.is_deleted = false
                              ) AS staff,
                              (
                                  SELECT COUNT(DISTINCT s.id)
                                  FROM stock_master s
                                  WHERE s.location_id = w.id AND s.location_type = 'Warehouse'
                              ) AS total_stock_items,
                              (
                                  SELECT COALESCE(SUM(s.quantity), 0)
                                  FROM stock_master s
                                  WHERE s.location_id = w.id AND s.location_type = 'Warehouse'
                              ) AS total_quantity
                       FROM warehouse_master w
                                LEFT JOIN user_master u     ON w.owner_id = u.id
                                LEFT JOIN user_master uc    ON w.created_by  = uc.id
                                LEFT JOIN user_master uu    ON w.updated_by  = uu.id
                       WHERE w.id = $1 AND w.owner_id = $2`,
                values: [id, userId]
            };
        } else if (userRole === 'Warehouse Staff') {
            query = {
                text: `SELECT w.*,
                              u.name AS owner_name,
                              u.email AS owner_email,
                              (
                                  SELECT COUNT(DISTINCT s.id)
                                  FROM stock_master s
                                  WHERE s.location_id = w.id AND s.location_type = 'Warehouse'
                              ) as total_stock_items,
                              (
                                  SELECT COALESCE(SUM(s.quantity), 0)
                                  FROM stock_master s
                                  WHERE s.location_id = w.id AND s.location_type = 'Warehouse'
                              ) as total_quantity
                       FROM warehouse_master w
                                LEFT JOIN user_master u ON w.owner_id = u.id
                       WHERE w.id = $1 AND w.id = $2`,
                values: [id, userId]
            };
        } else {
            return Promise.resolve({ rows: [] });
        }

        return db.query(query);
    },

    // Get single warehouse by ID (basic info)
    getWarehouseBasicById: (id) => {
        const query = {
            text: `SELECT id, warehouse_name, warehouse_code, location, contact_number, is_active
                   FROM warehouse_master
                   WHERE id = $1`,
            values: [id]
        };
        return db.query(query);
    },

    // Check if warehouse code exists
    checkWarehouseCodeExists: (warehouse_code, excludeId = null) => {
        let query;
        if (excludeId) {
            query = {
                text: `SELECT id FROM warehouse_master
                       WHERE warehouse_code = $1 AND id != $2`,
                values: [warehouse_code, excludeId]
            };
        } else {
            query = {
                text: `SELECT id FROM warehouse_master
                       WHERE warehouse_code = $1`,
                values: [warehouse_code]
            };
        }
        return db.query(query);
    },

    // Get warehouse statistics
    getWarehouseStats: (userRole, userId) => {
        let query;

        if (userRole === 'Super Admin') {
            query = {
                text: `SELECT
                           COUNT(*) as total_warehouses,
                           COUNT(CASE WHEN is_active THEN 1 END) as active_warehouses,
                           COUNT(CASE WHEN NOT is_active THEN 1 END) as inactive_warehouses,
                           SUM(staff_counts.staff_count) as total_staff,
                           SUM(stock_counts.stock_count) as total_stock_items,
                           SUM(stock_counts.total_quantity) as total_quantity
                       FROM warehouse_master w
                                LEFT JOIN (
                           SELECT warehouse_id, COUNT(*) as staff_count
                           FROM user_master
                           WHERE warehouse_id IS NOT NULL AND is_deleted = false
                           GROUP BY warehouse_id
                       ) staff_counts ON w.id = staff_counts.warehouse_id
                                LEFT JOIN (
                           SELECT location_id, COUNT(*) as stock_count, SUM(quantity) as total_quantity
                           FROM stock_master
                           WHERE location_type = 'Warehouse'
                           GROUP BY location_id
                       ) stock_counts ON w.id = stock_counts.location_id`
            };
        } else if (userRole === 'Store Owner') {
            query = {
                text: `SELECT
                           COUNT(*) as total_warehouses,
                           COUNT(CASE WHEN is_active THEN 1 END) as active_warehouses,
                           COUNT(CASE WHEN NOT is_active THEN 1 END) as inactive_warehouses,
                           SUM(staff_counts.staff_count) as total_staff,
                           SUM(stock_counts.stock_count) as total_stock_items,
                           SUM(stock_counts.total_quantity) as total_quantity
                       FROM warehouse_master w
                                LEFT JOIN (
                           SELECT warehouse_id, COUNT(*) as staff_count
                           FROM user_master
                           WHERE warehouse_id IS NOT NULL AND is_deleted = false
                           GROUP BY warehouse_id
                       ) staff_counts ON w.id = staff_counts.warehouse_id
                                LEFT JOIN (
                           SELECT location_id, COUNT(*) as stock_count, SUM(quantity) as total_quantity
                           FROM stock_master
                           WHERE location_type = 'Warehouse'
                           GROUP BY location_id
                       ) stock_counts ON w.id = stock_counts.location_id
                       WHERE w.owner_id = $1`,
                values: [userId]
            };
        } else {
            return Promise.resolve({ rows: [{}] });
        }

        return db.query(query);
    },

    // Get warehouse dropdown (for forms)
    getWarehouseDropdown: (userRole, userId) => {
        let query;

        if (userRole === 'Super Admin') {
            query = {
                text: `SELECT id, warehouse_name, warehouse_code, location
                       FROM warehouse_master
                       WHERE is_active = true
                       ORDER BY warehouse_name`
            };
        } else if (userRole === 'Store Owner') {
            query = {
                text: `SELECT id, warehouse_name, warehouse_code, location
                       FROM warehouse_master
                       WHERE owner_id = $1 AND is_active = true
                       ORDER BY warehouse_name`,
                values: [userId]
            };
        } else if (userRole === 'Warehouse Staff') {
            query = {
                text: `SELECT id, warehouse_name, warehouse_code, location
                       FROM warehouse_master
                       WHERE id = $1 AND is_active = true`,
                values: [userId]
            };
        } else {
            return Promise.resolve({ rows: [] });
        }

        return db.query(query);
    },

    // Get warehouses by owner ID (for validation)
    getWarehousesByOwnerId: (ownerId) => {
        const query = {
            text: `SELECT id FROM warehouse_master
                   WHERE owner_id = $1`,
            values: [ownerId]
        };
        return db.query(query);
    }
};

module.exports = warehouseModel;
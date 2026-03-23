const db = require('../../config/database.config');

const customerModel = {
    // Create new customer
    createCustomer: (customerData) => {
        const { name, phone, email, address, gst_number, created_by } = customerData;
        const query = {
            text: `INSERT INTO customer_master 
             (name, phone, email, address, gst_number, created_by, updated_by) 
             VALUES ($1, $2, $3, $4, $5, $6, $6) RETURNING *`,
            values: [name, phone, email, address, gst_number, created_by]
        };
        return db.query(query);
    },

    // Update customer
    updateCustomer: (id, customerData) => {
        const { name, phone, email, address, loyalty_points, gst_number, is_active, updated_by } = customerData;
        const query = {
            text: `UPDATE customer_master 
             SET name = COALESCE($1, name),
                 phone = COALESCE($2, phone),
                 email = COALESCE($3, email),
                 address = COALESCE($4, address),
                 loyalty_points = COALESCE($5, loyalty_points),
                 gst_number = COALESCE($6, gst_number),
                 is_active = COALESCE($7, is_active),
                 updated_by = $8,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $9 AND is_deleted = false RETURNING *`,
            values: [name, phone, email, address, loyalty_points, gst_number, is_active, updated_by, id]
        };
        return db.query(query);
    },

    // Soft delete customer
    deleteCustomer: (id, updated_by) => {
        const query = {
            text: `UPDATE customer_master 
             SET is_deleted = true, 
                 updated_by = $1, 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 AND is_deleted = false RETURNING *`,
            values: [updated_by, id]
        };
        return db.query(query);
    },

    // Get all customers
    getAllCustomers: () => {
        const query = {
            text: `SELECT * FROM customer_master 
             WHERE is_deleted = false 
             ORDER BY name ASC`
        };
        return db.query(query);
    },

    // Get customer by ID
    getCustomerById: (id) => {
        const query = {
            text: `SELECT * FROM customer_master 
             WHERE id = $1 AND is_deleted = false`,
            values: [id]
        };
        return db.query(query);
    },

    // Get customer by phone
    getCustomerByPhone: (phone) => {
        const query = {
            text: `SELECT * FROM customer_master 
             WHERE phone = $1 AND is_deleted = false`,
            values: [phone]
        };
        return db.query(query);
    },

    // Update loyalty points
    updateLoyaltyPoints: (id, points, updated_by) => {
        const query = {
            text: `UPDATE customer_master 
             SET loyalty_points = loyalty_points + $1,
                 updated_by = $2,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3 AND is_deleted = false RETURNING *`,
            values: [points, updated_by, id]
        };
        return db.query(query);
    }
};

module.exports = customerModel;

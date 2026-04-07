const stockModel = require('./stock.model');
const userModel = require('../users/users.model');
const { sendEmail } = require('../../utils/mail.utils');
const db = require('../../config/database.config');

const inventoryNotificationsService = {
    /**
     * Check if stock level is below min_stock and notify relevant users
     * @param {number} stockId - The ID of the stock entry that was updated
     */
    checkAndNotifyLowStock: async (stockId) => {
        try {
            // 1. Get stock and product details
            const stockRes = await stockModel.getStockById(stockId);
            const stock = stockRes.rows[0];

            if (!stock) {
                console.warn(`Low stock check failed: Stock ID ${stockId} not found`);
                return;
            }

            const {
                product_id, product_name, sku, quantity, min_stock,
                location_type, location_id, location_name, location_code
            } = stock;

            // 2. Check if quantity is at or below threshold
            // threshold = min_stock (default)
            if (quantity > min_stock) {
                return; // Stock is healthy
            }

            console.log(`Low stock detected for ${product_name} (${sku}) at ${location_name}. Qty: ${quantity}, Min: ${min_stock}`);

            // 3. Find recipients based on specific ownership rules
            let ownerEmail = '';
            let bccRecipients = [];

            if (location_type === 'Store') {
                // Get Store Owner ID
                const storeInfoRes = await db.query('SELECT owner_id FROM store_master WHERE id = $1', [location_id]);
                const ownerId = storeInfoRes.rows[0]?.owner_id;

                if (ownerId) {
                    // To: Store Owner
                    const ownerRes = await userModel.getUserById(ownerId);
                    ownerEmail = ownerRes.rows[0]?.email;

                    // BCC: Store Staff (Managers, Inventory Staff)
                    const storeStaffRes = await db.query(`
                        SELECT u.email FROM user_master u
                        JOIN role_master r ON u.role_id = r.id
                        WHERE u.store_id = $1 
                        AND r.role_name IN ('Store Manager', 'Inventory Staff')
                        AND u.is_active = true AND u.is_deleted = false
                    `, [location_id]);
                    bccRecipients.push(...storeStaffRes.rows.map(r => r.email));

                    // BCC: Owner's Warehouse Staff
                    const warehouseStaffRes = await db.query(`
                        SELECT u.email FROM user_master u
                        JOIN warehouse_master w ON u.warehouse_id = w.id
                        JOIN role_master r ON u.role_id = r.id
                        WHERE w.owner_id = $1 
                        AND r.role_name = 'Warehouse Staff'
                        AND u.is_active = true AND u.is_deleted = false
                    `, [ownerId]);
                    bccRecipients.push(...warehouseStaffRes.rows.map(r => r.email));
                }
            } else if (location_type === 'Warehouse') {
                // Get Warehouse Owner ID
                const warehouseInfoRes = await db.query('SELECT owner_id FROM warehouse_master WHERE id = $1', [location_id]);
                const ownerId = warehouseInfoRes.rows[0]?.owner_id;

                if (ownerId) {
                    // To: Store Owner
                    const ownerRes = await userModel.getUserById(ownerId);
                    ownerEmail = ownerRes.rows[0]?.email;

                    // BCC: Assigned Warehouse All Staff
                    const warehouseStaffRes = await db.query(`
                        SELECT u.email FROM user_master u
                        JOIN role_master r ON u.role_id = r.id
                        WHERE u.warehouse_id = $1 
                        AND r.role_name = 'Warehouse Staff'
                        AND u.is_active = true AND u.is_deleted = false
                    `, [location_id]);
                    bccRecipients.push(...warehouseStaffRes.rows.map(r => r.email));
                }
            }

            // Remove duplicates and empty emails
            bccRecipients = [...new Set(bccRecipients)].filter(email => email && email.includes('@') && email !== ownerEmail);

            if (!ownerEmail && bccRecipients.length === 0) {
                console.warn('Low stock notification skipped: No active recipients found');
                return;
            }

            // 4. Compose and Send Email
            const subject = `⚠️ Low Stock Alert: ${product_name} (${location_code})`;
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #ef4444;">Low Stock Notification</h2>
                        <p style="color: #6b7280;">Attention required for inventory levels.</p>
                    </div>
                    
                    <div style="background: #fdf2f2; border-left: 4px solid #ef4444; padding: 15px; margin-bottom: 20px;">
                        <p style="margin: 0; font-weight: bold; color: #b91c1c;">
                            Product: ${product_name}
                        </p>
                        <p style="margin: 5px 0 0 0; font-size: 14px;">
                            SKU: <span style="font-family: monospace; background: #fee2e2; padding: 2px 4px; border-radius: 4px;">${sku}</span>
                        </p>
                    </div>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #6b7280;">Location</td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">${location_name} (${location_code})</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #6b7280;">Current Quantity</td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #ef4444;">${quantity} Units</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #6b7280;">Minimum Threshold</td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">${min_stock} Units</td>
                        </tr>
                    </table>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <p style="font-size: 14px; color: #9ca3af;">
                            Please take necessary action to replenish stock at this location.
                        </p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 12px; color: #9ca3af;">
                            This is an automated notification from Prime Retail Management System.
                        </p>
                    </div>
                </div>
            `;

            console.log(`Sending low stock email. To: ${ownerEmail || 'System Email (Owner Not Found)'}, BCC Count: ${bccRecipients.length}`);

            const mailOptions = {
                to: ownerEmail || process.env.SMTP_FROM || 'noreply@primeretail.com',
                subject,
                html
            };

            if (bccRecipients.length > 0) {
                mailOptions.bcc = bccRecipients.join(', ');
            }
            
            // Send ONE email
            await sendEmail(mailOptions);

        } catch (error) {
            console.error('Inventory Notification Error:', error);
        }
    }
};

module.exports = inventoryNotificationsService;

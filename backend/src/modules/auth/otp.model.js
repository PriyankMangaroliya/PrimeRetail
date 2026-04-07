const db = require('../../config/database.config');

const otpModel = {
    // Create new OTP
    createOTP: (email, otpCode, expiresAt) => {
        const query = {
            text: `INSERT INTO otp_master (email, otp_code, expires_at) 
                   VALUES ($1, $2, $3) RETURNING *`,
            values: [email, otpCode, expiresAt]
        };
        return db.query(query);
    },

    // Get latest OTP by email
    getLatestOTPByEmail: (email) => {
        const query = {
            text: `SELECT * FROM otp_master 
                   WHERE email = $1 
                   ORDER BY created_at DESC LIMIT 1`,
            values: [email]
        };
        return db.query(query);
    },

    // Verify OTP (Check code and mark as verified)
    verifyOTP: (email, otpCode) => {
        const query = {
            text: `UPDATE otp_master 
                   SET is_verified = true 
                   WHERE email = $1 AND otp_code = $2 AND expires_at > CURRENT_TIMESTAMP AND is_verified = false
                   RETURNING *`,
            values: [email, otpCode]
        };
        return db.query(query);
    },

    // Check if OTP is verified for an email (for password reset)
    checkIsVerified: (email, otpCode) => {
        const query = {
            text: `SELECT * FROM otp_master 
                   WHERE email = $1 AND otp_code = $2 AND is_verified = true AND expires_at > CURRENT_TIMESTAMP - INTERVAL '15 minutes'
                   ORDER BY created_at DESC LIMIT 1`,
            values: [email, otpCode]
        };
        return db.query(query);
    },

    // Delete expired OTPs (optional cleanup)
    deleteExpiredOTPs: () => {
        const query = {
            text: `DELETE FROM otp_master WHERE expires_at < CURRENT_TIMESTAMP`,
        };
        return db.query(query);
    }
};

module.exports = otpModel;

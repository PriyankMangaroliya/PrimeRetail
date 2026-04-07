const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

// Public routes (no token required)
router.post('/register', authMiddleware.checkFirstAdmin, authController.registerFirstAdmin);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp', authController.verifyOTP);
router.post('/reset-password', authController.resetPassword);

// Protected routes (token required)
router.post('/logout', authMiddleware.verifyToken, authController.logout);
router.get('/profile', authMiddleware.verifyToken, authController.getProfile);
router.put('/update-profile', authMiddleware.verifyToken, authController.updateProfile);
router.put('/change-password', authMiddleware.verifyToken, authController.changePassword);

module.exports = router;
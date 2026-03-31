"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const validation_middleware_1 = require("../middleware/validation.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const authController = __importStar(require("../controllers/auth.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Login
router.post('/login', rateLimit_middleware_1.authLimiter, (0, validation_middleware_1.validate)([
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password required')
]), authController.login);
// Register
router.post('/register', (0, validation_middleware_1.validate)([
    (0, express_validator_1.body)('name').notEmpty().withMessage('Name required'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email required'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    (0, express_validator_1.body)('role')
        .optional()
        .isIn(['admin', 'csr', 'sales'])
        .withMessage('Invalid role')
]), authController.register);
// Logout
router.post('/logout', authController.logout);
// Refresh token
router.post('/refresh', authController.refreshToken);
router.get('/verify', auth_middleware_1.authenticate, authController.verifyToken);
// Change password
router.post('/change-password', (0, validation_middleware_1.validate)([
    (0, express_validator_1.body)('currentPassword').notEmpty().withMessage('Current password required'),
    (0, express_validator_1.body)('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters')
]), authController.changePassword);
// Forgot password
router.post('/forgot-password', (0, validation_middleware_1.validate)([
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email required')
]), authController.forgotPassword);
// Reset password
router.post('/reset-password', (0, validation_middleware_1.validate)([
    (0, express_validator_1.body)('token').notEmpty().withMessage('Token required'),
    (0, express_validator_1.body)('newPassword')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
]), authController.resetPassword);
// Verify email
router.get('/verify-email/:token', authController.verifyEmail);
exports.default = router;

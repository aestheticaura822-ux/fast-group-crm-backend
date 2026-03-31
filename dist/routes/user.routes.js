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
const auth_middleware_1 = require("../middleware/auth.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const userController = __importStar(require("../controllers/user.controller"));
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// Get all users (admin only)
router.get('/', rbac_middleware_1.isAdmin, userController.getUsers);
// Get user by ID
router.get('/:id', userController.getUserById);
// Create user (admin only)
router.post('/', rbac_middleware_1.isAdmin, (0, validation_middleware_1.validate)([
    (0, express_validator_1.body)('name').notEmpty().withMessage('Name required'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email required'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    (0, express_validator_1.body)('role')
        .isIn(['admin', 'csr', 'sales'])
        .withMessage('Invalid role')
]), userController.createUser);
// Update user
router.put('/:id', (0, validation_middleware_1.validate)([
    (0, express_validator_1.body)('name').optional().notEmpty(),
    (0, express_validator_1.body)('email').optional().isEmail(),
    (0, express_validator_1.body)('role').optional().isIn(['admin', 'csr', 'sales']),
    (0, express_validator_1.body)('is_active').optional().isBoolean()
]), userController.updateUser);
// Delete user (admin only)
router.delete('/:id', rbac_middleware_1.isAdmin, userController.deleteUser);
// Get user statistics
router.get('/:id/stats', userController.getUserStats);
exports.default = router;

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
const notificationController = __importStar(require("../controllers/notification.controller"));
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// Get notification settings
router.get('/settings', notificationController.getSettings);
// Update notification settings
router.put('/settings', rbac_middleware_1.isAdmin, (0, validation_middleware_1.validate)([
    (0, express_validator_1.body)('email_notifications').optional().isBoolean(),
    (0, express_validator_1.body)('push_notifications').optional().isBoolean(),
    (0, express_validator_1.body)('sms_notifications').optional().isBoolean()
]), notificationController.updateSettings);
// Test email
router.post('/test-email', rbac_middleware_1.isAdmin, (0, validation_middleware_1.validate)([
    (0, express_validator_1.body)('email').isEmail()
]), notificationController.testEmail);
// Get notification templates
router.get('/templates', rbac_middleware_1.isAdmin, notificationController.getTemplates);
// Update notification template
router.put('/templates/:templateId', rbac_middleware_1.isAdmin, (0, validation_middleware_1.validate)([
    (0, express_validator_1.body)('subject').optional().notEmpty(),
    (0, express_validator_1.body)('body').optional().notEmpty()
]), notificationController.updateTemplate);
exports.default = router;

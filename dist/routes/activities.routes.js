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
const validation_middleware_1 = require("../middleware/validation.middleware");
const activitiesController = __importStar(require("../controllers/activities.controller"));
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// ==================== GET ALL ACTIVITIES ====================
router.get('/', (0, validation_middleware_1.validate)([
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
    (0, express_validator_1.query)('type').optional().isIn(['call', 'email', 'note', 'status_change', 'assignment']).withMessage('Invalid activity type'),
    (0, express_validator_1.query)('leadId').optional().isUUID().withMessage('Invalid lead ID'),
    (0, express_validator_1.query)('userId').optional().isUUID().withMessage('Invalid user ID')
]), activitiesController.getActivities);
// ==================== GET ACTIVITIES FOR A SPECIFIC LEAD ====================
router.get('/lead/:leadId', (0, validation_middleware_1.validate)([
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 })
]), activitiesController.getLeadActivities);
// ==================== GET ACTIVITIES FOR A SPECIFIC USER ====================
router.get('/user/:userId', (0, validation_middleware_1.validate)([
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 })
]), activitiesController.getUserActivities);
// ==================== CREATE A NEW ACTIVITY ====================
router.post('/', (0, validation_middleware_1.validate)([
    (0, express_validator_1.body)('leadId').isUUID().withMessage('Valid lead ID required'),
    (0, express_validator_1.body)('type').isIn(['call', 'email', 'note', 'status_change', 'assignment']).withMessage('Valid activity type required'),
    (0, express_validator_1.body)('notes').optional().isString().withMessage('Notes must be string')
]), activitiesController.createActivity);
// ✅ DEFAULT EXPORT - IMPORTANT!
exports.default = router;

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
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const leadController = __importStar(require("../controllers/lead.controller"));
const router = (0, express_1.Router)();
// Public route for lead creation (no auth)
router.post('/public', rateLimit_middleware_1.createLeadLimiter, (0, validation_middleware_1.validate)([
    (0, express_validator_1.body)('name').notEmpty().withMessage('Name required'),
    (0, express_validator_1.body)('phone').notEmpty().withMessage('Phone required'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email required'),
    (0, express_validator_1.body)('company').notEmpty().withMessage('Company required'),
    (0, express_validator_1.body)('message').notEmpty().withMessage('Message required')
]), leadController.createPublicLead);
// Protected routes
router.use(auth_middleware_1.authenticate);
// Get leads (with filters)
router.get('/', (0, validation_middleware_1.validate)([
    (0, express_validator_1.query)('status').optional().isIn([
        'new', 'contacted', 'followup', 'interested', 'converted', 'not_interested'
    ]),
    (0, express_validator_1.query)('type').optional().isIn(['hot', 'warm', 'cold']),
    (0, express_validator_1.query)('source').optional().isIn([
        'website', 'facebook', 'instagram', 'linkedin', 'maps', 'manual', 'csv', 'import'
    ]),
    (0, express_validator_1.query)('assigned_to').optional().isUUID(),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 })
]), leadController.getLeads);
// Get lead by ID
router.get('/:id', leadController.getLeadById);
// Create lead
router.post('/', rbac_middleware_1.isAdminOrCSR, (0, validation_middleware_1.validate)([
    (0, express_validator_1.body)('name').notEmpty().withMessage('Name required'),
    (0, express_validator_1.body)('phone').notEmpty().withMessage('Phone required'),
    (0, express_validator_1.body)('email').optional().isEmail(),
    (0, express_validator_1.body)('type').optional().isIn(['hot', 'warm', 'cold']),
    (0, express_validator_1.body)('status').optional().isIn([
        'new', 'contacted', 'followup', 'interested', 'converted', 'not_interested'
    ]),
    (0, express_validator_1.body)('source').optional().isIn([
        'website', 'facebook', 'instagram', 'linkedin', 'maps', 'manual', 'csv', 'import'
    ])
]), leadController.createLead);
// Update lead
router.put('/:id', (0, validation_middleware_1.validate)([
    (0, express_validator_1.body)('name').optional().notEmpty(),
    (0, express_validator_1.body)('phone').optional().notEmpty(),
    (0, express_validator_1.body)('email').optional().isEmail(),
    (0, express_validator_1.body)('type').optional().isIn(['hot', 'warm', 'cold']),
    (0, express_validator_1.body)('status').optional().isIn([
        'new', 'contacted', 'followup', 'interested', 'converted', 'not_interested'
    ])
]), leadController.updateLead);
// Delete lead
router.delete('/:id', rbac_middleware_1.isAdminOrCSR, leadController.deleteLead);
// Assign lead
router.post('/:id/assign', rbac_middleware_1.isAdminOrCSR, (0, validation_middleware_1.validate)([
    (0, express_validator_1.body)('userId').isUUID().withMessage('Valid user ID required')
]), leadController.assignLead);
// Convert lead (sales only)
router.post('/:id/convert', rbac_middleware_1.isAdminOrSales, (0, validation_middleware_1.validate)([
    (0, express_validator_1.body)('dealValue').isNumeric().withMessage('Valid deal value required')
]), leadController.convertLead);
// Get lead activities
router.get('/:id/activities', leadController.getLeadActivities);
// Add activity to lead
router.post('/:id/activities', (0, validation_middleware_1.validate)([
    (0, express_validator_1.body)('activity_type').isIn(['call', 'email', 'note']),
    (0, express_validator_1.body)('notes').optional().notEmpty()
]), leadController.addLeadActivity);
exports.default = router;

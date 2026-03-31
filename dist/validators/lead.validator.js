"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertLeadValidator = exports.assignLeadValidator = exports.updateLeadValidator = exports.createLeadValidator = void 0;
const express_validator_1 = require("express-validator");
exports.createLeadValidator = [
    (0, express_validator_1.body)('name')
        .notEmpty()
        .withMessage('Name is required'),
    (0, express_validator_1.body)('phone')
        .notEmpty()
        .withMessage('Phone is required'),
    (0, express_validator_1.body)('email')
        .optional()
        .isEmail()
        .withMessage('Valid email required'),
    (0, express_validator_1.body)('type')
        .optional()
        .isIn(['hot', 'warm', 'cold'])
        .withMessage('Invalid lead type'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['new', 'contacted', 'followup', 'interested', 'converted', 'not_interested'])
        .withMessage('Invalid status'),
    (0, express_validator_1.body)('source')
        .optional()
        .isIn(['website', 'facebook', 'instagram', 'linkedin', 'maps', 'manual', 'csv', 'import'])
        .withMessage('Invalid source')
];
exports.updateLeadValidator = [
    (0, express_validator_1.body)('name')
        .optional()
        .notEmpty()
        .withMessage('Name cannot be empty'),
    (0, express_validator_1.body)('phone')
        .optional()
        .notEmpty()
        .withMessage('Phone cannot be empty'),
    (0, express_validator_1.body)('email')
        .optional()
        .isEmail()
        .withMessage('Valid email required'),
    (0, express_validator_1.body)('type')
        .optional()
        .isIn(['hot', 'warm', 'cold'])
        .withMessage('Invalid lead type'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['new', 'contacted', 'followup', 'interested', 'converted', 'not_interested'])
        .withMessage('Invalid status')
];
exports.assignLeadValidator = [
    (0, express_validator_1.body)('userId')
        .isUUID()
        .withMessage('Valid user ID required')
];
exports.convertLeadValidator = [
    (0, express_validator_1.body)('dealValue')
        .isNumeric()
        .withMessage('Valid deal value required')
        .custom(value => value > 0)
        .withMessage('Deal value must be positive')
];

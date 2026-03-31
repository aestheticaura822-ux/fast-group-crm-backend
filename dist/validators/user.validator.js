"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserValidator = exports.createUserValidator = void 0;
const express_validator_1 = require("express-validator");
exports.createUserValidator = [
    (0, express_validator_1.body)('name')
        .notEmpty()
        .withMessage('Name is required'),
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Valid email required'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    (0, express_validator_1.body)('role')
        .isIn(['admin', 'csr', 'sales'])
        .withMessage('Invalid role')
];
exports.updateUserValidator = [
    (0, express_validator_1.body)('name')
        .optional()
        .notEmpty()
        .withMessage('Name cannot be empty'),
    (0, express_validator_1.body)('email')
        .optional()
        .isEmail()
        .withMessage('Valid email required'),
    (0, express_validator_1.body)('role')
        .optional()
        .isIn(['admin', 'csr', 'sales'])
        .withMessage('Invalid role'),
    (0, express_validator_1.body)('is_active')
        .optional()
        .isBoolean()
        .withMessage('is_active must be boolean')
];

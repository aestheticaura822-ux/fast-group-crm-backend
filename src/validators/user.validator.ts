import { body } from 'express-validator'

export const createUserValidator = [
  body('name')
    .notEmpty()
    .withMessage('Name is required'),
  body('email')
    .isEmail()
    .withMessage('Valid email required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .isIn(['admin', 'csr', 'sales'])
    .withMessage('Invalid role')
]

export const updateUserValidator = [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Name cannot be empty'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email required'),
  body('role')
    .optional()
    .isIn(['admin', 'csr', 'sales'])
    .withMessage('Invalid role'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be boolean')
]
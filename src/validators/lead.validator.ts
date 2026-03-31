import { body } from 'express-validator'

export const createLeadValidator = [
  body('name')
    .notEmpty()
    .withMessage('Name is required'),
  body('phone')
    .notEmpty()
    .withMessage('Phone is required'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email required'),
  body('type')
    .optional()
    .isIn(['hot', 'warm', 'cold'])
    .withMessage('Invalid lead type'),
  body('status')
    .optional()
    .isIn(['new', 'contacted', 'followup', 'interested', 'converted', 'not_interested'])
    .withMessage('Invalid status'),
  body('source')
    .optional()
    .isIn(['website', 'facebook', 'instagram', 'linkedin', 'maps', 'manual', 'csv', 'import'])
    .withMessage('Invalid source')
]

export const updateLeadValidator = [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Name cannot be empty'),
  body('phone')
    .optional()
    .notEmpty()
    .withMessage('Phone cannot be empty'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email required'),
  body('type')
    .optional()
    .isIn(['hot', 'warm', 'cold'])
    .withMessage('Invalid lead type'),
  body('status')
    .optional()
    .isIn(['new', 'contacted', 'followup', 'interested', 'converted', 'not_interested'])
    .withMessage('Invalid status')
]

export const assignLeadValidator = [
  body('userId')
    .isUUID()
    .withMessage('Valid user ID required')
]

export const convertLeadValidator = [
  body('dealValue')
    .isNumeric()
    .withMessage('Valid deal value required')
    .custom(value => value > 0)
    .withMessage('Deal value must be positive')
]
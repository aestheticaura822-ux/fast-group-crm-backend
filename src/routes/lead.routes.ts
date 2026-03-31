import { Router } from 'express'
import { body, query } from 'express-validator'
import { authenticate } from '../middleware/auth.middleware'
import { isAdminOrCSR, isAdminOrSales } from '../middleware/rbac.middleware'
import { validate } from '../middleware/validation.middleware'
import { createLeadLimiter } from '../middleware/rateLimit.middleware'
import * as leadController from '../controllers/lead.controller'

const router = Router()

// Public route for lead creation (no auth)
router.post(
  '/public',
  createLeadLimiter,
  validate([
    body('name').notEmpty().withMessage('Name required'),
    body('phone').notEmpty().withMessage('Phone required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('company').notEmpty().withMessage('Company required'),
    body('message').notEmpty().withMessage('Message required')
  ]),
  leadController.createPublicLead
)

// Protected routes
router.use(authenticate)

// Get leads (with filters)
router.get(
  '/',
  validate([
    query('status').optional().isIn([
      'new', 'contacted', 'followup', 'interested', 'converted', 'not_interested'
    ]),
    query('type').optional().isIn(['hot', 'warm', 'cold']),
    query('source').optional().isIn([
      'website', 'facebook', 'instagram', 'linkedin', 'maps', 'manual', 'csv', 'import'
    ]),
    query('assigned_to').optional().isUUID(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ]),
  leadController.getLeads
)

// Get lead by ID
router.get('/:id', leadController.getLeadById)

// Create lead
router.post(
  '/',
  isAdminOrCSR,
  validate([
    body('name').notEmpty().withMessage('Name required'),
    body('phone').notEmpty().withMessage('Phone required'),
    body('email').optional().isEmail(),
    body('type').optional().isIn(['hot', 'warm', 'cold']),
    body('status').optional().isIn([
      'new', 'contacted', 'followup', 'interested', 'converted', 'not_interested'
    ]),
    body('source').optional().isIn([
      'website', 'facebook', 'instagram', 'linkedin', 'maps', 'manual', 'csv', 'import'
    ])
  ]),
  leadController.createLead
)

// Update lead
router.put(
  '/:id',
  validate([
    body('name').optional().notEmpty(),
    body('phone').optional().notEmpty(),
    body('email').optional().isEmail(),
    body('type').optional().isIn(['hot', 'warm', 'cold']),
    body('status').optional().isIn([
      'new', 'contacted', 'followup', 'interested', 'converted', 'not_interested'
    ])
  ]),
  leadController.updateLead
)

// Delete lead
router.delete('/:id', isAdminOrCSR, leadController.deleteLead)

// Assign lead
router.post(
  '/:id/assign',
  isAdminOrCSR,
  validate([
    body('userId').isUUID().withMessage('Valid user ID required')
  ]),
  leadController.assignLead
)

// Convert lead (sales only)
router.post(
  '/:id/convert',
  isAdminOrSales,
  validate([
    body('dealValue').isNumeric().withMessage('Valid deal value required')
  ]),
  leadController.convertLead
)

// Get lead activities
router.get('/:id/activities', leadController.getLeadActivities)

// Add activity to lead
router.post(
  '/:id/activities',
  validate([
    body('activity_type').isIn(['call', 'email', 'note']),
    body('notes').optional().notEmpty()
  ]),
  leadController.addLeadActivity
)

export default router
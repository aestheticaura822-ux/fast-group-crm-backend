import { Router } from 'express'
import { body, query } from 'express-validator'
import { authenticate } from '../middleware/auth.middleware'
import { validate } from '../middleware/validation.middleware'
import * as activitiesController from '../controllers/activities.controller'

const router = Router()

// All routes require authentication
router.use(authenticate)

// ==================== GET ALL ACTIVITIES ====================
router.get(
  '/',
  validate([
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
    query('type').optional().isIn(['call', 'email', 'note', 'status_change', 'assignment']).withMessage('Invalid activity type'),
    query('leadId').optional().isUUID().withMessage('Invalid lead ID'),
    query('userId').optional().isUUID().withMessage('Invalid user ID')
  ]),
  activitiesController.getActivities
)

// ==================== GET ACTIVITIES FOR A SPECIFIC LEAD ====================
router.get(
  '/lead/:leadId',
  validate([
    query('limit').optional().isInt({ min: 1, max: 100 })
  ]),
  activitiesController.getLeadActivities
)

// ==================== GET ACTIVITIES FOR A SPECIFIC USER ====================
router.get(
  '/user/:userId',
  validate([
    query('limit').optional().isInt({ min: 1, max: 100 })
  ]),
  activitiesController.getUserActivities
)

// ==================== CREATE A NEW ACTIVITY ====================
router.post(
  '/',
  validate([
    body('leadId').isUUID().withMessage('Valid lead ID required'),
    body('type').isIn(['call', 'email', 'note', 'status_change', 'assignment']).withMessage('Valid activity type required'),
    body('notes').optional().isString().withMessage('Notes must be string')
  ]),
  activitiesController.createActivity
)

// ✅ DEFAULT EXPORT - IMPORTANT!
export default router
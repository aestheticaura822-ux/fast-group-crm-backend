import { Router } from 'express'
import { body } from 'express-validator'
import { authenticate } from '../middleware/auth.middleware'
import { isAdmin } from '../middleware/rbac.middleware'
import { validate } from '../middleware/validation.middleware'
import * as notificationController from '../controllers/notification.controller'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Get notification settings
router.get('/settings', notificationController.getSettings)

// Update notification settings
router.put(
  '/settings',
  isAdmin,
  validate([
    body('email_notifications').optional().isBoolean(),
    body('push_notifications').optional().isBoolean(),
    body('sms_notifications').optional().isBoolean()
  ]),
  notificationController.updateSettings
)

// Test email
router.post(
  '/test-email',
  isAdmin,
  validate([
    body('email').isEmail()
  ]),
  notificationController.testEmail
)

// Get notification templates
router.get('/templates', isAdmin, notificationController.getTemplates)

// Update notification template
router.put(
  '/templates/:templateId',
  isAdmin,
  validate([
    body('subject').optional().notEmpty(),
    body('body').optional().notEmpty()
  ]),
  notificationController.updateTemplate
)

export default router
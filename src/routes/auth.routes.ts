import { Router } from 'express'
import { body } from 'express-validator'
import { validate } from '../middleware/validation.middleware'
import { authLimiter } from '../middleware/rateLimit.middleware'
import * as authController from '../controllers/auth.controller'
import { authenticate } from '../middleware/auth.middleware'
const router = Router()

// Login
router.post(
  '/login',
  authLimiter,
  validate([
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
  ]),
  authController.login
)

// Register
router.post(
  '/register',
  validate([
    body('name').notEmpty().withMessage('Name required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role')
      .optional()
      .isIn(['admin', 'csr', 'sales'])
      .withMessage('Invalid role')
  ]),
  authController.register
)

// Logout
router.post('/logout', authController.logout)

// Refresh token
router.post('/refresh', authController.refreshToken)
router.get('/verify', authenticate, authController.verifyToken)


// Change password
router.post(
  '/change-password',
  validate([
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters')
  ]),
  authController.changePassword
)

// Forgot password
router.post(
  '/forgot-password',
  validate([
    body('email').isEmail().withMessage('Valid email required')
  ]),
  authController.forgotPassword
)

// Reset password
router.post(
  '/reset-password',
  validate([
    body('token').notEmpty().withMessage('Token required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
  ]),
  authController.resetPassword
)

// Verify email
router.get('/verify-email/:token', authController.verifyEmail)

export default router
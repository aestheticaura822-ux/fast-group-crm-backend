import { Router } from 'express'
import { body } from 'express-validator'
import { authenticate } from '../middleware/auth.middleware'
import { isAdmin } from '../middleware/rbac.middleware'
import { validate } from '../middleware/validation.middleware'
import * as userController from '../controllers/user.controller'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Get all users (admin only)
router.get('/', isAdmin, userController.getUsers)

// Get user by ID
router.get('/:id', userController.getUserById)

// Create user (admin only)
router.post(
  '/',
  isAdmin,
  validate([
    body('name').notEmpty().withMessage('Name required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role')
      .isIn(['admin', 'csr', 'sales'])
      .withMessage('Invalid role')
  ]),
  userController.createUser
)

// Update user
router.put(
  '/:id',
  validate([
    body('name').optional().notEmpty(),
    body('email').optional().isEmail(),
    body('role').optional().isIn(['admin', 'csr', 'sales']),
    body('is_active').optional().isBoolean()
  ]),
  userController.updateUser
)

// Delete user (admin only)
router.delete('/:id', isAdmin, userController.deleteUser)

// Get user statistics
router.get('/:id/stats', userController.getUserStats)

export default router
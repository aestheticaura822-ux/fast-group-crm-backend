import { Router } from 'express'
import { query } from 'express-validator'
import { authenticate } from '../middleware/auth.middleware'
import { isAdmin } from '../middleware/rbac.middleware'
import { validate } from '../middleware/validation.middleware'
import * as reportController from '../controllers/report.controller'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Get dashboard stats
router.get('/dashboard', reportController.getDashboardStats)

// Daily report
router.get(
  '/daily',
  validate([
    query('date').optional().isDate()
  ]),
  reportController.getDailyReport
)

// Monthly report
router.get(
  '/monthly',
  validate([
    query('year').optional().isInt({ min: 2020 }),
    query('month').optional().isInt({ min: 1, max: 12 })
  ]),
  reportController.getMonthlyReport
)

// CSR performance report
router.get(
  '/csr/:userId',
  isAdmin,
  validate([
    query('startDate').optional().isDate(),
    query('endDate').optional().isDate()
  ]),
  reportController.getCSRPerformance
)

// Sales performance report
router.get(
  '/sales/:userId',
  isAdmin,
  validate([
    query('startDate').optional().isDate(),
    query('endDate').optional().isDate()
  ]),
  reportController.getSalesPerformance
)

// Lead source report
router.get('/sources', reportController.getLeadSourcesReport)

// Conversion funnel report
router.get('/funnel', reportController.getConversionFunnel)

// Export report
router.get(
  '/export',
  validate([
    query('type').isIn(['csv', 'pdf']),
    query('startDate').isDate(),
    query('endDate').isDate()
  ]),
  reportController.exportReport
)

export default router
import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth.middleware'

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.' 
      })
    }

    next()
  }
}

// Role-specific middleware
export const isAdmin = authorize('admin')
export const isCSR = authorize('admin', 'csr')
export const isSales = authorize('admin', 'sales')
export const isAdminOrCSR = authorize('admin', 'csr')
export const isAdminOrSales = authorize('admin', 'sales')
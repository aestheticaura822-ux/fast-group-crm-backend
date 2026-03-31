"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdminOrSales = exports.isAdminOrCSR = exports.isSales = exports.isCSR = exports.isAdmin = exports.authorize = void 0;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Access denied. Insufficient permissions.'
            });
        }
        next();
    };
};
exports.authorize = authorize;
// Role-specific middleware
exports.isAdmin = (0, exports.authorize)('admin');
exports.isCSR = (0, exports.authorize)('admin', 'csr');
exports.isSales = (0, exports.authorize)('admin', 'sales');
exports.isAdminOrCSR = (0, exports.authorize)('admin', 'csr');
exports.isAdminOrSales = (0, exports.authorize)('admin', 'sales');

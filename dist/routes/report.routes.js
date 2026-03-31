"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const reportController = __importStar(require("../controllers/report.controller"));
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// Get dashboard stats
router.get('/dashboard', reportController.getDashboardStats);
// Daily report
router.get('/daily', (0, validation_middleware_1.validate)([
    (0, express_validator_1.query)('date').optional().isDate()
]), reportController.getDailyReport);
// Monthly report
router.get('/monthly', (0, validation_middleware_1.validate)([
    (0, express_validator_1.query)('year').optional().isInt({ min: 2020 }),
    (0, express_validator_1.query)('month').optional().isInt({ min: 1, max: 12 })
]), reportController.getMonthlyReport);
// CSR performance report
router.get('/csr/:userId', rbac_middleware_1.isAdmin, (0, validation_middleware_1.validate)([
    (0, express_validator_1.query)('startDate').optional().isDate(),
    (0, express_validator_1.query)('endDate').optional().isDate()
]), reportController.getCSRPerformance);
// Sales performance report
router.get('/sales/:userId', rbac_middleware_1.isAdmin, (0, validation_middleware_1.validate)([
    (0, express_validator_1.query)('startDate').optional().isDate(),
    (0, express_validator_1.query)('endDate').optional().isDate()
]), reportController.getSalesPerformance);
// Lead source report
router.get('/sources', reportController.getLeadSourcesReport);
// Conversion funnel report
router.get('/funnel', reportController.getConversionFunnel);
// Export report
router.get('/export', (0, validation_middleware_1.validate)([
    (0, express_validator_1.query)('type').isIn(['csv', 'pdf']),
    (0, express_validator_1.query)('startDate').isDate(),
    (0, express_validator_1.query)('endDate').isDate()
]), reportController.exportReport);
exports.default = router;

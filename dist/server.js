"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const lead_routes_1 = __importDefault(require("./routes/lead.routes"));
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const activities_routes_1 = __importDefault(require("./routes/activities.routes")); // ✅ Default import
const PORT = 3002;
console.log('🚀 Test server starting...');
console.log('PORT:', PORT);
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'https://fast-group-crm-dashboard.vercel.app',
        'https://fast-group-crm-dashboard-bm5d.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Server is working!' });
});
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        routes: ['auth', 'leads', 'reports', 'users', 'activities']
    });
});
// Register routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/leads', lead_routes_1.default);
app.use('/api/reports', report_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/activities', activities_routes_1.default); // ✅ Sirf activitiesRoutes
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
// For local development
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
    });
}
// For Vercel serverless
exports.default = app;

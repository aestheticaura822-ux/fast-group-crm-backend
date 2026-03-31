import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.routes'
import leadRoutes from './routes/lead.routes'
import reportRoutes from './routes/report.routes'
import userRoutes from './routes/user.routes'
import activitiesRoutes from './routes/activities.routes'  // ✅ Default import
const PORT = 3002

console.log('🚀 Test server starting...')
console.log('PORT:', PORT)

const app = express()

// Middleware
app.use(cors({
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
}))
app.use(express.json())

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Server is working!' })
})

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    routes: ['auth', 'leads', 'reports', 'users', 'activities']
  })
})

// Register routes
app.use('/api/auth', authRoutes)
app.use('/api/leads', leadRoutes)
app.use('/api/reports', reportRoutes) 
app.use('/api/users', userRoutes)
app.use('/api/activities', activitiesRoutes)  // ✅ Sirf activitiesRoutes

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`)
  })
}

// For Vercel serverless
export default app
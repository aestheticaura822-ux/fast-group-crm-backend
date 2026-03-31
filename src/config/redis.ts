import { logger } from '../utils/logger.utils'

// Check if we should use mock mode
const USE_MOCK = process.env.USE_MOCK === 'true'

// Mock queue implementation
class MockQueue {
  name: string
  
  constructor(name: string) {
    this.name = name
    console.log(`📨 Mock queue "${name}" ready`)
  }
  
  async add(name: string, data: any) {
    console.log(`📨 Queue job: ${this.name}/${name}`, {
      leadId: data.leadId || 'new',
      leadName: data.leadName || data.name,
      email: data.email ? '***' : undefined
    })
    
    // Simulate async processing
    setTimeout(() => {
      console.log(`✅ Queue processed: ${this.name}/${name}`)
    }, 100)
    
    return { id: `mock-${Date.now()}` }
  }
  
  async process(handler: any) {
    return Promise.resolve()
  }
  
  on(event: string, handler: any) {
    return this
  }
  
  close() {
    return Promise.resolve()
  }
}

// Initialize queues - ADD reportQueue HERE!
let emailQueue: any, leadQueue: any, reportQueue: any

if (USE_MOCK) {
  console.log('📨 Using MOCK queue system')
  emailQueue = new MockQueue('email')
  leadQueue = new MockQueue('lead')
  reportQueue = new MockQueue('report')  // ✅ ADD THIS LINE
} else {
  // Real Redis implementation
  try {
    const Queue = require('bull')
    const redisConfig = {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      }
    }
    
    emailQueue = new Queue('email', redisConfig)
    leadQueue = new Queue('lead', redisConfig)
    reportQueue = new Queue('report', redisConfig)  // ✅ ADD THIS LINE
    
    console.log('✅ Redis queues initialized')
    
  } catch (error) {
    console.error('❌ Redis connection failed, falling back to mock')
    emailQueue = new MockQueue('email')
    leadQueue = new MockQueue('lead')
    reportQueue = new MockQueue('report')  // ✅ ADD THIS LINE
  }
}

// EXPORT ALL THREE QUEUES
export { emailQueue, leadQueue, reportQueue }  // ✅ UPDATE THIS LINE
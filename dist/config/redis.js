"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportQueue = exports.leadQueue = exports.emailQueue = void 0;
// Check if we should use mock mode
const USE_MOCK = process.env.USE_MOCK === 'true';
// Mock queue implementation
class MockQueue {
    constructor(name) {
        this.name = name;
        console.log(`📨 Mock queue "${name}" ready`);
    }
    async add(name, data) {
        console.log(`📨 Queue job: ${this.name}/${name}`, {
            leadId: data.leadId || 'new',
            leadName: data.leadName || data.name,
            email: data.email ? '***' : undefined
        });
        // Simulate async processing
        setTimeout(() => {
            console.log(`✅ Queue processed: ${this.name}/${name}`);
        }, 100);
        return { id: `mock-${Date.now()}` };
    }
    async process(handler) {
        return Promise.resolve();
    }
    on(event, handler) {
        return this;
    }
    close() {
        return Promise.resolve();
    }
}
// Initialize queues - ADD reportQueue HERE!
let emailQueue, leadQueue, reportQueue;
if (USE_MOCK) {
    console.log('📨 Using MOCK queue system');
    exports.emailQueue = emailQueue = new MockQueue('email');
    exports.leadQueue = leadQueue = new MockQueue('lead');
    exports.reportQueue = reportQueue = new MockQueue('report'); // ✅ ADD THIS LINE
}
else {
    // Real Redis implementation
    try {
        const Queue = require('bull');
        const redisConfig = {
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
            }
        };
        exports.emailQueue = emailQueue = new Queue('email', redisConfig);
        exports.leadQueue = leadQueue = new Queue('lead', redisConfig);
        exports.reportQueue = reportQueue = new Queue('report', redisConfig); // ✅ ADD THIS LINE
        console.log('✅ Redis queues initialized');
    }
    catch (error) {
        console.error('❌ Redis connection failed, falling back to mock');
        exports.emailQueue = emailQueue = new MockQueue('email');
        exports.leadQueue = leadQueue = new MockQueue('lead');
        exports.reportQueue = reportQueue = new MockQueue('report'); // ✅ ADD THIS LINE
    }
}

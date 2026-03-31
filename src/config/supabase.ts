import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// ✅ Force load .env from correct path
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })

// Debug logs
console.log('🔍 Loading environment variables...')
console.log('Current directory:', __dirname)
console.log('.env path:', path.resolve(__dirname, '../../.env.local'))

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('SUPABASE_URL:', supabaseUrl ? '✅ Found' : '❌ Missing')
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Found' : '❌ Missing')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('Please check your .env file at:', path.resolve(__dirname, '../../.env'))
  process.exit(1) // Exit instead of throw for cleaner error
}

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

console.log('✅ Supabase client initialized successfully')
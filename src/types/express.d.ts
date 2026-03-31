import { User } from './supabase'

declare global {
  namespace Express {
    interface Request {
      user?: User
    }
  }
}
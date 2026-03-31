export type UserRole = 'admin' | 'csr' | 'sales'

// Simple interface define karo
export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'csr' | 'sales'
  is_active: boolean
  created_at: string
  updated_at: string
  last_login: string | null
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User  // Select query result
        Insert: {
          id: string
          name: string
          email: string
          role: UserRole
          is_active?: boolean
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
        Update: {
          name?: string
          email?: string
          role?: UserRole
          is_active?: boolean
          last_login?: string | null
          updated_at?: string
        }
      }
    }
  }
}
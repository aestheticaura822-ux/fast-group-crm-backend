export type UserRole = 'admin' | 'csr' | 'sales'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
  last_login: string | null
}

export interface CreateUserInput {
  name: string
  email: string
  password: string
  role: UserRole
}

export interface UpdateUserInput {
  name?: string
  email?: string
  role?: UserRole
  is_active?: boolean
}

export interface UserStats {
  totalLeads: number
  conversions: number
  conversionRate: number
  activities: number
  hotLeads: number
  warmLeads: number
  coldLeads: number
}
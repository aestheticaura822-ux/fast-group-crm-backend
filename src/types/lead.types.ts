export type LeadType = 'hot' | 'warm' | 'cold'
export type LeadStatus = 'new' | 'contacted' | 'followup' | 'interested' | 'converted' | 'not_interested'
export type LeadSource = 'website' | 'facebook' | 'instagram' | 'linkedin' | 'maps' | 'manual' | 'csv' | 'import'

export interface Lead {
  id: string
  name: string
  phone: string
  email: string | null
  company: string | null
  message: string | null
  type: LeadType
  status: LeadStatus
  source: LeadSource
  deal_value: number | null
  assigned_to: string | null
  created_by: string | null
  converted_by: string | null
  converted_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CreateLeadInput {
  name: string
  phone: string
  email?: string
  company?: string
  message?: string
  type?: LeadType
  status?: LeadStatus
  source?: LeadSource
  notes?: string
}

export interface UpdateLeadInput {
  name?: string
  phone?: string
  email?: string | null
  company?: string | null
  message?: string | null
  type?: LeadType
  status?: LeadStatus
  deal_value?: number | null
  assigned_to?: string | null
  notes?: string | null
}

export interface LeadActivity {
  id: string
  lead_id: string
  user_id: string | null
  activity_type: 'call' | 'email' | 'note' | 'status_change' | 'assignment'
  notes: string | null
  old_status: string | null
  new_status: string | null
  created_at: string
  user?: {
    id: string
    name: string
    email: string
  }
}
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          role: 'admin' | 'csr' | 'sales'
          is_active: boolean
          created_at: string
          updated_at: string
          last_login: string | null
        }
        Insert: {
          id: string
          name: string
          email: string
          role: 'admin' | 'csr' | 'sales'
          is_active?: boolean
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: 'admin' | 'csr' | 'sales'
          is_active?: boolean
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
      }
      leads: {
        Row: {
          id: string
          name: string
          phone: string
          email: string | null
          company: string | null
          message: string | null
          type: 'hot' | 'warm' | 'cold'
          status: 'new' | 'contacted' | 'followup' | 'interested' | 'converted' | 'not_interested'
          source: 'website' | 'facebook' | 'instagram' | 'linkedin' | 'maps' | 'manual' | 'csv' | 'import'
          deal_value: number | null
          assigned_to: string | null
          created_by: string | null
          converted_by: string | null
          converted_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone: string
          email?: string | null
          company?: string | null
          message?: string | null
          type?: 'hot' | 'warm' | 'cold'
          status?: 'new' | 'contacted' | 'followup' | 'interested' | 'converted' | 'not_interested'
          source?: 'website' | 'facebook' | 'instagram' | 'linkedin' | 'maps' | 'manual' | 'csv' | 'import'
          deal_value?: number | null
          assigned_to?: string | null
          created_by?: string | null
          converted_by?: string | null
          converted_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          email?: string | null
          company?: string | null
          message?: string | null
          type?: 'hot' | 'warm' | 'cold'
          status?: 'new' | 'contacted' | 'followup' | 'interested' | 'converted' | 'not_interested'
          source?: 'website' | 'facebook' | 'instagram' | 'linkedin' | 'maps' | 'manual' | 'csv' | 'import'
          deal_value?: number | null
          assigned_to?: string | null
          created_by?: string | null
          converted_by?: string | null
          converted_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      lead_activities: {
        Row: {
          id: string
          lead_id: string
          user_id: string | null
          activity_type: 'call' | 'email' | 'note' | 'status_change' | 'assignment'
          notes: string | null
          old_status: string | null
          new_status: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          user_id?: string | null
          activity_type: 'call' | 'email' | 'note' | 'status_change' | 'assignment'
          notes?: string | null
          old_status?: string | null
          new_status?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          user_id?: string | null
          activity_type?: 'call' | 'email' | 'note' | 'status_change' | 'assignment'
          notes?: string | null
          old_status?: string | null
          new_status?: string | null
          created_at?: string
        }
      }
      scraper_jobs: {
        Row: {
          id: string
          platform: 'facebook' | 'instagram' | 'linkedin' | 'maps'
          keywords: string[]
          location: string | null
          status: 'pending' | 'running' | 'completed' | 'failed'
          results_count: number
          created_by: string | null
          created_at: string
          completed_at: string | null
          error: string | null
        }
        Insert: {
          id?: string
          platform: 'facebook' | 'instagram' | 'linkedin' | 'maps'
          keywords: string[]
          location?: string | null
          status?: 'pending' | 'running' | 'completed' | 'failed'
          results_count?: number
          created_by?: string | null
          created_at?: string
          completed_at?: string | null
          error?: string | null
        }
        Update: {
          id?: string
          platform?: 'facebook' | 'instagram' | 'linkedin' | 'maps'
          keywords?: string[]
          location?: string | null
          status?: 'pending' | 'running' | 'completed' | 'failed'
          results_count?: number
          created_by?: string | null
          created_at?: string
          completed_at?: string | null
          error?: string | null
        }
      }
      reports_cache: {
        Row: {
          id: string
          report_type: string
          data: Json
          generated_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          report_type: string
          data: Json
          generated_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          report_type?: string
          data?: Json
          generated_at?: string
          expires_at?: string
        }
      }
    }
    Functions: {
      clean_expired_reports: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
    }
  }
}
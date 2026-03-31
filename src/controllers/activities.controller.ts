import { Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase'
import { logger } from '../utils/logger.utils'
import { AuthRequest } from '../middleware/auth.middleware'

// ==================== GET ALL ACTIVITIES WITH FILTERS ====================
export const getActivities = async (req: Request, res: Response) => {
  try {
    const { limit = 50, type, leadId, userId } = req.query
    const user = (req as AuthRequest).user

    if (!user?.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    console.log('📋 Fetching activities with filters:', { type, leadId, userId })

    let query = supabaseAdmin
      .from('lead_activities')
      .select(`
        *,
        lead:lead_id(id, name, company),
        user:user_id(id, name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(Number(limit))

    if (type) {
      query = query.eq('activity_type', type)
    }

    if (leadId) {
      query = query.eq('lead_id', leadId)
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Error fetching activities:', error)
      throw error
    }

    console.log(`✅ Found ${data?.length || 0} activities`)
    res.json(data || [])
  } catch (error) {
    console.error('❌ Get activities error:', error)
    res.status(500).json({ error: 'Failed to fetch activities' })
  }
}

// ==================== GET ACTIVITIES FOR A SPECIFIC LEAD ====================
export const getLeadActivities = async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params
    const { limit = 50 } = req.query
    const user = (req as AuthRequest).user

    if (!user?.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!leadId) {
      return res.status(400).json({ error: 'Lead ID is required' })
    }

    console.log(`📋 Fetching activities for lead: ${leadId}`)

    const { data, error } = await supabaseAdmin
      .from('lead_activities')
      .select(`
        *,
        user:user_id(id, name, email)
      `)
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(Number(limit))

    if (error) {
      console.error('❌ Error fetching lead activities:', error)
      throw error
    }

    console.log(`✅ Found ${data?.length || 0} activities for lead ${leadId}`)
    res.json(data || [])
  } catch (error) {
    console.error('❌ Get lead activities error:', error)
    res.status(500).json({ error: 'Failed to fetch lead activities' })
  }
}

// ==================== GET ACTIVITIES FOR A SPECIFIC USER ====================
export const getUserActivities = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const { limit = 50 } = req.query
    const user = (req as AuthRequest).user

    if (!user?.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    console.log(`📋 Fetching activities for user: ${userId}`)

    const { data, error } = await supabaseAdmin
      .from('lead_activities')
      .select(`
        *,
        lead:lead_id(id, name, company)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(Number(limit))

    if (error) {
      console.error('❌ Error fetching user activities:', error)
      throw error
    }

    console.log(`✅ Found ${data?.length || 0} activities for user ${userId}`)
    res.json(data || [])
  } catch (error) {
    console.error('❌ Get user activities error:', error)
    res.status(500).json({ error: 'Failed to fetch user activities' })
  }
}

// ==================== CREATE A NEW ACTIVITY ====================
export const createActivity = async (req: Request, res: Response) => {
  try {
    const { leadId, type, notes } = req.body  // ✅ body se le rahe hain, query nahi
    const user = (req as AuthRequest).user

    if (!user?.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!leadId || !type) {
      return res.status(400).json({ error: 'Lead ID and activity type are required' })
    }

    // Validate activity type
    const validTypes = ['call', 'email', 'note', 'status_change', 'assignment']
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid activity type' })
    }

    console.log('📝 Creating new activity:', { leadId, type, notes, userId: user.id })

    const { data, error } = await supabaseAdmin
      .from('lead_activities')
      .insert({
        lead_id: leadId,
        user_id: user.id,
        activity_type: type,
        notes: notes || null
      })
      .select(`
        *,
        lead:lead_id(id, name, company),
        user:user_id(id, name, email)
      `)
      .single()

    if (error) {
      console.error('❌ Error creating activity:', error)
      throw error
    }

    console.log('✅ Activity created successfully:', data.id)
    res.status(201).json(data)
  } catch (error) {
    console.error('❌ Create activity error:', error)
    res.status(500).json({ error: 'Failed to create activity' })
  }
}
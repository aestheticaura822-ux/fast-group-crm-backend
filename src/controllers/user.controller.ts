import { Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase'
import { logger } from '../utils/logger.utils'
import { AuthRequest } from '../middleware/auth.middleware'

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json(users)
  } catch (error) {
    logger.error('Get users error:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
}

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(user)
  } catch (error) {
    logger.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
}

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role }
    })

    if (authError) throw authError

    // Create user in public.users
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        name,
        email,
        role
      })
      .select()
      .single()

    if (userError) throw userError

    logger.info(`User created: ${email} by ${(req as AuthRequest).user?.email}`)

    res.status(201).json(user)
  } catch (error) {
    logger.error('Create user error:', error)
    res.status(500).json({ error: 'Failed to create user' })
  }
}

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updates = req.body
    const authUser = (req as AuthRequest).user

    // Check if user exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Only admin can update roles
    if (updates.role && authUser.role !== 'admin') {
      delete updates.role
    }

    // Update user
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    logger.info(`User updated: ${id} by ${authUser.email}`)

    res.json(user)
  } catch (error) {
    logger.error('Update user error:', error)
    res.status(500).json({ error: 'Failed to update user' })
  }
}

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Delete from Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)

    if (authError) throw authError

    // Delete from public.users (cascade will handle)
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id)

    if (error) throw error

    logger.info(`User deleted: ${id} by ${(req as AuthRequest).user?.email}`)

    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    logger.error('Delete user error:', error)
    res.status(500).json({ error: 'Failed to delete user' })
  }
}

export const getUserStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Get leads handled
    const { data: leads, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('assigned_to', id)

    if (leadsError) throw leadsError

    // Get conversions
    const conversions = leads.filter(l => l.status === 'converted')
    
    // Get activities
    const { data: activities, error: activitiesError } = await supabaseAdmin
      .from('lead_activities')
      .select('*')
      .eq('user_id', id)

    if (activitiesError) throw activitiesError

    const stats = {
      totalLeads: leads.length,
      conversions: conversions.length,
      conversionRate: leads.length ? (conversions.length / leads.length) * 100 : 0,
      activities: activities.length,
      hotLeads: leads.filter(l => l.type === 'hot').length,
      warmLeads: leads.filter(l => l.type === 'warm').length,
      coldLeads: leads.filter(l => l.type === 'cold').length
    }

    res.json(stats)
  } catch (error) {
    logger.error('Get user stats error:', error)
    res.status(500).json({ error: 'Failed to fetch user stats' })
  }
}
import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '../config/supabase'
import { emailQueue } from '../config/redis'
import { logger } from '../utils/logger.utils'
import { AuthRequest } from '../middleware/auth.middleware'

// ==================== HELPER FUNCTION FOR ADMIN BYPASS ====================
const createUserWithAdminBypass = async (userData: {
  email: string
  password: string
  name: string
  role: string
}) => {
  console.log(`🔧 Using admin bypass for: ${userData.email}`)
  
  // Create in auth.users with admin API (NO RATE LIMIT)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      name: userData.name,
      role: userData.role
    }
  })

  if (authError) {
    console.error('Admin bypass error:', authError)
    throw authError
  }
  
  if (!authData?.user) {
    throw new Error('No user returned from admin API')
  }

  // Create profile in public.users
  const { error: profileError } = await supabaseAdmin
    .from('users')
    .insert({
      id: authData.user.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

  if (profileError) {
    console.error('Profile error in admin bypass:', profileError)
    // Rollback: delete auth user if profile fails
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    throw profileError
  }

  return authData.user
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    console.log('🔑 Login attempt for:', email)

    // Get user from database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      console.log('❌ User not found in public.users:', email)
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    console.log('✅ User found in public.users:', user.id)

    // Verify password with Supabase Auth
    const { data: authData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    })

    if (signInError) {
      console.log('❌ Supabase auth failed:', signInError.message)
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    console.log('✅ Supabase auth successful:', authData.user.id)

    // ✅ IMPORTANT: Add this line - define userData
    const userData = user as any;

    // Update last login
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userData.id)

    if (updateError) {
      logger.error('Failed to update last login:', updateError)
    }

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: userData.id, 
        email: userData.email,
        role: userData.role,
        is_active: userData.is_active 
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    )

    logger.info(`User logged in: ${userData.email}`)

    res.json({
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        is_active: userData.is_active,
        last_login: userData.last_login
      },
      token
    })
  } catch (error) {
    logger.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
}

// ==================== REGISTER (WITH AUTO RATE LIMIT BYPASS AND AUTO-CONFIRM) ====================
// ==================== REGISTER (FINAL VERSION - AUTO CONFIRM) ====================
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role = 'csr' } = req.body

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' })
    }

    // Validate role
    const validRoles = ['admin', 'csr', 'sales']
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Role must be admin, csr, or sales' })
    }

    // Check if email already exists in public.users
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    console.log(`📝 Registering ${role}: ${email} using admin API (auto-confirm)`)

    // ✅ USE ADMIN API DIRECTLY - AUTO CONFIRMS EMAIL, NO RATE LIMIT
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,  // THIS IS THE KEY - auto-confirms email
      user_metadata: {
        name,
        role
      }
    })

    if (authError) {
      console.error('❌ Admin API error:', authError)
      return res.status(400).json({ error: authError.message })
    }

    if (!authData?.user) {
      return res.status(400).json({ error: 'Registration failed' })
    }

    console.log('✅ Auth user created with confirmed email:', authData.user.id)

    // Create profile in public.users
    const { data: newUser, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        name,
        email,
        role: role,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error('❌ Profile error:', profileError)
      // Rollback: delete auth user if profile fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return res.status(500).json({ error: 'Failed to create user profile' })
    }

    // Add welcome email to queue (mock will handle)
    try {
      await emailQueue.add('welcome', { email, name })
      console.log('📨 Welcome email queued')
    } catch (queueError) {
      console.log('Queue error (ignored):', queueError)
    }

    console.log(`✅ ${role} registered successfully: ${email}`)
    logger.info(`New user registered: ${email}`)

    res.status(201).json({
      message: 'Registration successful! You can now login.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    })

  } catch (error: any) {
    console.error('❌ Registration error:', error)
    res.status(500).json({ error: error.message || 'Registration failed' })
  }
}
// ==================== REST OF YOUR FUNCTIONS (unchanged) ====================
export const logout = async (_req: Request, res: Response) => {
  try {
    res.json({ message: 'Logged out successfully' })
  } catch (error) {
    logger.error('Logout error:', error)
    res.status(500).json({ error: 'Logout failed' })
  }
}

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ error: 'Token required' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { 
      userId: string 
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single()

    if (error || !user) {
      return res.status(401).json({ error: 'User not found' })
    }

    const userData = user as any

    if (!userData.is_active) {
      return res.status(401).json({ error: 'Account is deactivated' })
    }

    const newToken = jwt.sign(
      { 
        userId: userData.id, 
        email: userData.email,
        role: userData.role,
        is_active: userData.is_active 
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    )

    res.json({ token: newToken })
  } catch (error) {
    logger.error('Refresh token error:', error)
    res.status(401).json({ error: 'Invalid token' })
  }
}

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = req.user

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' })
    }

    const userData = user as any

    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: userData.email,
      password: currentPassword
    })

    if (signInError) {
      return res.status(401).json({ error: 'Current password is incorrect' })
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      userData.id,
      { password: newPassword }
    )

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    logger.info(`Password changed for user: ${userData.email}`)
    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    logger.error('Change password error:', error)
    res.status(500).json({ error: 'Failed to change password' })
  }
}

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password`
    })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    logger.info(`Password reset email sent to: ${email}`)
    res.json({ message: 'Password reset email sent' })
  } catch (error) {
    logger.error('Forgot password error:', error)
    res.status(500).json({ error: 'Failed to process request' })
  }
}

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' })
    }

    const { data: { user }, error: verifyError } = await supabaseAdmin.auth.getUser(token)

    if (verifyError || !user) {
      return res.status(400).json({ error: 'Invalid or expired token' })
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    logger.info(`Password reset successful for: ${user.email}`)
    res.json({ message: 'Password reset successfully' })
  } catch (error) {
    logger.error('Reset password error:', error)
    res.status(500).json({ error: 'Failed to reset password' })
  }
}

export const verifyToken = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    const userData = user as any

    res.json({
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        is_active: userData.is_active
      }
    })
  } catch (error) {
    logger.error('Verify token error:', error)
    res.status(500).json({ error: 'Token verification failed' })
  }
}

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params

    if (!token) {
      return res.status(400).json({ error: 'Token is required' })
    }

    const { error } = await supabaseAdmin.auth.verifyOtp({
      token_hash: token,
      type: 'email'
    })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({ message: 'Email verified successfully' })
  } catch (error) {
    logger.error('Email verification error:', error)
    res.status(500).json({ error: 'Failed to verify email' })
  }
}
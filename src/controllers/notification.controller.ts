import { Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase'
import { emailQueue } from '../config/redis'
import { logger } from '../utils/logger.utils'
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export const getSettings = async (req: Request, res: Response) => {
  try {
    // Get settings from database (you can create a settings table)
    const { data: settings, error } = await supabaseAdmin
      .from('settings')
      .select('*')
      .eq('type', 'notification')
      .single()

    if (error && error.code !== 'PGRST116') throw error

    res.json(settings || {
      email_notifications: true,
      push_notifications: true,
      sms_notifications: false
    })
  } catch (error) {
    logger.error('Get settings error:', error)
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
}

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const settings = req.body

    const { data, error } = await supabaseAdmin
      .from('settings')
      .upsert({
        type: 'notification',
        ...settings,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    logger.info('Notification settings updated')

    res.json(data)
  } catch (error) {
    logger.error('Update settings error:', error)
    res.status(500).json({ error: 'Failed to update settings' })
  }
}

export const testEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body

    const msg = {
      to: email,
      from: process.env.FROM_EMAIL!,
      subject: 'Test Email from Fast Group CRM',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from your Fast Group CRM system.</p>
        <p>If you're receiving this, your email configuration is working correctly!</p>
      `
    }

    await sgMail.send(msg)

    logger.info(`Test email sent to ${email}`)

    res.json({ message: 'Test email sent successfully' })
  } catch (error) {
    logger.error('Test email error:', error)
    res.status(500).json({ error: 'Failed to send test email' })
  }
}

export const getTemplates = async (req: Request, res: Response) => {
  try {
    const { data: templates, error } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .order('name')

    if (error) throw error

    res.json(templates)
  } catch (error) {
    logger.error('Get templates error:', error)
    res.status(500).json({ error: 'Failed to fetch templates' })
  }
}

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params
    const updates = req.body

    const { data: template, error } = await supabaseAdmin
      .from('email_templates')
      .update(updates)
      .eq('id', templateId)
      .select()
      .single()

    if (error) throw error

    logger.info(`Email template updated: ${templateId}`)

    res.json(template)
  } catch (error) {
    logger.error('Update template error:', error)
    res.status(500).json({ error: 'Failed to update template' })
  }
}
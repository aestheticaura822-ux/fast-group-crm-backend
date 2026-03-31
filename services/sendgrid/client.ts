import sgMail from '@sendgrid/mail'
import fs from 'fs'
import path from 'path'
import { logger } from '../../api/src/utils/logger.utils'

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

// Email interfaces
export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
  attachments?: Array<{
    content: string
    filename: string
    type: string
    disposition?: 'attachment' | 'inline'
  }>
  cc?: string | string[]
  bcc?: string | string[]
  replyTo?: string
}

export interface EmailResult {
  success: boolean
  message: string
  error?: any
}

// Main send email function
export const sendEmail = async (options: EmailOptions): Promise<EmailResult> => {
  try {
    const msg = {
      to: options.to,
      from: options.from || process.env.FROM_EMAIL!,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo
    }

    await sgMail.send(msg)
    logger.info(`Email sent successfully to ${options.to}`)
    
    return { 
      success: true, 
      message: 'Email sent successfully' 
    }
  } catch (error) {
    logger.error('SendGrid error:', error)
    return { 
      success: false, 
      message: 'Failed to send email',
      error 
    }
  }
}

// Load HTML template
export const loadTemplate = (templateName: string, data: any): string => {
  try {
    const templatePath = path.join(__dirname, 'templates', `${templateName}.html`)
    let template = fs.readFileSync(templatePath, 'utf8')

    // Replace all variables in template
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      template = template.replace(regex, data[key])
    })

    return template
  } catch (error) {
    logger.error(`Failed to load template ${templateName}:`, error)
    throw new Error(`Email template ${templateName} not found`)
  }
}

// Welcome email
export const sendWelcomeEmail = async (email: string, name: string): Promise<EmailResult> => {
  try {
    const html = loadTemplate('welcome', { 
      name,
      appUrl: process.env.APP_URL || 'http://localhost:3002'
    })
    
    return await sendEmail({
      to: email,
      subject: 'Welcome to Fast Group CRM',
      html
    })
  } catch (error) {
    logger.error('Send welcome email error:', error)
    return { success: false, message: 'Failed to send welcome email' }
  }
}

// New lead notification
export const sendNewLeadEmail = async (
  email: string,
  leadName: string,
  leadId: string,
  leadDetails?: {
    phone?: string
    email?: string
    company?: string
    type?: string
  }
): Promise<EmailResult> => {
  try {
    const html = loadTemplate('new-lead', {
      leadName,
      leadPhone: leadDetails?.phone || 'Not provided',
      leadEmail: leadDetails?.email || 'Not provided',
      leadCompany: leadDetails?.company || 'Not provided',
      leadType: leadDetails?.type || 'warm',
      leadLink: `${process.env.APP_URL || 'http://localhost:3002'}/csr/leads/${leadId}`,
      appUrl: process.env.APP_URL || 'http://localhost:3002'
    })

    return await sendEmail({
      to: email,
      subject: '🔔 New Lead Assigned to You',
      html
    })
  } catch (error) {
    logger.error('Send new lead email error:', error)
    return { success: false, message: 'Failed to send new lead email' }
  }
}

// Daily digest
export const sendDailyDigest = async (
  email: string,
  stats: {
    totalLeads: number
    newLeads: number
    hotLeads: number
    conversions: number
    topSources: Array<{ source: string; count: number }>
  }
): Promise<EmailResult> => {
  try {
    const html = loadTemplate('daily-digest', {
      ...stats,
      date: new Date().toLocaleDateString(),
      appUrl: process.env.APP_URL || 'http://localhost:3002'
    })

    return await sendEmail({
      to: email,
      subject: `📊 Your Daily Lead Digest - ${new Date().toLocaleDateString()}`,
      html
    })
  } catch (error) {
    logger.error('Send daily digest error:', error)
    return { success: false, message: 'Failed to send daily digest' }
  }
}

// Lead assigned notification
export const sendLeadAssignedEmail = async (
  assignedToEmail: string,
  assignedByName: string,
  leadName: string,
  leadId: string
): Promise<EmailResult> => {
  try {
    const html = loadTemplate('lead-assigned', {
      leadName,
      assignedByName,
      leadLink: `${process.env.APP_URL || 'http://localhost:3002'}/csr/leads/${leadId}`,
      appUrl: process.env.APP_URL || 'http://localhost:3002'
    })

    return await sendEmail({
      to: assignedToEmail,
      subject: '📋 Lead Assigned to You',
      html
    })
  } catch (error) {
    logger.error('Send lead assigned email error:', error)
    return { success: false, message: 'Failed to send lead assigned email' }
  }
}

// Lead converted notification
export const sendLeadConvertedEmail = async (
  salesEmail: string,
  leadName: string,
  dealValue: number,
  leadId: string
): Promise<EmailResult> => {
  try {
    const html = loadTemplate('lead-converted', {
      leadName,
      dealValue: dealValue.toLocaleString(),
      leadLink: `${process.env.APP_URL || 'http://localhost:3002'}/sales/reports`,
      appUrl: process.env.APP_URL || 'http://localhost:3002'
    })

    return await sendEmail({
      to: salesEmail,
      subject: '💰 Lead Converted Successfully!',
      html
    })
  } catch (error) {
    logger.error('Send lead converted email error:', error)
    return { success: false, message: 'Failed to send lead converted email' }
  }
}

// Test email
export const sendTestEmail = async (email: string): Promise<EmailResult> => {
  try {
    const html = `
      <h1>Test Email</h1>
      <p>If you're receiving this, your email configuration is working correctly!</p>
      <p>Time: ${new Date().toLocaleString()}</p>
    `

    return await sendEmail({
      to: email,
      subject: 'Test Email from Fast Group CRM',
      html
    })
  } catch (error) {
    logger.error('Send test email error:', error)
    return { success: false, message: 'Failed to send test email' }
  }
}
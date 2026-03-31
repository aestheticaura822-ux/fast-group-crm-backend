import sgMail from '@sendgrid/mail'
import { logger } from './logger.utils'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

export const sendEmail = async (options: EmailOptions) => {
  try {
    const msg = {
      to: options.to,
      from: options.from || process.env.FROM_EMAIL!,
      subject: options.subject,
      html: options.html,
    }

    await sgMail.send(msg)
    logger.info(`Email sent to ${options.to}`)
    return true
  } catch (error) {
    logger.error('Email send error:', error)
    return false
  }
}

export const sendWelcomeEmail = async (email: string, name: string) => {
  const html = `
    <h1>Welcome to Fast Group CRM!</h1>
    <p>Hi ${name},</p>
    <p>Thank you for joining Fast Group. We're excited to have you on board!</p>
    <p>Get started by logging into your account and exploring the dashboard.</p>
  `

  return sendEmail({
    to: email,
    subject: 'Welcome to Fast Group CRM',
    html
  })
}

export const sendNewLeadNotification = async (
  email: string,
  leadName: string
) => {
  const html = `
    <h1>New Lead Assigned</h1>
    <p>A new lead has been assigned to you:</p>
    <p><strong>Lead Name:</strong> ${leadName}</p>
    <p>Please log in to the CRM to view details and take action.</p>
  `

  return sendEmail({
    to: email,
    subject: 'New Lead Assigned',
    html
  })
}
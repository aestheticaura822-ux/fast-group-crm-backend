"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTemplate = exports.getTemplates = exports.testEmail = exports.updateSettings = exports.getSettings = void 0;
const supabase_1 = require("../config/supabase");
const logger_utils_1 = require("../utils/logger.utils");
const mail_1 = __importDefault(require("@sendgrid/mail"));
mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
const getSettings = async (req, res) => {
    try {
        // Get settings from database (you can create a settings table)
        const { data: settings, error } = await supabase_1.supabaseAdmin
            .from('settings')
            .select('*')
            .eq('type', 'notification')
            .single();
        if (error && error.code !== 'PGRST116')
            throw error;
        res.json(settings || {
            email_notifications: true,
            push_notifications: true,
            sms_notifications: false
        });
    }
    catch (error) {
        logger_utils_1.logger.error('Get settings error:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};
exports.getSettings = getSettings;
const updateSettings = async (req, res) => {
    try {
        const settings = req.body;
        const { data, error } = await supabase_1.supabaseAdmin
            .from('settings')
            .upsert({
            type: 'notification',
            ...settings,
            updated_at: new Date().toISOString()
        })
            .select()
            .single();
        if (error)
            throw error;
        logger_utils_1.logger.info('Notification settings updated');
        res.json(data);
    }
    catch (error) {
        logger_utils_1.logger.error('Update settings error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
};
exports.updateSettings = updateSettings;
const testEmail = async (req, res) => {
    try {
        const { email } = req.body;
        const msg = {
            to: email,
            from: process.env.FROM_EMAIL,
            subject: 'Test Email from Fast Group CRM',
            html: `
        <h1>Test Email</h1>
        <p>This is a test email from your Fast Group CRM system.</p>
        <p>If you're receiving this, your email configuration is working correctly!</p>
      `
        };
        await mail_1.default.send(msg);
        logger_utils_1.logger.info(`Test email sent to ${email}`);
        res.json({ message: 'Test email sent successfully' });
    }
    catch (error) {
        logger_utils_1.logger.error('Test email error:', error);
        res.status(500).json({ error: 'Failed to send test email' });
    }
};
exports.testEmail = testEmail;
const getTemplates = async (req, res) => {
    try {
        const { data: templates, error } = await supabase_1.supabaseAdmin
            .from('email_templates')
            .select('*')
            .order('name');
        if (error)
            throw error;
        res.json(templates);
    }
    catch (error) {
        logger_utils_1.logger.error('Get templates error:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
};
exports.getTemplates = getTemplates;
const updateTemplate = async (req, res) => {
    try {
        const { templateId } = req.params;
        const updates = req.body;
        const { data: template, error } = await supabase_1.supabaseAdmin
            .from('email_templates')
            .update(updates)
            .eq('id', templateId)
            .select()
            .single();
        if (error)
            throw error;
        logger_utils_1.logger.info(`Email template updated: ${templateId}`);
        res.json(template);
    }
    catch (error) {
        logger_utils_1.logger.error('Update template error:', error);
        res.status(500).json({ error: 'Failed to update template' });
    }
};
exports.updateTemplate = updateTemplate;

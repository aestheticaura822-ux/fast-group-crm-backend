"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNewLeadNotification = exports.sendWelcomeEmail = exports.sendEmail = void 0;
const mail_1 = __importDefault(require("@sendgrid/mail"));
const logger_utils_1 = require("./logger.utils");
mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
const sendEmail = async (options) => {
    try {
        const msg = {
            to: options.to,
            from: options.from || process.env.FROM_EMAIL,
            subject: options.subject,
            html: options.html,
        };
        await mail_1.default.send(msg);
        logger_utils_1.logger.info(`Email sent to ${options.to}`);
        return true;
    }
    catch (error) {
        logger_utils_1.logger.error('Email send error:', error);
        return false;
    }
};
exports.sendEmail = sendEmail;
const sendWelcomeEmail = async (email, name) => {
    const html = `
    <h1>Welcome to Fast Group CRM!</h1>
    <p>Hi ${name},</p>
    <p>Thank you for joining Fast Group. We're excited to have you on board!</p>
    <p>Get started by logging into your account and exploring the dashboard.</p>
  `;
    return (0, exports.sendEmail)({
        to: email,
        subject: 'Welcome to Fast Group CRM',
        html
    });
};
exports.sendWelcomeEmail = sendWelcomeEmail;
const sendNewLeadNotification = async (email, leadName) => {
    const html = `
    <h1>New Lead Assigned</h1>
    <p>A new lead has been assigned to you:</p>
    <p><strong>Lead Name:</strong> ${leadName}</p>
    <p>Please log in to the CRM to view details and take action.</p>
  `;
    return (0, exports.sendEmail)({
        to: email,
        subject: 'New Lead Assigned',
        html
    });
};
exports.sendNewLeadNotification = sendNewLeadNotification;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScraperService = exports.getEmailService = void 0;
// Service configuration - use mock in development
const USE_MOCK_SERVICES = process.env.NODE_ENV !== 'production' || process.env.USE_MOCK === 'true';
// Email service
const getEmailService = () => {
    if (USE_MOCK_SERVICES) {
        const { mockSendNewLeadEmail } = require('../../../services/mock/email.mock');
        return { sendNewLeadEmail: mockSendNewLeadEmail };
    }
    else {
        const { sendNewLeadEmail } = require('../../../services/sendgrid/client');
        return { sendNewLeadEmail };
    }
};
exports.getEmailService = getEmailService;
// Scraper service
const getScraperService = () => {
    if (USE_MOCK_SERVICES) {
        const { mockScrapeFacebook, mockScrapeInstagram, mockScrapeGoogleMaps } = require('../../../services/mock/scraper.mock');
        return {
            scrapeFacebook: mockScrapeFacebook,
            scrapeInstagram: mockScrapeInstagram,
            scrapeGoogleMaps: mockScrapeGoogleMaps
        };
    }
    else {
        const { scrapeFacebook, scrapeInstagram, scrapeGoogleMaps } = require('../../../services/apify/client');
        return { scrapeFacebook, scrapeInstagram, scrapeGoogleMaps };
    }
};
exports.getScraperService = getScraperService;

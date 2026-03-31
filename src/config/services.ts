// Service configuration - use mock in development
const USE_MOCK_SERVICES = process.env.NODE_ENV !== 'production' || process.env.USE_MOCK === 'true'

// Email service
export const getEmailService = () => {
  if (USE_MOCK_SERVICES) {
    const { mockSendNewLeadEmail } = require('../../../services/mock/email.mock')
    return { sendNewLeadEmail: mockSendNewLeadEmail }
  } else {
    const { sendNewLeadEmail } = require('../../../services/sendgrid/client')
    return { sendNewLeadEmail }
  }
}

// Scraper service
export const getScraperService = () => {
  if (USE_MOCK_SERVICES) {
    const { 
      mockScrapeFacebook,
      mockScrapeInstagram,
      mockScrapeGoogleMaps 
    } = require('../../../services/mock/scraper.mock')
    return {
      scrapeFacebook: mockScrapeFacebook,
      scrapeInstagram: mockScrapeInstagram,
      scrapeGoogleMaps: mockScrapeGoogleMaps
    }
  } else {
    const { 
      scrapeFacebook,
      scrapeInstagram,
      scrapeGoogleMaps 
    } = require('../../../services/apify/client')
    return { scrapeFacebook, scrapeInstagram, scrapeGoogleMaps }
  }
}
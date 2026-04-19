const path = require('path');

module.exports = {
  port: Number(process.env.PORT || 3000),
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  storagePath: process.env.STORAGE_PATH || path.join(process.cwd(), 'data', 'orders.json'),
  downloadDir: process.env.DOWNLOAD_DIR || path.join(process.cwd(), 'public', 'downloads'),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  stripePriceId: process.env.STRIPE_PRICE_ID || '',
  appName: 'Reclamo Energia'
};

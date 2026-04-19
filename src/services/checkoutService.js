const Stripe = require('stripe');

function createCheckoutService(config) {
  const stripeEnabled = Boolean(config.stripeSecretKey && config.stripePriceId);
  const stripe = stripeEnabled ? new Stripe(config.stripeSecretKey) : null;

  return {
    stripeEnabled,
    async createSession(order) {
      if (!stripeEnabled) {
        return {
          mode: 'mock',
          url: `${config.baseUrl}/checkout.html?orderId=${order.id}`,
          sessionId: `mock_${order.id}`
        };
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        success_url: `${config.baseUrl}/ordine.html?orderId=${order.id}&paid=1`,
        cancel_url: `${config.baseUrl}/ordine.html?orderId=${order.id}`,
        customer_email: order.customer.email,
        line_items: [{ price: config.stripePriceId, quantity: 1 }],
        metadata: { orderId: order.id }
      });

      return {
        mode: 'stripe',
        url: session.url,
        sessionId: session.id
      };
    },
    async constructEvent(rawBody, signature) {
      if (!stripeEnabled || !config.stripeWebhookSecret) return null;
      return stripe.webhooks.constructEvent(rawBody, signature, config.stripeWebhookSecret);
    }
  };
}

module.exports = { createCheckoutService };

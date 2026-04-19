const express = require('express');
const path = require('path');
const config = require('./config');
const OrdersStore = require('./storage/ordersStore');
const { validateOrderPayload } = require('./services/validation');
const { buildDocument } = require('./services/documentService');
const { createCheckoutService } = require('./services/checkoutService');

const app = express();
const store = new OrdersStore(config.storagePath);
const checkoutService = createCheckoutService(config);

app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

app.get('/health', (_req, res) => {
  res.json({ ok: true, app: config.appName, stripeEnabled: checkoutService.stripeEnabled });
});

app.post('/api/orders', (req, res) => {
  const errors = validateOrderPayload(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ message: 'Validation failed', errors });
  }

  const order = store.create(req.body);
  return res.status(201).json({
    id: order.id,
    status: order.status,
    amountCents: order.amountCents,
    recoveryUrl: `/ordine.html?token=${order.recoveryToken}`
  });
});

app.get('/api/orders/:id', (req, res) => {
  const order = store.getById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Ordine non trovato' });
  return res.json(order);
});

app.get('/api/orders/recover/:token', (req, res) => {
  const order = store.getByRecoveryToken(req.params.token);
  if (!order) return res.status(404).json({ message: 'Token non valido' });
  return res.json(order);
});

app.post('/api/orders/:id/checkout', async (req, res) => {
  const order = store.getById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Ordine non trovato' });

  const checkout = await checkoutService.createSession(order);
  const updated = store.update(order.id, () => ({
    status: 'checkout_pending',
    checkout: {
      mode: checkout.mode,
      sessionId: checkout.sessionId,
      createdAt: new Date().toISOString()
    }
  }));

  return res.json({ orderId: updated.id, checkoutUrl: checkout.url });
});

app.post('/api/orders/:id/mock-pay', async (req, res) => {
  const order = store.getById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Ordine non trovato' });

  const document = await buildDocument(order, config.downloadDir);
  const updated = store.update(order.id, () => ({
    status: 'paid',
    document
  }));

  return res.json({ status: updated.status, orderId: updated.id });
});

app.post('/api/webhooks/stripe', async (req, res) => {
  const signature = req.headers['stripe-signature'];
  if (!signature) return res.status(400).send('Missing signature');

  try {
    const event = await checkoutService.constructEvent(req.body, signature);
    if (!event) return res.status(200).send('Stripe disabled');

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      if (!orderId) return res.status(200).send('No orderId');
      const order = store.getById(orderId);
      if (!order) return res.status(200).send('Order not found');
      const document = await buildDocument(order, config.downloadDir);
      store.update(order.id, () => ({ status: 'paid', document }));
    }

    return res.status(200).send('ok');
  } catch (error) {
    return res.status(400).send(`Webhook error: ${error.message}`);
  }
});

app.listen(config.port, () => {
  console.log(`Reclamo Energia 2.0 running on http://localhost:${config.port}`);
});

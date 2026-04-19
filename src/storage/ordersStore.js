const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class OrdersStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.ensureFile();
  }

  ensureFile() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify({ orders: [] }, null, 2));
    }
  }

  read() {
    return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
  }

  write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  create(formPayload) {
    const db = this.read();
    const now = new Date().toISOString();
    const order = {
      id: crypto.randomUUID(),
      recoveryToken: crypto.randomBytes(18).toString('hex'),
      status: 'draft',
      amountCents: 700,
      currency: 'EUR',
      createdAt: now,
      updatedAt: now,
      checkout: null,
      customer: {
        fullName: formPayload.fullName,
        email: formPayload.email,
        pec: formPayload.pec || '',
        phone: formPayload.phone || '',
        address: formPayload.address
      },
      practice: {
        type: formPayload.type,
        reason: formPayload.reason,
        supplyType: formPayload.supplyType,
        supplierName: formPayload.supplierName,
        supplierPec: formPayload.supplierPec || '',
        invoiceNumber: formPayload.invoiceNumber || '',
        invoiceDate: formPayload.invoiceDate || '',
        invoiceAmount: formPayload.invoiceAmount || '',
        supplyAddress: formPayload.supplyAddress || '',
        customerCode: formPayload.customerCode || '',
        description: formPayload.description || ''
      },
      document: {
        text: '',
        pdfPath: '',
        generatedAt: null
      }
    };

    db.orders.push(order);
    this.write(db);
    return order;
  }

  update(orderId, updater) {
    const db = this.read();
    const i = db.orders.findIndex((o) => o.id === orderId);
    if (i === -1) return null;
    const current = db.orders[i];
    const next = { ...current, ...updater(current), updatedAt: new Date().toISOString() };
    db.orders[i] = next;
    this.write(db);
    return next;
  }

  getById(orderId) {
    return this.read().orders.find((o) => o.id === orderId) || null;
  }

  getByRecoveryToken(token) {
    return this.read().orders.find((o) => o.recoveryToken === token) || null;
  }

  getByCheckoutSessionId(sessionId) {
    return this.read().orders.find((o) => o.checkout?.sessionId === sessionId) || null;
  }
}

module.exports = OrdersStore;

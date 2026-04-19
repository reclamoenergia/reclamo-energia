const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateOrderPayload(payload = {}) {
  const errors = {};
  const required = ['type', 'reason', 'supplyType', 'supplierName', 'fullName', 'email', 'address'];

  required.forEach((field) => {
    if (!String(payload[field] || '').trim()) {
      errors[field] = 'Campo obbligatorio';
    }
  });

  if (payload.email && !EMAIL_RE.test(payload.email)) {
    errors.email = 'Inserisci un indirizzo email valido';
  }

  if (payload.invoiceAmount && Number.isNaN(Number(payload.invoiceAmount.replace(',', '.')))) {
    errors.invoiceAmount = 'Importo non valido';
  }

  return errors;
}

module.exports = { validateOrderPayload };

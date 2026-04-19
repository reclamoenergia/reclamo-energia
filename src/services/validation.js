const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isBlank(value) {
  return !String(value || '').trim();
}

function validateOrderPayload(payload = {}) {
  const errors = {};
  ['type', 'reason', 'supplyType', 'supplierName', 'goal', 'fullName', 'email', 'address'].forEach((field) => {
    if (isBlank(payload[field])) errors[field] = 'Campo obbligatorio';
  });

  if (payload.email && !EMAIL_RE.test(payload.email)) {
    errors.email = 'Inserisci un indirizzo email valido';
  }

  ['invoiceAmount', 'usualAmount'].forEach((field) => {
    if (payload[field] && Number.isNaN(Number(String(payload[field]).replace(',', '.')))) {
      errors[field] = 'Importo non valido';
    }
  });

  if (isBlank(payload.description)) {
    errors.description = 'Descrivi brevemente il problema per migliorare la qualità del testo';
  }

  if (['reclamo', 'rimborso', 'cessazione'].includes(payload.type) && isBlank(payload.invoiceAmount)) {
    errors.invoiceAmount = 'Indica l’importo coinvolto, se disponibile';
  }

  if (payload.type === 'rateizzazione' && isBlank(payload.invoiceAmount)) {
    errors.invoiceAmount = 'Indica l’importo da rateizzare';
  }

  if (payload.type === 'voltura' && isBlank(payload.effectiveDate)) {
    errors.effectiveDate = 'Inserisci la data della richiesta';
  }

  if (payload.type === 'subentro' && isBlank(payload.activationDate)) {
    errors.activationDate = 'Inserisci la data della richiesta di subentro/attivazione';
  }

  if (payload.type === 'cessazione' && isBlank(payload.cessationDate)) {
    errors.cessationDate = 'Inserisci la data della richiesta di cessazione';
  }

  return errors;
}

module.exports = { validateOrderPayload };

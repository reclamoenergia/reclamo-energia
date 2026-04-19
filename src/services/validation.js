const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isBlank(value) {
  return !String(value || '').trim();
}

function validateOrderPayload(payload = {}) {
  const errors = {};
  const required = ['type', 'reason', 'supplyType', 'supplierName', 'goal', 'fullName', 'email', 'address'];

  required.forEach((field) => {
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
    errors.description = 'Inserisci almeno un riepilogo breve del problema';
  }

  if (payload.type === 'reclamo' && isBlank(payload.invoiceAmount)) {
    errors.invoiceAmount = 'Per un reclamo su bolletta indica l\'importo contestato';
  }

  if (payload.type === 'rateizzazione') {
    if (isBlank(payload.invoiceAmount)) errors.invoiceAmount = 'Indica l\'importo da rateizzare';
    if (isBlank(payload.requestedInstallments)) errors.requestedInstallments = 'Indica il numero di rate desiderate';
  }

  if (payload.type === 'voltura') {
    if (isBlank(payload.contractHolderNew)) errors.contractHolderNew = 'Indica il nuovo intestatario';
    if (isBlank(payload.effectiveDate)) errors.effectiveDate = 'Indica la data richiesta';
  }

  if (payload.type === 'contatore' && isBlank(payload.meterIssueType)) {
    errors.meterIssueType = 'Seleziona il problema del contatore';
  }

  return errors;
}

module.exports = { validateOrderPayload };

const reasonNormalization = {
  importo: 'contestazione_fattura_importo',
  stimata: 'verifica_letture_contatore',
  doppia: 'contestazione_doppia_fatturazione',
  voci: 'addebiti_non_chiari',
  generale: 'reclamo_amministrativo_generico',
  difficolta: 'richiesta_rateizzazione',
  importo_elevato: 'richiesta_rateizzazione',
  pagamenti_pregressi: 'richiesta_rateizzazione',
  ritardo: 'pratica_voltura_ritardo',
  documenti: 'pratica_voltura_bloccata_documenti',
  attivazione: 'pratica_subentro_ritardo',
  consumi: 'verifica_tecnica_contatore',
  letture: 'verifica_letture_contatore',
  guasto: 'verifica_tecnica_contatore',
  subentro_ritardo: 'pratica_subentro_ritardo',
  cessazione_non_gestita: 'pratica_cessazione_non_gestita',
  rimborso_storno: 'richiesta_rimborso_storno',
  amministrativo: 'reclamo_amministrativo_generico'
};

function clean(value) {
  return String(value || '').trim();
}

function boolish(value) {
  const v = clean(value).toLowerCase();
  if (!v) return null;
  if (['si', 'sì', 'yes', 'true'].includes(v)) return true;
  if (['no', 'false'].includes(v)) return false;
  return null;
}

function money(value) {
  const normalized = clean(value).replace('.', '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeOrder(order) {
  const customer = order.customer || {};
  const practice = order.practice || {};
  const reasonKey = reasonNormalization[practice.reason] || 'reclamo_amministrativo_generico';

  return {
    orderId: order.id,
    customer: {
      fullName: clean(customer.fullName),
      email: clean(customer.email),
      pec: clean(customer.pec),
      phone: clean(customer.phone),
      address: clean(customer.address)
    },
    practice: {
      type: clean(practice.type) || 'reclamo',
      reason: clean(practice.reason),
      reasonKey,
      goal: clean(practice.goal),
      tone: clean(practice.tone) || 'standard',
      urgency: clean(practice.urgency),
      supplyType: clean(practice.supplyType) || 'luce/gas',
      supplierName: clean(practice.supplierName),
      supplierPec: clean(practice.supplierPec),
      invoiceNumber: clean(practice.invoiceNumber),
      invoiceDate: clean(practice.invoiceDate),
      invoiceAmount: money(practice.invoiceAmount),
      usualAmount: money(practice.usualAmount),
      customerCode: clean(practice.customerCode),
      supplyAddress: clean(practice.supplyAddress),
      description: clean(practice.description),
      perceivedDifference: clean(practice.perceivedDifference),
      requestedInstallments: clean(practice.requestedInstallments),
      temporaryDifficulty: clean(practice.temporaryDifficulty),
      requestedActions: clean(practice.requestedActions),
      evidenceList: clean(practice.evidenceList),
      previousComplaints: boolish(practice.previousComplaints),
      lowUsageProperty: boolish(practice.lowUsageProperty),
      incompatibleUsage: boolish(practice.incompatibleUsage),
      estimatedReading: boolish(practice.estimatedReading),
      selfReadingValue: clean(practice.selfReadingValue),
      meterIssueType: clean(practice.meterIssueType),
      contractHolderCurrent: clean(practice.contractHolderCurrent),
      contractHolderNew: clean(practice.contractHolderNew),
      effectiveDate: clean(practice.effectiveDate),
      supplyActive: clean(practice.supplyActive),
      activationDate: clean(practice.activationDate),
      cessationDate: clean(practice.cessationDate),
      disputedPeriod: clean(practice.disputedPeriod),
      attachmentsReady: boolish(practice.attachmentsReady),
      writtenResponse: clean(practice.writtenResponse || 'si')
    }
  };
}

module.exports = { normalizeOrder };

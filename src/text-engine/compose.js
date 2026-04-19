const { tones } = require('./tone');
const { renderRequests } = require('./requests');

function euros(amount) {
  if (typeof amount !== 'number') return '';
  return amount.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
}

function choose(arr) {
  return arr.filter(Boolean).join(' ');
}

function buildSubject(ctx) {
  const p = ctx.normalized.practice;
  const scope = ctx.classification.objective;
  const invoice = p.invoiceNumber ? ` - fattura ${p.invoiceNumber}` : '';
  return `Comunicazione formale: ${scope}${invoice}`;
}

function buildPremise(ctx) {
  const { customer, practice } = ctx.normalized;
  const tone = tones[ctx.classification.tone] || tones.standard;
  return `Il/La sottoscritto/a ${customer.fullName}, intestatario/a della fornitura ${practice.supplyType} presso ${practice.supplyAddress || 'l’indirizzo indicato in anagrafica'}, ${tone.intro}.`;
}

function buildContext(ctx) {
  const p = ctx.normalized.practice;
  const bits = [
    p.customerCode ? `Codice cliente/POD/PDR: ${p.customerCode}.` : '',
    p.invoiceNumber ? `Fattura: ${p.invoiceNumber}${p.invoiceDate ? ` del ${p.invoiceDate}` : ''}${p.invoiceAmount ? `, importo addebitato ${euros(p.invoiceAmount)}` : ''}.` : '',
    p.disputedPeriod ? `Periodo interessato: ${p.disputedPeriod}.` : '',
    p.effectiveDate ? `Data richiesta pratica: ${p.effectiveDate}.` : '',
    p.previousComplaints ? 'Sono già stati effettuati precedenti contatti senza soluzione definitiva.' : ''
  ];
  return choose(bits);
}

function buildProblem(ctx) {
  const p = ctx.normalized.practice;
  const map = {
    complaintHighBill: `L’importo addebitato risulta anomalo rispetto al profilo abituale di consumo${p.usualAmount ? ` (media storica stimata: ${euros(p.usualAmount)})` : ''}.`,
    estimatedReadings: 'La fatturazione appare basata su letture non coerenti con i dati reali disponibili.',
    duplicateBilling: 'Sono presenti addebiti che appaiono sovrapposti o duplicati rispetto al medesimo periodo di fornitura.',
    installmentPlan: `Si richiede un piano di rientro per l’importo di ${euros(p.invoiceAmount) || 'cui alla pratica'} per difficoltà temporanea, con volontà di adempiere integralmente.`,
    meterCheck: 'Si riscontrano segnali di possibile anomalia del contatore o della catena di misura, con effetti sui consumi fatturati.',
    transferDelay: 'La voltura risulta non conclusa nonostante la richiesta già presentata.',
    activationDelay: 'La richiesta di subentro/attivazione risulta in ritardo rispetto alle esigenze abitative indicate.',
    cessationIssue: 'La cessazione/chiusura fornitura non risulta completata con regolarità amministrativa.',
    refundRequest: 'Permangono somme ritenute non dovute per cui si richiede rimborso o storno.',
    genericComplaint: 'La pratica presenta criticità amministrative che necessitano istruttoria e risposta formale.'
  };

  return choose([
    map[ctx.classification.category],
    p.lowUsageProperty ? 'Nel periodo considerato l’immobile è stato utilizzato in modo ridotto, elemento che rafforza la non coerenza dell’addebito.' : '',
    p.incompatibleUsage ? 'I consumi rilevati non risultano compatibili con l’uso reale dichiarato della fornitura.' : '',
    p.description
  ]);
}

function buildCriticality(ctx) {
  const p = ctx.normalized.practice;
  return choose([
    p.estimatedReading ? 'Si rileva la possibilità che in fattura siano state utilizzate letture stimate o non aggiornate.' : '',
    p.selfReadingValue ? `È disponibile autolettura pari a ${p.selfReadingValue}, utile alla verifica tecnica.` : '',
    p.contractHolderNew ? `La pratica coinvolge il subentro da ${p.contractHolderCurrent || 'intestatario attuale'} a ${p.contractHolderNew}.` : '',
    p.temporaryDifficulty ? `È stata segnalata la seguente situazione economica temporanea: ${p.temporaryDifficulty}.` : '',
    !p.estimatedReading && !p.selfReadingValue && !p.contractHolderNew && !p.temporaryDifficulty
      ? 'La ricostruzione dei fatti evidenzia la necessità di una verifica puntuale dei dati commerciali e tecnici della pratica.'
      : ''
  ]);
}

function buildAttachments(ctx) {
  const p = ctx.normalized.practice;
  if (p.evidenceList) return `Documentazione disponibile: ${p.evidenceList}.`;
  if (p.attachmentsReady === false) return 'Eventuali allegati saranno trasmessi tempestivamente su richiesta dell’ufficio competente.';
  return 'Documenti di supporto disponibili e pronti per l’invio in allegato alla PEC.';
}

function composeDocument(ctx) {
  const subject = buildSubject(ctx);
  const premise = buildPremise(ctx);
  const context = buildContext(ctx);
  const problem = buildProblem(ctx);
  const criticality = buildCriticality(ctx);
  const requests = renderRequests(ctx.classification.requestKeys, {
    mode: ['installmentPlan', 'genericComplaint'].includes(ctx.classification.category) ? 'paragraph' : 'list',
    custom: ctx.normalized.practice.requestedActions
  });
  const attachments = buildAttachments(ctx);
  const closingTone = tones[ctx.classification.tone] || tones.standard;
  const closing = `${ctx.normalized.practice.writtenResponse === 'no' ? 'Si resta in attesa di cortese riscontro.' : 'Si richiede riscontro scritto con esito della pratica.'} ${closingTone.close}`;

  return {
    subject,
    sections: { premise, context, problem, criticality, requests, attachments, closing }
  };
}

module.exports = { composeDocument, euros };

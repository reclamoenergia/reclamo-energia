const { normalizeOrder } = require('./normalize');
const { classifyCase } = require('./classify');
const { composeDocument } = require('./compose');

function buildTextEngineOutput(order) {
  const normalized = normalizeOrder(order);
  const classification = classifyCase(normalized);
  const composed = composeDocument({ normalized, classification });

  const today = new Date().toLocaleDateString('it-IT');
  const senderBlock = [
    normalized.customer.fullName,
    normalized.customer.address,
    normalized.customer.email ? `Email: ${normalized.customer.email}` : '',
    normalized.customer.pec ? `PEC: ${normalized.customer.pec}` : '',
    normalized.customer.phone ? `Telefono: ${normalized.customer.phone}` : ''
  ].filter(Boolean).join('\n');

  const recipientBlock = `Spett.le ${normalized.practice.supplierName}\n${normalized.practice.supplierPec ? `PEC: ${normalized.practice.supplierPec}` : ''}`.trim();

  const fullText = `${senderBlock}\n\n${recipientBlock}\n\nOggetto: ${composed.subject}\n\nPremessa\n${composed.sections.premise}\n\nDescrizione della pratica\n${composed.sections.context}\n\nRicostruzione del problema\n${composed.sections.problem}\n\nElementi di criticità\n${composed.sections.criticality}\n\nRichieste\n${composed.sections.requests}\n\nAllegati / disponibilità allegati\n${composed.sections.attachments}\n\n${composed.sections.closing}\n\nData: ${today}\n\nFirma\n${normalized.customer.fullName}`;

  const pecBody = `${composed.sections.premise}\n\n${composed.sections.problem}\n\nRichieste:\n${composed.sections.requests}\n\n${composed.sections.attachments}\n\n${composed.sections.closing}`;

  return {
    normalized,
    classification,
    subject: composed.subject,
    fullText,
    pec: {
      subject: composed.subject,
      body: pecBody
    },
    sections: composed.sections
  };
}

module.exports = { buildTextEngineOutput };

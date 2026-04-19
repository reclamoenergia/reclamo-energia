const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const reasonLabels = {
  importo: 'importo anomalo della fattura',
  stimata: 'possibile lettura stimata o errata',
  doppia: 'possibile doppia fatturazione',
  voci: 'presenza di voci non previste',
  generale: 'irregolarità in bolletta',
  difficolta: 'difficoltà economica temporanea',
  importo_elevato: 'importo elevato da ripartire',
  pagamenti_pregressi: 'regolarizzazione importi pregressi',
  ritardo: 'ritardo nel completamento voltura',
  documenti: 'pratica ferma nonostante documentazione inviata',
  attivazione: 'mancata conferma decorrenza voltura',
  consumi: 'consumi anomali rilevati',
  letture: 'letture incoerenti',
  guasto: 'sospetto malfunzionamento contatore'
};

function line(label, value) {
  return value ? `${label}: ${value}` : '';
}

function formatCurrency(value) {
  if (!value) return '';
  const parsed = Number(String(value).replace(',', '.'));
  if (Number.isNaN(parsed)) return value;
  return parsed.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
}

function buildSubject(practice) {
  const base = practice.type === 'rateizzazione'
    ? 'Richiesta di rateizzazione importi'
    : practice.type === 'contatore'
      ? 'Richiesta verifica tecnica contatore'
      : practice.type === 'voltura'
        ? 'Sollecito completamento pratica di voltura'
        : 'Reclamo formale su fattura energia';

  const reason = reasonLabels[practice.reason] || practice.reason;
  const invoice = practice.invoiceNumber ? ` - Fattura ${practice.invoiceNumber}` : '';
  return `${base}${reason ? ` per ${reason}` : ''}${invoice}`;
}

function buildPremise(practice, customer) {
  const tone = practice.tone === 'chiaro' ? 'diretta e chiara' : 'formale';
  return `Il/La sottoscritto/a ${customer.fullName}, intestatario/a della fornitura ${practice.supplyType || 'energia'}, presenta la seguente comunicazione con impostazione ${tone}, al fine di ottenere una gestione puntuale della pratica.`;
}

function buildFacts(practice) {
  const facts = [];

  if (practice.type === 'reclamo') {
    facts.push(`La presente riguarda una contestazione su fattura ${practice.invoiceNumber || 'non indicata'} del ${practice.invoiceDate || 'periodo recente'}, con importo pari a ${formatCurrency(practice.invoiceAmount) || 'importo non indicato'}.`);
    if (practice.usualAmount) facts.push(`L'importo medio abituale risulta di circa ${formatCurrency(practice.usualAmount)}, con scostamento percepito: ${practice.perceivedDifference || 'significativo'}.`);
    if (practice.incompatibleUsage) facts.push(`Compatibilità consumi con uso reale: ${practice.incompatibleUsage}.`);
    if (practice.lowUsageProperty) facts.push(`Immobile con utilizzo ridotto/vuoto nel periodo: ${practice.lowUsageProperty}.`);
    if (practice.estimatedReading) facts.push(`Sospetto di letture stimate o non corrette: ${practice.estimatedReading}.`);
  }

  if (practice.type === 'rateizzazione') {
    facts.push(`Si richiede la rateizzazione dell'importo complessivo di ${formatCurrency(practice.invoiceAmount) || 'importo non indicato'}, con preferenza per ${practice.requestedInstallments || 'un piano sostenibile'} rate.`);
    if (practice.temporaryDifficulty) facts.push(`Motivazione: ${practice.temporaryDifficulty}.`);
  }

  if (practice.type === 'voltura') {
    facts.push(`È stata richiesta la voltura dell'utenza da ${practice.contractHolderCurrent || 'intestatario attuale'} a ${practice.contractHolderNew || 'nuovo intestatario'}, con decorrenza richiesta dal ${practice.effectiveDate || 'prima data utile'}.`);
    if (practice.supplyActive) facts.push(`Stato fornitura dichiarato: ${practice.supplyActive}.`);
  }

  if (practice.type === 'contatore') {
    facts.push(`Si segnala il seguente problema del contatore: ${practice.meterIssueType || 'verifica necessaria'}.`);
    if (practice.selfReadingValue) facts.push(`Autolettura disponibile: ${practice.selfReadingValue}.`);
    if (practice.incompatibleUsage) facts.push(`Compatibilità consumi con uso reale: ${practice.incompatibleUsage}.`);
    if (practice.estimatedReading) facts.push(`Presenza di letture presumibilmente non coerenti: ${practice.estimatedReading}.`);
  }

  if (practice.previousComplaints === 'si') {
    facts.push('Sono già state inviate precedenti segnalazioni senza riscontro risolutivo.');
  }

  if (practice.description) facts.push(`Ulteriori dettagli forniti: ${practice.description}`);

  return facts.length > 0
    ? facts
    : ['Si richiede una verifica puntuale della situazione segnalata e relativo riscontro scritto.'];
}

function parseRequestedActions(practice) {
  if (practice.requestedActions) {
    return practice.requestedActions.split(',').map((item) => item.trim()).filter(Boolean);
  }

  const defaultsByType = {
    reclamo: [
      'verifica analitica della fattura contestata',
      'rettifica degli importi eventualmente non dovuti',
      'sospensione di azioni di recupero sull\'importo contestato',
      'emissione di nota di credito o nuova fattura corretta'
    ],
    rateizzazione: [
      'valutazione e concessione di un piano rate sostenibile',
      'conferma scritta del piano con importi e scadenze',
      'sospensione temporanea di eventuali solleciti in pendenza di valutazione'
    ],
    voltura: [
      'completamento della pratica di voltura',
      'conferma scritta della decorrenza e dell\'avvenuta registrazione',
      'indicazione puntuale di eventuali documenti ancora necessari'
    ],
    contatore: [
      'verifica tecnica del contatore e delle letture associate',
      'eventuale rettifica dei consumi fatturati se non coerenti',
      'comunicazione scritta dell\'esito della verifica'
    ]
  };

  return defaultsByType[practice.type] || ['presa in carico e risposta scritta alla presente pratica'];
}

function buildClosing(practice) {
  if (practice.writtenResponse === 'no') {
    return 'Si resta in attesa di cortese riscontro e della gestione della pratica nei tempi normalmente applicati.';
  }

  return 'Si richiede un riscontro scritto con esito della pratica entro i tempi normalmente applicati e, se necessario, il dettaglio delle azioni correttive adottate.';
}

function buildBody(practice, customer) {
  const today = new Date().toLocaleDateString('it-IT');
  const subject = buildSubject(practice);
  const premise = buildPremise(practice, customer);
  const facts = buildFacts(practice);
  const actions = parseRequestedActions(practice);

  const header = [
    customer.fullName,
    customer.address,
    line('Email', customer.email),
    line('PEC', customer.pec),
    line('Telefono', customer.phone)
  ].filter(Boolean).join('\n');

  const dossier = [
    line('Codice cliente / POD / PDR', practice.customerCode),
    line('Fornitura', practice.supplyType),
    line('Indirizzo fornitura', practice.supplyAddress),
    line('Numero fattura', practice.invoiceNumber),
    line('Data fattura', practice.invoiceDate),
    line('Importo indicato', formatCurrency(practice.invoiceAmount)),
    line('Motivo principale', reasonLabels[practice.reason] || practice.reason),
    line('Obiettivo dichiarato', practice.goal)
  ].filter(Boolean).join('\n');

  const attachments = practice.evidenceList
    ? `Documenti disponibili a supporto: ${practice.evidenceList}.`
    : 'Documenti a supporto: disponibili su richiesta o in fase di invio PEC.';

  const text = `${header}

Spett.le ${practice.supplierName}
PEC: ${practice.supplierPec || 'non indicata'}

Oggetto: ${subject}

Premessa
${premise}

Riepilogo del caso
${facts.map((fact, idx) => `${idx + 1}. ${fact}`).join('\n')}

Richieste
${actions.map((action, idx) => `${idx + 1}. ${action}.`).join('\n')}

Dati pratica
${dossier}

Allegati
${attachments}

${buildClosing(practice)}

Data: ${today}

Firma
${customer.fullName}`;

  return { text, subject, premise, facts, actions, dossier, attachments };
}

function generatePdf(documentData, destinationPath, order) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 56, size: 'A4' });
    const stream = fs.createWriteStream(destinationPath);
    doc.pipe(stream);

    doc.font('Helvetica-Bold').fontSize(16).text('Reclamo Energia 2.0', { align: 'left' });
    doc.moveDown(0.4);
    doc.font('Helvetica').fontSize(10).fillColor('#4b5563').text(`Documento pratica #${order.id}`);
    doc.fillColor('#111111').moveDown(1.2);

    doc.font('Helvetica-Bold').fontSize(11).text('Mittente');
    doc.moveDown(0.3).font('Helvetica').fontSize(11).text([
      order.customer.fullName,
      order.customer.address,
      line('Email', order.customer.email),
      line('PEC', order.customer.pec),
      line('Telefono', order.customer.phone)
    ].filter(Boolean).join('\n'));

    doc.moveDown(0.8);
    doc.font('Helvetica-Bold').text('Destinatario');
    doc.moveDown(0.3).font('Helvetica').text(`Spett.le ${order.practice.supplierName}\nPEC: ${order.practice.supplierPec || 'non indicata'}`);

    doc.moveDown(1);
    doc.rect(doc.x, doc.y, 495, 30).fill('#eef2ff').stroke('#c7d2fe');
    doc.fillColor('#1e3a8a').font('Helvetica-Bold').fontSize(11).text(`Oggetto: ${documentData.subject}`, doc.x + 8, doc.y - 21, { width: 475 });
    doc.fillColor('#111111');

    doc.moveDown(1.8);
    doc.font('Helvetica-Bold').fontSize(11).text('Premessa');
    doc.moveDown(0.3).font('Helvetica').fontSize(11).text(documentData.premise, { lineGap: 2 });

    doc.moveDown(0.8).font('Helvetica-Bold').text('Riepilogo del caso');
    doc.moveDown(0.3).font('Helvetica');
    documentData.facts.forEach((fact, idx) => {
      doc.text(`${idx + 1}. ${fact}`, { lineGap: 2 });
    });

    doc.moveDown(0.8).font('Helvetica-Bold').text('Richieste');
    doc.moveDown(0.3).font('Helvetica');
    documentData.actions.forEach((action, idx) => {
      doc.text(`${idx + 1}. ${action}.`, { lineGap: 2 });
    });

    doc.moveDown(0.8).font('Helvetica-Bold').text('Dati pratica');
    doc.moveDown(0.3).font('Helvetica').text(documentData.dossier || 'Dati pratica non specificati', { lineGap: 2 });

    doc.moveDown(0.8).font('Helvetica-Bold').text('Allegati');
    doc.moveDown(0.3).font('Helvetica').text(documentData.attachments, { lineGap: 2 });

    doc.moveDown(1).text(buildClosing(order.practice), { lineGap: 2 });
    doc.moveDown(1.4).text(`Data: ${new Date().toLocaleDateString('it-IT')}`);
    doc.moveDown(1.1).font('Helvetica-Bold').text(`Firma\n${order.customer.fullName}`);

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

async function buildDocument(order, downloadDir) {
  if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });
  const documentData = buildBody(order.practice, order.customer);
  const filename = `reclamo-energia-${order.id}.pdf`;
  const absolute = path.join(downloadDir, filename);
  await generatePdf(documentData, absolute, order);

  return {
    text: documentData.text,
    pdfPath: `/downloads/${filename}`,
    generatedAt: new Date().toISOString()
  };
}

module.exports = { buildDocument };

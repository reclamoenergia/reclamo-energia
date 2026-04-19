const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const reasonLabels = {
  importo: 'Importo anomalo',
  stimata: 'Lettura stimata errata',
  doppia: 'Doppia fatturazione',
  voci: 'Voci non previste',
  generale: 'Richiesta generale'
};

function line(label, value) {
  return value ? `${label}: ${value}` : '';
}

function buildBody(practice, customer) {
  const header = [
    customer.fullName,
    customer.address,
    line('Email', customer.email),
    line('PEC', customer.pec),
    line('Telefono', customer.phone)
  ].filter(Boolean).join('\n');

  const details = [
    line('Codice cliente', practice.customerCode),
    line('Fornitura', practice.supplyType),
    line('Indirizzo fornitura', practice.supplyAddress),
    line('Fattura', practice.invoiceNumber),
    line('Data fattura', practice.invoiceDate),
    line('Importo fattura', practice.invoiceAmount ? `${practice.invoiceAmount} €` : ''),
    line('Motivo pratica', reasonLabels[practice.reason] || practice.reason)
  ].filter(Boolean).join('\n');

  const today = new Date().toLocaleDateString('it-IT');
  const subject = practice.type === 'rateizzazione'
    ? 'Richiesta di rateizzazione'
    : practice.type === 'contatore'
      ? 'Richiesta verifica contatore'
      : practice.type === 'voltura'
        ? 'Richiesta di voltura'
        : 'Reclamo formale su bolletta energia';

  return `${header}\n\nSpett.le ${practice.supplierName}\nPEC: ${practice.supplierPec || 'non indicata'}\n\nOggetto: ${subject}\n\n${details}\n\nDescrizione del caso:\n${practice.description || 'Richiedo verifica e riscontro scritto nei tempi previsti dalla regolazione ARERA.'}\n\nChiedo una risposta scritta e la gestione della pratica nei termini previsti.\n\nData: ${today}\n\nFirma\n${customer.fullName}`;
}

function generatePdf(text, destinationPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 56, size: 'A4' });
    const stream = fs.createWriteStream(destinationPath);
    doc.pipe(stream);
    doc.font('Times-Roman').fontSize(12).text(text, { lineGap: 5 });
    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

async function buildDocument(order, downloadDir) {
  if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });
  const text = buildBody(order.practice, order.customer);
  const filename = `reclamo-energia-${order.id}.pdf`;
  const absolute = path.join(downloadDir, filename);
  await generatePdf(text, absolute);

  return {
    text,
    pdfPath: `/downloads/${filename}`,
    generatedAt: new Date().toISOString()
  };
}

module.exports = { buildDocument };

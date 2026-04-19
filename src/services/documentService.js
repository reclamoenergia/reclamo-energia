const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { buildTextEngineOutput } = require('../text-engine');

function renderSection(doc, title, body) {
  if (!body) return;
  doc.moveDown(0.7);
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a').text(title.toUpperCase(), { characterSpacing: 0.8 });
  doc.moveDown(0.25);
  doc.font('Helvetica').fontSize(11).fillColor('#1f2937').text(body, { lineGap: 3, align: 'justify' });
}

function generatePdf(engine, destinationPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 64, size: 'A4' });
    const stream = fs.createWriteStream(destinationPath);
    doc.pipe(stream);

    doc.font('Helvetica-Bold').fontSize(16).fillColor('#0f172a').text('Comunicazione formale utenza energia');
    doc.font('Helvetica').fontSize(9).fillColor('#64748b').text(`Documento generato il ${new Date().toLocaleDateString('it-IT')}`);

    doc.moveDown(0.8);
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(64, doc.y).lineTo(531, doc.y).stroke();

    doc.moveDown(0.8);
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a').text('MITTENTE');
    doc.font('Helvetica').fontSize(11).fillColor('#1f2937').text([
      engine.normalized.customer.fullName,
      engine.normalized.customer.address,
      engine.normalized.customer.email ? `Email: ${engine.normalized.customer.email}` : '',
      engine.normalized.customer.pec ? `PEC: ${engine.normalized.customer.pec}` : '',
      engine.normalized.customer.phone ? `Telefono: ${engine.normalized.customer.phone}` : ''
    ].filter(Boolean).join('\n'));

    doc.moveDown(0.7);
    doc.font('Helvetica-Bold').fontSize(10).text('DESTINATARIO');
    doc.font('Helvetica').fontSize(11).text(`Spett.le ${engine.normalized.practice.supplierName}`);
    if (engine.normalized.practice.supplierPec) doc.text(`PEC: ${engine.normalized.practice.supplierPec}`);

    doc.moveDown(0.8);
    const y = doc.y;
    doc.roundedRect(64, y, 467, 44, 6).fillAndStroke('#eff6ff', '#bfdbfe');
    doc.fillColor('#1d4ed8').font('Helvetica-Bold').fontSize(11)
      .text(`Oggetto: ${engine.subject}`, 76, y + 14, { width: 442 });

    doc.y = y + 52;
    renderSection(doc, 'Premessa', engine.sections.premise);
    renderSection(doc, 'Descrizione della pratica', engine.sections.context);
    renderSection(doc, 'Ricostruzione del problema', engine.sections.problem);
    renderSection(doc, 'Elementi di criticità', engine.sections.criticality);
    renderSection(doc, 'Richieste', engine.sections.requests);
    renderSection(doc, 'Allegati / disponibilità allegati', engine.sections.attachments);

    doc.moveDown(0.9);
    doc.font('Helvetica').fontSize(11).text(engine.sections.closing, { lineGap: 3, align: 'justify' });
    doc.moveDown(1.2).text(`Data: ${new Date().toLocaleDateString('it-IT')}`);
    doc.moveDown(1.4).font('Helvetica-Bold').text('Firma');
    doc.font('Helvetica').text(engine.normalized.customer.fullName);

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

async function buildDocument(order, downloadDir) {
  if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });
  const engine = buildTextEngineOutput(order);
  const filename = `reclamo-energia-${order.id}.pdf`;
  const absolute = path.join(downloadDir, filename);
  await generatePdf(engine, absolute);

  return {
    text: engine.fullText,
    pecSubject: engine.pec.subject,
    pecBody: engine.pec.body,
    pdfPath: `/downloads/${filename}`,
    generatedAt: new Date().toISOString()
  };
}

module.exports = { buildDocument };

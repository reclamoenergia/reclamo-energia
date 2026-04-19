const { templateCatalog } = require('./templates');
const { resolveTone } = require('./tone');

function classifyCase(normalized) {
  const practice = normalized.practice;
  const template = templateCatalog[practice.reasonKey] || templateCatalog.reclamo_amministrativo_generico;
  const urgency = practice.urgency || (practice.previousComplaints ? 'media' : 'ordinaria');

  const narrativeBlocks = ['premessa', 'contesto', 'problema', 'criticita', 'richieste', 'allegati', 'chiusura'];
  if (!practice.evidenceList && practice.attachmentsReady === false) {
    narrativeBlocks.push('disponibilita_allegati');
  }

  return {
    category: template.key,
    subCategory: practice.reasonKey,
    requestKeys: template.requestKeys,
    objective: template.objective,
    tone: resolveTone(practice.tone),
    urgency,
    narrativeBlocks
  };
}

module.exports = { classifyCase };

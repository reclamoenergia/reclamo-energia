const tones = {
  standard: {
    intro: 'trasmette la presente comunicazione per sottoporre formalmente la problematica sotto descritta',
    close: 'Confidando in una gestione puntuale, resto a disposizione per eventuali integrazioni.'
  },
  fermo: {
    intro: 'trasmette la presente comunicazione per richiedere una verifica tempestiva e una definizione puntuale della pratica',
    close: 'In assenza di riscontro, mi riservo ogni ulteriore iniziativa nelle sedi competenti.'
  },
  amministrativo: {
    intro: 'trasmette la presente istanza ai fini della corretta istruttoria amministrativa della pratica indicata',
    close: 'Si resta in attesa del riscontro formale e degli adempimenti conseguenti.'
  }
};

function resolveTone(rawTone = '') {
  const tone = String(rawTone || '').toLowerCase();
  if (tone.includes('fermo')) return 'fermo';
  if (tone.includes('amministr')) return 'amministrativo';
  return 'standard';
}

module.exports = { tones, resolveTone };

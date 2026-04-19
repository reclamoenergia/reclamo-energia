const REQUESTS = {
  richiesta_verifica_fattura: 'verificare la correttezza della fattura contestata e dei criteri di addebito applicati',
  richiesta_verifica_letture: 'verificare le letture utilizzate in fatturazione e riallinearle con i dati reali disponibili',
  richiesta_verifica_tecnica_contatore: 'programmare una verifica tecnica del contatore e delle misure associate alla fornitura',
  richiesta_rettifica_importi: 'rettificare gli importi non coerenti con i consumi effettivi o con lo stato della pratica',
  richiesta_nota_credito: 'emettere nota di credito per gli importi non dovuti',
  richiesta_nuova_fattura: 'emettere nuova fattura con importi ricalcolati in modo trasparente',
  richiesta_rateizzazione: 'proporre un piano di rateizzazione sostenibile con importi e scadenze chiare',
  richiesta_definizione_pratica: 'definire la pratica in modo conclusivo con conferma formale della lavorazione',
  richiesta_aggiornamento_stato: 'comunicare lo stato aggiornato della pratica con tempi previsti di chiusura',
  richiesta_comunicazione_scritta: 'fornire riscontro scritto sull’esito delle verifiche e delle decisioni adottate',
  richiesta_sospensione_recupero_importo_contestato: 'sospendere, in via prudenziale, iniziative di recupero sulle somme oggetto di contestazione',
  richiesta_indicazione_documenti_mancanti: 'indicare con precisione eventuali documenti mancanti per completare la pratica',
  richiesta_rimborso: 'indicare tempi e modalità del rimborso delle somme risultate non dovute',
  richiesta_storno: 'procedere allo storno amministrativo degli importi non dovuti'
};

function parseCustomActions(value) {
  return String(value || '')
    .split(',')
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

function renderRequests(requestKeys = [], { mode = 'list', custom = '' } = {}) {
  const customActions = parseCustomActions(custom);
  const baseActions = requestKeys
    .map((key) => REQUESTS[key])
    .filter(Boolean);
  const actions = [...baseActions, ...customActions];

  if (!actions.length) return '';

  if (mode === 'paragraph') {
    return `Si richiede cortesemente di ${actions.join(', nonché di ')}.`;
  }

  return actions.map((action, index) => `${index + 1}. ${action}.`).join('\n');
}

module.exports = { renderRequests, REQUESTS };

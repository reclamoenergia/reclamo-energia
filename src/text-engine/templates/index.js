const templateCatalog = {
  contestazione_fattura_importo: {
    key: 'complaintHighBill',
    objective: 'contestare importo anomalo e ottenere rettifica',
    requestKeys: ['richiesta_verifica_fattura', 'richiesta_verifica_letture', 'richiesta_rettifica_importi', 'richiesta_nuova_fattura', 'richiesta_sospensione_recupero_importo_contestato', 'richiesta_comunicazione_scritta']
  },
  verifica_letture_contatore: {
    key: 'estimatedReadings',
    objective: 'riallineare le letture e ricalcolare la fattura',
    requestKeys: ['richiesta_verifica_letture', 'richiesta_rettifica_importi', 'richiesta_nuova_fattura', 'richiesta_comunicazione_scritta']
  },
  contestazione_doppia_fatturazione: {
    key: 'duplicateBilling',
    objective: 'eliminare addebiti duplicati o non chiari',
    requestKeys: ['richiesta_verifica_fattura', 'richiesta_storno', 'richiesta_nota_credito', 'richiesta_nuova_fattura', 'richiesta_comunicazione_scritta']
  },
  richiesta_rateizzazione: {
    key: 'installmentPlan',
    objective: 'ottenere un piano sostenibile senza bloccare la gestione della pratica',
    requestKeys: ['richiesta_rateizzazione', 'richiesta_aggiornamento_stato', 'richiesta_comunicazione_scritta']
  },
  verifica_tecnica_contatore: {
    key: 'meterCheck',
    objective: 'attivare verifica tecnica e eventuale rettifica consumi',
    requestKeys: ['richiesta_verifica_tecnica_contatore', 'richiesta_verifica_letture', 'richiesta_rettifica_importi', 'richiesta_comunicazione_scritta']
  },
  pratica_voltura_ritardo: {
    key: 'transferDelay',
    objective: 'sollecitare chiusura voltura',
    requestKeys: ['richiesta_aggiornamento_stato', 'richiesta_definizione_pratica', 'richiesta_indicazione_documenti_mancanti', 'richiesta_comunicazione_scritta']
  },
  pratica_subentro_ritardo: {
    key: 'activationDelay',
    objective: 'sbloccare subentro o attivazione in ritardo',
    requestKeys: ['richiesta_aggiornamento_stato', 'richiesta_definizione_pratica', 'richiesta_comunicazione_scritta']
  },
  pratica_cessazione_non_gestita: {
    key: 'cessationIssue',
    objective: 'chiudere fornitura e rettificare eventuali addebiti successivi',
    requestKeys: ['richiesta_definizione_pratica', 'richiesta_rettifica_importi', 'richiesta_storno', 'richiesta_comunicazione_scritta']
  },
  richiesta_rimborso_storno: {
    key: 'refundRequest',
    objective: 'ottenere rimborso o storno di importi non dovuti',
    requestKeys: ['richiesta_rimborso', 'richiesta_storno', 'richiesta_comunicazione_scritta']
  },
  reclamo_amministrativo_generico: {
    key: 'genericComplaint',
    objective: 'formalizzare il reclamo con ricostruzione chiara e richiesta puntuale',
    requestKeys: ['richiesta_aggiornamento_stato', 'richiesta_definizione_pratica', 'richiesta_comunicazione_scritta']
  }
};

module.exports = { templateCatalog };

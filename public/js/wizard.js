const state = { currentStep: 1, maxStep: 4, orderId: null };

const form = document.getElementById('wizardForm');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const submitBtn = document.getElementById('submitBtn');
const feedback = document.getElementById('formFeedback');
const summary = document.getElementById('summary');
const typeSelect = document.getElementById('type');
const reasonSelect = document.getElementById('reason');

const reasonOptions = {
  reclamo: [
    { value: 'importo', label: 'Importo anomalo' },
    { value: 'stimata', label: 'Lettura stimata/errata' },
    { value: 'doppia', label: 'Doppia fatturazione' },
    { value: 'voci', label: 'Voci non previste in bolletta' },
    { value: 'generale', label: 'Altro reclamo su fatturazione' }
  ],
  rateizzazione: [
    { value: 'difficolta', label: 'Difficoltà economica temporanea' },
    { value: 'importo_elevato', label: 'Importo troppo elevato in un’unica soluzione' },
    { value: 'pagamenti_pregressi', label: 'Presenza di arretrati da regolarizzare' }
  ],
  voltura: [
    { value: 'ritardo', label: 'Voltura non completata' },
    { value: 'documenti', label: 'Documentazione inviata ma pratica ferma' },
    { value: 'attivazione', label: 'Richiesta conferma data decorrenza' }
  ],
  contatore: [
    { value: 'consumi', label: 'Consumi anomali' },
    { value: 'letture', label: 'Letture incoerenti' },
    { value: 'guasto', label: 'Sospetto guasto o malfunzionamento' }
  ]
};

function formDataObject() {
  return Object.fromEntries(new FormData(form).entries());
}

function requiredByStep(step, data) {
  if (step === 1) return ['type', 'reason', 'supplyType', 'supplierName', 'goal'];
  if (step === 2) return ['fullName', 'email', 'address'];

  if (step === 3) {
    const common = ['description'];
    if (data.type === 'reclamo') return [...common, 'invoiceAmount'];
    if (data.type === 'rateizzazione') return [...common, 'invoiceAmount', 'requestedInstallments'];
    if (data.type === 'voltura') return [...common, 'contractHolderNew', 'effectiveDate'];
    if (data.type === 'contatore') return [...common, 'meterIssueType'];
    return common;
  }

  return [];
}

function clearErrors() {
  document.querySelectorAll('[data-error]').forEach((el) => { el.textContent = ''; });
  document.querySelectorAll('input,select,textarea').forEach((el) => el.classList.remove('input-error'));
}

function setError(name, message) {
  const input = form.querySelector(`[name="${name}"]`);
  const error = form.querySelector(`[data-error="${name}"]`);
  if (input) input.classList.add('input-error');
  if (error) error.textContent = message;
}

function validateStep() {
  clearErrors();
  const data = formDataObject();
  const required = requiredByStep(state.currentStep, data);
  let valid = true;

  required.forEach((field) => {
    if (!String(data[field] || '').trim()) {
      setError(field, 'Campo obbligatorio');
      valid = false;
    }
  });

  if (state.currentStep === 2 && data.email) {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
    if (!ok) {
      setError('email', 'Inserisci un indirizzo email valido');
      valid = false;
    }
  }

  ['invoiceAmount', 'usualAmount'].forEach((field) => {
    if (data[field] && Number.isNaN(Number(String(data[field]).replace(',', '.')))) {
      setError(field, 'Inserisci un importo numerico valido');
      valid = false;
    }
  });

  return valid;
}

function updateReasons() {
  const currentType = typeSelect.value;
  const options = reasonOptions[currentType] || [];
  const currentValue = reasonSelect.value;

  reasonSelect.innerHTML = options.map((opt) => `<option value="${opt.value}">${opt.label}</option>`).join('');
  const hasCurrent = options.some((opt) => opt.value === currentValue);
  if (hasCurrent) reasonSelect.value = currentValue;
}

function renderConditionalFields() {
  const type = typeSelect.value;
  document.querySelectorAll('.case-field').forEach((field) => {
    const types = String(field.dataset.types || '').split(',').map((entry) => entry.trim());
    const visible = types.includes(type);
    field.style.display = visible ? 'block' : 'none';
    field.querySelectorAll('input,select,textarea').forEach((input) => {
      if (!visible) input.value = '';
    });
  });
}

function drawSummary() {
  const data = formDataObject();
  const requestedActions = data.requestedActions
    ? data.requestedActions
    : data.type === 'reclamo'
      ? 'Verifica fattura, rettifica importi, sospensione azioni su importo contestato e risposta scritta'
      : data.type === 'rateizzazione'
        ? 'Valutazione rateizzazione sostenibile e conferma piano'
        : data.type === 'voltura'
          ? 'Completamento pratica con data certa e conferma scritta'
          : 'Verifica tecnica contatore con riscontro scritto';

  summary.textContent = [
    `Pratica: ${data.type} · Motivo: ${reasonSelect.options[reasonSelect.selectedIndex]?.text || data.reason}`,
    `Obiettivo: ${data.goal}`,
    `Fornitore: ${data.supplierName} (${data.supplyType})`,
    `Cliente: ${data.fullName} · ${data.email}`,
    data.invoiceNumber ? `Fattura contestata: ${data.invoiceNumber} del ${data.invoiceDate || 'data non indicata'}` : '',
    data.invoiceAmount ? `Importo indicato: ${data.invoiceAmount} €` : '',
    data.usualAmount ? `Importo medio abituale: ${data.usualAmount} €` : '',
    data.evidenceList ? `Documenti disponibili: ${data.evidenceList}` : 'Documenti disponibili: da specificare in fase di invio',
    `Richieste da inserire: ${requestedActions}`,
    data.description ? `Nota caso: ${data.description}` : ''
  ].filter(Boolean).join('\n');
}

function renderStep() {
  document.querySelectorAll('.step').forEach((el) => {
    el.classList.toggle('active', Number(el.dataset.step) === state.currentStep);
  });

  document.querySelectorAll('#progress span').forEach((el, idx) => {
    el.classList.toggle('active', idx < state.currentStep);
  });

  prevBtn.style.visibility = state.currentStep === 1 ? 'hidden' : 'visible';
  nextBtn.style.display = state.currentStep === state.maxStep ? 'none' : 'inline-block';
  submitBtn.style.display = state.currentStep === state.maxStep ? 'inline-block' : 'none';

  if (state.currentStep === state.maxStep) drawSummary();
}

nextBtn.addEventListener('click', () => {
  if (!validateStep()) return;
  state.currentStep += 1;
  renderStep();
});

prevBtn.addEventListener('click', () => {
  state.currentStep -= 1;
  renderStep();
});

typeSelect.addEventListener('change', () => {
  updateReasons();
  renderConditionalFields();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  feedback.textContent = '';
  clearErrors();

  const payload = formDataObject();

  try {
    const createRes = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!createRes.ok) {
      const body = await createRes.json();
      if (body.errors) Object.entries(body.errors).forEach(([key, message]) => setError(key, message));
      feedback.textContent = 'Manca qualche dato utile: completa i campi evidenziati per ottenere un documento più preciso.';
      return;
    }

    const order = await createRes.json();
    state.orderId = order.id;

    const checkoutRes = await fetch(`/api/orders/${order.id}/checkout`, { method: 'POST' });
    const checkout = await checkoutRes.json();
    window.location.href = checkout.checkoutUrl;
  } catch (_error) {
    feedback.textContent = 'Errore di rete. Riprova tra pochi secondi.';
  }
});

updateReasons();
renderConditionalFields();
renderStep();

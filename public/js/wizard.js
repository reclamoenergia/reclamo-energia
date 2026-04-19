const state = { currentStep: 1, maxStep: 4 };

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
    { value: 'stimata', label: 'Letture stimate o errate' },
    { value: 'doppia', label: 'Doppia fatturazione / addebiti duplicati' },
    { value: 'voci', label: 'Voci non chiare in fattura' },
    { value: 'generale', label: 'Altro reclamo bolletta' }
  ],
  rateizzazione: [
    { value: 'difficolta', label: 'Difficoltà economica temporanea' },
    { value: 'importo_elevato', label: 'Importo elevato da distribuire' },
    { value: 'pagamenti_pregressi', label: 'Regolarizzazione importi pregressi' }
  ],
  contatore: [
    { value: 'guasto', label: 'Malfunzionamento del contatore' },
    { value: 'letture', label: 'Letture incoerenti' },
    { value: 'consumi', label: 'Consumi anomali' }
  ],
  voltura: [{ value: 'ritardo', label: 'Voltura in ritardo' }, { value: 'documenti', label: 'Pratica ferma nonostante documenti inviati' }],
  subentro: [{ value: 'subentro_ritardo', label: 'Subentro / attivazione in ritardo' }],
  cessazione: [{ value: 'cessazione_non_gestita', label: 'Cessazione non completata' }],
  rimborso: [{ value: 'rimborso_storno', label: 'Rimborso o storno importi non dovuti' }],
  amministrativo: [{ value: 'amministrativo', label: 'Reclamo amministrativo generico' }]
};

function formDataObject() {
  return Object.fromEntries(new FormData(form).entries());
}

function requiredByStep(step, data) {
  if (step === 1) return ['type', 'reason', 'supplyType', 'supplierName', 'goal'];
  if (step === 2) return ['fullName', 'email', 'address'];
  if (step === 3) {
    const req = ['description'];
    if (['reclamo', 'rimborso', 'rateizzazione', 'cessazione'].includes(data.type)) req.push('invoiceAmount');
    if (data.type === 'voltura') req.push('effectiveDate');
    if (data.type === 'subentro') req.push('activationDate');
    if (data.type === 'cessazione') req.push('cessationDate');
    return req;
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
  let valid = true;
  requiredByStep(state.currentStep, data).forEach((field) => {
    if (!String(data[field] || '').trim()) {
      setError(field, 'Campo obbligatorio');
      valid = false;
    }
  });

  if (state.currentStep === 2 && data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    setError('email', 'Inserisci un indirizzo email valido');
    valid = false;
  }

  return valid;
}

function updateReasons() {
  const options = reasonOptions[typeSelect.value] || [];
  reasonSelect.innerHTML = options.map((opt) => `<option value="${opt.value}">${opt.label}</option>`).join('');
}

function renderConditionalFields() {
  const type = typeSelect.value;
  document.querySelectorAll('.case-field').forEach((field) => {
    const visible = String(field.dataset.types || '').split(',').map((entry) => entry.trim()).includes(type);
    field.style.display = visible ? 'block' : 'none';
    if (!visible) field.querySelectorAll('input,select,textarea').forEach((el) => { el.value = ''; });
  });
}

function drawSummary() {
  const data = formDataObject();
  const reasonLabel = reasonSelect.options[reasonSelect.selectedIndex]?.text || data.reason;
  summary.textContent = [
    `Pratica: ${data.type} · Motivo: ${reasonLabel}`,
    `Obiettivo dichiarato: ${data.goal}`,
    `Fornitura: ${data.supplyType} · Fornitore: ${data.supplierName}`,
    data.invoiceAmount ? `Importo coinvolto: ${data.invoiceAmount} €` : '',
    data.invoiceNumber ? `Fattura: ${data.invoiceNumber} ${data.invoiceDate ? `(${data.invoiceDate})` : ''}` : '',
    data.previousComplaints === 'si' ? 'Hai indicato precedenti segnalazioni: il documento sarà più fermo sul riscontro.' : '',
    `Tono selezionato: ${data.tone}`,
    `Descrizione caso: ${data.description}`
  ].filter(Boolean).join('\n');
}

function renderStep() {
  document.querySelectorAll('.step').forEach((el) => el.classList.toggle('active', Number(el.dataset.step) === state.currentStep));
  document.querySelectorAll('#progress span').forEach((el, idx) => el.classList.toggle('active', idx < state.currentStep));
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
      feedback.textContent = 'Completa i campi evidenziati per generare una pratica più solida.';
      return;
    }

    const order = await createRes.json();
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

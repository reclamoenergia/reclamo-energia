const state = { currentStep: 1, maxStep: 4, orderId: null };

const form = document.getElementById('wizardForm');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const submitBtn = document.getElementById('submitBtn');
const feedback = document.getElementById('formFeedback');
const summary = document.getElementById('summary');

function formDataObject() {
  return Object.fromEntries(new FormData(form).entries());
}

function requiredByStep(step, data) {
  if (step === 1) return ['type', 'reason', 'supplyType', 'supplierName'];
  if (step === 2) return ['fullName', 'email', 'address'];
  if (step === 3) return data.type === 'reclamo' ? ['description'] : [];
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

  return valid;
}

function drawSummary() {
  const data = formDataObject();
  summary.textContent = [
    `Tipo pratica: ${data.type}`,
    `Motivo: ${data.reason}`,
    `Fornitore: ${data.supplierName}`,
    `Cliente: ${data.fullName}`,
    `Email: ${data.email}`,
    `Indirizzo: ${data.address}`,
    data.invoiceNumber ? `Fattura: ${data.invoiceNumber}` : '',
    data.invoiceAmount ? `Importo: ${data.invoiceAmount} €` : '',
    data.description ? `Descrizione: ${data.description}` : ''
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
      feedback.textContent = 'Controlla i campi evidenziati prima di continuare.';
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

renderStep();

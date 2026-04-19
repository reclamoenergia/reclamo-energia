async function fetchOrderByQuery() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('orderId');
  const token = params.get('token');

  if (token) {
    const res = await fetch(`/api/orders/recover/${token}`);
    if (!res.ok) throw new Error('Token non valido o scaduto');
    return res.json();
  }

  if (!orderId) throw new Error('Ordine mancante: usa ID ordine o token recupero');
  const res = await fetch(`/api/orders/${orderId}`);
  if (!res.ok) throw new Error('Ordine non trovato');
  return res.json();
}

function render(order) {
  const stateEl = document.getElementById('orderState');
  const paidBox = document.getElementById('paidBox');
  const pendingBox = document.getElementById('pendingBox');
  const pdfLink = document.getElementById('pdfLink');
  const pecText = document.getElementById('pecText');
  const checkoutAgain = document.getElementById('checkoutAgain');
  const recoveryUrl = document.getElementById('recoveryUrl');

  if (order.status === 'paid') {
    const recoverLink = `${window.location.origin}/ordine.html?token=${order.recoveryToken}`;
    stateEl.textContent = `Ordine ${order.id} confermato e consegnato.`;
    paidBox.style.display = 'block';
    pendingBox.style.display = 'none';
    pdfLink.href = order.document.pdfPath;
    pecText.value = order.document.text;
    recoveryUrl.textContent = recoverLink;

    const copyRecoveryLink = document.getElementById('copyRecoveryLink');
    copyRecoveryLink.onclick = async () => {
      await navigator.clipboard.writeText(recoverLink);
      document.getElementById('copyFeedback').textContent = 'Link di recupero copiato.';
    };
  } else {
    stateEl.textContent = `Ordine ${order.id} in stato ${order.status}. Completa il checkout per ricevere documento e istruzioni invio.`;
    paidBox.style.display = 'none';
    pendingBox.style.display = 'block';
    checkoutAgain.onclick = async () => {
      const res = await fetch(`/api/orders/${order.id}/checkout`, { method: 'POST' });
      const data = await res.json();
      window.location.href = data.checkoutUrl;
    };
  }
}

async function init() {
  const stateEl = document.getElementById('orderState');
  const recoverBtn = document.getElementById('recoverBtn');
  const recoverToken = document.getElementById('recoverToken');
  const recoverFeedback = document.getElementById('recoverFeedback');
  const copyBtn = document.getElementById('copyPec');
  const copyFeedback = document.getElementById('copyFeedback');

  copyBtn?.addEventListener('click', async () => {
    const text = document.getElementById('pecText').value;
    await navigator.clipboard.writeText(text);
    copyFeedback.textContent = 'Testo PEC copiato. Ora incollalo nella tua casella PEC.';
  });

  recoverBtn.addEventListener('click', () => {
    if (!recoverToken.value.trim()) {
      recoverFeedback.textContent = 'Inserisci un token valido.';
      return;
    }
    window.location.href = `/ordine.html?token=${encodeURIComponent(recoverToken.value.trim())}`;
  });

  try {
    const order = await fetchOrderByQuery();
    render(order);
  } catch (error) {
    stateEl.textContent = error.message;
  }
}

init();

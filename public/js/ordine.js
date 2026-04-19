async function fetchOrderByQuery() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('orderId');
  const token = params.get('token');

  if (token) {
    const res = await fetch(`/api/orders/recover/${token}`);
    if (!res.ok) throw new Error('Token non valido o non trovato');
    return res.json();
  }

  if (!orderId) throw new Error('Ordine mancante: usa orderId o token recupero');
  const res = await fetch(`/api/orders/${orderId}`);
  if (!res.ok) throw new Error('Ordine non trovato');
  return res.json();
}

async function copyText(value, message) {
  await navigator.clipboard.writeText(value);
  document.getElementById('copyFeedback').textContent = message;
}

function render(order) {
  const stateEl = document.getElementById('orderState');
  const paidBox = document.getElementById('paidBox');
  const pendingBox = document.getElementById('pendingBox');

  if (order.status === 'paid') {
    const recoverLink = `${window.location.origin}/ordine.html?token=${order.recoveryToken}`;
    stateEl.textContent = `Ordine ${order.id} confermato.`;
    paidBox.style.display = 'block';
    pendingBox.style.display = 'none';

    document.getElementById('pdfLink').href = order.document.pdfPath;
    document.getElementById('pecSubject').value = order.document.pecSubject || '';
    document.getElementById('pecBody').value = order.document.pecBody || order.document.text || '';
    document.getElementById('recoveryUrl').textContent = recoverLink;

    document.getElementById('copySubject').onclick = () => copyText(order.document.pecSubject || '', 'Oggetto PEC copiato.');
    document.getElementById('copyBody').onclick = () => copyText(order.document.pecBody || order.document.text || '', 'Corpo PEC copiato.');
    document.getElementById('copyRecoveryLink').onclick = () => copyText(recoverLink, 'Link di recupero copiato.');
  } else {
    stateEl.textContent = `Ordine ${order.id} in stato ${order.status}.`;
    paidBox.style.display = 'none';
    pendingBox.style.display = 'block';

    document.getElementById('checkoutAgain').onclick = async () => {
      const res = await fetch(`/api/orders/${order.id}/checkout`, { method: 'POST' });
      const data = await res.json();
      window.location.href = data.checkoutUrl;
    };
  }
}

async function init() {
  document.getElementById('recoverBtn').addEventListener('click', () => {
    const token = document.getElementById('recoverToken').value.trim();
    if (!token) {
      document.getElementById('recoverFeedback').textContent = 'Inserisci un token valido.';
      return;
    }
    window.location.href = `/ordine.html?token=${encodeURIComponent(token)}`;
  });

  try {
    const order = await fetchOrderByQuery();
    render(order);
  } catch (error) {
    document.getElementById('orderState').textContent = error.message;
  }
}

init();

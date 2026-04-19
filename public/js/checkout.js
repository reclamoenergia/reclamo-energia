document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('orderId');
  const payBtn = document.getElementById('payBtn');
  const feedback = document.getElementById('checkoutFeedback');

  payBtn.addEventListener('click', async () => {
    if (!orderId) {
      feedback.textContent = 'OrderId non presente.';
      return;
    }

    payBtn.disabled = true;
    feedback.textContent = 'Pagamento in corso...';

    const res = await fetch(`/api/orders/${orderId}/mock-pay`, { method: 'POST' });
    if (!res.ok) {
      feedback.textContent = 'Errore pagamento. Riprova.';
      payBtn.disabled = false;
      return;
    }

    feedback.textContent = 'Pagamento confermato. Reindirizzamento...';
    window.location.href = `/ordine.html?orderId=${orderId}&paid=1`;
  });
});

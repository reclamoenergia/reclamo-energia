document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('consentStatus');
  const acceptBtn = document.getElementById('acceptAnalytics');
  const rejectBtn = document.getElementById('rejectAnalytics');

  function refreshStatus() {
    const consent = window.reclamoConsent?.getConsent?.() || {};
    statusEl.textContent = consent.analytics ? 'Analytics attivi con consenso.' : 'Analytics disattivati finché non acconsenti.';
  }

  acceptBtn.addEventListener('click', () => {
    window.reclamoConsent.setConsent({ analytics: true, updatedAt: new Date().toISOString() });
    window.reclamoConsent.loadAnalytics();
    refreshStatus();
  });

  rejectBtn.addEventListener('click', () => {
    window.reclamoConsent.setConsent({ analytics: false, updatedAt: new Date().toISOString() });
    refreshStatus();
  });

  refreshStatus();
});

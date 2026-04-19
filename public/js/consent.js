(function consentBootstrap() {
  const key = 'reclamo_energia_consent_v2';

  function getConsent() {
    try {
      return JSON.parse(localStorage.getItem(key) || '{}');
    } catch (_error) {
      return {};
    }
  }

  function setConsent(next) {
    localStorage.setItem(key, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('consent:changed', { detail: next }));
  }

  function loadAnalytics() {
    if (window.__analyticsLoaded) return;
    window.__analyticsLoaded = true;
    const script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-TXF7GV201Z';
    script.async = true;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', 'G-TXF7GV201Z');
  }

  const consent = getConsent();
  if (consent.analytics === true) loadAnalytics();

  window.reclamoConsent = {
    key,
    getConsent,
    setConsent,
    loadAnalytics
  };
})();

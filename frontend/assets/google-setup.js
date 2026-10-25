/*
  SP WorldTech Google integrations.

  AdSense is active with the publisher ID already configured in ads.txt.
  Add your own GA4 Measurement ID and Search Console verification token below
  when Google gives them to you. Leave them blank until then; the site will
  simply skip those integrations instead of sending fake/invalid data.
*/
window.SPW_GOOGLE = Object.freeze({
  adsensePublisherId: 'pub-5207077935751414',
  analyticsMeasurementId: '',
  searchConsoleVerification: ''
});

(() => {
  const cfg = window.SPW_GOOGLE || {};

  if (cfg.analyticsMeasurementId && /^G-[A-Z0-9]+$/i.test(cfg.analyticsMeasurementId)) {
    const src = document.createElement('script');
    src.async = true;
    src.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(cfg.analyticsMeasurementId)}`;
    document.head.appendChild(src);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', cfg.analyticsMeasurementId, { anonymize_ip: true });
  }

  if (cfg.searchConsoleVerification) {
    const meta = document.createElement('meta');
    meta.name = 'google-site-verification';
    meta.content = cfg.searchConsoleVerification;
    document.head.appendChild(meta);
  }
})();

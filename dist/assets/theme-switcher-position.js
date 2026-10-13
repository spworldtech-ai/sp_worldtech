/* Keeps the existing persisted Light/Dark switcher in the hosting banner across all pages. */
(() => {
  'use strict';
  const root = document.documentElement;
  const buttonId = 'spwt-theme-toggle';
  function place() {
    const button = document.getElementById(buttonId);
    if (!button) return false;
    const banner = document.querySelector('.wnh-ad-banner, [data-wnh-ad], .wnh-hero');
    if (banner) {
      banner.classList.add('spwt-theme-banner-host');
      if (button.parentElement !== banner) {
        const cta = banner.querySelector('.wnh-ad-cta, a[href*="worldnethosting.com"]');
        if (cta) banner.insertBefore(button, cta);
        else banner.appendChild(button);
      }
      root.classList.remove('spwt-theme-fallback');
      return true;
    }
    root.classList.add('spwt-theme-fallback');
    return false;
  }
  function start() {
    place();
    const observer = new MutationObserver(() => { place(); });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    // The hosting ad may be inserted after DOM ready; keep watching, but stop after it is placed.
    let attempts = 0;
    const interval = window.setInterval(() => {
      attempts += 1;
      if (place() || attempts >= 40) window.clearInterval(interval);
    }, 250);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();

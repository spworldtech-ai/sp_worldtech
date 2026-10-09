(() => {
  'use strict';

  // Dashboard pages intentionally use the same live language, currency, rolling-ad, and time tools.
  const LANGUAGES = [["en", "English"], ["es", "Spanish"], ["fr", "French"], ["de", "German"], ["it", "Italian"], ["pt", "Portuguese"], ["nl", "Dutch"], ["pl", "Polish"], ["ru", "Russian"], ["uk", "Ukrainian"], ["tr", "Turkish"], ["ar", "Arabic"], ["he", "Hebrew"], ["fa", "Persian"], ["ur", "Urdu"], ["hi", "Hindi"], ["bn", "Bengali"], ["pa", "Punjabi"], ["gu", "Gujarati"], ["mr", "Marathi"], ["ne", "Nepali"], ["si", "Sinhala"], ["ta", "Tamil"], ["te", "Telugu"], ["kn", "Kannada"], ["ml", "Malayalam"], ["or", "Odia"], ["as", "Assamese"], ["my", "Burmese"], ["th", "Thai"], ["vi", "Vietnamese"], ["id", "Indonesian"], ["ms", "Malay"], ["tl", "Filipino"], ["km", "Khmer"], ["lo", "Lao"], ["zh", "Chinese"], ["ja", "Japanese"], ["ko", "Korean"], ["mn", "Mongolian"], ["ka", "Georgian"], ["hy", "Armenian"], ["az", "Azerbaijani"], ["kk", "Kazakh"], ["ky", "Kyrgyz"], ["uz", "Uzbek"], ["tg", "Tajik"], ["tk", "Turkmen"], ["ps", "Pashto"], ["ku", "Kurdish"], ["sd", "Sindhi"], ["so", "Somali"], ["sw", "Swahili"], ["am", "Amharic"], ["om", "Oromo"], ["ti", "Tigrinya"], ["ha", "Hausa"], ["yo", "Yoruba"], ["ig", "Igbo"], ["zu", "Zulu"], ["xh", "Xhosa"], ["af", "Afrikaans"], ["st", "Southern Sotho"], ["tn", "Tswana"], ["ts", "Tsonga"], ["rw", "Kinyarwanda"], ["rn", "Kirundi"], ["lg", "Ganda"], ["ny", "Chichewa"], ["mg", "Malagasy"], ["sn", "Shona"], ["wo", "Wolof"], ["ff", "Fulah"], ["bm", "Bambara"], ["ee", "Ewe"], ["ak", "Akan"], ["tw", "Twi"], ["ga", "Irish"], ["gd", "Scottish Gaelic"], ["cy", "Welsh"], ["br", "Breton"], ["is", "Icelandic"], ["no", "Norwegian"], ["nb", "Norwegian Bokmål"], ["nn", "Norwegian Nynorsk"], ["sv", "Swedish"], ["da", "Danish"], ["fi", "Finnish"], ["et", "Estonian"], ["lv", "Latvian"], ["lt", "Lithuanian"], ["cs", "Czech"], ["sk", "Slovak"], ["sl", "Slovenian"], ["hr", "Croatian"], ["sr", "Serbian"], ["bs", "Bosnian"], ["mk", "Macedonian"], ["bg", "Bulgarian"], ["ro", "Romanian"], ["hu", "Hungarian"], ["el", "Greek"], ["sq", "Albanian"], ["mt", "Maltese"], ["ca", "Catalan"], ["eu", "Basque"], ["gl", "Galician"], ["lb", "Luxembourgish"], ["fo", "Faroese"], ["fy", "Frisian"], ["yi", "Yiddish"], ["la", "Latin"], ["eo", "Esperanto"], ["swb", "Comorian"], ["jv", "Javanese"], ["su", "Sundanese"], ["ceb", "Cebuano"], ["ilo", "Ilocano"], ["war", "Waray"], ["hmn", "Hmong"], ["mi", "Maori"], ["sm", "Samoan"], ["to", "Tongan"], ["fj", "Fijian"], ["haw", "Hawaiian"], ["ty", "Tahitian"], ["pap", "Papiamento"], ["ht", "Haitian Creole"], ["co", "Corsican"], ["oc", "Occitan"], ["rm", "Romansh"], ["sc", "Sardinian"], ["ast", "Asturian"], ["an", "Aragonese"], ["wa", "Walloon"], ["nap", "Neapolitan"], ["vec", "Venetian"], ["fur", "Friulian"], ["li", "Limburgish"], ["nds", "Low German"], ["dsb", "Lower Sorbian"], ["hsb", "Upper Sorbian"], ["szl", "Silesian"], ["csb", "Kashubian"], ["se", "Northern Sami"], ["smj", "Lule Sami"], ["sma", "Southern Sami"], ["smn", "Inari Sami"], ["sms", "Skolt Sami"], ["kl", "Kalaallisut"], ["iu", "Inuktitut"], ["cr", "Cree"], ["oj", "Ojibwa"], ["chr", "Cherokee"], ["nv", "Navajo"], ["qu", "Quechua"], ["ay", "Aymara"], ["gn", "Guarani"], ["nah", "Nahuatl"], ["jbo", "Lojban"], ["ia", "Interlingua"], ["ie", "Interlingue"], ["vo", "Volapük"], ["tlh", "Klingon"], ["brx", "Bodo"], ["sat", "Santali"], ["mai", "Maithili"], ["kok", "Konkani"], ["mni", "Manipuri"], ["doi", "Dogri"]];
  const CURRENCIES = ["USD", "EUR", "GBP", "NGN", "CAD", "AUD", "NZD", "JPY", "CNY", "INR", "SGD", "HKD", "AED", "SAR", "QAR", "KWD", "BHD", "OMR", "ZAR", "KES", "GHS", "UGX", "TZS", "RWF", "ETB", "EGP", "MAD", "DZD", "TND", "LYD", "XOF", "XAF", "XCD", "NAD", "BWP", "ZMW", "MWK", "MZN", "AOA", "CDF", "BIF", "DJF", "ERN", "GMD", "GNF", "LRD", "SLL", "SOS", "SDG", "SSP", "STN", "SZL", "MGA", "MUR", "SCR", "KMF", "CVE", "SHP", "BBD", "BZD", "BMD", "BSD", "JMD", "TTD", "GYD", "SRD", "AWG", "ANG", "BOV", "BRL", "ARS", "CLP", "COP", "PEN", "UYU", "PYG", "BOB", "VES", "GTQ", "HNL", "NIO", "CRC", "DOP", "HTG", "MXN", "PAB", "CUP", "BND", "KHR", "LAK", "MMK", "VND", "IDR", "MYR", "THB", "PHP", "TWD", "KRW", "MNT", "KZT", "KGS", "UZS", "TJS", "TMT", "AZN", "GEL", "AMD", "TRY", "ILS", "JOD", "LBP", "SYP", "YER", "IRR", "IQD", "AFN", "PKR", "BDT", "LKR", "NPR", "BTN", "MOP", "MVR", "FJD", "PGK", "SBD", "VUV", "WST", "TOP", "XPF", "ISK", "NOK", "SEK", "DKK", "CHF", "PLN", "CZK", "HUF", "RON", "BGN"];

  const API_BASE = (window.SPW_APP?.API_BASE || location.origin).replace(/\/$/, '').replace(/\/api$/i, '');
  const STORAGE_LANGUAGE = 'spw_language';
  const STORAGE_CURRENCY = 'spw_currency';

  const state = {
    language: localStorage.getItem(STORAGE_LANGUAGE) || 'en',
    currency: localStorage.getItem(STORAGE_CURRENCY) || 'USD',
    rates: { USD: 1 },
    translating: false
  };

  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  function createGlobalUI() {
    if (document.getElementById('spwGlobalTools')) return;

    const existingAd = document.querySelector('.worldnet-ad');
    const existingClock = document.querySelector('.nigeria-clock');

    // The homepage already contains these components. Move them into the
    // shared top area instead of creating duplicates.
    let adNode = existingAd;
    let clockNode = existingClock;

    if (adNode) adNode.remove();
    if (clockNode) clockNode.remove();

    const root = document.createElement('section');
    root.id = 'spwGlobalTools';
    root.className = 'spw-global-tools';
    root.setAttribute('aria-label', 'SP WorldTech global tools');

    root.innerHTML = `
      <div class="spw-global-ad">
        <a class="spw-global-ad-link" href="https://worldnethosting.com" target="_blank" rel="noopener" aria-label="Visit World Net Hosting">
          <div class="spw-global-ad-track">
            <div class="spw-global-ad-item"><span>✨</span><strong>CLICK &amp; GET FREE .COM - .ORG</strong></div>
            <div class="spw-global-ad-item"><span>🌐</span><strong>WORLD NET HOSTING • FREE DOMAIN • PROFESSIONAL HOSTING • BUILD YOUR ONLINE PRESENCE • VISIT WORLDNETHOSTING.COM →</strong></div>
            <div class="spw-global-ad-item"><span>✨</span><strong>CLICK &amp; GET FREE .COM - .ORG</strong></div>
            <div class="spw-global-ad-item"><span>🌐</span><strong>WORLD NET HOSTING • FREE DOMAIN • PROFESSIONAL HOSTING • BUILD YOUR ONLINE PRESENCE • VISIT WORLDNETHOSTING.COM →</strong></div>
          </div>
        </a>
      </div>

      <div class="spw-global-toolbar">
        <div class="spw-global-inner">
          <div class="spw-clock-card">
            <div class="spw-clock-digital" aria-hidden="true">NG</div>
            <div class="spw-clock-info">
              <span class="spw-clock-label">NIGERIA TIME</span>
              <strong id="spwNigeriaTime">--:--:-- --</strong>
              <span id="spwNigeriaDate">Loading date...</span>
            </div>
          </div>

          <div class="spw-global-selectors">
            <label class="spw-selector">
              <span>Language</span>
              <select id="spwLanguageSelect" aria-label="Select language"></select>
            </label>
            <label class="spw-selector">
              <span>Currency</span>
              <select id="spwCurrencySelect" aria-label="Select currency"></select>
            </label>
            <span id="spwGlobalStatus" class="spw-global-status" role="status" aria-live="polite"></span>
          </div>
        </div>
      </div>
    `;

    const main = document.querySelector('main');
    const mainInner = main?.querySelector('.main') || main;
    if (mainInner) mainInner.insertBefore(root, mainInner.firstChild);
    else document.body.insertBefore(root, document.body.firstChild);

    if (adNode) {
      const target = root.querySelector('.spw-global-ad');
      // Existing homepage markup is discarded intentionally; shared markup is identical in behavior.
      void target;
    }

    buildSelectors();
    startClock();
    bindSelectors();
  }

  function buildSelectors() {
    const languageSelect = document.getElementById('spwLanguageSelect');
    const currencySelect = document.getElementById('spwCurrencySelect');
    if (!languageSelect || !currencySelect) return;

    const languageFragment = document.createDocumentFragment();
    LANGUAGES.forEach(([code, name]) => {
      const option = document.createElement('option');
      option.value = code;
      option.textContent = name;
      languageFragment.appendChild(option);
    });
    languageSelect.appendChild(languageFragment);

    const currencyFragment = document.createDocumentFragment();
    CURRENCIES.forEach(code => {
      const option = document.createElement('option');
      option.value = code;
      let name = code;
      try {
        name = new Intl.DisplayNames([navigator.language || 'en'], { type: 'currency' }).of(code) || code;
      } catch (_) {}
      option.textContent = `${code} — ${name}`;
      currencyFragment.appendChild(option);
    });
    currencySelect.appendChild(currencyFragment);

    languageSelect.value = LANGUAGES.some(x => x[0] === state.language) ? state.language : 'en';
    currencySelect.value = CURRENCIES.includes(state.currency) ? state.currency : 'USD';
  }

  function bindSelectors() {
    document.getElementById('spwLanguageSelect')?.addEventListener('change', async event => {
      state.language = event.target.value;
      localStorage.setItem(STORAGE_LANGUAGE, state.language);
      await applyLanguage(state.language);
    });

    document.getElementById('spwCurrencySelect')?.addEventListener('change', async event => {
      state.currency = event.target.value;
      localStorage.setItem(STORAGE_CURRENCY, state.currency);
      await applyCurrency(state.currency);
    });
  }

  function startClock() {
    const timeEl = document.getElementById('spwNigeriaTime');
    const dateEl = document.getElementById('spwNigeriaDate');
    if (!timeEl || !dateEl) return;

    const update = () => {
      const now = new Date();
      timeEl.textContent = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Lagos',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(now);

      dateEl.textContent = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Lagos',
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(now);
    };

    update();
    setInterval(update, 1000);
  }

  const originalText = new WeakMap();
  const currencyNodes = new Set();
  const translationCacheKey = 'spw_translation_cache_v2';
  const originalAttributes = new WeakMap();
  const originalDocumentTitle = document.title || 'SP WorldTech';
  const RTL_LANGUAGES = new Set(['ar','he','fa','ur','ps','ku','sd','yi']);
  let translationCache = {};
  let languageRefreshTimer = null;
  try { translationCache = JSON.parse(localStorage.getItem(translationCacheKey) || '{}') || {}; } catch (_) { translationCache = {}; }

  function shouldSkipNode(node) {
    const parent = node.parentElement;
    if (!parent) return true;
    if (parent.closest('[data-spw-no-translate], script, style, noscript, textarea, input, select, option, code, pre')) return true;
    if (!node.nodeValue || !/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(node.nodeValue)) return true;
    return node.nodeValue.trim().length < 2;
  }

  function captureTextNodes() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) {
      if (shouldSkipNode(node)) continue;
      if (!originalText.has(node)) originalText.set(node, node.nodeValue);
      nodes.push(node);
    }
    return nodes;
  }

  async function translateBatch(texts, to) {
    const language = String(to || '').toLowerCase();
    const cache = translationCache[language] || (translationCache[language] = {});
    const missing = [];
    const missingIndex = [];
    const output = new Array(texts.length);

    texts.forEach((text, index) => {
      const key = String(text || '');
      if (cache[key]) output[index] = cache[key];
      else { missing.push(key); missingIndex.push(index); }
    });

    if (missing.length) {
      const response = await fetch(`${API_BASE}/api/localization/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: language, texts: missing })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Translation service is unavailable.');
      const translations = data.translations || [];
      missing.forEach((source, i) => {
        const translated = translations[i];
        if (translated) {
          cache[source] = translated;
          output[missingIndex[i]] = translated;
        }
      });
      try { localStorage.setItem(translationCacheKey, JSON.stringify(translationCache)); } catch (_) {}
    }
    return output;
  }

  function captureTranslatableAttributes() {
    const elements = [...document.querySelectorAll('[placeholder],[title],[aria-label]')];
    const attributes = [];
    elements.forEach(element => {
      if (element.closest('[data-spw-no-translate], script, style, noscript, code, pre')) return;
      const stored = originalAttributes.get(element) || {};
      ['placeholder','title','aria-label','alt'].forEach(name => {
        const value = element.getAttribute(name);
        if (!value || !/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(value)) return;
        if (!stored[name]) stored[name] = value;
        attributes.push({ element, name, source: stored[name] });
      });
      originalAttributes.set(element, stored);
    });
    return attributes;
  }


  async function applyLanguage(language) {
    const status = document.getElementById('spwGlobalStatus');
    const nodes = captureTextNodes();
    const attributes = captureTranslatableAttributes();

    // Always restore the source text first, so switching languages never translates
    // an already translated sentence into another language.
    nodes.forEach(node => {
      const source = originalText.get(node);
      if (source != null) node.nodeValue = source;
    });
    attributes.forEach(item => item.element.setAttribute(item.name, item.source));

    document.documentElement.lang = language || 'en';
    if (!language || language === 'en') {
      document.title = originalDocumentTitle;
      document.documentElement.dir = 'ltr';
      if (status) status.textContent = 'English';
      return;
    }

    state.translating = true;
    if (status) status.textContent = 'Translating…';

    try {
      const chunks = [];
      
      for (let i = 0; i < nodes.length; i += 50) chunks.push(nodes.slice(i, i + 50));

      const chunkResults = await Promise.all(chunks.map(async chunk => {
        const texts = chunk.map(node => originalText.get(node)).filter(Boolean);
        if (!texts.length) return { chunk, translations: [] };
        return { chunk, translations: await translateBatch(texts, language) };
      }));
      chunkResults.forEach(({ chunk, translations }) => {
        chunk.forEach((node, index) => {
          if (translations[index]) node.nodeValue = translations[index];
        });
      });

      if (attributes.length) {
        const attrSources = attributes.map(item => item.source);
        const attrTranslations = await translateBatch(attrSources, language);
        attributes.forEach((item, index) => {
          if (attrTranslations[index]) item.element.setAttribute(item.name, attrTranslations[index]);
        });
      }

      const titleTranslation = await translateBatch([originalDocumentTitle], language);
      if (titleTranslation[0]) document.title = titleTranslation[0];
      document.documentElement.dir = RTL_LANGUAGES.has(language) ? 'rtl' : 'ltr';
      if (status) status.textContent = `Language: ${language.toUpperCase()}`;
      if (state.currency !== 'USD') await applyCurrency(state.currency);
    } catch (error) {
      if (status) status.textContent = error.message;
      // Keep English content visible when a selected target is not supported by
      // the configured translation service.
      nodes.forEach(node => {
        const source = originalText.get(node);
        if (source != null) node.nodeValue = source;
      });
    } finally {
      state.translating = false;
    }
  }

  function getMoneyFromText(text) {
    const value = String(text);
    const usd = value.match(/\$\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)/);
    if (usd) {
      const amount = Number(usd[1].replace(/,/g, ''));
      return Number.isFinite(amount) ? { amount, base: 'USD' } : null;
    }
    const ngn = value.match(/₦\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)/);
    if (ngn) {
      const amount = Number(ngn[1].replace(/,/g, ''));
      return Number.isFinite(amount) ? { amount, base: 'NGN' } : null;
    }
    return null;
  }

  function formatCurrency(value, currency) {
    try {
      return new Intl.NumberFormat(navigator.language || 'en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2
      }).format(value);
    } catch (_) {
      return `${currency} ${Number(value).toFixed(2)}`;
    }
  }

  async function loadRates() {
    const status = document.getElementById('spwGlobalStatus');
    const sources = [
      `${API_BASE}/api/fx/rates`,
      'https://open.er-api.com/v6/latest/USD'
    ];
    for (const url of sources) {
      try {
        const response = await fetch(url, { cache: 'no-store' });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.rates || typeof data.rates !== 'object') continue;
        const rates = { USD: 1 };
        Object.entries(data.rates).forEach(([code, value]) => {
          const n = Number(value);
          if (Number.isFinite(n) && n > 0) rates[String(code).toUpperCase()] = n;
        });
        if (Object.keys(rates).length > 1) {
          state.rates = rates;
          localStorage.setItem('spw_fx_rates', JSON.stringify({ rates, at: Date.now() }));
          return true;
        }
      } catch (_) {}
    }
    try {
      const cached = JSON.parse(localStorage.getItem('spw_fx_rates') || '{}');
      if (cached.rates && Date.now() - Number(cached.at || 0) < 24 * 60 * 60 * 1000) {
        state.rates = cached.rates;
        return true;
      }
    } catch (_) {}
    if (status) status.textContent = 'Exchange rates temporarily unavailable';
    return false;
  }

  function markCurrencyNodes() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (!parent || parent.closest('[data-spw-no-currency], script, style, noscript, textarea, input, select, option, code, pre')) continue;
      if (getMoneyFromText(node.nodeValue) !== null) {
        currencyNodes.add(node);
        if (!originalText.has(node)) originalText.set(node, node.nodeValue);
      }
    }
  }

  async function applyCurrency(currency) {
    const status = document.getElementById('spwGlobalStatus');
    if (!state.rates[currency]) {
      const loaded = await loadRates();
      if (!loaded || !state.rates[currency]) {
        if (status) status.textContent = `${currency} rate unavailable`;
        return;
      }
    }

    markCurrencyNodes();

    currencyNodes.forEach(node => {
      const source = originalText.get(node);
      if (!source) return;

      node.nodeValue = source.replace(/(?:\$\s*|₦\s*)([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)/g, (match, amount) => {
        const numeric = Number(String(amount).replace(/,/g, ''));
        const baseIsNgn = match.trim().startsWith('₦');
        const usd = baseIsNgn
          ? numeric / Number(state.rates.NGN || 1)
          : numeric;
        const converted = usd * Number(state.rates[currency] || 1);
        return formatCurrency(converted, currency);
      });
    });

    document.querySelectorAll('[data-spw-price-usd]').forEach(el => {
      const usd = Number(el.getAttribute('data-spw-price-usd'));
      if (!Number.isFinite(usd)) return;
      const rate = Number(state.rates[currency] || 0);
      if (!rate) return;
      const converted = usd * rate;
      el.textContent = formatCurrency(converted, currency);
    });

    if (status) status.textContent = `Currency: ${currency}`;
  }

  function initExistingPriceMarkers() {
    document.querySelectorAll('[data-spw-price-usd]').forEach(el => {
      const value = Number(el.getAttribute('data-spw-price-usd'));
      if (Number.isFinite(value)) {
        el.textContent = formatCurrency(value * Number(state.rates[state.currency] || 1), state.currency);
      }
    });
  }

  function observeDynamicContent() {
    const observer = new MutationObserver(mutations => {
      let changed = false;
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
              if (!originalText.has(node)) originalText.set(node, node.nodeValue);
              if (getMoneyFromText(node.nodeValue) !== null) currencyNodes.add(node);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              node.querySelectorAll?.('[data-spw-price-usd]').forEach(() => { changed = true; });
            }
          });
          changed = true;
        }
      }
      if (changed && state.language !== 'en' && !state.translating) {
        clearTimeout(languageRefreshTimer);
        languageRefreshTimer = window.setTimeout(() => applyLanguage(state.language), 0);
      }
      if (changed && state.currency !== 'USD') {
        window.setTimeout(() => applyCurrency(state.currency), 0);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.SPW_APP = window.SPW_APP || {};
  window.SPW_APP.refreshCurrency = () => applyCurrency(state.currency);
  window.SPW_APP.refreshLanguage = () => applyLanguage(state.language);

  function start() {
    createGlobalUI();
    captureTextNodes();
    markCurrencyNodes();
    loadRates().then(() => {
      initExistingPriceMarkers();
      if (state.currency !== 'USD') applyCurrency(state.currency);
      else document.getElementById('spwGlobalStatus')?.replaceChildren(document.createTextNode('Ready'));
    });
    if (state.language !== 'en') applyLanguage(state.language);
    observeDynamicContent();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

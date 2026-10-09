const express = require('express');
const router = express.Router();

const LANGUAGE_CACHE_MS = 6 * 60 * 60 * 1000;
let languageCache = null;
let languageCacheAt = 0;

function azureConfig() {
  return {
    key: String(process.env.AZURE_TRANSLATOR_KEY || '').trim(),
    endpoint: String(process.env.AZURE_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com').replace(/\/+$/, ''),
    region: String(process.env.AZURE_TRANSLATOR_REGION || '').trim()
  };
}

router.get('/languages', async (_req, res) => {
  const { key, endpoint, region } = azureConfig();
  if (!key) return res.json({ ok: true, languages: {}, source: 'frontend-list' });

  if (languageCache && Date.now() - languageCacheAt < LANGUAGE_CACHE_MS) {
    return res.json({ ok: true, languages: languageCache, source: 'azure-cache' });
  }

  try {
    const headers = {
      'Ocp-Apim-Subscription-Key': key,
      Accept: 'application/json'
    };
    if (region && region.toLowerCase() !== 'global') {
      headers['Ocp-Apim-Subscription-Region'] = region;
    }

    const response = await fetch(`${endpoint}/languages?api-version=3.0&scope=translation`, {
      headers,
      signal: AbortSignal.timeout(10000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error?.message || 'Azure language list unavailable.');

    languageCache = data?.translation || {};
    languageCacheAt = Date.now();
    return res.json({ ok: true, languages: languageCache, source: 'azure' });
  } catch (error) {
    return res.status(502).json({ ok: false, message: error.message });
  }
});

router.post('/translate', async (req, res) => {
  const { key, endpoint, region } = azureConfig();
  const to = String(req.body?.to || '').trim().toLowerCase();
  const texts = Array.isArray(req.body?.texts)
    ? req.body.texts.map(v => String(v ?? '')).filter(Boolean).slice(0, 50)
    : [];

  if (!key || /^replace_with_|^your_/i.test(key)) return res.status(503).json({ ok: false, message: 'Language translation is not configured on the live backend. Add a valid AZURE_TRANSLATOR_KEY in the deployment environment.' });
  if (!/^[a-z0-9-]{2,20}$/i.test(to)) return res.status(400).json({ ok: false, message: 'A valid target language is required.' });
  if (!texts.length) return res.json({ ok: true, translations: [] });

  try {
    const headers = {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    };
    if (region && region.toLowerCase() !== 'global') {
      headers['Ocp-Apim-Subscription-Region'] = region;
    }

    const response = await fetch(
      `${endpoint}/translate?api-version=3.0&to=${encodeURIComponent(to)}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(texts.map(Text => ({ Text }))),
        signal: AbortSignal.timeout(20000)
      }
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.error?.message || `Translation request failed (${response.status}).`);
    }

    const translations = Array.isArray(data)
      ? data.map(item => String(item?.translations?.[0]?.text ?? ''))
      : [];

    if (translations.length !== texts.length) {
      throw new Error('Translation service returned an incomplete result.');
    }

    return res.json({ ok: true, translations });
  } catch (error) {
    return res.status(502).json({ ok: false, message: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();

let cachedRates = null;
let cachedAt = 0;
const CACHE_MS = 10 * 60 * 1000;

router.get('/rates', async (_req, res) => {
  if (cachedRates && Date.now() - cachedAt < CACHE_MS) {
    return res.json({ ok: true, base: 'USD', rates: cachedRates, cached: true });
  }

  const url = process.env.FX_RATE_URL || 'https://open.er-api.com/v6/latest/USD';
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.rates || typeof data.rates !== 'object') {
      throw new Error('Live exchange-rate service is unavailable.');
    }

    const rates = { USD: 1 };
    for (const [code, value] of Object.entries(data.rates)) {
      const n = Number(value);
      if (Number.isFinite(n) && n > 0) rates[code.toUpperCase()] = n;
    }

    cachedRates = rates;
    cachedAt = Date.now();
    return res.json({ ok: true, base: 'USD', rates, cached: false });
  } catch (error) {
    return res.status(502).json({ ok: false, message: error.message });
  }
});

module.exports = router;

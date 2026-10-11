let cachedRate = null;
let cachedAt = 0;
const CACHE_MS = 10 * 60 * 1000;

async function getUsdToNgnRate() {
  const configured = Number(process.env.USD_TO_NGN_RATE || 0);
  if (Number.isFinite(configured) && configured > 0) return configured;

  if (cachedRate && Date.now() - cachedAt < CACHE_MS) return cachedRate;

  const url = process.env.FX_RATE_URL || 'https://open.er-api.com/v6/latest/USD';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    const rate = Number(data?.rates?.NGN);
    if (!response.ok || !Number.isFinite(rate) || rate <= 0) {
      throw new Error('Live USD/NGN exchange rate is unavailable.');
    }
    cachedRate = rate;
    cachedAt = Date.now();
    return rate;
  } finally {
    clearTimeout(timeout);
  }
}

async function convertUsdToNgn(usdAmount) {
  const usd = Number(usdAmount);
  if (!Number.isFinite(usd) || usd <= 0) throw new Error('A valid USD amount is required.');
  const rate = await getUsdToNgnRate();
  return { usd, rate, ngn: Math.max(1, Math.round(usd * rate)) };
}

module.exports = { getUsdToNgnRate, convertUsdToNgn };

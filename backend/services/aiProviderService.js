function getKey() {
  return process.env.AI_PROVIDER_API_KEY || process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GEMINI_API_KEY || '';
}

function pickEndpoint(provider = 'gemini') {
  const p = String(provider || '').toLowerCase();
  if (p.includes('chatgpt') || p.includes('gpt')) return process.env.CHATGPT_API_URL || process.env.AI_PROVIDER_URL || '';
  // A custom provider URL takes precedence. Otherwise the Google Gemini REST API is used.
  if (process.env.AI_PROVIDER_URL) return process.env.AI_PROVIDER_URL;
  if (process.env.GEMINI_API_URL) return process.env.GEMINI_API_URL;
  const model = String(process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
}

function isNativeGeminiEndpoint(endpoint, provider) {
  return /generativelanguage\.googleapis\.com\/v1beta\/models\//i.test(endpoint) && !String(process.env.AI_PROVIDER_URL || '').trim() && !String(process.env.GEMINI_API_URL || '').trim() && !String(provider || '').toLowerCase().includes('gpt');
}

function extractText(data) {
  if (!data) return '';
  if (typeof data === 'string') return data;
  return data.answer || data.reply_text || data.response || data.message || data.text || data.result || data.output || data.content ||
    data.choices?.[0]?.message?.content || data.candidates?.[0]?.content?.parts?.[0]?.text ||
    data.data?.answer || data.data?.reply_text || data.data?.response || data.data?.message || data.data?.text || data.data?.content || '';
}

function buildProfessionalPrompt({ context = 'general', message = '', user = null, system = '' }) {
  return `${system || 'You are SP WorldTech AI Agent.'}\n\nBrand: SP WorldTech — The World 🌎 Web, Applications & Software Solutions.\nTone: professional, clear, safe, helpful.\nContext: ${context}.\nRules: Do not promise guaranteed jobs, guaranteed payments, banking approval, card/account creation, withdrawals. Do not claim to be human. For sensitive payment, wallet, withdrawal, bank account, virtual card, KYC, service failure, account blocking, or complaint issues, recommend escalation to admin/staff support.\nUser: ${user?.fullName || 'SP WorldTech user'}\nQuestion/request: ${message}`;
}

async function callAIProvider({ provider = 'gemini', context = 'general', message = '', user = null, system = '', extra = {} }) {
  const apiKey = getKey();
  if (!apiKey) {
    const err = new Error('SP WorldTech AI assistant is not available yet.');
    err.statusCode = 503;
    throw err;
  }
  if (!message || !String(message).trim()) {
    const err = new Error('Message is required.');
    err.statusCode = 400;
    throw err;
  }
  const endpoint = pickEndpoint(provider);
  if (!endpoint) { const err = new Error('SP WorldTech AI endpoint is not configured yet.'); err.statusCode = 503; throw err; }
  const prompt = buildProfessionalPrompt({ context, message, user, system });
  const nativeGemini = isNativeGeminiEndpoint(endpoint, provider);
  const payload = nativeGemini
    ? { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.35, maxOutputTokens: 1200 } }
    : { prompt, message: prompt, input: prompt, query: prompt, context, provider, ...extra };
  const requestUrl = nativeGemini ? `${endpoint}?key=${encodeURIComponent(apiKey)}` : endpoint;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
    if (!nativeGemini) {
      headers['X-API-Key'] = apiKey;
      headers['x-api-key'] = apiKey;
      headers.Authorization = `Bearer ${apiKey}`;
    }
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = new Error(data.message || data.error || data.detail || `SP WorldTech AI request failed with ${response.status}`);
      err.statusCode = response.status;
      throw err;
    }
    const content = extractText(data);
    if (!content) {
      const err = new Error('SP WorldTech AI returned an empty response. Please try again shortly.');
      err.statusCode = 502;
      throw err;
    }
    return { content, provider, endpointUsed: endpoint, raw: data };
  } finally { clearTimeout(timeout); }
}

module.exports = { callAIProvider, buildProfessionalPrompt };

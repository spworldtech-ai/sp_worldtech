window.SPW_APP = window.SPW_APP || {};
const productionApi = 'https://spworldtech.com';
const isProductionDomain = /(^|\.)spworldtech\.com$/i.test(window.location.hostname || '');
// Use the public site origin in production so /api requests stay same-origin
// and are routed by Vercel to the backend.
const rawApiBase = isProductionDomain ? window.location.origin : productionApi;
const normalizedApiBase = String(rawApiBase || productionApi).replace(/\/$/, '').replace(/\/api$/i, '');
window.SPW_APP.API_BASE = normalizedApiBase;
window.SPW_APP.API_BASE_URL = 'https://spworldtech.com/api';

window.SPW_APP.parseResponse = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); }
  catch (_) {
    const contentType = response.headers.get('content-type') || '';
    const looksHtml = /html/i.test(contentType) || /^\s*<!doctype|^\s*<html/i.test(text);
    if (looksHtml) {
      throw new Error(`The API returned an HTML page instead of JSON (HTTP ${response.status}). Check the SP WorldTech API URL/rewrite configuration.`);
    }
    throw new Error(text.slice(0, 240) || `Server returned HTTP ${response.status}.`);
  }
};
window.SPW_APP.setPasswordToggleState = (button, visible, isPin = false) => {
  if (!button) return;
  const label = visible ? (isPin ? 'Hide PIN' : 'Hide Password') : (isPin ? 'View PIN' : 'View Password');
  button.innerHTML = visible
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.7a2.5 2.5 0 0 0 3.5 3.5M9.9 4.4A10.8 10.8 0 0 0 2.2 12c2.1 4.1 5.4 6.5 9.8 6.5 1.7 0 3.2-.4 4.6-1.1M14.1 4.4c3.3.7 5.7 2.9 7.7 7.6-.8 1.6-1.7 2.9-2.8 3.9"/><path d="M6.2 6.2C4.4 7.5 3.1 9.4 2.2 12 4.3 16.1 7.6 18.5 12 18.5c1.2 0 2.4-.2 3.4-.6"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.2 12S5.5 5.5 12 5.5 21.8 12 21.8 12 18.5 18.5 12 18.5 2.2 12 2.2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
  button.setAttribute('aria-label', label);
  button.setAttribute('title', label);
  button.setAttribute('aria-pressed', visible ? 'true' : 'false');
};

window.SPW_APP.SITE_URL = 'https://spworldtech.com';
window.SPW_APP.WORLD_NET_HOSTING_URL = 'https://worldnethosting.com';
window.SPW_APP.tokenKey = 'spw_user_token';
window.SPW_APP.getToken = () => localStorage.getItem(window.SPW_APP.tokenKey) || '';
window.SPW_APP.headers = () => {
  const t = window.SPW_APP.getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};
window.SPW_APP.api = async (path, options = {}) => {
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...window.SPW_APP.headers(),
    ...(options.headers || {})
  };
  const response = await fetch(`${window.SPW_APP.API_BASE}${path}`, { ...options, headers });
  const data = await window.SPW_APP.parseResponse(response);
  if (!response.ok) throw new Error(data.message || 'Request failed.');
  return data;
};

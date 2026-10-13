(() => {
  const API = (window.SPW_APP?.API_BASE || location.origin).replace(/\/$/, '').replace(/\/api$/i, '');
  const next = new URLSearchParams(location.search).get('next') || '/dashboard.html';
  const status = document.getElementById('authStatus');
  const googleButton = document.getElementById('googleButton');
  const form = document.getElementById('authForm');
  const mode = document.body.dataset.authMode || 'login';
  const setStatus = (text, ok = false) => { if (status) { status.textContent = text; status.className = `status ${ok ? 'success' : ''}`; } };

// sourcery skip: avoid-function-declarations-in-blocks
  async function loadGoogle() {
    if (!googleButton) return;
    try {
      const config = await fetch(`${API}/api/public-config`).then(r => r.json());
      const clientId = config.googleClientId;
      if (!clientId) { googleButton.hidden = true; return; }
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true; script.defer = true;
      script.onload = () => {
        google.accounts.id.initialize({ client_id: clientId, callback: async ({ credential }) => {
          try {
            setStatus('Signing you in with Google…');
            const result = await fetch(`${API}/api/auth/google`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential }) }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.message || 'Google sign-in failed.'); return d; });
            localStorage.setItem('spw_user_token', result.token);
            localStorage.setItem('spw_user', JSON.stringify(result.user));
            location.href = next;
          } catch (error) { setStatus(error.message); }
        }});
        google.accounts.id.renderButton(googleButton, { theme: 'outline', size: 'large', shape: 'pill', text: mode === 'register' ? 'signup_with' : 'signin_with', width: 340 });
      };
      document.head.appendChild(script);
    } catch (_error) { googleButton.hidden = true; }
  }

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const data = Object.fromEntries(new FormData(form).entries());
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/user-login';
      const result = await fetch(`${API}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.message || 'Authentication failed.'); return d; });
      localStorage.setItem('spw_user_token', result.token); localStorage.setItem('spw_user', JSON.stringify(result.user));
      location.href = next;
    } catch (error) { setStatus(error.message); }
  });
  loadGoogle();
})();

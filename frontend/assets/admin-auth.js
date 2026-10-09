(() => {
  const API = (window.SPW_APP?.API_BASE || location.origin).replace(/\/$/, '').replace(/\/api$/i, '');
  const $ = id => document.getElementById(id);
  const setStatus = (id, message, ok = false) => {
    const el = $(id);
    if (!el) return;
    el.textContent = message || '';
    el.className = `status ${ok ? 'success' : ''}`;
  };
  const handleAuthResponse = (data) => { if (!data?.token) throw new Error('Authentication completed without a valid admin session.'); localStorage.setItem('spw_user_token', data.token); localStorage.setItem('spw_user', JSON.stringify(data.user || {})); location.replace('./admin-dashboard.html'); };

  $('adminLogin')?.addEventListener('submit', async event => {
    event.preventDefault();
    setStatus('loginStatus', 'Verifying admin credentials…');
    try {
      const response = await fetch(`${API}/api/admin/auth/login`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ username: $('adminUsername').value.trim(), password: $('adminPassword').value })
      });
      const data = await window.SPW_APP.parseResponse(response);
      if (!response.ok) throw new Error(data.message || 'Admin login failed.');
      handleAuthResponse(data);
    } catch (error) { setStatus('loginStatus', error.message); }
  });

  $('adminSignup')?.addEventListener('submit', async event => {
    event.preventDefault();
    setStatus('signupStatus', 'Creating the admin account…');
    try {
      const response = await fetch(`${API}/api/admin/auth/signup`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          fullName: $('adminSignupName').value.trim(),
          username: $('adminSignupUsername').value.trim(),
          email: $('adminSignupEmail').value.trim(),
          password: $('adminSignupPassword').value,
          setupCode: $('adminSetupCode').value
        })
      });
      const data = await window.SPW_APP.parseResponse(response);
      if (!response.ok) throw new Error(data.message || 'Admin account creation failed.');
      handleAuthResponse(data);
    } catch (error) { setStatus('signupStatus', error.message); }
  });

  document.querySelectorAll('[data-auth-tab]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-auth-tab]').forEach(b => b.classList.remove('active'));
    button.classList.add('active');
    const login = button.dataset.authTab === 'login';
    $('loginPanel').hidden = !login;
    $('signupPanel').hidden = login;
  }));

  document.querySelectorAll('[data-switch]').forEach(button => button.addEventListener('click', () => {
    document.querySelector(`[data-auth-tab="${button.dataset.switch}"]`)?.click();
  }));

  document.querySelectorAll('[data-password]').forEach(button => button.addEventListener('click', () => {
    const input = $(button.dataset.password);
    if (!input) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    button.textContent = show ? 'Hide' : 'Show';
  }));

  async function setupGoogle() {
    const loginButton = $('adminGoogleLogin');
    const signupButton = $('adminGoogleSignup');
    try {
      const response = await fetch(`${API}/api/public-config`, { headers: { Accept: 'application/json' } });
      const config = await window.SPW_APP.parseResponse(response);
      if (!config.googleClientId) {
        document.querySelectorAll('.google-config-note').forEach(el => el.textContent = 'Google authentication is not configured on the server.');
        return;
      }
      const loadGoogle = () => new Promise((resolve, reject) => {
        if (window.google?.accounts?.id) return resolve();
        const existing = document.querySelector('script[data-spw-google]');
        if (existing) { existing.addEventListener('load', resolve, { once: true }); existing.addEventListener('error', reject, { once: true }); return; }
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client'; script.async = true; script.defer = true; script.dataset.spwGoogle = '1';
        script.onload = resolve; script.onerror = reject; document.head.appendChild(script);
      });
      await loadGoogle();
      window.google.accounts.id.initialize({ client_id: config.googleClientId, callback: async ({ credential }) => {
        try {
          if (!credential) throw new Error('Google did not return a valid credential.');
          setStatus('loginStatus', 'Verifying your Google admin account…');
          setStatus('signupStatus', 'Verifying your Google admin account…');
          const response = await fetch(`${API}/api/admin/auth/google`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ credential }) });
          const data = await window.SPW_APP.parseResponse(response);
          if (!response.ok) throw new Error(data.message || 'Admin Google authentication failed.');
          handleAuthResponse(data);
        } catch (error) { setStatus('loginStatus', error.message); setStatus('signupStatus', error.message); }
      }});
      if (loginButton) window.google.accounts.id.renderButton(loginButton, { theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', width: 340 });
      if (signupButton) window.google.accounts.id.renderButton(signupButton, { theme: 'outline', size: 'large', shape: 'pill', text: 'signup_with', width: 340 });
    } catch (error) {
      setStatus('loginStatus', 'Google authentication could not be loaded.');
      setStatus('signupStatus', 'Google authentication could not be loaded.');
    }
  }
  setupGoogle();
})();

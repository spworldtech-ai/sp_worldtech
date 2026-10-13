(() => {
  const API = (window.SPW_APP?.API_BASE || location.origin).replace(/\/$/, '').replace(/\/api$/i, '');
  const next = new URLSearchParams(location.search).get('next') || '/dashboard.html';
  const setStatus = (id, text, ok=false) => { const el=document.getElementById(id); if(el){el.textContent=text; el.className=`status ${ok?'success':''}`;} };
  const saveAndGo = (result) => { localStorage.setItem('spw_user_token', result.token); localStorage.setItem('spw_user', JSON.stringify(result.user)); location.href=next; };
  const continueAuth = (result) => { if (!result.token) throw new Error('Authentication completed without a valid session.'); saveAndGo(result); };
  async function submitLogin(e){
    e.preventDefault();
    try{
      const data=Object.fromEntries(new FormData(e.currentTarget).entries());
      setStatus('loginStatus','Signing you in…');
      const r=await fetch(`${API}/api/auth/user-login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      const d=await window.SPW_APP.parseResponse(r); if(!r.ok) throw new Error(d.message||'Login failed.');
      continueAuth(d);
    }catch(err){setStatus('loginStatus',err.message);}
  }
  async function submitRegister(e){
    e.preventDefault();
    try{
      const data=Object.fromEntries(new FormData(e.currentTarget).entries());
      setStatus('registerStatus','Creating your account…');
      const r=await fetch(`${API}/api/auth/register`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      const d=await window.SPW_APP.parseResponse(r); if(!r.ok)throw new Error(d.message||'Registration failed.'); continueAuth(d);
    }catch(err){setStatus('registerStatus',err.message);}
  }
  document.getElementById('loginForm')?.addEventListener('submit',submitLogin);
  document.getElementById('registerForm')?.addEventListener('submit',submitRegister);
  document.querySelectorAll('[data-auth-tab]').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.auth-tab').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
    const isLogin=btn.dataset.authTab==='login'; document.getElementById('loginPanel').hidden=!isLogin; document.getElementById('registerPanel').hidden=isLogin;
  }));
  async function setupGoogle(){
    try{
      const cfg=await fetch(`${API}/api/public-config`).then(r=>window.SPW_APP.parseResponse(r)); if(!cfg.googleClientId){ ['googleButtonLogin','googleButtonRegister'].forEach(id=>{ const el=document.getElementById(id); if(el) el.innerHTML='<div class=\"google-config-note\">Google Sign-In is ready in the interface. Add the real GOOGLE_CLIENT_ID in the backend environment to enable the official Google button.</div>'; }); return; }
      const script=document.createElement('script'); script.src='https://accounts.google.com/gsi/client'; script.async=true; script.defer=true;
      script.onload=()=>{
        const callback=async({credential})=>{
          try{
            setStatus('loginStatus','Signing you in with Google…'); setStatus('registerStatus','Connecting your Google account…');
            const r=await fetch(`${API}/api/auth/google`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({credential,role:'user'})}); const d=await window.SPW_APP.parseResponse(r); if(!r.ok)throw new Error(d.message||'Google authentication failed.'); continueAuth(d);
          }catch(err){setStatus('loginStatus',err.message);setStatus('registerStatus',err.message);}
        };
        google.accounts.id.initialize({client_id:cfg.googleClientId,callback});
        google.accounts.id.renderButton(document.getElementById('googleButtonLogin'),{theme:'outline',size:'large',shape:'pill',text:'signin_with',width:340});
        google.accounts.id.renderButton(document.getElementById('googleButtonRegister'),{theme:'outline',size:'large',shape:'pill',text:'signup_with',width:340});
      }; document.head.appendChild(script);
    }catch(_){ }
  }
  function bindPasswordToggles(){
    document.querySelectorAll('[data-toggle-password]').forEach((button)=>{
      if (button.dataset.passwordToggleBound === '1') return;
      const targetId = button.dataset.togglePassword;
      const input = document.getElementById(targetId);
      if (!input) return;
      button.dataset.passwordToggleBound = '1';
      button.addEventListener('click',()=>{
        const visible = input.type === 'password';
        input.type = visible ? 'text' : 'password';
        window.SPW_APP.setPasswordToggleState(button, visible, false);
      });
    });
  }
  bindPasswordToggles();
  setupGoogle();
})();
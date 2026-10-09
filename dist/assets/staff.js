(() => {
  const API = (window.SPW_APP?.API_BASE || location.origin).replace(/\/$/, '').replace(/\/api$/i, '');
  const next = './staff.html'; // Staff sessions always enter the staff dashboard; ignore external/role-crossing redirects.

  const status = (id, message, ok=false) => {
    const el=document.getElementById(id); if(el){el.textContent=message;el.className=`status ${ok?'success':''}`;}
  };
  const saveAndGo = result => {
    localStorage.setItem('spw_staff_token', result.token);
    localStorage.setItem('spw_staff_user', JSON.stringify(result.user || {}));
    location.href = next;
  };
  const continueGoogle = result => { saveAndGo(result); };

  document.querySelectorAll('[data-toggle-password]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const input=btn.closest('.password-field-wrap')?.querySelector('input');
      if(!input)return;
      const show=input.type==='password';
      input.type=show?'text':'password';
      window.SPW_APP.setPasswordToggleState(btn, show, input.inputMode==='numeric');
    });
  });

  document.querySelectorAll('[data-staff-tab]').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('[data-staff-tab]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
    const login=btn.dataset.staffTab==='login';
    document.getElementById('staffLoginPanel').hidden=!login;
    document.getElementById('staffRegisterPanel').hidden=login;
  }));

  document.getElementById('staffLoginForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    try{
      status('staffLoginStatus','Signing you in…');
      const data=Object.fromEntries(new FormData(e.currentTarget).entries());
      const r=await fetch(`${API}/api/auth/staff-login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,role:'staff'})});
      const d=await window.SPW_APP.parseResponse(r);if(!r.ok)throw new Error(d.message||'Staff login failed.');
      saveAndGo(d);
    }catch(err){status('staffLoginStatus',err.message);}
  });

  document.getElementById('staffRegisterForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    try{
      const data=Object.fromEntries(new FormData(e.currentTarget).entries());
      delete data.pinConfirm; delete data.pin;
      status('staffRegisterStatus','Creating your staff account…');
      const r=await fetch(`${API}/api/auth/staff-signup`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      const d=await window.SPW_APP.parseResponse(r);if(!r.ok)throw new Error(d.message||'Staff signup failed.');
      saveAndGo(d);
    }catch(err){status('staffRegisterStatus',err.message);}
  });

  async function setupGoogle(){
    const loginButton=document.getElementById('staffGoogleLogin');
    const registerButton=document.getElementById('staffGoogleRegister');
    if(!loginButton && !registerButton)return;
    try{
      const cfg=await fetch(`${API}/api/public-config`,{headers:{Accept:'application/json'}}).then(r=>window.SPW_APP.parseResponse(r));
      if(!cfg.googleClientId){
        status('staffLoginStatus','Google Login is not configured on the server.');
        status('staffRegisterStatus','Google Signup is not configured on the server.');
        return;
      }
      const loadGoogle=()=>new Promise((resolve,reject)=>{
        if(window.google?.accounts?.id)return resolve();
        const existing=document.querySelector('script[data-spw-google]');
        if(existing){existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return;}
        const script=document.createElement('script');
        script.src='https://accounts.google.com/gsi/client';script.async=true;script.defer=true;script.dataset.spwGoogle='1';
        script.onload=resolve;script.onerror=reject;document.head.appendChild(script);
      });
      await loadGoogle();
      window.google.accounts.id.initialize({client_id:cfg.googleClientId,callback:async({credential})=>{
        try{
          if(!credential)throw new Error('Google did not return a valid credential.');
          status('staffLoginStatus','Verifying your Google staff account…');
          status('staffRegisterStatus','Verifying your Google staff account…');
          const r=await fetch(`${API}/api/auth/google`,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({credential,role:'staff'})});
          const d=await window.SPW_APP.parseResponse(r);
          if(!r.ok)throw new Error(d.message||'Staff Google sign-in failed.');
          continueGoogle(d);
        }catch(err){status('staffLoginStatus',err.message);status('staffRegisterStatus',err.message);}
      }});
      if(loginButton)window.google.accounts.id.renderButton(loginButton,{theme:'outline',size:'large',shape:'pill',text:'signin_with',width:340});
      if(registerButton)window.google.accounts.id.renderButton(registerButton,{theme:'outline',size:'large',shape:'pill',text:'signup_with',width:340});
    }catch(err){
      status('staffLoginStatus','Google authentication could not be loaded.');
      status('staffRegisterStatus','Google authentication could not be loaded.');
    }
  }
  setupGoogle();
})();

const API = (window.SPW_APP?.API_BASE || window.location.origin).replace(/\/$/, '').replace(/\/api$/i, '');
const next = new URLSearchParams(window.location.search).get('next') || './dashboard.html';
let googleReady = false;

function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const target=document.getElementById(id);
  if(target) target.classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
  if(id==='pinScreen') startTimer();
  if(window.lucide) lucide.createIcons();
}

function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;t.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer=setTimeout(()=>t.classList.remove('show'),3000);
}

function goHome(){ window.location.href='./index.html'; }

function savePendingPin(result, role='user'){
  const pendingToken=result.requiresPinSetup ? result.setupToken : result.pinToken;
  if(!pendingToken) throw new Error('Authentication completed but the secure PIN session was not returned.');
  localStorage.setItem('spw_pending_pin_token', pendingToken);
  localStorage.setItem('spw_pending_pin_user', JSON.stringify(result.user || {}));
  localStorage.setItem('spw_pending_pin_role', role);
  const mode=result.requiresPinSetup ? 'setup' : 'verify';
  window.location.href=`./pin.html?mode=${mode}&role=${encodeURIComponent(role)}&next=${encodeURIComponent(next)}`;
}

async function api(path, body){
  const response=await fetch(`${API}${path}`,{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)
  });
  const data=await (window.SPW_APP?.parseResponse ? window.SPW_APP.parseResponse(response) : response.json());
  if(!response.ok) throw new Error(data.message || 'Request failed.');
  return data;
}

async function finishAuthentication(result, role='user'){
  if(result.requiresPin || result.requiresPinSetup){ savePendingPin(result,role); return; }
  if(result.token){
    localStorage.setItem('spw_user_token',result.token);
    localStorage.setItem('spw_user',JSON.stringify(result.user || {}));
    window.location.href=next;
    return;
  }
  throw new Error('Authentication completed without a valid session token.');
}

document.querySelectorAll('.eye').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const input=document.getElementById(btn.dataset.password);
    if(!input)return;
    const hidden=input.type==='password';
    input.type=hidden?'text':'password';
    btn.innerHTML=`<i data-lucide="${hidden?'eye-off':'eye'}"></i>`;
    btn.setAttribute('aria-label',hidden?'Hide password':'Show password');
    if(window.lucide)lucide.createIcons();
  });
});

document.getElementById('loginForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const button=e.currentTarget.querySelector('button[type="submit"]');
  button.disabled=true;button.textContent='Signing In…';
  try{
    const result=await api('/api/auth/user-login',{
      identifier:document.getElementById('loginEmail').value.trim(),
      password:document.getElementById('loginPassword').value
    });
    await finishAuthentication(result,'user');
  }catch(error){showToast(error.message);button.disabled=false;button.innerHTML='Sign In <span>→</span>';}
});

document.getElementById('signupForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const pass=document.getElementById('signupPassword').value;
  const confirm=document.getElementById('confirmPassword').value;
  if(pass!==confirm){showToast('Passwords do not match.');return;}
  const button=e.currentTarget.querySelector('button[type="submit"]');
  button.disabled=true;button.textContent='Creating Account…';
  try{
    const first=document.getElementById('firstName').value.trim();
    const last=document.getElementById('lastName').value.trim();
    const result=await api('/api/auth/register',{
      fullName:`${first} ${last}`.trim(),
      email:document.getElementById('signupEmail').value.trim(),
      password:pass
    });
    if(result.requiresPinSetup||result.requiresPin){
      document.getElementById('pinDescription').textContent='Your account has been created. Create your secure 4 to 8 digit account PIN to continue.';
      savePendingPin(result,'user');
      return;
    }
    await finishAuthentication(result,'user');
  }catch(error){showToast(error.message);button.disabled=false;button.innerHTML='Create Account <span>→</span>';}
});

document.querySelectorAll('.pin-box').forEach((box,index,boxes)=>{
  box.addEventListener('input',()=>{
    box.value=box.value.replace(/\D/g,'').slice(0,1);
    if(box.value&&boxes[index+1])boxes[index+1].focus();
  });
  box.addEventListener('keydown',e=>{
    if(e.key==='Backspace'&&!box.value&&boxes[index-1])boxes[index-1].focus();
  });
  box.addEventListener('paste',e=>{
    e.preventDefault();
    const value=(e.clipboardData||window.clipboardData).getData('text').replace(/\D/g,'').slice(0,4);
    boxes.forEach((b,i)=>b.value=value[i]||'');
    if(value.length)boxes[Math.min(value.length,4)-1]?.focus();
  });
});

document.getElementById('pinForm').addEventListener('submit',e=>{
  e.preventDefault();
  const pin=[...document.querySelectorAll('.pin-box')].map(x=>x.value).join('');
  if(pin.length!==4){showToast('Please enter the complete 4-digit PIN.');return;}
  // The actual secure PIN verification happens on pin.html through the backend.
  localStorage.setItem('spw_auth_pin_preview',pin);
  showToast('Continue to the secure PIN verification page.');
});

let seconds=60,timer;
function startTimer(){
  clearInterval(timer);seconds=60;
  const resend=document.getElementById('resendBtn');
  if(resend)resend.disabled=true;
  const timerEl=document.getElementById('timer');
  if(timerEl)timerEl.textContent=`(00:${String(seconds).padStart(2,'0')})`;
  timer=setInterval(()=>{
    seconds--;
    if(timerEl)timerEl.textContent=seconds>0?`(00:${String(seconds).padStart(2,'0')})`:'';
    if(seconds<=0){clearInterval(timer);if(resend)resend.disabled=false;}
  },1000);
}
function resendPin(){showToast('Please sign in again to request a new secure PIN session.');}

async function loadGoogle(){
  try{
    const response=await fetch(`${API}/api/public-config`);
    const config=await response.json();
    if(!config.googleClientId){
      showToast('Google Sign-In is not configured on the server yet. Add GOOGLE_CLIENT_ID to the backend environment.');
      return;
    }
    const script=document.createElement('script');
    script.src='https://accounts.google.com/gsi/client';script.async=true;script.defer=true;
    script.onload=()=>{
      if(!window.google?.accounts?.id)return;
      google.accounts.id.initialize({
        client_id:config.googleClientId,
        callback:async response=>{
          try{
            const result=await api('/api/auth/google',{credential:response.credential,role:'user'});
            await finishAuthentication(result,'user');
          }catch(error){showToast(error.message);}
        },
        ux_mode:'popup'
      });
      const loginButton=document.getElementById('googleLoginButton');
      const signupButton=document.getElementById('googleSignupButton');
      if(loginButton)google.accounts.id.renderButton(loginButton,{theme:'outline',size:'large',shape:'rectangular',text:'signin_with',width:340});
      if(signupButton)google.accounts.id.renderButton(signupButton,{theme:'outline',size:'large',shape:'rectangular',text:'signup_with',width:340});
      googleReady=true;
    };
    script.onerror=()=>showToast('Unable to load Google Sign-In. Check your network connection.');
    document.head.appendChild(script);
  }catch(error){showToast('Unable to load Google Sign-In configuration.');}
}

async function googleLogin(){
  if(!googleReady){showToast('Google Sign-In is still loading or is not configured.');return;}
  try{google.accounts.id.prompt();}catch(error){showToast('Google Sign-In could not be opened.');}
}
async function googleSignup(){return googleLogin();}
function openDashboard(){window.location.href='./dashboard.html';}

loadGoogle();
if(window.lucide)lucide.createIcons();

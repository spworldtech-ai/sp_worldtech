(() => {
  'use strict';
  if (window.__SPW_CHAT_WIDGET__) return;
  window.__SPW_CHAT_WIDGET__ = true;

  const API = (window.SPW_APP?.API_BASE || location.origin).replace(/\/$/, '').replace(/\/api$/i, '');
  const userToken = () => localStorage.getItem('spw_user_token') || '';
  const staffToken = () => localStorage.getItem('spw_staff_token') || '';
  const adminToken = () => localStorage.getItem('spw_admin_token') || '';
  const token = () => adminToken() || staffToken() || userToken();
  const storedUser = () => {
    try { return JSON.parse(localStorage.getItem('spw_user') || localStorage.getItem('spw_staff_user') || '{}'); } catch (_) { return {}; }
  };
  const isSupport = () => Boolean(adminToken() || staffToken() || ['admin','owner','staff'].includes(String(storedUser().role || '').toLowerCase()));
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const formatTime = value => { const d = new Date(value); return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); };

  function injectStyles() {
    if (document.getElementById('spwChatWidgetStyles')) return;
    const link = document.createElement('link');
    link.id = 'spwChatWidgetStyles'; link.rel = 'stylesheet'; link.href = './assets/chat-widget.css';
    document.head.appendChild(link);
  }

  function mount() {
    if (document.getElementById('spwChatWidget')) return;
    injectStyles();
    const support = isSupport();
    const logo = './assets/logo.jpeg';
    const root = document.createElement('div'); root.id = 'spwChatWidget';
    root.innerHTML = `
      <div class="spw-chat-panel" id="spwChatPanel" role="dialog" aria-label="SP WorldTech live chat" aria-hidden="true">
        <div class="spw-chat-head">
          <div class="spw-chat-brand"><div class="spw-chat-avatar"><img src="${logo}" alt="SP WorldTech"></div><div><div class="spw-chat-title">${support ? 'Support Inbox' : 'SP WorldTech Live Chat'}</div><div class="spw-chat-status">● Live support • Replies appear automatically</div></div></div>
          <button class="spw-chat-close" id="spwChatClose" type="button" aria-label="Close chat">×</button>
        </div>
        ${support ? `<div class="spw-chat-inbox active"><div class="spw-chat-conversations" id="spwChatConversations"></div><div class="spw-chat-staff-main"><div class="spw-chat-messages" id="spwChatMessages"></div><div class="spw-chat-compose"><form class="spw-chat-form" id="spwChatForm"><textarea class="spw-chat-input" id="spwChatInput" maxlength="2000" placeholder="Reply to this visitor…" aria-label="Reply"></textarea><button class="spw-chat-send" type="submit" aria-label="Send reply"><svg viewBox="0 0 24 24"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg></button></form></div></div></div>` : `<div class="spw-chat-messages" id="spwChatMessages"></div><div class="spw-chat-compose"><form class="spw-chat-form" id="spwChatForm"><textarea class="spw-chat-input" id="spwChatInput" maxlength="2000" placeholder="Write a message…" aria-label="Message"></textarea><button class="spw-chat-send" type="submit" aria-label="Send message"><svg viewBox="0 0 24 24"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg></button></form><div class="spw-chat-note">Please do not send passwords, PINs or payment credentials.</div></div>`}
      </div>
      <button class="spw-chat-fab" id="spwChatFab" type="button" aria-label="Open SP WorldTech live chat" aria-expanded="false"><span class="spw-chat-badge" id="spwChatBadge">0</span><svg viewBox="0 0 24 24"><path d="M20 11.5a7.5 7.5 0 0 1-7.8 7.5 8.6 8.6 0 0 1-3.2-.6L4 20l1.6-4.1A7.4 7.4 0 0 1 4.5 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z"/><path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01"/></svg></button>`;
    document.body.appendChild(root);

    root.querySelector('#spwChatFab').addEventListener('click', toggle);
    root.querySelector('#spwChatClose').addEventListener('click', close);
    root.querySelector('#spwChatForm').addEventListener('submit', send);
    root.querySelector('#spwChatInput').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); } });
    if (support) renderSupport([]); else renderUser([]);
    load();
    setInterval(() => { if (token()) load(true); }, 3500);
  }

  function toggle() { const panel = document.getElementById('spwChatPanel'); if (!panel) return; panel.classList.contains('open') ? close() : open(); }
  function open() { const panel=document.getElementById('spwChatPanel'); if(!panel)return; panel.classList.add('open'); panel.setAttribute('aria-hidden','false'); document.getElementById('spwChatFab').setAttribute('aria-expanded','true'); document.getElementById('spwChatBadge').style.display='none'; document.getElementById('spwChatInput')?.focus(); }
  function close() { const panel=document.getElementById('spwChatPanel'); if(!panel)return; panel.classList.remove('open'); panel.setAttribute('aria-hidden','true'); document.getElementById('spwChatFab').setAttribute('aria-expanded','false'); }

  async function load(silent=false) {
    const t=token(); if(!t){ renderLoginPrompt(); return; }
    try {
      const r=await fetch(`${API}/api/chat/me`,{headers:{Authorization:`Bearer ${t}`},cache:'no-store'});
      const d=await parse(r); if(!r.ok) throw new Error(d.message||'Chat unavailable');
      if(isSupport()) renderSupport(d.messages||[]); else renderUser(d.messages||[]);
    } catch(e) { if(!silent) showError(e.message); }
  }

  async function parse(r){const text=await r.text();try{return text?JSON.parse(text):{}}catch(_){throw new Error(text.slice(0,180)||`Server returned HTTP ${r.status}`)}}

  function renderLoginPrompt(){
    const el=document.getElementById('spwChatMessages'); if(!el)return;
    el.innerHTML='<div class="spw-chat-empty"><strong>Chat with SP WorldTech</strong>Sign in to your SP WorldTech account to start a secure live support conversation.<br><br><a href="./auth.html?next='+encodeURIComponent(location.pathname+location.search)+'" style="color:#69c0ff;font-weight:800">Sign in to chat →</a></div>';
    document.getElementById('spwChatForm')?.classList.add('spw-chat-disabled');
  }

  function renderUser(messages){
    const el=document.getElementById('spwChatMessages'); if(!el)return;
    if(!messages.length){el.innerHTML='<div class="spw-chat-empty"><strong>How can we help?</strong>Send us a message and our admin/staff support team will respond here. Keep your passwords, PINs and payment credentials private.</div>';return;}
    el.innerHTML=messages.map(m=>`<div class="spw-chat-message ${m.senderRole==='user'?'mine':''}"><div class="spw-chat-bubble">${escapeHtml(m.message)}<div class="spw-chat-meta">${escapeHtml(m.senderName||'SP WorldTech Support')} • ${formatTime(m.createdAt)}</div></div></div>`).join(''); el.scrollTop=el.scrollHeight;
  }

  function group(messages){
    const map=new Map(); messages.forEach(m=>{const id=String(m.conversationId||m.sender||'legacy');if(!map.has(id))map.set(id,{id,name:m.senderRole==='user'?m.senderName:'Visitor',messages:[]});map.get(id).messages.push(m);}); return [...map.values()].sort((a,b)=>new Date(b.messages.at(-1)?.createdAt||0)-new Date(a.messages.at(-1)?.createdAt||0));
  }
  let supportMessages=[]; let selectedConversation='';
  function renderSupport(messages){
    supportMessages=messages; const groups=group(messages); const list=document.getElementById('spwChatConversations'); if(!list)return;
    if(!groups.length){list.innerHTML='<div class="spw-chat-empty" style="padding:18px 5px">No conversations yet.</div>';document.getElementById('spwChatMessages').innerHTML='<div class="spw-chat-empty"><strong>Support Inbox</strong>New customer messages will appear here.</div>';return;}
    if(!selectedConversation || !groups.some(g=>g.id===selectedConversation)) selectedConversation=groups[0].id;
    list.innerHTML=groups.map(g=>{const last=g.messages.at(-1);return `<button class="spw-chat-conv ${g.id===selectedConversation?'active':''}" data-conv="${escapeHtml(g.id)}"><strong>${escapeHtml(g.name||'Visitor')}</strong><span>${escapeHtml((last?.message||'').slice(0,36))}</span></button>`}).join('');
    list.querySelectorAll('[data-conv]').forEach(b=>b.addEventListener('click',()=>{selectedConversation=b.dataset.conv;renderSupport(supportMessages)}));
    const current=groups.find(g=>g.id===selectedConversation); const el=document.getElementById('spwChatMessages');
    el.innerHTML=current.messages.map(m=>`<div class="spw-chat-message ${m.senderRole==='staff'?'mine':''}"><div class="spw-chat-bubble">${escapeHtml(m.message)}<div class="spw-chat-meta">${escapeHtml(m.senderName||'SP WorldTech')} • ${formatTime(m.createdAt)}</div></div></div>`).join(''); el.scrollTop=el.scrollHeight;
  }

  function showError(message){const el=document.getElementById('spwChatMessages');if(el)el.innerHTML=`<div class="spw-chat-empty"><strong>Chat is temporarily unavailable</strong>${escapeHtml(message)}</div>`;}

  async function send(e){e.preventDefault(); const input=document.getElementById('spwChatInput'); const message=input?.value.trim(); if(!message)return; const t=token(); if(!t){renderLoginPrompt();return;}
    const body={message}; if(isSupport()) body.conversationId=selectedConversation;
    try{input.disabled=true;const endpoint=isSupport()?'/api/chat/staff-reply':'/api/chat/send';const r=await fetch(API+endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${t}`},body:JSON.stringify(body)});const d=await parse(r);if(!r.ok)throw new Error(d.message||'Unable to send message');input.value='';await load(true);}catch(err){showError(err.message)}finally{input.disabled=false;input.focus();}
  }

  document.addEventListener('visibilitychange',()=>{if(!document.hidden)load(true)});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true}); else mount();
})();

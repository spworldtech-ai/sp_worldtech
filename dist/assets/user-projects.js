(() => {
  const token = localStorage.getItem('spw_user_token');
  if (!token) return;
  const API = (window.SPW_APP?.API_BASE || location.origin).replace(/\/$/, '').replace(/\/api$/i, '');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = v => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(v||0));
  const statusLabel = s => String(s||'pending_payment').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());

  async function api(path, options={}) {
    const headers={Authorization:`Bearer ${token}`,...(options.body?{'Content-Type':'application/json'}:{})};
    const r=await fetch(API+path,{...options,headers});
    const d=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(d.message||'Request failed.');
    return d;
  }

  function card(p) {
    const remaining=Number(p.remainingAmount||0), total=Number(p.totalAmount||0), paid=Number(p.paidAmount||0);
    const halfReady=paid < total*0.5 && remaining>0;
    const fullReady=remaining>0;
    const progress=total?Math.min(100,Math.round(paid/total*100)):0;
    return `<article class="card page-card spw-project-card">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div><span class="eyebrow dark">PROJECT</span><h3 style="margin:6px 0">${esc(p.title)}</h3><p style="color:var(--muted);font-size:12px">${esc(p.description||'Project managed by SP WorldTech.')}</p></div>
        <span class="status ${p.status==='delivered'||p.status==='completed'?'completed':p.status==='pending_payment'?'pending':'active-status'}">${esc(statusLabel(p.status))}</span>
      </div>
      <div style="height:8px;background:#e9eef5;border-radius:20px;margin:14px 0;overflow:hidden"><div style="height:100%;width:${progress}%;background:#0871ff"></div></div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
        <div><small style="color:var(--muted)">Project Total</small><strong style="display:block">${money(total)}</strong></div>
        <div><small style="color:var(--muted)">Paid</small><strong style="display:block">${money(paid)}</strong></div>
        <div><small style="color:var(--muted)">Remaining</small><strong style="display:block">${money(remaining)}</strong></div>
      </div>
      ${remaining>0?`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:15px">
        ${halfReady?`<button class="primary-btn spw-project-pay" data-id="${p.id}" data-type="half">Pay 50% — ${money(Math.min(remaining,total*.5))}</button>`:''}
        ${fullReady?`<button class="small-btn spw-project-pay" data-id="${p.id}" data-type="full">Pay Full — ${money(remaining)}</button>`:''}
        ${halfReady?`<button class="small-btn spw-project-wallet" data-id="${p.id}" data-type="half">Use Wallet (50%)</button>`:''}
        ${fullReady?`<button class="small-btn spw-project-wallet" data-id="${p.id}" data-type="full">Use Wallet (Full)</button>`:''}
      </div>`:''}
      ${p.deliveryNotes||p.deliveryUrl||p.hasDeliveryFile?`<div style="margin-top:15px;padding:12px;border:1px solid var(--border);border-radius:10px;background:#f8fbff"><strong>Project Delivery</strong>${p.deliveryNotes?`<p style="font-size:12px;color:var(--muted);white-space:pre-wrap">${esc(p.deliveryNotes)}</p>`:''}<div style="display:flex;gap:8px;flex-wrap:wrap">${p.deliveryUrl?`<a class="small-btn" href="${esc(p.deliveryUrl)}" target="_blank" rel="noopener">Open Delivery Link</a>`:''}${p.hasDeliveryFile?`<button class="small-btn spw-project-download" data-id="${p.id}">Download Project File</button>`:''}</div></div>`:''}
    </article>`;
  }

  async function load() {
    const root=document.getElementById('userProjectsList'); if(!root)return;
    try {
      const d=await api('/api/projects/me');
      const projects=Array.isArray(d.projects)?d.projects:[];
      root.innerHTML=projects.length?projects.map(card).join(''):`<div class="info-card"><h3>No projects yet</h3><p>When SP WorldTech creates a project for your account, it will appear here with its payment and delivery status.</p><a class="primary" href="./pricing.html">View Pricing</a></div>`;
      bind(projects);
    } catch(e){root.innerHTML=`<div class="info-card"><h3>Projects unavailable</h3><p>${esc(e.message)}</p></div>`;}
  }

  function bind(projects) {
    document.querySelectorAll('.spw-project-pay').forEach(btn=>btn.addEventListener('click',async()=>{
      try{btn.disabled=true;btn.textContent='Preparing secure checkout…';const d=await api(`/api/projects/${btn.dataset.id}/pay`,{method:'POST',body:JSON.stringify({paymentType:btn.dataset.type})});if(d.checkoutUrl)location.href=d.checkoutUrl;else throw new Error('Checkout could not be created.');}catch(e){alert(e.message);btn.disabled=false;}
    }));
    document.querySelectorAll('.spw-project-wallet').forEach(btn=>btn.addEventListener('click',async()=>{
      try{btn.disabled=true;const d=await api(`/api/projects/${btn.dataset.id}/wallet-pay`,{method:'POST',body:JSON.stringify({paymentType:btn.dataset.type})});alert(d.message||'Payment completed.');await load();}catch(e){alert(e.message);btn.disabled=false;}
    }));
    document.querySelectorAll('.spw-project-download').forEach(btn=>btn.addEventListener('click',async()=>{
      try{const r=await fetch(`${API}/api/projects/${btn.dataset.id}/delivery`,{headers:{Authorization:`Bearer ${token}`}});if(!r.ok){const d=await r.json().catch(()=>({}));throw new Error(d.message||'Download failed.');}const blob=await r.blob();const cd=r.headers.get('content-disposition')||'';const m=cd.match(/filename="?([^";]+)"?/i);const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=m?.[1]||'SP-WorldTech-Project';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}catch(e){alert(e.message);}
    }));
  }

  async function verifyCallback(){
    const ref=new URLSearchParams(location.search).get('reference')||new URLSearchParams(location.search).get('trxref');
    if(!ref)return;
    try{const d=await api(`/api/projects/payments/verify/${encodeURIComponent(ref)}`);alert(d.message||'Project payment verified.');history.replaceState(null,'',location.pathname+'#projects');}catch(e){console.warn('Project payment verification:',e.message);}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{load();verifyCallback();},{once:true});else{load();verifyCallback();}
  window.SPW_USER_PROJECTS={load};
})();
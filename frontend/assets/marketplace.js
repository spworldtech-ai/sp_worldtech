(() => {
  const API = (window.SPW_APP?.API_BASE || 'https://spworldtech.com').replace(/\/$/, '').replace(/\/api$/i, '');
  const grid = document.getElementById('ebookGrid');
  const status = document.getElementById('marketStatus');
  const search = document.getElementById('marketplaceSearch');
  const count = document.getElementById('marketplaceCount');
  let products = [];
  const money = (v) => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', minimumFractionDigits:2 }).format(Number(v||0));
  const esc = v => String(v ?? '').replace(/[&<>\'\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  function render(list) {
    if (count) count.textContent = `${list.length} product${list.length === 1 ? '' : 's'}`;
    if (!list.length) {
      grid.innerHTML='<div class="info-card"><h3>No matching products</h3><p>Try another product name or category.</p></div>';
      return;
    }
    grid.innerHTML=list.map(e=>`<article class="ebook-card info-card"><img class="ebook-cover" src="${esc(e.coverUrl||'./assets/logo.png')}" alt="${esc(e.title)}"><div class="card-body"><span class="eyebrow dark">${esc(e.category)}</span><h3>${esc(e.title)}</h3><div class="spw-rating compact" aria-label="5.0 out of 5 professional quality rating"><span class="spw-stars" aria-hidden="true">★★★★★</span><strong class="spw-rating-score">5.0/5</strong><span class="spw-rating-label">Professional quality</span></div><p>${esc(e.description||'Practical SP WorldTech digital guide.')}</p><div class="ebook-meta">${e.pageCount?`${e.pageCount} pages · `:''}${Math.max(1,Math.round((e.fileSize||0)/1024))} KB · Digital file · Instant download</div><div class="ebook-price">${Number(e.priceUsd ?? e.price ?? 0)<=0 ? '<span class="product-free">Download Free</span>' : `${Number(e.oldPrice||0)>Number(e.priceUsd??e.price??0)?`<del class="product-old-price">${money(e.oldPrice)}</del>`:''}<strong class="product-new-price" data-spw-price-usd="${Number(e.priceUsd ?? e.price ?? 0)}">${money(e.priceUsd ?? e.price)}</strong>`}</div><div class="page-actions">${Number(e.priceUsd ?? e.price ?? 0)<=0 ? `<button class="primary buy-ebook" data-id="${esc(e.id)}" data-method="free">Download Free</button>` : `<button class="primary buy-ebook" data-id="${esc(e.id)}" data-method="paystack">Pay with Paystack</button><button class="secondary buy-ebook" data-id="${esc(e.id)}" data-method="wallet">Pay with Wallet</button>`}<a class="secondary whatsapp-btn" target="_blank" rel="noopener" href="https://wa.me/${encodeURIComponent(String(e.whatsappNumber||'2349129193069').replace(/[^0-9]/g,''))}?text=${encodeURIComponent(`Hello SP WorldTech, I am interested in the product: ${e.title}`)}">WhatsApp</a></div></div></article>`).join('');
    grid.querySelectorAll('.buy-ebook').forEach(b=>b.addEventListener('click',()=>buy(b.dataset.id,b.dataset.method)));
    window.SPW_APP?.refreshCurrency?.();
  }

  async function load(){
    try {
      const d=await fetch(`${API}/api/marketplace/ebooks`,{cache:'no-store'}).then(async r=>{const x=await r.json();if(!r.ok)throw new Error(x.message);return x;});
      products=Array.isArray(d.ebooks)?d.ebooks:[];
      render(products);
    } catch(e){grid.innerHTML='<div class="info-card"><h3>Marketplace unavailable</h3><p>We could not load the marketplace right now.</p></div>';status.textContent=e.message;}
  }

  search?.addEventListener('input',()=>{
    const q=search.value.trim().toLowerCase();
    render(products.filter(e=>`${e.title} ${e.description||''} ${e.category||''}`.toLowerCase().includes(q)));
  });

  async function buy(id, method) {
    const token = localStorage.getItem('spw_user_token');
    if (!token) { location.href = `./auth.html?next=${encodeURIComponent(`/marketplace.html?buy=${id}`)}`; return; }
    try {
      if (method === 'free') {
        status.textContent = 'Preparing your free download…';
        const r = await fetch(`${API}/api/marketplace/ebooks/${encodeURIComponent(id)}/free-download`, { headers: window.SPW_APP.headers() });
        if (!r.ok) { const x=await r.json().catch(()=>({})); throw new Error(x.message || 'Free download failed.'); }
        const blob=await r.blob(); const cd=r.headers.get('content-disposition')||''; const m=cd.match(/filename=\"?([^\";]+)\"?/i); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=m?.[1]||'SP-WorldTech-Product'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); status.textContent='Download started.'; return;
      }
      if (method === 'wallet') {
        status.textContent = 'Checking your wallet balance…';
        const d = await window.SPW_APP.api(`/api/marketplace/ebooks/${id}/wallet-checkout`, { method: 'POST' });
        if (d.alreadyOwned) { location.href = './dashboard.html#marketplace'; return; }
        status.textContent = d.message || 'E-book purchased successfully.';
        setTimeout(() => location.href = './dashboard.html#marketplace', 700); return;
      }
      status.textContent = 'Preparing secure Paystack checkout…';
      const d = await window.SPW_APP.api(`/api/marketplace/ebooks/${id}/checkout`, { method: 'POST' });
      if (d.alreadyOwned) { location.href = './dashboard.html#marketplace'; return; }
      if (!d.checkoutUrl) throw new Error('Paystack checkout could not be created.');
      status.textContent = `Opening secure Paystack checkout for $${Number(d.payment?.usdAmount || 0).toFixed(2)}.`;
      setTimeout(() => { location.href = d.checkoutUrl; }, 350);
    } catch (e) { status.textContent = e.message; }
  }

  async function verifyCallback(){
    const params=new URLSearchParams(location.search); const ref=params.get('reference')||params.get('trxref'); if(!ref)return;
    try { status.textContent='Verifying payment…'; const d=await fetch(`${API}/api/marketplace/payments/verify/${encodeURIComponent(ref)}`).then(async r=>{const x=await r.json();if(!r.ok)throw new Error(x.message);return x;});
      if(d.paid){ status.textContent='Payment verified. Your product is available in your dashboard.'; setTimeout(()=>location.href='./dashboard.html#marketplace',700); }
    } catch(e){ status.textContent=e.message; }
  }

  load().then(() => { const buyId = new URLSearchParams(location.search).get('buy'); if (buyId) { const button = grid.querySelector(`.buy-ebook[data-id="${CSS.escape(buyId)}"]`); if (button) setTimeout(() => button.click(), 250); } });
  verifyCallback();
})();

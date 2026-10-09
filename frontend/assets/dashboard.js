(() => {
  const token = localStorage.getItem('spw_user_token');
  if (!token) {
    const next = location.pathname + location.search + location.hash;
    location.href = `./auth.html?next=${encodeURIComponent(next)}`;
    return;
  }

  const user = JSON.parse(localStorage.getItem('spw_user') || '{}');
  const API = (window.SPW_APP?.API_BASE || 'https://spworldtech.com').replace(/\/$/, '').replace(/\/api$/i, '');
  const welcome = document.getElementById('welcome');
  const walletUsd = document.getElementById('walletUsd');
  const walletNgn = document.getElementById('walletNgn');
  const walletStatus = document.getElementById('walletStatus');
  const walletPaymentBalance = document.getElementById('walletPaymentBalance');
  const dashboardWalletUsd = document.getElementById('dashboardWalletUsd');
  const dashboardWalletUsdMetric = document.getElementById('dashboardWalletUsdMetric');
  const dashboardWalletNgn = document.getElementById('dashboardWalletNgn');
  const walletPurchaseCount = document.getElementById('walletPurchaseCount');

  if (welcome) welcome.textContent = `Welcome, ${user.fullName || 'SP WorldTech user'}`;
  const safe = v => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const usd = v => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2}).format(Number(v||0));
  if (document.getElementById('dashboardProfileName')) document.getElementById('dashboardProfileName').textContent = user.fullName || user.email || 'SP WorldTech User';
  if (document.getElementById('dashboardProfileRole')) document.getElementById('dashboardProfileRole').textContent = user.role || 'Customer';

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('spw_user_token');
    localStorage.removeItem('spw_user');
    location.href = './auth.html';
  });

  document.getElementById('fundBtn')?.addEventListener('click', () => {
    const status = document.getElementById('walletStatus');
    if (status) { status.textContent = 'Wallet funding is handled through secure checkout. Choose a service or payment flow to continue.'; status.className = 'status'; }
  });
  document.getElementById('withdrawBtn')?.addEventListener('click', () => {
    const status = document.getElementById('walletStatus');
    if (status) { status.textContent = 'Withdrawal requests are available when your account has eligible earnings.'; status.className = 'status'; }
  });

  async function loadWallet() {
    try {
      const d = await window.SPW_APP.api('/api/wallet/me');
      const wallet = d.wallet || {};
      const usd = Number(wallet.usdBalance || 0);
      const ngn = Number(wallet.ngnBalance || 0);
      if (walletUsd) walletUsd.textContent = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usd);
      if (dashboardWalletUsd) dashboardWalletUsd.textContent = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usd);
      if (dashboardWalletUsdMetric) dashboardWalletUsdMetric.textContent = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usd);
      if (dashboardWalletNgn) dashboardWalletNgn.textContent = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(ngn);
      if (walletNgn) walletNgn.textContent = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(ngn);
      if (walletPaymentBalance) walletPaymentBalance.textContent = `${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usd)} USD available`;
      if (walletStatus) {
        walletStatus.textContent = 'Wallet balance loaded securely.';
        walletStatus.className = 'status success';
      }
      return wallet;
    } catch (e) {
      if (walletStatus) walletStatus.textContent = e.message;
      return null;
    }
  }

  function productCard(e, compact=false) {
    const cover = safe(e.coverUrl || './assets/logo.jpeg');
    const whatsapp=String(e.whatsappNumber||'2349129193069').replace(/[^0-9]/g,'');
    const current=Number(e.priceUsd ?? e.price ?? 0), old=Number(e.oldPrice ?? 0);
    const pricing=current<=0 ? '<span class="product-free">Download Free</span>' : `${old>current?`<del class="product-old-price">${usd(old)}</del>`:''}<strong class="product-new-price" data-spw-price-usd="${current}">${usd(current)}</strong>`;
    const action=current<=0 ? `<button class="small-btn free-download" data-product-id="${safe(e.id)}">Download Free</button>` : `<a class="small-btn" href="./marketplace.html?buy=${encodeURIComponent(e.id)}">Buy Now</a>`;
    return `<article class="${compact?'product-card':'catalog-card'}">${cover ? `<img class="${compact?'product-img':''}" src="${cover}" alt="${safe(e.title)}" loading="lazy">` : ''}<div class="${compact?'product-body':'catalog-body'}"><span class="tag">${safe(e.category || 'Digital Product')}</span><h3>${safe(e.title)}</h3><p>${safe(e.description || 'Digital product published by SP WorldTech.')}</p><div class="${compact?'product-bottom':'catalog-footer'}"><span class="product-price-wrap">${pricing}</span><span style="display:flex;gap:6px;flex-wrap:wrap">${action}<a class="small-btn" target="_blank" rel="noopener" href="https://wa.me/${encodeURIComponent(whatsapp)}?text=${encodeURIComponent(`Hello SP WorldTech, I am interested in the product: ${e.title}`)}">WhatsApp</a></span></div></div></article>`;
  }

  async function loadMarketplace() {
    const grid = document.getElementById('dashboardMarketplace');
    const popular = document.getElementById('popularProducts');
    const catalog = document.getElementById('catalogProducts');
    if (!grid && !popular && !catalog) return;
    try {
      const d = await window.SPW_APP.api('/api/marketplace/ebooks');
      const products = Array.isArray(d.ebooks) ? d.ebooks : [];
      const empty = '<div class="info-card"><h3>No live products yet</h3><p>The administrator has not published a product yet.</p><a class="primary" href="./marketplace.html">Open Marketplace</a></div>';
      if (grid) grid.innerHTML = products.length ? products.map(x=>productCard(x,true)).join('') : empty;
      if (popular) popular.innerHTML = products.length ? products.slice(0,6).map(x=>productCard(x,true)).join('') : empty;
      if (catalog) catalog.innerHTML = products.length ? products.map(x=>productCard(x,false)).join('') : empty;
      window.SPW_APP?.refreshCurrency?.();
      window.dispatchEvent(new CustomEvent('spw:products-loaded',{detail:{products}}));
    } catch (e) {
      const message = '<div class="info-card"><h3>Live marketplace unavailable</h3><p>Please try again shortly.</p></div>';
      if (grid) grid.innerHTML = message; if (popular) popular.innerHTML = message; if (catalog) catalog.innerHTML = message;
      document.getElementById('marketplaceStatus')?.replaceChildren(document.createTextNode(e.message || 'Marketplace unavailable.'));
    }
  }

  document.addEventListener('click', async (event) => {
    const btn = event.target.closest('.free-download[data-product-id]');
    if (!btn) return;
    btn.disabled = true; btn.textContent = 'Preparing…';
    try {
      const r = await fetch(`${API}/api/marketplace/ebooks/${encodeURIComponent(btn.dataset.productId)}/free-download`, { headers: window.SPW_APP.headers() });
      if (!r.ok) { const d=await r.json().catch(()=>({})); throw new Error(d.message || 'Free download failed.'); }
      const blob=await r.blob(); const cd=r.headers.get('content-disposition')||''; const m=cd.match(/filename=\"?([^\";]+)\"?/i);
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=m?.[1]||'SP-WorldTech-Product'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(a.href),1000); btn.textContent='Downloaded';
    } catch (e) { btn.disabled=false; btn.textContent='Download Free'; alert(e.message); }
  });

  async function loadUserStats() {
    try {
      const [purchases, wallet] = await Promise.all([window.SPW_APP.api('/api/marketplace/purchases'), window.SPW_APP.api('/api/wallet/me')]);
      const pc = Array.isArray(purchases.purchases) ? purchases.purchases.length : 0;
      if (walletPurchaseCount) walletPurchaseCount.textContent = pc;
      const usdBalance = Number(wallet.wallet?.usdBalance || 0);
      const p = document.getElementById('userPurchasesCount'); if (p) p.textContent = pc;
      const w = document.getElementById('userWalletBalance'); if (w) w.textContent = usd(usdBalance);
    } catch (_) {}
  }

  async function loadPurchases() {
    try {
      const d = await window.SPW_APP.api('/api/marketplace/purchases');
      const grid = document.getElementById('purchases');
      if (!d.purchases.length) {
        grid.innerHTML = '<div class="info-card"><h3>No purchases yet</h3><p>Visit the Marketplace to buy your first practical e-book.</p><a class="primary" href="./marketplace.html">Browse Marketplace</a></div>';
        return;
      }
      grid.innerHTML = d.purchases.map(p => {
        const amount = Number(p.amount || 0);
        const currency = String(p.currency || 'NGN').toUpperCase();
        const paid = currency === 'USD'
          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
          : new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
        return `<article class="ebook-card info-card"><div class="card-body">
          <span class="eyebrow dark">Purchased</span><h3>${String(p.ebook?.title || 'E-book')}</h3>
          <p>${String(p.ebook?.description || '')}</p><div class="ebook-meta">Paid: ${paid}</div>
          <button class="primary download-btn" data-purchase="${p._id}">Download E-book</button>
        </div></article>`;
      }).join('');
      grid.querySelectorAll('[data-purchase]').forEach(b => b.addEventListener('click', () => download(b.dataset.purchase)));
    } catch (e) {
      document.getElementById('dashStatus').textContent = e.message;
    }
  }

  async function download(id) {
    try {
      const r = await fetch(`${API}/api/marketplace/download/${encodeURIComponent(id)}`, { headers: window.SPW_APP.headers() });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.message || 'Download failed.');
      }
      const blob = await r.blob();
      const contentDisposition = r.headers.get('content-disposition') || '';
      const filenameMatch = contentDisposition.match(/filename=\"?([^\";]+)\"?/i);
      const filename = filenameMatch?.[1]?.trim() || 'SP-WorldTech-Ebook';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      document.getElementById('dashStatus').textContent = e.message;
    }
  }

  document.getElementById('paymentForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const status = document.getElementById('paymentStatus');
    const method = document.getElementById('paymentMethod').value;
    try {
      const body = {
        projectTitle: document.getElementById('projectTitle').value,
        amount: Number(document.getElementById('paymentAmount').value),
        currency: 'USD',
        paymentType: document.getElementById('paymentType').value
      };
      if (!body.projectTitle || !Number.isFinite(body.amount) || body.amount <= 0) throw new Error('Enter a valid service and amount.');

      if (method === 'wallet') {
        status.textContent = 'Checking your wallet balance…';
        const d = await window.SPW_APP.api('/api/client-payments/wallet-pay', { method: 'POST', body: JSON.stringify(body) });
        status.textContent = d.message || 'Payment completed from your wallet.';
        status.className = 'status success';
        await loadWallet();
        return;
      }

      status.textContent = 'Preparing secure Paystack checkout…';
      const d = await window.SPW_APP.api('/api/client-payments/checkout', { method: 'POST', body: JSON.stringify(body) });
      if (d.checkoutUrl) {
        status.textContent = `Opening secure Paystack checkout for $${Number(d.payment?.displayAmount || body.amount).toFixed(2)}.`;
        setTimeout(() => { location.href = d.checkoutUrl; }, 650);
      } else {
        throw new Error('Paystack checkout could not be created.');
      }
    } catch (err) {
      status.textContent = err.message;
      status.className = 'status';
    }
  });

  async function verifyCallback() {
    const ref = new URLSearchParams(location.search).get('reference');
    if (!ref) return;
    try {
      const status = document.getElementById('paymentStatus');
      status.textContent = 'Verifying your Paystack payment…';
      const d = await window.SPW_APP.api('/api/client-payments/verify/' + encodeURIComponent(ref));
      status.textContent = d.message || 'Payment verified successfully.';
      status.className = 'status success';
    } catch (e) {
      document.getElementById('paymentStatus').textContent = e.message;
    }
  }

  const params = new URLSearchParams(location.search);
  if (params.get('service')) document.getElementById('projectTitle').value = params.get('service');
  if (params.get('amount')) document.getElementById('paymentAmount').value = params.get('amount');

  loadWallet();
  loadMarketplace();
  loadPurchases();
  loadUserStats();
  verifyCallback();
})();
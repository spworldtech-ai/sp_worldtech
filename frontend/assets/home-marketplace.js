(() => {
  const API = (window.SPW_APP?.API_BASE || 'https://spworldtech.com').replace(/\/$/, '').replace(/\/api$/i, '');
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(Number(value || 0));
  function productCard(product, index) {
    const cover = product.coverUrl;
    const price = Number(product.priceUsd ?? product.price ?? 0);
    const oldPrice = Number(product.oldPrice ?? 0);
    const priceMarkup = price <= 0
      ? '<span class="product-free">Download Free</span>'
      : `${oldPrice > price ? `<del class="product-old-price">${money(oldPrice)}</del>` : ''}<strong class="product-new-price" data-spw-price-usd="${price}">${money(price)}</strong>`;
    const action = price <= 0
      ? `<a class="primary" href="./marketplace.html?buy=${encodeURIComponent(product.id)}">Download Free</a>`
      : `<a class="primary" href="./marketplace.html?buy=${encodeURIComponent(product.id)}">Buy Now</a>`;
    return `<article class="home-product-card">
      ${cover ? `<img src="${escape(cover)}" alt="${escape(product.title)}" loading="lazy" decoding="async">` : '<div class="home-product-placeholder" aria-hidden="true">SP</div>'}
      <div>
        <span class="eyebrow dark">${escape(product.category || 'Digital Product')}</span>
        <h3>${escape(product.title)}</h3>
        <p>${escape(product.description || '')}</p>
        <div class="home-product-price">${priceMarkup}</div>
        <div class="page-actions">${action}</div>
      </div>
    </article>`;
  }

  async function load() {
    let section = document.getElementById('homeMarketplaceLive');
    if (!section) {
      section = document.createElement('section');
      section.id = 'homeMarketplaceLive';
      section.className = 'content-section home-marketplace-live';
      const main = document.querySelector('main');
      const anchor = document.querySelector('.sp-tech-roll-section');
      if (anchor?.parentNode) anchor.parentNode.insertBefore(section, anchor);
      else if (main) main.appendChild(section);
      else return;
    }

    try {
      const response = await fetch(`${API}/api/marketplace/ebooks`, { cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Marketplace unavailable.');
      const products = Array.isArray(data.ebooks) ? data.ebooks : [];
      const visibleProducts = products.slice(0, 10);
      const signature = JSON.stringify(visibleProducts.map(p => ({
        id: p.id, title: p.title, description: p.description, category: p.category,
        price: p.priceUsd ?? p.price, oldPrice: p.oldPrice, coverUrl: p.coverUrl
      })));
      // Avoid replacing the entire marketplace DOM every 15 seconds when
      // product data has not changed; repeated replacement caused translation
      // and currency formatting to flash back to their source values.
      if (section.dataset.productsSignature === signature) return;
      const cards = visibleProducts.map(productCard).join('');
      section.dataset.productsSignature = signature;
      section.innerHTML = `<div class="container">
        <div class="section-heading">
          <span class="eyebrow">Live Marketplace</span>
          <h2>SP WorldTech Digital Products</h2>
          <p>Products published by the administrator appear here automatically.</p>
        </div>
        ${cards ? `<div class="home-marketplace-grid">${cards}</div>` : `<div class="info-card"><h3>Marketplace products will appear here</h3><p>Once the administrator publishes an e-book, it is loaded automatically from the live marketplace.</p></div>`}
        <div class="page-actions"><a class="primary" href="./marketplace.html">Open Marketplace</a></div>
      </div>`;
      if (window.SPW_APP && typeof window.SPW_APP.refreshCurrency === 'function') window.SPW_APP.refreshCurrency();
      if (window.SPW_APP && typeof window.SPW_APP.refreshLanguage === 'function' && localStorage.getItem('spw_language') && localStorage.getItem('spw_language') !== 'en') window.SPW_APP.refreshLanguage();
    } catch (_) {
      section.innerHTML = `<div class="container"><div class="section-heading"><span class="eyebrow">Live Marketplace</span><h2>SP WorldTech Digital Products</h2></div><div class="info-card"><h3>Marketplace temporarily unavailable</h3><p>Live products could not be loaded. Please try again shortly.</p><a class="primary" href="./marketplace.html">Open Marketplace</a></div></div>`;
    }
  }

  load();
  window.setInterval(load, 15000);
})();

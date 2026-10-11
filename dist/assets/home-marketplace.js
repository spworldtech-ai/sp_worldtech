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
        <div class="spw-rating compact" aria-label="5.0 out of 5 professional quality rating"><span class="spw-stars" aria-hidden="true">★★★★★</span><strong class="spw-rating-score">5.0/5</strong><span class="spw-rating-label">Professional quality</span></div>
        <p>${escape(product.description || 'Practical digital guide from SP WorldTech.')}</p>
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
      const cards = products.slice(0, 10).map(productCard).join('');
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
      section.innerHTML = '';
    }
  }

  load();
  window.setInterval(load, 15000);
})();

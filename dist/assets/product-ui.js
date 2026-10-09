(() => {
  'use strict';
  const safe = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = v => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(v||0));
  const priceMarkup = (item) => {
    const current = Number(item.priceUsd ?? item.price ?? 0);
    const old = Number(item.oldPrice ?? 0);
    if (current <= 0) return '<span class="product-free">Download Free</span>';
    return `<span class="product-price-wrap">${old > current ? `<del class="product-old-price">${money(old)}</del>` : ''}<strong class="product-new-price">${money(current)}</strong></span>`;
  };
  window.SPW_PRODUCT_UI = {safe,money,priceMarkup};
})();

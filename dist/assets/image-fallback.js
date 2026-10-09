(() => {
  'use strict';
  const makeFallback = (alt='SP WorldTech') => {
    const text=String(alt||'SP WorldTech').replace(/\s+/g,' ').trim().slice(0,28);
    const initials=text.split(' ').filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'SP';
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#0868f7"/><stop offset="1" stop-color="#0c1b2e"/></linearGradient></defs><rect width="800" height="500" rx="28" fill="url(#g)"/><circle cx="400" cy="205" r="76" fill="rgba(255,255,255,.12)"/><text x="400" y="230" text-anchor="middle" font-family="Arial,sans-serif" font-size="64" font-weight="800" fill="#fff">${initials}</text><text x="400" y="360" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="700" fill="#fff">${text.replace(/&/g,'&amp;')}</text></svg>`;
    return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
  };
  const fix=img=>{if(!img||img.dataset.spwFallback)return;img.dataset.spwFallback='1';img.src=makeFallback(img.alt||img.title||'SP WorldTech');img.removeAttribute('srcset');};
  document.addEventListener('error',e=>{if(e.target?.tagName==='IMG')fix(e.target)},true);
  window.addEventListener('DOMContentLoaded',()=>document.querySelectorAll('img').forEach(img=>{if(img.complete&&img.naturalWidth===0)fix(img)}));
})();

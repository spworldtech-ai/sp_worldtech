(function(){
  'use strict';
  if(window.__spWnhAdsLoaded)return; window.__spWnhAdsLoaded=true;
  var url='https://worldnethosting.com';
  var path=(location.pathname||'').toLowerCase();
  var existingHero=document.querySelector('.wnh-hero');
  var existingSide=document.querySelector('.wnh-side-ad');
  var existingExplicit=document.querySelector('[data-wnh-ad]');
  var isDashboard=/dashboard|admin|staff|auth|login|pin/.test(path);
  if(isDashboard) document.documentElement.classList.add('spw-dashboard-page');
  if(isDashboard && document.body) document.body.classList.add('spw-dashboard-page');

  function banner(){
    if(existingHero||existingExplicit)return '';
    return '<aside class="wnh-ad-banner" data-wnh-ad aria-label="World Net Hosting advertisement">'+
      '<div class="wnh-ad-copy"><span class="wnh-ad-kicker">WORLD NET HOSTING</span><strong>Get your domain and reliable web hosting.</strong><p>Launch your website with fast hosting, domain registration and digital infrastructure.</p></div>'+
      '<a class="wnh-ad-cta" href="'+url+'" target="_blank" rel="noopener noreferrer">Visit World Net Hosting ↗</a></aside>';
  }
  function footer(){
    if(document.querySelector('.wnh-ad-footer'))return '';
    return '<section class="wnh-ad-footer" aria-label="World Net Hosting promotion"><div><strong>Need a domain or web hosting?</strong><p>World Net Hosting provides domain registration, hosting and related digital infrastructure.</p></div><a href="'+url+'" target="_blank" rel="noopener noreferrer">Explore Hosting ↗</a></section>';
  }
  function floating(){
    if(document.querySelector('.wnh-ad-floating'))return;
    var el=document.createElement('aside');
    el.className='wnh-ad-floating';
    el.setAttribute('aria-label','World Net Hosting advertisement');
    el.innerHTML='<button class="close" type="button" aria-label="Close advertisement">×</button><b>WORLD NET HOSTING</b><span>Domains, hosting and digital infrastructure for your website.</span><a href="'+url+'" target="_blank" rel="noopener noreferrer">Visit World Net Hosting ↗</a>';
    function show(){
      el.classList.remove('is-visible');
      requestAnimationFrame(function(){requestAnimationFrame(function(){el.classList.add('is-visible');});});
    }
    el.querySelector('.close').addEventListener('click',function(){
      el.classList.remove('is-visible');
      window.clearTimeout(el.__reopen);
      el.__reopen=window.setTimeout(show,5000);
    });
    document.body.appendChild(el);
    window.setTimeout(show,1700);
  }
  function insert(){
    var header=document.querySelector('header.site-header');
    var main=document.querySelector('main');
    var target=header||document.body.firstElementChild;
    var b=banner();
    if(b){
      var wrap=document.createElement('div');wrap.innerHTML=b;
      var node=wrap.firstElementChild;
      if(target&&target.parentNode)target.parentNode.insertBefore(node,target.nextSibling);
      else document.body.insertBefore(node,document.body.firstChild);
    }
    if(main&&!existingHero&&!document.querySelector('.wnh-ad-footer')){
      var f=document.createElement('div');f.innerHTML=footer();
      if(f.firstElementChild)main.appendChild(f.firstElementChild);
    }
    floating();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',insert);else insert();
})();

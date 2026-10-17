
document.addEventListener('DOMContentLoaded',()=>{
  const btn=document.getElementById('spwWireframeMenuBtn');
  const menu=document.getElementById('spwWireframeMenu');
  if(btn&&menu){
    btn.addEventListener('click',()=>{
      const open=btn.getAttribute('aria-expanded')==='true';
      btn.setAttribute('aria-expanded',String(!open));
      menu.hidden=open;
      btn.textContent=open?'☰':'×';
    });
  }
  document.querySelectorAll('.spw-search-btn').forEach(b=>b.addEventListener('click',()=>{
    const q=window.prompt('Search SP WorldTech');
    if(q&&q.trim()) window.location.href='./index.html#search='+encodeURIComponent(q.trim());
  }));
});

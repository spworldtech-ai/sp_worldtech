(function(){
  'use strict';
  const app = window.SPW_APP || {};
  const apiBase = String(app.API_BASE || window.location.origin).replace(/\/$/,'');
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase() || 'index.html';
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const stars = (n) => '★★★★★'.split('').map((s,i)=>`<span class="${i < n ? 'is-on' : ''}">${s}</span>`).join('');
  const initials = (name) => String(name||'SP').trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();

  function mount(){
    if(document.getElementById('spwComments')) return;
    const section = document.createElement('section');
    section.id='spwComments'; section.className='spw-comments-section';
    section.innerHTML=`<div class="spw-comments-shell">
      <div class="spw-comments-head"><div><div class="spw-comments-eyebrow">Community feedback</div><h2>What visitors are saying</h2><p>Share your experience, question or feedback. You can comment without creating an account.</p></div></div>
      <div class="spw-comments-grid">
        <form class="spw-comment-form" id="spwCommentForm">
          <h3>Leave a comment</h3><small>Your feedback helps us improve the SP WorldTech experience.</small>
          <div class="spw-comment-fields">
            <input id="spwCommentName" name="name" maxlength="80" placeholder="Your name" required>
            <input id="spwCommentLocation" name="location" maxlength="100" placeholder="City / Country (optional)">
            <div><small>Rating</small><div class="spw-comment-stars" id="spwCommentStars" role="radiogroup" aria-label="Choose rating"></div></div>
            <textarea id="spwCommentMessage" name="message" maxlength="700" placeholder="Write your comment..." required></textarea>
            <button class="spw-comment-submit" type="submit">Post Comment</button>
            <div class="spw-comment-status" id="spwCommentStatus" aria-live="polite"></div>
          </div>
        </form>
        <div><div class="spw-comment-list" id="spwCommentList"><div class="spw-comment-empty">Loading community comments…</div></div></div>
      </div>
    </div>`;
    const footer = document.querySelector('footer');
    if(footer && footer.parentNode) footer.parentNode.insertBefore(section, footer); else document.body.appendChild(section);
    let selected=5;
    const starBox=document.getElementById('spwCommentStars');
    starBox.innerHTML=[1,2,3,4,5].map(i=>`<button type="button" class="spw-comment-star is-selected" data-rating="${i}" aria-label="${i} star">★</button>`).join('');
    const paint=()=>starBox.querySelectorAll('.spw-comment-star').forEach(b=>b.classList.toggle('is-selected',Number(b.dataset.rating)<=selected));
    starBox.addEventListener('click',e=>{const b=e.target.closest('.spw-comment-star');if(!b)return;selected=Number(b.dataset.rating);paint();});
    load();
    document.getElementById('spwCommentForm').addEventListener('submit',submit);
  }
  async function load(){
    const list=document.getElementById('spwCommentList');
    try{
      const r=await fetch(`${apiBase}/api/comments?page=${encodeURIComponent(page)}`,{headers:{Accept:'application/json'}});
      const d=await r.json(); if(!r.ok) throw new Error(d.message||'Unable to load comments.');
      list.innerHTML=(d.comments||[]).map(c=>`<article class="spw-comment-card"><div class="spw-comment-top"><div class="spw-comment-author"><div class="spw-comment-avatar">${esc(initials(c.name))}</div><div><div class="spw-comment-name">${esc(c.name)}</div><div class="spw-comment-location">${esc(c.location||'Visitor')}${c.role?` • ${esc(c.role)}`:''}</div></div></div><div class="spw-comment-rating" aria-label="${c.rating} out of 5">${stars(Number(c.rating||5))}</div></div><p class="spw-comment-message">${esc(c.message)}</p><span class="spw-comment-label">Community feedback</span></article>`).join('') || '<div class="spw-comment-empty">Be the first to share feedback on this page.</div>';
    }catch(e){list.innerHTML='<div class="spw-comment-empty">Comments will appear when the platform API is available.</div>';}
  }
  async function submit(e){
    e.preventDefault(); const status=document.getElementById('spwCommentStatus'), button=e.currentTarget.querySelector('button[type=submit]');
    const body={page,name:document.getElementById('spwCommentName').value.trim(),location:document.getElementById('spwCommentLocation').value.trim(),message:document.getElementById('spwCommentMessage').value.trim(),rating:Number(document.querySelector('.spw-comment-star.is-selected:last-child')?.dataset.rating||5)};
    if(body.rating<1) body.rating=5;
    button.disabled=true; status.className='spw-comment-status'; status.textContent='Publishing…';
    try{
      const r=await fetch(`${apiBase}/api/comments`,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body)}); const d=await r.json(); if(!r.ok) throw new Error(d.message||'Unable to publish comment.');
      status.className='spw-comment-status success'; status.textContent='Your comment has been published.'; e.currentTarget.reset(); document.getElementById('spwCommentStars').querySelectorAll('.spw-comment-star').forEach(b=>b.classList.add('is-selected')); await load();
    }catch(err){status.className='spw-comment-status error';status.textContent=err.message||'Unable to publish comment.';} finally{button.disabled=false;}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount); else mount();
})();

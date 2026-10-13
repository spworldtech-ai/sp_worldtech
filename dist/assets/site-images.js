(() => {
  'use strict';
  const manifest = {"home":[{"url":"https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=82","title":"Artificial Intelligence"},{"url":"https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=82","title":"Software Engineering"},{"url":"https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=82","title":"Cloud Computing"},{"url":"https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=82","title":"Cybersecurity"},{"url":"https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=82","title":"Web Development"},{"url":"https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=82","title":"Mobile Technology"},{"url":"https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=82","title":"Data Science"},{"url":"https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=82","title":"Digital Infrastructure"},{"url":"https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=82","title":"APIs & Integrations"},{"url":"https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=82","title":"Machine Learning"},{"url":"https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=82","title":"Automation"},{"url":"https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=82","title":"Database Systems"},{"url":"https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=82","title":"FinTech"},{"url":"https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=82","title":"Payment Technology"},{"url":"https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=82","title":"Networking"},{"url":"https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=82","title":"Enterprise Technology"},{"url":"https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=82","title":"Robotics"},{"url":"https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=82","title":"Digital Transformation"},{"url":"https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=82","title":"Future Technology"},{"url":"https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=82","title":"DevOps & Deployment"}],"about":[{"url":"https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=82","title":"Analytics Dashboard"},{"url":"https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=82","title":"Modern Office"},{"url":"https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=82","title":"Product Design"},{"url":"https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1200&q=82","title":"Team Collaboration"},{"url":"https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=82","title":"Startup Strategy"}],"admin":[{"url":"https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=82","title":"Project Management"},{"url":"https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=82","title":"Creative Workspace"}],"businesses":[{"url":"https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=82","title":"Digital Product"},{"url":"https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=82","title":"Business Growth"},{"url":"https://images.unsplash.com/photo-1523966211575-eb4a01e7dd51?auto=format&fit=crop&w=1200&q=82","title":"Technology Education"},{"url":"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=82","title":"Cloud Architecture"}],"contact":[{"url":"https://images.unsplash.com/photo-1521790366324-3e4f99f6b7f8?auto=format&fit=crop&w=1200&q=82","title":"Secure Systems"},{"url":"https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=82","title":"Data Analytics"}],"dashboard":[{"url":"https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=82","title":"Programming Workspace"},{"url":"https://images.unsplash.com/photo-1529778873920-4da4926a72c2?auto=format&fit=crop&w=1200&q=82","title":"Developer Tools"},{"url":"https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=82","title":"AI Research"},{"url":"https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=1200&q=82","title":"Cybersecurity Operations"},{"url":"https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1200&q=82","title":"Network Engineering"}],"join-free":[{"url":"https://images.unsplash.com/photo-1504386106331-3e4e71712b38?auto=format&fit=crop&w=1200&q=82","title":"Product Development"},{"url":"https://images.unsplash.com/photo-1522228115018-d838a7e1f8a7?auto=format&fit=crop&w=1200&q=82","title":"Software Testing"},{"url":"https://images.unsplash.com/photo-1505238680356-4b9da50a0a8b?auto=format&fit=crop&w=1200&q=82","title":"Innovation Lab"}],"marketplace":[{"url":"https://images.unsplash.com/photo-1531973576167-7125cd663d10?auto=format&fit=crop&w=1200&q=82","title":"Digital Strategy"},{"url":"https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=82","title":"Technology Consulting"},{"url":"https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=82","title":"Customer Support"},{"url":"https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1200&q=82","title":"Remote Work"},{"url":"https://images.unsplash.com/photo-1528909514045-4a42a436b60b?auto=format&fit=crop&w=1200&q=82","title":"Leadership"},{"url":"https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=82","title":"Business Operations"}],"pricing":[{"url":"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=82","title":"Cloud Infrastructure"},{"url":"https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=82","title":"Financial Technology"},{"url":"https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=82","title":"Online Learning"},{"url":"https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=82","title":"Professional Services"},{"url":"https://images.unsplash.com/photo-1522071820081-009f0129c71d?auto=format&fit=crop&w=1200&q=82","title":"Ecommerce Technology"}],"privacy-policy":[{"url":"https://images.unsplash.com/photo-1490150028299-bf57d78394e0?auto=format&fit=crop&w=1200&q=82","title":"API Architecture"},{"url":"https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1200&q=82","title":"Web Design"}],"projects":[{"url":"https://images.unsplash.com/photo-1456439663599-95b042d50252?auto=format&fit=crop&w=1200&q=82","title":"UX Research"},{"url":"https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=82","title":"Engineering Team"},{"url":"https://images.unsplash.com/photo-1554078875-e37cb8b0e27d?auto=format&fit=crop&w=1200&q=82","title":"Data Center"},{"url":"https://images.unsplash.com/photo-1559209172-0ff8f6d49ff7?auto=format&fit=crop&w=1200&q=82","title":"Automation Workflow"},{"url":"https://images.unsplash.com/photo-1547191783-94d5f8f6d8b1?auto=format&fit=crop&w=1200&q=82","title":"Digital Marketing"}],"reviews":[{"url":"https://images.unsplash.com/photo-1520903074185-8eca362b3dce?auto=format&fit=crop&w=1200&q=82","title":"Business Intelligence"},{"url":"https://images.unsplash.com/photo-1520640023173-50a135e35804?auto=format&fit=crop&w=1200&q=82","title":"System Architecture"},{"url":"https://images.unsplash.com/photo-1533371452382-d45a9da51ad9?auto=format&fit=crop&w=1200&q=82","title":"Code Review"},{"url":"https://images.unsplash.com/photo-1517331156700-3c241d2b4d83?auto=format&fit=crop&w=1200&q=82","title":"Deployment Pipeline"}],"services":[{"url":"https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1200&q=82","title":"Technology Training"},{"url":"https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=82","title":"Client Solutions"},{"url":"https://images.unsplash.com/photo-1499002238440-d264edd596ec?auto=format&fit=crop&w=1200&q=82","title":"Product Analytics"},{"url":"https://images.unsplash.com/photo-1475113548554-5a36f1f523d6?auto=format&fit=crop&w=1200&q=82","title":"Startup Workspace"},{"url":"https://images.unsplash.com/photo-1529778873920-4da4926a72c2?auto=format&fit=crop&w=1200&q=82","title":"Modern Computing"},{"url":"https://images.unsplash.com/photo-1557800636-894a64c1696f?auto=format&fit=crop&w=1200&q=82","title":"Technical Support"}],"terms-and-conditions":[{"url":"https://images.unsplash.com/photo-1604076850742-4c7221f3101b?auto=format&fit=crop&w=1200&q=82","title":"Digital Services"},{"url":"https://images.unsplash.com/photo-1591871937573-74dbba515c4c?auto=format&fit=crop&w=1200&q=82","title":"Software Delivery"},{"url":"https://images.unsplash.com/photo-1544006659-f0b21884ce1d?auto=format&fit=crop&w=1200&q=82","title":"Technology Roadmap"}]};

  const page = (location.pathname.split('/').pop() || 'index').replace(/\.html$/i, '') || 'index';

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  const uniquePool = (() => {
    const out = [];
    const seen = new Set();
    Object.values(manifest).flat().forEach(item => {
      if (!item || !item.url || seen.has(item.url)) return;
      seen.add(item.url);
      out.push(item);
    });
    return out;
  })();

  function installImageFallbacks(root = document) {
    root.querySelectorAll('img').forEach(img => {
      if (img.dataset.spwFallbackBound) return;
      img.dataset.spwFallbackBound = '1';
      img.addEventListener('error', () => {
        if (img.dataset.spwFallbackUsed) return;
        img.dataset.spwFallbackUsed = '1';
        img.src = './images/hero-1.png';
      }, { once: true });
    });
  }

  function card(item) {
    return `<a class="spw-roll-card" href="#" aria-label="${esc(item.title)}">
      <img src="${esc(item.url)}" alt="${esc(item.title)}" loading="lazy" decoding="async">
      <span class="spw-roll-label">${esc(item.title)}</span>
    </a>`;
  }

  function makeTrack(items, direction) {
    const track = document.createElement('div');
    track.className = 'spw-roll-track';
    track.dataset.direction = direction;
    track.innerHTML = items.map(card).join('') + items.map(card).join('');
    return track;
  }

  function makeRow(items, direction) {
    const viewport = document.createElement('div');
    viewport.className = 'spw-roll-viewport';
    viewport.appendChild(makeTrack(items, direction));
    return viewport;
  }

  function addRollingGallery(pageItems) {
    if (document.getElementById('spwPageImageGallery')) return;
    const main = document.querySelector('main');
    if (!main) return;

    const selected = [];
    const seen = new Set();
    [...(pageItems || []), ...uniquePool].forEach(item => {
      if (!item || !item.url || seen.has(item.url)) return;
      seen.add(item.url);
      selected.push(item);
    });

    const items = selected.slice(0, 8);
    if (items.length < 8) return;

    const section = document.createElement('section');
    section.id = 'spwPageImageGallery';
    section.className = 'content-section sp-rolling-gallery-section';
    section.innerHTML = `
      <div class="container">
        <div class="spw-rolling-gallery-heading">
          <span class="eyebrow">Visual Showcase</span>
          <h2>SP WorldTech Technology Gallery</h2>
          <p class="section-lead">Professional technology visuals selected for this page.</p>
        </div>
      </div>
    `;

    const container = section.querySelector('.container');
    container.appendChild(makeRow(items.slice(0, 4), 'left'));
    container.appendChild(makeRow(items.slice(4, 8), 'right'));
    main.appendChild(section);

    installImageFallbacks(section);
    startRollingRows(section);
  }

  function upgradeHome() {
    const sections = [...document.querySelectorAll('.sp-tech-roll-section')];
    if (!sections.length) return;

    let cursor = 0;

    sections.forEach(section => {
      const oldViewport = section.querySelector('.sp-tech-roll-viewport');
      if (!oldViewport) return;

      const direction = section.dataset.direction === 'right' ? 'right' : 'left';
      const selected = [];

      while (selected.length < 8 && cursor < uniquePool.length) {
        selected.push(uniquePool[cursor++]);
      }

      if (selected.length < 8) return;

      const wrapper = document.createDocumentFragment();
      wrapper.appendChild(makeRow(selected.slice(0, 4), direction));
      wrapper.appendChild(makeRow(selected.slice(4, 8), direction === 'left' ? 'right' : 'left'));
      oldViewport.replaceWith(wrapper);
    });

    installImageFallbacks(document);
    startRollingRows(document);
  }

  function startRollingRows(root) {
    root.querySelectorAll('.spw-roll-track').forEach(track => {
      if (track.dataset.started) return;
      track.dataset.started = '1';

      let x = track.dataset.direction === 'right' ? -50 : 0;
      const direction = track.dataset.direction === 'right' ? 1 : -1;
      const speed = 0.0035;
      let last = performance.now();
      let paused = false;

      const viewport = track.closest('.spw-roll-viewport');
      viewport?.addEventListener('mouseenter', () => paused = true);
      viewport?.addEventListener('mouseleave', () => paused = false);
      viewport?.addEventListener('touchstart', () => paused = true, { passive: true });
      viewport?.addEventListener('touchend', () => setTimeout(() => paused = false, 700), { passive: true });

      function frame(now) {
        const dt = Math.min(now - last, 40);
        last = now;
        if (!paused) {
          x += direction * speed * dt;
          if (direction < 0 && x <= -50) x = 0;
          if (direction > 0 && x >= 0) x = -50;
          track.style.transform = `translate3d(${x}%,0,0)`;
        }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }

  function start() {
    if (page === 'index') upgradeHome();
    else addRollingGallery(manifest[page] || []);
    installImageFallbacks(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();

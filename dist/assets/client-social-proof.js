(() => {
  'use strict';
  if (document.body?.dataset?.socialProof === 'off') return;
  if (document.getElementById('spwClientProof')) return;

  // Rotating community-feedback presentation profiles.
  const first = ['Michael','Daniel','James','William','Thomas','Oliver','George','Henry','Edward','Jack','Charles','Alexander','Harry','Benjamin','Samuel','Joseph','David','Matthew','Lucas','Theodore','Arthur','Leo','Oscar','Finn','Ethan','Jacob','Noah','Liam','Mason','Logan','Sebastian','Dylan','Nathan','Isaac','Samuel','Julian','Gabriel','Owen','Wyatt','Caleb','Ryan','Connor','Luke','Adam','Elliot','Max','Louis','Theo','Hugo'];
  const last = ['Miller','Johnson','Williams','Brown','Davis','Wilson','Anderson','Taylor','Thomas','Moore','Martin','Jackson','Thompson','White','Harris','Clark','Lewis','Walker','Hall','Young','Allen','King','Wright','Scott','Green','Baker','Adams','Nelson','Hill','Campbell','Mitchell','Roberts','Carter','Phillips','Evans','Turner','Parker','Collins','Edwards','Stewart','Sanchez','Morris','Rogers','Reed','Cook','Morgan','Bell','Murphy','Bailey'];
  const places = [
    'London, United Kingdom','Manchester, United Kingdom','Birmingham, United Kingdom','Edinburgh, United Kingdom','Bristol, United Kingdom',
    'New York, United States','California, United States','Texas, United States','Florida, United States','Washington, United States',
    'Toronto, Canada','Vancouver, Canada','Montreal, Canada','Berlin, Germany','Munich, Germany','Hamburg, Germany',
    'Paris, France','Amsterdam, Netherlands','Dublin, Ireland','Brussels, Belgium','Zurich, Switzerland','Vienna, Austria',
    'Copenhagen, Denmark','Stockholm, Sweden','Oslo, Norway','Helsinki, Finland','Madrid, Spain','Barcelona, Spain',
    'Lisbon, Portugal','Milan, Italy','Rome, Italy','Warsaw, Poland','Prague, Czech Republic','Sydney, Australia',
    'Melbourne, Australia','Auckland, New Zealand','Dubai, United Arab Emirates','Abu Dhabi, United Arab Emirates','Singapore','Cape Town, South Africa'
  ];
  const quotes = [
    'Professional presentation and a smooth digital experience.',
    'The platform feels clear, modern and easy to use.',
    'A strong technology experience with excellent attention to detail.',
    'The service presentation feels polished and business-ready.',
    'A clean international platform with a professional customer journey.',
    'The interface is fast, organized and easy to understand.',
    'The technology services are presented in a clear and professional way.',
    'A modern experience that makes it easy to explore services and products.'
  ];
  const items = Array.from({length: 200}, (_, i) => {
    const name = `${first[i % first.length]} ${last[Math.floor(i / first.length) % last.length]}`;
    const location = places[i % places.length];
    const initials = name.split(' ').map(x => x[0]).join('').slice(0,2);
    return { name, location, initials, quote: quotes[i % quotes.length] };
  });

  let index = Math.floor(Math.random() * items.length);
  let cycleTimer = null;
  let reopenTimer = null;
  const root = document.createElement('div');
  root.id = 'spwClientProof';
  root.className = 'spw-client-proof';
  root.setAttribute('aria-live','polite');
  root.setAttribute('aria-label','Client feedback showcase');
  document.body.appendChild(root);

  function scheduleNext(delay = 8500) {
    clearTimeout(cycleTimer);
    cycleTimer = setTimeout(() => {
      index = (index + 1) % items.length;
      render(items[index]);
    }, delay);
  }

  function scheduleReopen() {
    clearTimeout(reopenTimer);
    reopenTimer = setTimeout(() => {
      index = (index + 1) % items.length;
      render(items[index]);
    }, 5000);
  }

  function render(item) {
    root.innerHTML = `<div class="spw-client-proof-card">
      <div class="spw-client-avatar" aria-hidden="true">${item.initials}</div>
      <div class="spw-client-meta">
        <div class="eyebrow">Community feedback</div>
        <div class="spw-client-name">${item.name}<span class="spw-client-location">• ${item.location}</span></div>
        <div class="spw-client-stars" aria-label="5 out of 5 stars">★★★★★ <strong>5.0/5</strong></div>
        <p class="spw-client-quote">“${item.quote}”</p>
        <div class="spw-client-note">Community feedback • international showcase</div>
        <div class="spw-client-progress"></div>
      </div>
      <button class="spw-client-close" type="button" aria-label="Close client feedback">×</button>
    </div>`;
    root.querySelector('.spw-client-close')?.addEventListener('click', () => {
      root.classList.remove('is-visible');
      clearTimeout(cycleTimer);
      scheduleReopen();
    });
    requestAnimationFrame(() => root.classList.add('is-visible'));
    scheduleNext(8500);
  }

  setTimeout(() => render(items[index]), 1600);
})();

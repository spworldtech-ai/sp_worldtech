(() => {
  'use strict';

  function initFooter() {
    const existing = document.querySelectorAll('footer');
    existing.forEach(node => node.remove());
    if (document.getElementById('spw-footer')) return;

    const footer = document.createElement('div');
    footer.innerHTML = FOOTER_HTML;
    const footerNode = footer.querySelector('#spw-footer');
    if (!footerNode) return;
    document.body.appendChild(footerNode);
    const floatingTopButton = footer.querySelector('#spwFooterTopButton');
    if (floatingTopButton && floatingTopButton.parentElement !== document.body) document.body.appendChild(floatingTopButton);

    const topButton = document.getElementById('spwFooterTopButton');
    const updateTopButton = () => topButton?.classList.toggle('visible', window.scrollY > 500);
    window.addEventListener('scroll', updateTopButton, { passive: true });
    topButton?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    updateTopButton();
    const year = document.getElementById('year');
    if (year) year.textContent = String(new Date().getFullYear());

    // Convert every password/PIN control to a compact real eye button.
    document.querySelectorAll('[data-toggle-password], [data-pin-toggle]').forEach(button => {
      const targetId = button.getAttribute('data-toggle-password') || button.getAttribute('data-pin-toggle');
      const input = targetId ? document.getElementById(targetId) : button.closest('.password-field-wrap')?.querySelector('input');
      const isPin = Boolean(input && (input.inputMode === 'numeric' || String(input.name || '').toLowerCase().includes('pin')));
      if (window.SPW_APP?.setPasswordToggleState) window.SPW_APP.setPasswordToggleState(button, input?.type === 'text', isPin);
    });
  }

  const FOOTER_HTML = `<footer class="spw-footer-shell" id="spw-footer">
<section class="spw-footer-tech-section">
<div class="spw-footer-container">
<div class="spw-footer-eyebrow">Trusted Technology Partners</div>
<h2>Built with the World's <span class="spw-footer-gradient-text">Leading Technologies</span></h2>
<p class="spw-footer-tech-subtitle">Reliable. Scalable. Secure. Powering a better digital future.</p>
<div class="spw-footer-tech-grid">
<!-- Every technology logo is a real clickable link to the company's official website. -->
<a class="spw-footer-tech-card" href="https://www.microsoft.com/" rel="noopener noreferrer" target="_blank">
<div class="spw-footer-logo-box"><img alt="Microsoft logo" src="./assets/footer-logos/microsoft.svg" loading="lazy" decoding="async"></div>
<div><h3>Microsoft</h3><p>Cloud. AI. Productivity.</p><span class="spw-footer-brand-link">microsoft.com ↗</span></div>
</a>
<a class="spw-footer-tech-card" href="https://azure.microsoft.com/" rel="noopener noreferrer" target="_blank">
<div class="spw-footer-logo-box"><img alt="Microsoft Azure logo" src="./assets/footer-logos/azure.svg" loading="lazy" decoding="async"></div>
<div><h3>Azure</h3><p>Cloud Infrastructure.</p><span class="spw-footer-brand-link">azure.microsoft.com ↗</span></div>
</a>
<a class="spw-footer-tech-card" href="https://www.digitalocean.com/" rel="noopener noreferrer" target="_blank">
<div class="spw-footer-logo-box"><img alt="DigitalOcean logo" src="./assets/footer-logos/digitalocean.svg" loading="lazy" decoding="async"></div>
<div><h3>DigitalOcean</h3><p>Simple. Scalable. Cloud.</p><span class="spw-footer-brand-link">digitalocean.com ↗</span></div>
</a>
<a class="spw-footer-tech-card" href="https://www.mongodb.com/" rel="noopener noreferrer" target="_blank">
<div class="spw-footer-logo-box"><img alt="MongoDB logo" src="./assets/footer-logos/mongodb.svg" loading="lazy" decoding="async"></div>
<div><h3>MongoDB</h3><p>Modern Data Platform.</p><span class="spw-footer-brand-link">mongodb.com ↗</span></div>
</a>
<a class="spw-footer-tech-card" href="https://vercel.com/" rel="noopener noreferrer" target="_blank">
<div class="spw-footer-logo-box"><img alt="Vercel logo" src="./assets/footer-logos/vercel.svg" loading="lazy" decoding="async"></div>
<div><h3>Vercel</h3><p>Deploy. Scale. Build Faster.</p><span class="spw-footer-brand-link">vercel.com ↗</span></div>
</a>
<a class="spw-footer-tech-card" href="https://render.com/" rel="noopener noreferrer" target="_blank">
<div class="spw-footer-logo-box"><img alt="Render logo" src="./assets/footer-logos/render.svg" loading="lazy" decoding="async"></div>
<div><h3>Render</h3><p>Modern Cloud Platform.</p><span class="spw-footer-brand-link">render.com ↗</span></div>
</a>
<a class="spw-footer-tech-card" href="https://github.com/" rel="noopener noreferrer" target="_blank">
<div class="spw-footer-logo-box"><img alt="GitHub logo" src="./assets/footer-logos/github.svg" loading="lazy" decoding="async"></div>
<div><h3>GitHub</h3><p>Code. Collaborate. Innovate.</p><span class="spw-footer-brand-link">github.com ↗</span></div>
</a>
<a class="spw-footer-tech-card" href="https://code.visualstudio.com/" rel="noopener noreferrer" target="_blank">
<div class="spw-footer-logo-box"><img alt="Visual Studio Code logo" src="./assets/footer-logos/vscode.svg" loading="lazy" decoding="async"></div>
<div><h3>Visual Studio Code</h3><p>Code Smarter. Build More.</p><span class="spw-footer-brand-link">code.visualstudio.com ↗</span></div>
</a>
</div>
</div>
</section>
<section class="spw-footer-social-section">
<div class="spw-footer-container spw-footer-social-inner">
<div class="spw-footer-social-copy">
<div class="spw-footer-eyebrow">Stay Connected Worldwide</div>
<h2>Follow <span class="spw-footer-gradient-text">SP WorldTech</span></h2>
<p>Get the latest updates, technology insights, opportunities, and innovations from SP WorldTech.</p>
</div>
<div class="spw-footer-social-grid">
<a class="spw-footer-social-card" href="https://www.facebook.com/" rel="noopener noreferrer" target="_blank">
<img alt="Facebook logo" src="./assets/footer-logos/facebook.svg" loading="lazy" decoding="async">
<strong>Facebook</strong><span>Like &amp; Follow</span>
</a>
<a class="spw-footer-social-card" href="https://www.instagram.com/" rel="noopener noreferrer" target="_blank">
<img alt="Instagram logo" src="./assets/footer-logos/instagram.svg" loading="lazy" decoding="async">
<strong>Instagram</strong><span>See Our Updates</span>
</a>
<a class="spw-footer-social-card" href="https://x.com/" rel="noopener noreferrer" target="_blank">
<img alt="X logo" src="./assets/footer-logos/x.svg" loading="lazy" decoding="async">
<strong>Twitter / X</strong><span>Join the Conversation</span>
</a>
<a class="spw-footer-social-card" href="https://www.linkedin.com/" rel="noopener noreferrer" target="_blank">
<img alt="LinkedIn logo" src="./assets/footer-logos/linkedin.svg" loading="lazy" decoding="async">
<strong>LinkedIn</strong><span>Connect Professionally</span>
</a>
</div>
</div>
</section>
<section class="spw-footer-main">
<div class="spw-footer-container spw-footer-grid">
<div class="spw-footer-brand-area">
<div class="spw-footer-brand-row">
<img alt="SPWT logo" class="spw-footer-logo" src="./assets/logo.jpeg" loading="lazy" decoding="async"/>
<div>
<div class="spw-footer-brand-name">SP <span>WorldTech</span></div>
<div class="spw-footer-brand-tag">International Digital Solutions</div>
</div>
</div>
<p class="spw-footer-brand-description">
          Software engineering, AI solutions, digital infrastructure, technology education,
          and professional digital services for modern businesses and global clients.
        </p>
<div class="spw-footer-motto">
<span>Innovate</span><i></i><span>Build</span><i></i><span>Host</span><i></i><span>Empower</span>
</div>
</div>
<div class="spw-footer-column">
<h3>Company</h3>
<a href="https://spworldtech.com/">About Us</a>
<a href="https://spworldtech.com/">Our Services</a>
<a href="https://spworldtech.com/">Projects</a>
<a href="https://spworldtech.com/">Pricing</a>
<a href="https://spworldtech.com/">Careers</a>
<a href="https://spworldtech.com/">News &amp; Updates</a>
</div>
<div class="spw-footer-column">
<h3>Platform &amp; Business</h3>
<a href="https://spworldtech.com/">World Net Hosting</a>
<a href="https://spworldtech.com/">Domain Services</a>
<a href="https://spworldtech.com/">Website Development</a>
<a href="https://spworldtech.com/">Marketplace</a>
<a href="https://spworldtech.com/">Technology Academy</a>
<a href="https://spworldtech.com/">API Services</a>
</div>
<div class="spw-footer-column">
<h3>Resources &amp; Support</h3>
<a href="https://spworldtech.com/">Contact Us</a>
<a href="https://spworldtech.com/">Help Center</a>
<a href="https://spworldtech.com/">Documentation</a>
<a href="https://spworldtech.com/">Blog &amp; Insights</a>
<a href="https://spworldtech.com/">Student Resources</a>
<a href="https://spworldtech.com/">Support</a>
</div>
<div class="spw-footer-column">
<h3>Legal</h3>
<a href="https://spworldtech.com/">Privacy Policy</a>
<a href="https://spworldtech.com/">Terms &amp; Conditions</a>
<a href="https://spworldtech.com/">Refund Policy</a>
<a href="https://spworldtech.com/">Cookie Policy</a>
<a href="https://spworldtech.com/">Sitemap</a>
</div>
</div>
</section>
<div class="spw-footer-bottom-bar">
<div class="spw-footer-container spw-footer-bottom-inner">
<div class="spw-footer-copyright">
        © <span id="year"></span> SP WorldTech International Digital Solutions. All rights reserved.
      </div>
<div class="spw-footer-trust-row">
<span class="spw-footer-trust-item"><span class="spw-footer-trust-dot"></span>A Global Technology Brand</span>
<span class="spw-footer-trust-item"><span class="spw-footer-trust-dot"></span>Secure</span>
<span class="spw-footer-trust-item"><span class="spw-footer-trust-dot"></span>Reliable</span>
<span class="spw-footer-trust-item"><span class="spw-footer-trust-dot"></span>Trusted Worldwide</span>
</div>
</div>
</div>
</footer>
<button class="spw-footer-top-button" id="spwFooterTopButton" type="button" aria-label="Back to top" title="Back to top">↑</button>`;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initFooter);
  else initFooter();
})();

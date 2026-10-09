from pathlib import Path
import re
root=Path('/mnt/data/sp_nav_update')

def nav_block(prefix='./'):
    return f'''<nav class="spw-desktop-nav" aria-label="Primary navigation">
      <a class="spw-nav-home" href="{prefix}index.html"><span class="spw-ico">⌂</span><span>Home</span></a>
      <a href="{prefix}services.html"><span class="spw-ico">⚙</span><span>Services</span></a>
      <a href="{prefix}businesses.html"><span class="spw-ico">▥</span><span>Our Businesses</span></a>
      <a href="{prefix}projects.html"><span class="spw-ico">□</span><span>Projects</span></a>
      <a href="{prefix}pricing.html"><span class="spw-ico">◇</span><span>Pricing</span></a>
      <a href="{prefix}marketplace.html"><span class="spw-ico">🛒</span><span>Marketplace</span></a>
      <a href="{prefix}academy.html"><span class="spw-ico">◇</span><span>Academy</span></a>
      <a href="{prefix}about.html"><span class="spw-ico">ⓘ</span><span>About</span></a>
      <a href="{prefix}privacy-policy.html"><span class="spw-ico">♢</span><span>Privacy</span></a>
      <a href="{prefix}terms-and-conditions.html"><span class="spw-ico">▤</span><span>Terms</span></a>
      <a href="{prefix}contact.html"><span class="spw-ico">⌕</span><span>Contact</span></a>
      <a class="spw-join-btn" href="{prefix}auth.html"><span>♙+</span> Join Free</a>
    </nav>'''

def mobile_block(prefix='./'):
    return f'''<div class="spw-mobile-menu" id="spwWireframeMenu" hidden>
    <a href="{prefix}index.html">Home</a><a href="{prefix}services.html">Services</a><a href="{prefix}businesses.html">Our Businesses</a>
    <a href="{prefix}projects.html">Projects</a><a href="{prefix}pricing.html">Pricing</a><a href="{prefix}marketplace.html">Marketplace</a>
    <a href="{prefix}academy.html">Academy</a><a href="{prefix}about.html">About</a><a href="{prefix}privacy-policy.html">Privacy</a>
    <a href="{prefix}terms-and-conditions.html">Terms</a><a href="{prefix}contact.html">Contact</a><a class="mobile-join" href="{prefix}auth.html">Join Free</a>
  </div>'''

for base in [root/'frontend', root/'dist']:
    for p in base.glob('*.html'):
        s=p.read_text(encoding='utf-8', errors='ignore')
        old=s
        # All current pages use relative ./ links; preserve the single shared header structure.
        s=re.sub(r'<nav class="spw-desktop-nav" aria-label="Primary navigation">.*?</nav>', nav_block('./'), s, count=1, flags=re.S)
        s=re.sub(r'<div class="spw-mobile-menu" id="spwWireframeMenu" hidden>.*?</div>', mobile_block('./'), s, count=1, flags=re.S)
        if s!=old:
            p.write_text(s, encoding='utf-8')

# Make sure the navigation CSS doesn't reserve space for the removed search control.
css=root/'frontend/assets/wireframe-header.css'
if css.exists():
    c=css.read_text(encoding='utf-8', errors='ignore')
    # Do not delete generic search styling because other page search widgets may use it;
    # only hide the obsolete header search class if any stale markup survives.
    c += '\n/* 2026-10-07 owner navigation cleanup: no standalone header search button. */\n.spw-desktop-nav > .spw-search-btn{display:none!important;}\n'
    css.write_text(c, encoding='utf-8')
    dcss=root/'dist/assets/wireframe-header.css'
    if dcss.exists(): dcss.write_text(c, encoding='utf-8')

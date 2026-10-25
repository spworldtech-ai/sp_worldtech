# SP WorldTech robot hero and voice behavior fix — 2026-10-18

- Made hero injection idempotent: a second initialization no longer selects a later hero and creates a duplicate robot band.
- The shared hero component continues to use the supplied `spwt-robot.png` asset and keeps existing hero content in place.
- Homepage: attempts one spoken welcome on page load (subject to browser autoplay policy).
- Other pages and dashboards: start with voice disabled; answers are spoken only after the visitor explicitly clicks the Speak replies control.
- Voice preference is not carried from the homepage to other pages.
- Updated the frontend and `dist` copies together.

Validation performed: Node syntax check, source/dist asset equality, HTML script coverage, and ZIP integrity. Full browser-based testing is still required before production sign-off.

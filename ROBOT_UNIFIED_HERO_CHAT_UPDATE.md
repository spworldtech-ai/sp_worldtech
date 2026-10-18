# SP WorldTech Unified Robot Hero & Chat Update

## Included
- Shared robot hero component across frontend pages and matching `dist` pages.
- Page-specific hero heading, description and eligible primary links are reused in the unified robot hero; original hero background visuals are retained.
- Supplied SPWT robot artwork is kept and its edge-connected navy background is made transparent for better blending with hero backgrounds.
- CSS character motion includes body bob/sway, blinking overlay, mouth movement while browser speech is active, and arm gesture overlays while speaking.
- Green `Speak replies ON` / neutral `Speak replies OFF` control in the robot assistant.
- Homepage attempts a single spoken welcome; other pages begin with voice disabled and require the user to enable it.
- Removed legacy customer-facing live-chat widget stylesheet/script references from frontend and `dist` HTML pages so the robot assistant is the visible chat entry point.

## Important limits
- Character movement is a browser CSS animation over the supplied artwork, not a fully rigged 3D model. Mouth/arm overlays are visual approximations; this is not phoneme-level lip sync.
- Browser autoplay rules may prevent homepage speech until a visitor interacts with the page.
- Live AI and translation still require valid backend endpoints and Vercel environment configuration.
- The legacy live-chat widget is no longer loaded by these HTML pages; its backend files are left untouched.

## Validation performed
- `spwt-robot.js` passes `node --check`.
- All root HTML files in both `frontend` and `dist` reference the shared robot script.
- No root HTML files in either folder reference `chat-widget.js` or `chat-widget.css`.
- ZIP integrity verified separately after packaging.

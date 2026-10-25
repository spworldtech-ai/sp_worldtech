# SP WorldTech public calculator and homepage cleanup — 2026-10-25

- Kept the dashboard Calculator navigation item as a styled sidebar link to the public calculator page.
- Standardized the calculator header spacing with the public homepage header.
- Removed the calculator script that changed public Join Free buttons into role-specific dashboard links when a session existed.
- Removed the homepage script include that injected marketplace product cards into the homepage. The dedicated Marketplace page remains available for published products.
- Replaced the public Marketplace page's direct My Dashboard link with Join Free, routing users through authentication.
- Updated public Academy and Pricing links that directly opened the client dashboard to route through authentication first.
- Applied matching changes to both `frontend/` and `dist/` copies.
- Existing `.env` files were not modified.

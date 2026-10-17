# SP WorldTech repair notes — 2026-10-13

## Concrete staff dashboard defects repaired
- Added the missing `showCreateProject()` handler referenced by the Create project button.
- Connected the `projectForm` submission to the existing authenticated `POST /api/projects` route, including progress state, error notification, reset, and list refresh.
- Corrected staff page navigation to hide inactive sections and refresh project/product data when those sections open.
- Added initial loading for the staff dashboard and marketplace product list; the page previously defined loaders but did not invoke them at startup.
- Changed project loading failures to show the actual API error and a Retry control rather than leaving a generic/indefinite loading state.
- Rebuilt `dist` from `frontend` so the deployed copies match the source copies.

## Checks performed
- `node scripts/build-frontend.js` completed successfully.
- Inline JavaScript syntax checks passed for `frontend/staff.html` and `dist/staff.html`.
- Node syntax checks passed for the project/auth/marketplace route files and the relevant standalone scripts.
- The existing `backend/.env`, `frontend/.env`, and sample environment files were retained in the source project. Secrets are not reproduced in this report.

## Not claimed as verified
Live Google sign-in, production API/database requests, uploads on Vercel, and translation/exchange-rate services require production configuration and authenticated end-to-end testing. These cannot be proven by local syntax/build checks alone.

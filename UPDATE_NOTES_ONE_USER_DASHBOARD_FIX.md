# SP WorldTech One User Dashboard Fix

This update fixes the user dashboard workflow.

## Fixed
- Job Dashboard, Academy Dashboard, User Banking, and User Removed finance module pages now redirect into one main `dashboard.html`.
- Dashboard cards for Banking/Card/Airtime/Data/Bills now stay inside the dashboard and preselect the right request type.
- Jobs now call `/api/jobs/remote` from the secure backend route.
- API errors now show JSON-safe messages instead of breaking with `Not Found` / non-JSON responses.
- Backend now returns JSON for missing `/api/*` routes.
- Dashboard loads wallet, jobs, academy, removed finance module, support, and applications independently so one failing module does not break the entire dashboard.
- Added static cache hints for faster asset loading.

## Important Vercel setup
- `spworldtech.com` must point to the frontend static site, not backend.
- Backend should remain at `https://sp-worldtech-backend.vercel.app`.
- Frontend public API should use `https://spworldtech.com/api`; Vercel rewrites `/api/*` to `https://sp-worldtech-backend.vercel.app/api/:path*`.

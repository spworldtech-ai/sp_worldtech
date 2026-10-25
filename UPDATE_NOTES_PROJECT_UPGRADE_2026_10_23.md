# Project upgrade notes — 2026-10-23

Scope: robot removal on four pages, calculator fixes, login/session hardening, admin product workflow, dashboard navigation.
No `.env` file was modified. No secret values appear in this document.

## Pages
- **"Join Free" page = `auth.html`** (the only page behind the "Join Free" button). Robot script removed.
- `calculator.html`, `admin.html`, `staff-auth.html`: robot script removed. `spwt-robot.js/.css/.png` are untouched and still used by the other public pages and the dashboards.
- Calculator: `1..2` is now rejected (it silently evaluated to 0.2); the `e` constant after a digit no longer turns `2e3` into 2000; signed-in users see "My Dashboard" instead of "Join Free".
- `admin.html` / `admin-auth.js`: fixed garbled "…" characters in status messages.

## Dashboards
- Logout now clears all four session keys (`spw_user_token`, `spw_user`, `spw_staff_token`, `spw_staff_user`); staff logout previously left the staff token behind.
- Client dashboard redirects admin/owner to `admin-dashboard.html` and staff to `staff.html`.
- A 401 from the API (expired/invalid token) now clears the session and returns to the matching login page (hook: `SPW_APP.onUnauthorized`).
- Admin dashboard now loads its data on open (`loadDashboard()` was never called, so stats and products stayed empty until "Refresh" was clicked) and restores the section from the URL hash.

## Product workflow (`backend/routes/marketplaceRoutes.js`, admin/staff dashboards)
- Server verifies file signatures (PDF/ZIP/PNG/JPEG/GIF/WEBP/SVG/TXT) against the declared type.
- Edit endpoint: strict boolean parsing (`"false"` used to publish), numeric/title validation, optional file and cover replacement, cover URL allow-list.
- Delete is administrator/owner only and is refused when paid purchases exist (hide instead). Previously it also erased paid purchase records.
- Staff keep upload / edit / publish / hide. Staff dashboard no longer shows Delete.
- Cover route can no longer redirect to itself. Admin list endpoint has error handling.
- Existing publication model is unchanged: a product is public only when `published` is true.

## Security fixes
- `POST /api/auth/operations-pin/create` could mint **staff/admin/owner** accounts (and a token) with no authentication when `OPERATIONS_SETUP_CODE` was unset. It now fails closed.
- Admin signup can no longer take over / promote an existing non-admin account with an unverified password; Google sign-in remains the promotion path.
- Admin error messages no longer reveal the configured administrator email.
- Credential endpoints are rate limited (20 requests / 15 min / IP / endpoint; in-memory, per server instance).

## Environment variables (names only — add to your deployment yourself)
| Variable | Purpose |
|---|---|
| `STAFF_ALLOWED_EMAILS` | Comma-separated allowlist for self-service staff registration (password and Google). **When unset, anyone can still register as staff (existing behaviour).** Strongly recommended to set. |
| `OPERATIONS_SETUP_CODE` | Required to create staff/admin/owner operations PINs. Unset = those creations are refused. |

## Tests
`cd backend && npm test` — 15 route/controller tests using in-memory stand-ins for the Mongoose models (no database needed).

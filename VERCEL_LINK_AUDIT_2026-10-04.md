# SP WorldTech Vercel Link Audit — 2026-10-04

## Canonical public URLs
- Website: https://spworldtech.com
- Public API: https://spworldtech.com/api
- New frontend deployment: https://spworldtech-frontend.vercel.app
- New backend deployment: https://sp-worldtech-backend.vercel.app

## Verified
- Old SP WorldTech frontend deployment URL `https://sp-worldtech-frontend.vercel.app` is NOT present.
- No old SP WorldTech Vercel frontend URL remains in source, environment files, deployment configuration, or documentation.
- `vercel.json` routes `/api/*` to the new backend deployment.
- Backend CORS includes the canonical domain and the new frontend deployment.
- Frontend runtime API uses `https://spworldtech.com/api`.

## Intentionally retained
`https://tynasystems-backend.vercel.app` belongs to TYNA Systems and is an external dependency, not an old SP WorldTech deployment.

## Vercel account/domain ownership
Deleting the old Vercel project/account does not change DNS ownership state by itself. If Vercel still reports that `spworldtech.com` is linked to another account, use the exact TXT verification record Vercel provides at `_vercel.spworldtech.com`. Do not guess the TXT value.

# SP WorldTech repair report — 2026-10-13

## Change made in this pass

- Restricted Google admin sign-in/signup to the explicit `ADMIN_GOOGLE_EMAIL` / `ADMIN_GOOGLE_EMAILS` backend allow-list. A valid Google account can no longer automatically create an owner account unless its verified email is explicitly authorized.
- Improved the backend `.env.sample` to document the optional comma-separated admin allow-list.
- Rebuilt `dist` from `frontend` using the project's build script.

## Checks that passed locally

- `npm run build`
- `node --check` for JavaScript source files under `frontend`, `backend`, and `scripts` (excluding dependencies)
- Required backend route modules loaded successfully
- SHA-256 checks confirmed `backend/.env` and `frontend/.env` were unchanged by this repair/build
- ZIP integrity check (run after archive creation)

## Not verified / requires a real deployment environment

This project does not contain an automated test suite for the requested end-to-end flows. No live Vercel deployment, Google OAuth exchange, MongoDB write, or authenticated browser session was available in this local run. Therefore this report does **not** claim that all five requested areas are fully fixed.

Still requiring end-to-end verification:
- Admin Google sign-in/signup and redirects (including configuring `ADMIN_GOOGLE_EMAIL` or `ADMIN_GOOGLE_EMAILS` in the deployed backend and matching Google OAuth client/origins)
- Admin dashboard actions and project-management CRUD
- Staff project loading, Create Project, editing, delivery, and permission behavior
- Product file/cover uploads, persistence, editing, publishing, deletion, and public rendering
- Translation service with a valid deployed `AZURE_TRANSLATOR_KEY`, and currency conversion using live FX responses on homepage and dashboard pages

## Environment-file handling

Existing `backend/.env` and `frontend/.env` were left unchanged. Existing sample files are retained. Do not commit real `.env` files to a public repository; configure production secrets in Vercel environment variables.

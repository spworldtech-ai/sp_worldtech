# SP WorldTech repair report — 2026-10-12

This update was made on a separate working copy of the supplied ZIP. The original uploaded ZIP was not modified.

## Changes made

1. **Admin Google authorization configuration**
   - Added support for `ADMIN_GOOGLE_EMAILS` as an explicit comma-separated allow-list.
   - Preserved `ADMIN_GOOGLE_EMAIL` as the primary single-account setting.
   - Added compatibility fallbacks to `ADMIN_NOTIFICATION_EMAIL` and `ADMIN_EMAIL` only when the primary admin Google setting is absent.
   - Kept Google token audience, issuer, verified-email and role checks. This does not authorize arbitrary Google accounts.
   - Improved the authorization error so it points to the active backend deployment's `ADMIN_GOOGLE_EMAIL` configuration.

2. **Language persistence behavior**
   - The current language is no longer replaced with English before a new translation finishes loading.
   - A temporary translation API failure no longer forcibly restores every text node to English.
   - The selected language is kept in storage and the language selector is synchronized when settings are applied.

3. **Currency selector persistence**
   - The saved currency selector is synchronized whenever currency settings are applied.
   - Existing request-sequencing and storage-event synchronization remain in place.

4. **Product upload validation**
   - Added server-side validation for product title length, non-negative numeric fields, base64 payload shape, supported cover image MIME types, and sanitized filenames.
   - Kept the existing product model, routes, roles, upload fields, and published/hidden behavior.

5. **Frontend build output**
   - Rebuilt `dist/` from `frontend/` using the repository's existing build script so the shipped `dist/assets/global-ui.js` matches the updated source.

## Environment-file preservation

The original ZIP's `backend/.env`, `frontend/.env`, `backend/.env.sample`, and `frontend/.env.sample` were byte-compared with the working copy. All were unchanged. No secret values are included in this report.

## Validation performed

- `node --check` passed for the changed backend and frontend JavaScript files.
- The repository frontend build script completed successfully.
- Rebuilt `dist/` file list matches the original `dist/` file list.
- Source and built `global-ui.js` are byte-identical.

## Deployment checks still required

- Google Admin sign-in must be tested against the active Vercel deployment. Vercel's environment variables are separate from the local `.env` files; ensure `GOOGLE_CLIENT_ID` and `ADMIN_GOOGLE_EMAIL` are correct in the active backend deployment, then redeploy.
- Language translation requires a valid `AZURE_TRANSLATOR_KEY` in the active backend deployment. If that provider is unavailable, the selection will remain saved and the last successfully rendered language will remain visible, but new translations cannot be generated until the service is available.
- Real product uploads, database writes, and authorization must be smoke-tested against the live backend because this local check did not use production credentials or a live database.

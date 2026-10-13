# SP WorldTech Resend and Admin Access Update — 2026-10-11

## Changes made
- Removed the `ADMIN_SETUP_CODE` placeholder from environment sample files.
- Disabled public password-based administrator signup. Administrator provisioning remains restricted to the verified Google account configured by `ADMIN_GOOGLE_EMAIL` through the existing Google authentication endpoint.
- Removed the admin setup-code form and client-side signup handler; existing admin credential login and Google sign-in remain.
- Configured the backend environment sample with the sender format `SP WorldTech <notifications@spworldtech.com>` and retained the Resend key as an empty placeholder.
- Kept `ADMIN_NOTIFICATION_EMAIL=spworldtechtechnology@gmail.com`.
- Preserved `.env.sample` files and their other existing settings. The supplied ZIP did not contain actual `.env` files, so none were created or modified.
- Kept Resend credentials out of source files and this ZIP. Set `RESEND_API_KEY` privately in the backend deployment environment.

## Required deployment configuration
- `RESEND_API_KEY`: create a new key in Resend and store it privately in the backend's Vercel environment variables.
- `EMAIL_FROM`: `SP WorldTech <notifications@spworldtech.com>` only after `spworldtech.com` is verified in Resend and the sender address is permitted.
- `ADMIN_NOTIFICATION_EMAIL`: `spworldtechtechnology@gmail.com`.
- `ADMIN_GOOGLE_EMAIL`: `spworldtechtechnology@gmail.com`.
- `GOOGLE_CLIENT_ID` and `JWT_SECRET` must be configured correctly in the backend environment.

## Checks
- Frontend build script completed successfully and prepared `dist/`.
- Node syntax checks passed for the changed admin authentication route, Resend email service, and admin authentication client script.
- ZIP integrity checked after packaging.
- Live Resend delivery and production authentication were not tested because they require the user's private deployment credentials and a verified sender domain.

# SP WorldTech Authentication Production Fix — 2026-10-06

## Fixed
- Production API requests use the SP WorldTech public origin on `spworldtech.com`, allowing `/api/*` to use the Vercel rewrite without cross-origin browser calls.
- Public registration now returns a PIN **setup** session, not a PIN **verify** session. New accounts can therefore create their first PIN and then receive a real dashboard JWT.
- PIN setup/verification errors are reported as backend/API errors instead of the old misleading network message when a response is available.
- Google user sign-in/sign-up continues through the same secure PIN setup/verification flow.
- Staff Google sign-in/sign-up is wired through a dedicated `staff-auth.html` page and the staff API role.
- Admin Google sign-in and Google account creation use the authorized `ADMIN_EMAIL`; Google token verification accepts Google's boolean/string `email_verified` forms and validates issuer/audience.
- Admin auth page now has a Google option in the Admin Sign Up section as well as Admin Login.
- Removed all literal localhost/127.0.0.1 references from frontend/backend source.
- Rebuilt `dist/` from `frontend/`.

## Required production environment
The backend still needs valid Vercel environment variables such as `MONGODB_URI`, `JWT_SECRET`, and the real `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`. Google Cloud must authorize the production site origin.

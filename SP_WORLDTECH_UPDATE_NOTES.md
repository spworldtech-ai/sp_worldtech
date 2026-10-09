# SP WorldTech Update — 2026-10-04

Implemented:
- Slower, smoother rolling image galleries across the main rolling systems.
- User login/signup improvements with View Password/PIN controls.
- Staff portal (`frontend/staff.html`) with staff signup/login, PIN support, and Google authentication.
- Admin login improvements, View Password, controlled admin signup, and Google admin sign-in restricted to ADMIN_EMAIL.
- User wallet display and server-side wallet payment for service payments.
- E-book wallet checkout in addition to Paystack checkout.
- Server-side balance checks and wallet transaction records.
- Google authentication role handling for user/staff.
- Persistent language selection with faster translation reuse and translation of placeholders/title/ARIA labels.
- Canonical API environment value `https://spworldtech.com/api` retained/added in frontend/backend env configuration.
- Added `ADMIN_SETUP_CODE` configuration placeholder for controlled admin signup.

Important:
- Set real GOOGLE_CLIENT_ID, PAYSTACK keys, AZURE_TRANSLATOR_KEY, and ADMIN_SETUP_CODE in deployment environment variables.
- The uploaded archive contained live-looking credentials/secrets. Rotate any database password, JWT secret, payment credentials, API keys, or other secrets that were previously exposed in that archive before production deployment.

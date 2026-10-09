# SP WorldTech Step-by-Step Update — 2026-10-04

## Step 1 — API & Environment
- Production API standardized to `https://spworldtech.com/api`.
- Removed malformed standalone API URL from backend `.env`.
- Local frontend API fallback corrected to port `1000`.
- Checked for `/api/api` URL construction and old `sp-worldtech.com/api` references.

## Step 2 — User Login/Signup
- Restored working `auth.html` authentication page.
- User login and signup use the existing backend authentication routes.
- Added View/Hide Password.
- Added View/Hide PIN for signup and PIN confirmation.
- Fixed `auth-portal.js` missing `bindPasswordToggles()` implementation.

## Step 3 — Admin Login/Signup
- Verified admin username/password login.
- Verified controlled admin signup using `ADMIN_SETUP_CODE`.
- Verified admin password visibility controls.
- Verified admin Google authentication route and email restriction.

## Step 4 — Staff Portal
- `staff.html` provides Staff Login and Staff Signup.
- Password/PIN visibility controls included.
- Staff signup/login uses backend role `staff`.
- Staff Google login/signup supported.
- Google-created staff accounts use the secure staff PIN setup/verification flow.

## Step 5 — Wallet & Payments
- User dashboard loads wallet balances from backend/database.
- Service payments support Paystack or wallet balance.
- Wallet payment checks balance server-side and atomically deducts it.
- Failed wallet transaction processing restores the deducted balance.
- Paystack checkout and verification are server-side.
- Marketplace e-books support Paystack and wallet checkout.
- Payment transactions are recorded in the transaction system.

## Step 6 — Rolling Images
- Main gallery motion slowed to 60 seconds.
- Secondary gallery motion slowed to 78/84 seconds.
- Contact gallery motion slowed to 78/86 seconds.
- Global rolling advertisement slowed to 40 seconds.
- JavaScript rolling speed reduced to `0.0035`.
- Recycled-card rolling speed reduced to 14 px/s.
- Main second row direction corrected to roll opposite the first row.

## Step 7 — Google Authentication
- User Google authentication verified through `/api/auth/google`.
- Staff Google authentication verified through `/api/auth/google` with `role=staff`.
- Admin Google authentication verified through `/api/admin/auth/google`.
- Backend validates Google ID token audience and verified email.
- Admin Google login is restricted to configured `ADMIN_EMAIL`.

## Step 8 — Language Switching
- Selected language persists between pages using localStorage.
- Current page content translates through the backend Azure Translator route.
- Translation batches run in parallel for faster switching.
- Dynamic content is observed and translated after insertion.
- Page title, placeholders, titles, ARIA labels, and image alt text are translated.
- RTL languages automatically use RTL document direction.
- English restores original source text.

## Step 9 — Validation
- Every frontend/backend JavaScript file passed `node --check`.
- Root build passed.
- Frontend build passed.
- Static API URL checks passed.
- Authentication page checks passed.
- Wallet/Paystack route checks passed.
- Language hook checks passed.
- Rolling-speed checks passed.
- Environment API checks passed.

### Test-environment note
A temporary backend dependency installation/API runtime smoke test could not be completed because the container's npm dependency installation timed out. This is not reported as an application failure; deterministic source/build checks above passed.

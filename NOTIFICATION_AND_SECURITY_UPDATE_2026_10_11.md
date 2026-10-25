# SP WorldTech notification and security update — 2026-10-11

## Changes in this package
- Added authenticated `/api/notifications` list, per-account read state, and mark-all-read endpoints using the existing notification records.
- Added a shared in-app notification bell to the user, admin, and staff dashboards. It polls every 45 seconds while the page is visible.
- Added `readBy` to notification records so role-wide notifications can be marked read separately for each account.
- Preserved existing `.env.sample` files and their variable names.
- Replaced credential-looking MongoDB and JWT values in `backend/.env.sample` with placeholders. Never place live credentials in sample files or commit them.

## Environment configuration
Set production secrets in Vercel/backend environment variables, not in frontend variables or Git. Required examples:
- `MONGODB_URI`: your private database connection string
- `JWT_SECRET`: a newly generated unique secret
- `RESEND_API_KEY`: your private Resend API key
- `EMAIL_FROM`: a sender address verified in Resend, e.g. `SP WorldTech <notifications@spworldtech.com>`
- `ADMIN_NOTIFICATION_EMAIL`: `spworldtechtechnology@gmail.com`

The Resend API key previously pasted in chat should be revoked and replaced. Rotate the MongoDB credential and JWT secret if the values that were present in the previous sample file were ever used in production.

## Important verification notes
- In-app notification endpoints require a valid user JWT and a connected MongoDB database.
- The UI is included on the main user, admin, and staff dashboards. Existing job/application notifications appear if those events have created records in the existing `JobNotification` collection.
- The UI polls every 45 seconds; this is not WebSocket push delivery.
- Live login, Google OAuth, Resend delivery, Paystack webhooks, MongoDB access, and product upload/storage still require verification in a configured staging or production environment.
- This update does not claim to guarantee zero future failures.

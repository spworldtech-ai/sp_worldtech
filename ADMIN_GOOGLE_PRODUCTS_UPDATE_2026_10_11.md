# SP WorldTech admin and product-management update — 2026-10-11

- The Google administrator identity defaults to `spworldtechtechnology@gmail.com` via `ADMIN_GOOGLE_EMAIL` (or `ADMIN_NOTIFICATION_EMAIL`), and the former hard-coded administrator default was removed from the sample environment.
- The actual `backend/.env` was not edited. Update deployment environment variables to `ADMIN_GOOGLE_EMAIL=spworldtechtechnology@gmail.com` and `ADMIN_NOTIFICATION_EMAIL=spworldtechtechnology@gmail.com`, then redeploy. Google sign-in still requires the intended account to be a verified Google account and `GOOGLE_CLIENT_ID` to be correctly configured.
- Admin and staff marketplace cards now include product file download, edit details, publish/hide, and delete actions. The download endpoint is protected by the existing authenticated admin/staff role middleware.
- Product upload still supports title, category, description, current and old USD prices, WhatsApp contact, page count, product file and optional cover image.
- In-app operational notifications remain stored through the existing notification workflow. Actual Gmail delivery requires an SMTP/email provider configuration; setting the destination email alone does not authenticate a sender or deliver email.

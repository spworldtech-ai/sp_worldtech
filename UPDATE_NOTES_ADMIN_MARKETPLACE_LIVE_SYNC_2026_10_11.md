# SP WorldTech admin and marketplace update — 2026-10-11

- Admin Google authorization uses `ADMIN_GOOGLE_EMAIL` with the intended default `spworldtechtechnology@gmail.com`; notification recipient no longer acts as a fallback login allowlist. The old hard-coded admin email is absent from active code.
- Admin/staff product forms now support ebook, downloadable file, logo/design asset, template, software and other types; upload includes the actual downloadable file, optional cover image, prices, category, WhatsApp number, page count, description and publish/hidden status.
- Backend upload validation accepts PDF, ZIP, EPUB, DOC/DOCX, TXT, ODT, PNG/JPG/WEBP/GIF/SVG and limits product files to 15 MB and covers to 3 MB.
- Admin/staff can list, download, edit product metadata/type, publish/hide, and delete through the existing role-protected backend endpoints.
- Homepage, marketplace page and user dashboard consume the live published-products endpoint. Homepage refreshes every 15 seconds; user dashboard refreshes every 30 seconds. Marketplace cards no longer display fabricated 5-star ratings or fallback product descriptions.
- Optional email alert on product upload uses Resend HTTP API. To enable real delivery, set `RESEND_API_KEY`, `EMAIL_FROM` (a sender verified with Resend), and `ADMIN_NOTIFICATION_EMAIL=spworldtechtechnology@gmail.com` in the backend deployment environment. No secret is hard-coded.
- Admin Google login still requires `ADMIN_GOOGLE_EMAIL=spworldtechtechnology@gmail.com` in Vercel, the matching `GOOGLE_CLIENT_ID`, correct Google authorized origins, and a redeployment. Existing environment values override code defaults.
- Existing `.env` files were not edited or deleted.

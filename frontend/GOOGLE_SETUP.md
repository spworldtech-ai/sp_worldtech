# SP WorldTech Google Setup

## Google Login / Register

1. Open Google Cloud Console and create/select the SP WorldTech project.
2. Configure the OAuth consent screen.
3. Create a **Web application** OAuth client.
4. Add the production origin:
   - `https://spworldtech.com`
5. Add local development origin if needed:
   - `https://spworldtech.com`
6. Copy the Web Client ID into the backend Vercel environment as:
   - `GOOGLE_CLIENT_ID`
7. The frontend reads the public Google client ID from `/api/public-config`; the Google client secret is never placed in frontend code.
8. Google Login/Register uses the official Google Identity Services button and sends the returned ID token to the backend for verification.

The project intentionally does not contain a fake Google client ID. Until the real client ID is added to the backend environment, the page shows a configuration notice instead of pretending a Google button is functional. Once GOOGLE_CLIENT_ID is set, the official Google Identity Services button is rendered automatically for both Login and Create Account.

## Other Google integrations

- Google AdSense uses the existing publisher configuration.
- Root `ads.txt` remains configured.
- Schema.org JSON-LD is present on public pages.
- Sitemap and robots.txt remain configured for search crawling.
- Google Analytics 4 and Search Console verification remain configurable in `assets/google-setup.js`.

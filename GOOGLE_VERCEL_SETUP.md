# Google Login — Vercel Setup

The user authentication page uses Google Identity Services and the backend `/api/auth/google` endpoint.

## Backend environment variables
Set these in the backend environment (and in Vercel for the deployed backend):

- `GOOGLE_CLIENT_ID` — Google Web OAuth client ID.
- `GOOGLE_CLIENT_SECRET` — keep this private on the server. It must never be placed in frontend JavaScript.

The current Google Identity Services credential flow validates the ID token against `GOOGLE_CLIENT_ID`; the client secret is retained as a server-only OAuth configuration value and is not exposed to browsers.

## Vercel
In the Vercel project that runs the backend, open **Settings → Environment Variables** and add the two variables for the environments you deploy (Production, Preview, as needed). Redeploy after saving.

## Google Cloud Console
Configure the Web OAuth client with the production site origins and the appropriate authorized JavaScript origins for your deployment. Use the deployed SP WorldTech domain, not a local file URL, for production.

## Security
Never commit the real `GOOGLE_CLIENT_SECRET` to GitHub. Use Vercel Environment Variables or another secure server-side secret store.

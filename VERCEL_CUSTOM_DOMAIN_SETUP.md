# SP WorldTech Vercel / Custom Domain Setup

Frontend: https://spworldtech-frontend.vercel.app
Backend: https://sp-worldtech-backend.vercel.app
Canonical site: https://spworldtech.com
Canonical API: https://spworldtech.com/api

Add `spworldtech.com` to the frontend Vercel project. If Vercel asks for ownership verification, add the exact TXT record Vercel provides at `_vercel.spworldtech.com`; never guess the TXT value.

The frontend `vercel.json` proxies `/api/*` to the backend deployment. Backend CORS allows the apex domain, www domain, and current frontend Vercel deployment.

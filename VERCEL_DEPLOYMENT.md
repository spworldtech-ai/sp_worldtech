# SP WorldTech Vercel Deployment

## Frontend
Use the repository root or set Vercel Root Directory to `frontend`.

Recommended repository-root settings:
- Framework Preset: Other
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

The root build copies the public frontend into `dist` and excludes `.env` files.

## Backend
Create a separate Vercel project from the same repository and set:
- Root Directory: `backend`
- Framework Preset: Other
- Build Command: leave default/empty

The backend is API-only. It no longer serves or redirects to frontend HTML pages.

Backend URL should be used by the frontend through `SP_WORLDTECH_API_BASE_URL`.

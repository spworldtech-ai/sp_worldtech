# SP WorldTech Vercel frontend/backend split

## Frontend project
- Vercel project: `sp-worldtech-frontend`
- Root Directory: repository root (`.`)
- Build Command: `npm run build:frontend`
- Output Directory: `dist`

The root build copies only `frontend/` into `dist/`. The backend directory is never used as the frontend output.

## Backend project
- Vercel project: `sp-worldtech-backend`
- Root Directory: `backend`
- Build Command: leave Vercel default
- Output Directory: leave blank

The backend uses `backend/vercel.json` and `backend/server.js`.

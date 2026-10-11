# SP WorldTech

SP WorldTech is a technology and digital solutions business focused on software engineering, AI solutions, digital platforms, technology education, and client services. World Net Hosting is presented as a separate digital infrastructure platform under the SP WorldTech business structure.

## Main folders
- `frontend/` public pages and dashboards
- `backend/` Node.js API server
- `database/` schema notes

## Public company structure
- **SP WorldTech** — company-level technology and digital solutions brand.
- **World Net Hosting** — separate domain, hosting, and digital infrastructure platform.
- **Software & AI Solutions** — custom software, web applications, APIs, automation, and AI products.
- **SP WorldTech Academy** — practical technology education.

## Local setup
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Open the frontend through the backend or deploy the frontend separately on Vercel.

## Environment variables
Use real production keys only in your deployment environment. Never commit real secrets to GitHub. `.env.sample` files are templates only.

## Local development

Run the backend and frontend in separate terminals:

```powershell
cd "C:\Users\USER\sp_worldtech\backend"
npm install
npm run dev
```

```powershell
cd "C:\Users\USER\sp_worldtech\frontend"
npm install
npm run dev
```

The production website runs at `https://spworldtech.com` and uses the production API at `https://spworldtech.com/api`. Keep deployment environment variables configured with the production domain.

# SP WorldTech custom-domain and global UI configuration

## Production frontend

- Site: `https://spworldtech.com`
- Runtime API origin: `https://spworldtech.com`
- API endpoints are called as `https://spworldtech.com/api/...`

The frontend runtime normalizes a configured API value ending in `/api`, so a value such as `https://spworldtech.com/api` is safely converted to the API origin before code appends `/api/...` paths.

## Global tools

The shared global UI provides:

- Rolling World Net Hosting advertisement
- Real-time Nigeria clock using the `Africa/Lagos` time zone
- Persistent language selection
- Persistent currency selection
- Exchange-rate loading through the SP WorldTech FX endpoint with a public fallback and short-term browser cache

## Authentication

User password/Google authentication now creates a short-lived PIN flow token. The user must complete the dedicated PIN page before the dashboard token is stored in the browser.

## Environment files

The existing frontend and backend `.env` and `.env.sample` files are preserved in the project. Private backend credentials must remain server-side and should be configured through the deployment environment.

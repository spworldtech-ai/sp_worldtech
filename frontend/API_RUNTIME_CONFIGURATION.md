# SP WorldTech runtime API configuration

The frontend runtime uses the root API origin and appends `/api/...` to requests.

Production origin: `https://spworldtech.com`
Production API paths: `https://spworldtech.com/api/...`

The runtime normalizes the production API origin so `.../api/api/...` is never produced. The public website is locked to the production API origin.

The existing `.env` and `.env.sample` files are preserved. Do not place private backend secrets in browser code.

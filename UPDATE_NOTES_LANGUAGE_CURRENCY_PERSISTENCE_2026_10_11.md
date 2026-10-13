SP WorldTech language/currency persistence fix
Date: 2026-10-11

Files updated in both frontend source and dist:
- frontend/assets/global-ui.js
- dist/assets/global-ui.js
- frontend/assets/home-marketplace.js
- dist/assets/home-marketplace.js

Changes:
1. Added request sequencing to language translation so stale, slower translation requests cannot overwrite the user's latest language selection.
2. Persisted validated language/currency selections when applying them and synchronized selections across browser tabs via the storage event.
3. Added request sequencing to currency application so an older exchange-rate request cannot overwrite a newer currency choice.
4. Prevented the homepage live marketplace from replacing all product-card DOM every 15 seconds when product data has not changed. This repeated replacement could make language and currency formatting flash back to English/USD.

Validation:
- node --check passed for all four updated JavaScript files.

Notes:
- This ZIP updates the language/currency behavior. It does not claim to implement the separate admin/staff authentication, email notifications, or multi-file product-upload requests.
- Test in the deployed environment with the localization API and exchange-rate API available.

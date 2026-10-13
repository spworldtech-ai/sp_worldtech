# SP WorldTech Marketplace & Payments

## Local development

Backend:
```powershell
cd "C:\Users\USER\sp_worldtech\backend"
npm install
npm run dev
```

Frontend:
```powershell
cd "C:\Users\USER\sp_worldtech\frontend"
npm install
npm run dev
```

The frontend uses the production SP WorldTech API at `https://spworldtech.com/api`.

## Vercel environment variables

Backend:
- `MONGODB_URI`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `PAYSTACK_PUBLIC_KEY`
- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_CALLBACK_URL`
- `PAYSTACK_EBOOK_CALLBACK_URL`
- `PAYSTACK_SERVICE_CALLBACK_URL`
- `CLIENT_URL`
- `FRONTEND_URL`

Frontend does not need the Paystack secret. Only the public key may be exposed to the browser.

## Marketplace workflow

1. Admin signs in at `/admin.html`.
2. Admin uploads an e-book, page count, description, category, price and optional cover image.
3. The e-book file is stored in MongoDB and is not publicly downloadable.
4. Users register/login at `/auth.html`.
5. Users choose an e-book at `/marketplace.html`.
6. The backend initializes Paystack using the server-side secret key.
7. Paystack returns the customer to `/marketplace.html` after payment.
8. The backend verifies the transaction reference and exact amount/currency before marking the purchase as paid.
9. The paid e-book appears in `/dashboard.html` and can be downloaded only by the purchasing account.

E-book uploads are limited to 15 MB because the file is stored inside a MongoDB document. Accepted formats: PDF, EPUB, DOC, DOCX and TXT.

## Google Login

Set `GOOGLE_CLIENT_ID` to the Web OAuth Client ID created in Google Cloud Console. The official Google Identity Services button is rendered only when the backend has a valid client ID. Google credentials are verified by the backend before an account is created or linked.

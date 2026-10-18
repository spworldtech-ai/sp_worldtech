# SP WorldTech Robot AI — Vercel deployment

This update wires the browser assistant to the configured API base (`window.SPW_APP.API_BASE`) rather than always calling the frontend origin. The backend AI route supports Google's Gemini REST API by default, or an existing custom AI endpoint. Azure Translator remains configured through the existing `/api/localization/translate` backend route.

## Set environment variables in the BACKEND Vercel project

Add these in Vercel → backend project → Settings → Environment Variables, for Production (and Preview if desired):

- `GEMINI_API_KEY`: your Google AI Studio API key (secret; backend only).
- `GEMINI_MODEL`: optional; defaults to `gemini-2.5-flash`.
- `AZURE_TRANSLATOR_KEY`: your Azure Translator key (secret; backend only).
- `AZURE_TRANSLATOR_ENDPOINT`: optional; defaults to `https://api.cognitive.microsofttranslator.com`.
- `AZURE_TRANSLATOR_REGION`: region configured for your Azure Translator resource (use `global` only if your resource is global).
- `MONGODB_URI`: required by the current backend API middleware and AI chat history storage.

If using a custom AI gateway instead of Gemini, configure `AI_PROVIDER_API_KEY` and `AI_PROVIDER_URL`. When `AI_PROVIDER_URL` is set, it takes precedence over the default Gemini endpoint. Ensure that gateway accepts the generic JSON payload and the API key headers used by `backend/services/aiProviderService.js`.

Do not put secret API keys in frontend variables such as `VITE_*`, `NEXT_PUBLIC_*`, or browser JavaScript. Do not paste keys into source control. Existing `.env` files are intentionally left untouched by this update; configure deployment secrets in Vercel.

## Deploy and verify

1. Add the environment variables to the backend Vercel project.
2. Redeploy the backend so the runtime receives them.
3. Verify `GET /api/health` returns `{\"ok\":true,...}`.
4. Verify `POST /api/ai/chat` with a non-sensitive test question while monitoring backend logs.
5. Verify `POST /api/localization/translate` with a short test phrase and the target language code.
6. Test the robot on the deployed site. Browser speech synthesis depends on available device voices and may require a user gesture; the homepage welcome may be blocked by autoplay policy.

The assistant must not be used as proof of payment, order, inventory, or account state unless those systems are explicitly integrated and authorized. The client-side page label is context only and does not grant permissions.

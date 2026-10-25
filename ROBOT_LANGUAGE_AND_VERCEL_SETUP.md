# SP WorldTech robot language and speech integration

## What this update does
- Uses the existing saved site language (`spw_language`) selected in the global language selector.
- Sends robot text through the existing backend endpoint `/api/localization/translate`, so the Azure Translator key remains server-side.
- Sets speech synthesis language based on the selected language and uses a matching installed browser voice when available.
- Translates robot answers, including AI answers and offline fallback guidance, when Azure Translator is configured.
- Keeps the existing `/api/ai/chat` integration for AI responses. Academy context remains instructor-oriented.
- Does not store visitor names, email addresses, or other personal details in local storage.

## Required Vercel environment variables
Configure these on the **backend Vercel project** that serves `https://sp-worldtech-backend.vercel.app` (Production, Preview, and Development as appropriate):

- `AZURE_TRANSLATOR_KEY` — your valid Azure AI Translator subscription key
- `AZURE_TRANSLATOR_ENDPOINT` — usually `https://api.cognitive.microsofttranslator.com`
- `AZURE_TRANSLATOR_REGION` — the region configured for your Azure Translator resource; use `global` only if that is correct for your resource

Keep the key private. Do not put it in frontend JavaScript, HTML, or public `VITE_`/`NEXT_PUBLIC_` variables. Redeploy the backend after changing Vercel environment variables.

The frontend Vercel project already rewrites `/api/*` to the backend deployment. If the backend hostname changes, update the existing rewrite configuration and redeploy the frontend.

## Speech and browser limitations
- Browsers may block automatic speech on the homepage until the visitor interacts with the page. The site can attempt a single welcome, but cannot override browser autoplay rules.
- Speech uses a matching voice installed in the visitor's browser/operating system. A browser may not have a voice for every language; translated text can still be shown even if speech is unavailable.
- Azure Translator supports a defined set of languages, not every language label in a long selector. If a selected language is not supported by the active Azure resource, the robot falls back to the original text and the page's translation service may report an error. Verify the actual supported-language list from `/api/localization/languages`.
- Dynamic live platform activity, account status, inventory, and payments are only available to the AI if authorized server endpoints expose that data. The robot must not invent those details.

## Verification
After deployment, test language selection on the homepage, Marketplace, Academy, client dashboard, staff dashboard, and admin dashboard. Confirm page text changes, robot replies are translated, speech uses the selected language when a browser voice exists, and login/roles/payments still work.

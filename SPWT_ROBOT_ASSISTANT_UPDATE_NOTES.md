# SP WorldTech Robot Assistant Update

- Added a scoped robot helper to public HTML pages and dashboards in both `frontend` and `dist`.
- Homepage attempts one spoken welcome on visit; browsers can block speech autoplay until a user gesture. Other pages speak only when the assistant is opened and voice is enabled.
- Welcome includes a live local date/time string with seconds.
- Assistant attempts the existing `/api/ai/chat` endpoint and falls back to step-by-step offline guidance if unavailable. Academy context gets an instructor-oriented system prompt. Existing auth/role routes were not changed.
- The supplied robot image is copied as `assets/spwt-robot.png`.
- Privacy: this update does not silently store visitor names, emails, location, or other personal details. Chat history behavior remains the existing backend AIChatHistory behavior; disclose it in the site's privacy notice and add a lawful consent/retention workflow before expanding visitor analytics. Only the voice preference is stored locally.
- Live platform activity, product inventory, order/payment status, and server diagnostics are not automatically available to the robot; these require explicit authorized data integrations. It must not claim otherwise.
- Validate in a browser, test the `/api/ai/chat` endpoint and academy route, and test role-specific pages before deployment.

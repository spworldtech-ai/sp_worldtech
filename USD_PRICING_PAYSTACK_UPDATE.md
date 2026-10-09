# SP WorldTech Pricing & Paystack Display Update

- Customer-facing service and e-book prices display in USD (`$`).
- No customer-facing frontend page displays `NGN`, `Naira`, or a `Price in NGN` label.
- Paystack checkout remains in NGN internally after server-side USD-to-NGN conversion.
- Marketplace and dashboard checkout messages only show the USD amount before redirecting to Paystack.
- Admin marketplace upload field is labeled `Price (USD)`.
- Pricing page amounts remain USD.
- Backend conversion and Paystack initialization were not removed; only customer-facing currency messaging was cleaned up.
- Paystack secret key remains backend-only.

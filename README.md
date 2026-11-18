# PayPulse
Multi-role FinTech invoicing and Razorpay billing SaaS featuring integer minor-unit (paise) tax math, state-machine edit guards, idempotent webhook processing, and automated PDF generation.

## Local setup

```bash
docker compose up -d postgres
cp .env.example .env
npm install
npm run migrate
npm run dev
```

Run `npm test` for focused billing, webhook, and PDF tests.

The backend exposes `GET /health`, `POST /webhooks/razorpay`, and `GET /invoices/:id/pdf`.

# Brand Rate V5 — Verified Unlock

This version replaces hosted payment buttons with verified server-side checkout flows.

## What changed
- Brand Rate SVG icon + favicon.
- D1-backed kit records. Calculator payload is copied into D1 before checkout.
- Razorpay Orders API checkout; HMAC signature + payment + order/amount/currency verification before unlock.
- PayPal Orders API checkout; server-side capture + amount/currency/reference verification before unlock.
- Paid access uses a random token. Only its SHA-256 hash is stored in D1.
- `?paid=true` and preview parameters cannot unlock paid content.

## Cloudflare setup
1. Create D1: `npx wrangler d1 create brand-rate`
2. Copy `wrangler.toml.example` to `wrangler.toml` and add the returned database ID.
3. Apply schema: `npx wrangler d1 execute brand-rate --remote --file=schema.sql`
4. In Cloudflare Pages > Settings > Bindings, add D1 binding named `DB`.
5. Add encrypted environment secrets:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `PAYPAL_CLIENT_ID`
   - `PAYPAL_CLIENT_SECRET`
   - optional sandbox: `PAYPAL_API_BASE=https://api-m.sandbox.paypal.com`
6. Deploy the repository to Cloudflare Pages.

## Important
The old Razorpay Payment Button ID and PayPal Hosted Button ID are intentionally not used in V5. Hosted buttons do not give this static app a trustworthy kit-specific server verification path. V5 uses provider order APIs so the backend can verify the exact payment before issuing access.

V5 shows the secure access link immediately after verified payment. Email delivery can be added next with Resend/Postmark so buyers can recover access later.

Deployment refresh after Cloudflare secrets setup.

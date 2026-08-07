# 05 — Commerce rails (checkout, orders, payments)

**Role:** Shared plumbing for Phase 1 storefronts and Phase 2 marketplace. Not a separate customer product — the rails everything sells on.

## What we do today

- Checkout API + client helpers (`src/app/api/tr/checkout`, `src/lib/tr/cartCheckout.ts`, `checkoutProfile.ts`)
- Orders + line items (`src/lib/tr/orders.ts`, owner orders API)
- **Gated live pay:** `TR_CHECKOUT_ENABLED` — when false, WhatsApp order path (`src/lib/tr/whatsapp.ts`, sandbox/`is_sandbox` payment status)
- Discount codes (`discountCodes.ts`, `patch_tr_discount_codes.sql`, panel kampanyalar)
- Fulfillment fields (`patch_tr_order_fulfillment.sql`)
- Owner Web Push for new orders (`patch_tr_owner_push_subscriptions.sql`, `pushNotify.ts`, panel Ayarlar)
- Customer profiles for storefront (`tr_customer_profiles`, registration-source API)
- Admin seed/ops with `TR_ADMIN_SECRET` (`adminAuth.ts`)

## What we will do / direction

- **iyzico** card checkout (sandbox → live) — primary payment path in vision docs
- Multi-boutique cart → split shipments; weekly boutique payouts first, pazaryeri split later
- Enforce mesafeli satış / ön bilgilendirme / iade UX as legal launch blockers
- Turn off WhatsApp interim once card pay + vergi/ETBİS are ready

## Key paths

| Concern | Path |
|---------|------|
| Checkout | `src/lib/tr/cartCheckout.ts`, `src/app/api/tr/checkout/` |
| Orders | `src/lib/tr/orders.ts`, `api/tr/owner/orders` |
| WhatsApp | `src/lib/tr/whatsapp.ts`, `TrWhatsAppOrderButton` |
| Discounts | `src/lib/tr/discountCodes.ts` |
| Schema | `patch_tr_marketplace.sql`, `patch_tr_order_fulfillment.sql`, `patch_tr_discount_codes.sql` |
| Legal ops | `docs/pre-vergi-levhasi-checklist.md`, partnership draft |

## Agent rules of thumb

- Never assume card pay is live — check `TR_CHECKOUT_ENABLED` / platform helpers.
- Owner mutations often use **service role** after owner auth — don’t expose service key client-side.
- Keep marketplace and boutique cart stores from writing into each other’s checkout blindly.
- Tax/legal checklists are ops docs; don’t invent compliance copy without reading existing legal pages/`src/lib/tr/legal/`.

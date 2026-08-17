# 05 — Commerce rails (checkout, orders, payments)

**Role:** Shared plumbing for Phase 1 storefronts and Phase 2 marketplace. Not a separate customer product — the rails everything sells on.

## What we do today

- Checkout API + client helpers (`src/app/api/tr/checkout`, `src/lib/tr/cartCheckout.ts`, `checkoutProfile.ts`, `checkoutValidate.ts`, `checkoutSelection.ts`)
- Server reprice / ownership / stock / size / coupon apply on boutique checkout
- Orders + line items (`src/lib/tr/orders.ts`, `inventory.ts`, owner orders API)
- **Payment modes:** `TR_CHECKOUT_SANDBOX` → sandbox orders; default → **pending** (stock reserved). Card capture when `TR_IYZICO_ENABLED` (not yet). Owner can mark pending → paid until then.
- **Gated Cadde checkout:** `TR_CHECKOUT_ENABLED` — marketplace gating; does **not** equal iyzico live.
- Discount codes (`discountCodes.ts`, `patch_tr_discount_codes.sql`, panel kampanyalar + checkout)
- Fulfillment fields (`patch_tr_order_fulfillment.sql`)
- Order line size + order discount columns (`patch_tr_order_items_size.sql`, `patch_tr_orders_discount.sql`)
- Owner Web Push for new orders (`patch_tr_owner_push_subscriptions.sql`, `pushNotify.ts`, panel Ayarlar)
- Customer profiles for storefront (`tr_customer_profiles` registration-source; `profiles.first_name` / `last_name` / `phone` from boutique signup + Hesabım edit — `patch_tr_customer_profile_fields.sql`; optional signup discovery — `patch_tr_customer_signup_discovery.sql`)
- **Demo shopper orders / tracking** (UI only, not `tr_orders`): `src/lib/tr/commerce/demoShopperOrders.ts` → `/siparisler`, `/siparisler/[id]`, `/siparisler/[id]/takip`. Live takip for UUID orders uses the boutique shipping provider (Lila = Basit Kargo).
- **Per-boutique shipping** (`src/lib/tr/shipping/`): registry by slug. **Lila** = Basit Kargo (her token/balance). **Pervin / clones** = manual stub. Cortisstyle is not the carrier. SQL `supabase/patch_tr_order_shipments.sql`. Webhook `POST /api/tr/shipping/basitkargo/webhook` (Bearer `TR_SHIPPING_BASITKARGO_WEBHOOK_SECRET`).
- **Locked TR address** (`src/lib/tr/geo/turkeyAddress.ts`, `src/data/tr/turkey-cities-districts.json`): checkout il/ilçe are selects; checkout POST rejects free-text junk. Street stays typed (min length).
- **Buyer pays kargo (Lila):** server quotes cheapest pack (`POST /api/tr/shipping/quote` + re-quote on checkout). Client cannot set the fee. After **paid / sandbox**, auto-buy Basit `ECONOMIC` barcode; owner only prints. Quote drift stays on Lila’s Basit balance.
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
| Shipping | `src/lib/tr/shipping/` (registry + Basit Kargo for Lila) |
| Address zones | `src/lib/tr/geo/turkeyAddress.ts` |
| Schema | `patch_tr_marketplace.sql`, `patch_tr_order_fulfillment.sql`, `patch_tr_order_shipments.sql`, `patch_tr_discount_codes.sql` |
| Legal ops | `docs/pre-vergi-levhasi-checklist.md`, partnership draft |

## Agent rules of thumb

- Never assume card pay is live — check `TR_IYZICO_ENABLED` / `isTrIyzicoCaptureEnabled()`. Pending orders are real until capture.
- Owner mutations often use **service role** after owner auth — don’t expose service key client-side.
- Keep marketplace and boutique cart stores from writing into each other’s checkout blindly.
- Tax/legal checklists are ops docs; don’t invent compliance copy without reading existing legal pages/`src/lib/tr/legal/`.

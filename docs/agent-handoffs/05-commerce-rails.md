# 05 — Commerce rails (checkout, orders, payments)

**Role:** Shared plumbing for Phase 1 storefronts and Phase 2 marketplace. Not a separate customer product — the rails everything sells on.

## What we do today

- Checkout API + client helpers (`src/app/api/tr/checkout`, `src/lib/tr/cartCheckout.ts`, `checkoutProfile.ts`, `checkoutValidate.ts`, `checkoutSelection.ts`)
- Server reprice / ownership / stock / size / coupon apply on boutique checkout
- Orders + line items (`src/lib/tr/orders.ts`, `inventory.ts`, owner orders API)
- **Payment modes:** `TR_CHECKOUT_SANDBOX` → sandbox orders; default → **pending** hold (stock reserved). **Lila** iyzico Checkout Form: owner panel / push / ciro only after **SUCCESS**. Cancel/fail **or browser-back / closed tab** restores stock and never lists as a sipariş. Cart stays until paid (`TrIyzicoCheckoutHoldEffects`). Stale unpaid holds (30 min) are released on the next checkout POST (`abandonStaleIyzicoHolds`). Cadde / other boutiques still show pending until their keys exist.
- **Gated Cadde checkout:** `TR_CHECKOUT_ENABLED` — marketplace gating; does **not** equal iyzico live.
- Discount codes (`discountCodes.ts`, `patch_tr_discount_codes.sql`, panel kampanyalar + checkout)
- Fulfillment fields (`patch_tr_order_fulfillment.sql`)
- Order line size + order discount columns (`patch_tr_order_items_size.sql`, `patch_tr_orders_discount.sql`)
- Owner Web Push for new orders (`patch_tr_owner_push_subscriptions.sql`, `pushNotify.ts`, panel Ayarlar)
- Customer profiles for storefront (`tr_customer_profiles` registration-source; `profiles.first_name` / `last_name` / `phone` from boutique signup + Hesabım edit — `patch_tr_customer_profile_fields.sql`; optional signup discovery — `patch_tr_customer_signup_discovery.sql`)
- **Address book** (logged-in): `tr_customer_addresses` — platform account, shared across boutiques. Hesabım → `/adresler`; checkout picker + “Adres defterine kaydet”. Guests still use device `checkoutProfile` localStorage. Do **not** put addresses on `profiles`. SQL `supabase/patch_tr_customer_addresses.sql`. APIs `GET/POST /api/tr/customer/addresses`, `PATCH/DELETE /api/tr/customer/addresses/[id]` (Bearer shopper JWT; service role after `getCustomerUserFromRequest`). Cap 10; one default per user. Same TR il/ilçe validation as checkout.
- **Demo shopper orders / tracking** (UI only, not `tr_orders`): `src/lib/tr/commerce/demoShopperOrders.ts` → `/siparisler`, `/siparisler/[id]`, `/siparisler/[id]/takip`. Live takip for UUID orders uses the boutique shipping provider (Lila = Basit Kargo).
- **Per-boutique shipping** (`src/lib/tr/shipping/`): registry by slug. **Lila** = Basit Kargo (her token/balance). **Pervin / clones** = manual stub. Cortisstyle is not the carrier. SQL `supabase/patch_tr_order_shipments.sql`. Webhook `POST /api/tr/shipping/basitkargo/webhook` (Bearer `TR_SHIPPING_BASITKARGO_WEBHOOK_SECRET`).
- **Locked TR address** (`src/lib/tr/geo/turkeyAddress.ts`, `src/data/tr/turkey-cities-districts.json`): checkout il/ilçe are selects; checkout POST rejects free-text junk. Street stays typed (min length).
- **Buyer pays kargo (Lila):** **120 TL** for 1 item (`FLAT_SHIPPING_FEE_KURUS`); **2+ items free** (`FREE_SHIPPING_MIN_ITEMS` — quantity sum). **Exception:** Midi Jean Elbise twins (Espresso / Navy) — **1 piece is enough** (`isMidiJeanElbiseProduct` in `src/lib/tr/catalog/midiJeanTwins.ts`). `quoteCheckoutShippingFee(slug, itemCount, items)` is the source of truth; pass line titles so the promo applies; client cannot set the fee. After **paid / sandbox**, auto-waterfall cheapest eligible Basit handlers up to **140 TL** (20 TL buffer); skip Yurtiçi / `SELF_*` / meta `ECONOMIC`/`FAST`. Owner prints only. Cart/checkout sticky nudge (`TrFreeShippingNudge`) shows free vs 1/2 progress (click through to shop).
- **Address is view-only** in the panel unless **every eligible buy is an address error** (`shipping_block = address_rejected`). Other Basit failures stay `provider_error` so **Etiket hazırla** can retry. Owner order **list and detail** refresh Basit on load. Print asks Basit first; if the kod was cancelled there, we clear local barcode and switch to **Etiket hazırla** (409 + order). A Basit `NEW` draft may still echo a barcode string after cancel — that is **not** a purchased kod (`hasPurchasedShippingLabel`); do not print it or skip the waterfall. Webhook uses the same persist helper. Then owner WhatsApps the customer, edits once, and we retry the waterfall once (`shipping_address_retry_used`). Second failure → iade (İptal; no iyzico refund yet). SQL `supabase/patch_tr_order_shipping_block.sql`.
- **Insufficient Basit balance** is `shipping_block = insufficient_balance` — not an address reject. Owner tops up and retries **Etiket hazırla**.
- **Panel İptal** cancels a Basit barcode if present, then deletes the Basit draft (`DELETE /v2/order/{id}`) so it does not stay as Yeni Sipariş. If Basit cancel/delete fails, local İptal does not complete.
- **Shipping leaks to keep closed:** never auto-buy over 140 TL; no address edit after barcode / unless `address_rejected` / if retry already used; no public address-edit URL; one in-flight lock per order; don’t fulfill cancelled or refunded; same TR il/ilçe validation on edit; PUT Basit `NEW` order before retry; client cannot set `shippingFeeKurus` or `handlerCode`.
- Admin seed/ops with `TR_ADMIN_SECRET` (`adminAuth.ts`)

## What we will do / direction

- **iyzico** marketplace split / refunds / Cadde capture — Lila is one merchant Checkout Form only
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
| Payments | `src/lib/tr/payments/` (Lila iyzico Checkout Form; callback `/api/tr/checkout/iyzico/callback`) |
| Address zones | `src/lib/tr/geo/turkeyAddress.ts` |
| Address book | `src/lib/tr/commerce/customerAddresses.ts`, `api/tr/customer/addresses` |
| Schema | `patch_tr_marketplace.sql`, `patch_tr_order_fulfillment.sql`, `patch_tr_order_shipments.sql`, `patch_tr_order_shipping_block.sql`, `patch_tr_discount_codes.sql`, `patch_tr_customer_addresses.sql` |
| Legal ops | `docs/boutique-partnership-agreement-draft.md` |

## Agent rules of thumb

- Lila iyzico is **per-boutique env keys** + `boutiqueOffersIyzicoCheckout('lilabutik')`. Do not copy keys into git. Do not set `TR_IYZICO_ENABLED=true` until a live test charge succeeds (sandbox “kart yakında” banner already hides for Lila via the registry).
- iyzico callback is `GET/POST /api/tr/checkout/iyzico/callback?boutique=&order=`. Retrieve `conversationId` is a **request echo**, not the initialize order id — resolve the order from `basketId` (initialize) or the `order` query. Do not treat a blank retrieve `conversationId` as a mismatch.
- Do **not** clear the boutique cart when redirecting to iyzico. Clear **checked-out lines** on sipariş-onay after `paid` (leave other cart items). Browser-back calls `POST /api/tr/checkout/iyzico/abandon` (confirm token + checkout form token): if iyzico already SUCCESS, capture and drop those lines; otherwise restore size stock. If iyzico initialize fails, checkout POST returns 502 and keeps the cart.
- Lila Alıcı Koruması overlay (`TrIyzicoBuyerProtection`) is **homepage only** — do not show the “iyzico ile öde” bar on PDP / PLP / cart. Footer payment logos stay on every storefront page.
- Owner mutations often use **service role** after owner auth — don’t expose service key client-side.
- Keep marketplace and boutique cart stores from writing into each other’s checkout blindly.
- Tax/legal checklists are ops docs; don’t invent compliance copy without reading existing legal pages/`src/lib/tr/legal/`.

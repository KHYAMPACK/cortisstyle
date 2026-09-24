# 05 — Owner panel & commerce rails

**What this is:** the owner-facing product/order management UI (`/tr/panel`) and the money-moving path behind it — cart, checkout, shipping, discounts, payments. This is the highest-traffic surface for both bugs and future feature work, and the one place where "generic vs. fashion-specific" is still genuinely unresolved in several files — read the caveat below before editing panel product forms.

## Owner panel structure

Routes live under `src/app/tr/panel/`, gated by owner auth (`src/lib/tr/ownerAuth.ts`) and Bearer + `owner_user_id` on the API side. What an owner sees is gated by `catalog_profile` capability flags (`src/lib/tr/catalogProfiles/registry.ts` — `showProductsNav`, `showStockNav`, `allowProductRoutes`, `pdpLayout`, `skipStockValidation`, `skipInventoryDecrement`, etc.), not by slug checks.

Product management pages: `urun/yeni` (create wizard), `urun/[id]` (edit form), `urun/takim` (two-piece garment set upload), `urun/toplu` (batch create), `urunler` (list), `stok` (stock table). Order pages: `siparisler` (list/detail). `ayarlar` is boutique settings (brand, WhatsApp, IG, contact — all writing straight to `tr_boutiques` columns).

**Important caveat for anyone editing these:** `TrProductCreateWizard.tsx`, `TrProductEditorForm.tsx`, `TrOwnerGuidedPhotoUpload.tsx`, `TrOwnerBatchCreatePage.tsx` (and its step components), `TrOwnerStorePreview.tsx`, `TrOwnerProductListPage.tsx`, and `TrOwnerStockPage.tsx` are large files (several are 1500+ lines) that interleave **generic** product fields (title, price, stock, images) with **garment-specific** UI (size charts, construction chips, category taxonomy) in the same component. This is known, deliberate technical debt from the fashion-module extraction (see [06-fashion-module.md](./06-fashion-module.md)) — splitting them cleanly is a bigger, riskier job than a file move and was deferred on purpose. Don't assume everything in `src/components/tr/panel/` is generic just because it's not under `src/components/tr/fashion/panel/`.

## Checkout & orders

`POST /api/tr/checkout` creates the order; `TrCheckoutPageContent.tsx` drives the checkout page. Supporting logic: `src/lib/tr/cartCheckout.ts`, `checkoutProfile.ts`, `checkoutValidate.ts`, `checkoutSelection.ts`, `orders.ts`, `inventory.ts` (stock decrement — skipped entirely for `custom_art` per capability flag), `discountCodes.ts`. Checkout re-prices and re-validates server-side; it never trusts client-submitted prices.

Without a live payment integration, checkout creates a **pending** order and the owner marks it paid manually from the panel. `TR_CHECKOUT_SANDBOX` forces this behavior for staging even when a payment integration exists.

## Shipping

**What the shopper pays** is per-boutique DB config, not code: `tr_boutiques.shipping_fee_kurus` (flat fee, 0 = no shipping charge), plus at most one free-shipping threshold — `free_shipping_min_items` (order has N+ items) or `free_shipping_min_subtotal_kurus` (items subtotal, before discounts, reaches N). They are on `tr_boutiques_public` because the cart/checkout/PDP show them. `src/lib/tr/shipping/quoteShipping.ts` turns a boutique's `ShippingFeeConfig` plus the cart lines into a fee; `shippingCopy.ts` builds every piece of shopper-facing shipping text from the same config so it can't drift from what is charged; `settings.ts` validates writes. The server re-quotes from the re-priced catalog lines in `POST /api/tr/checkout` — the client-side numbers are display only. Set it through the intake file (`shippingFeeTry`, `freeShippingMinItems` | `freeShippingMinSubtotalTry`), `PATCH /api/tr/owner/boutiques/[id]`, or the seed route. A boutique with no fee set charges no shipping — `scripts/create-boutique.mts` warns when the intake omits it. `quoteShipping.test.ts` (run `npm test`) pins lilabutik's exact rules (120 TL, free at 2+ items) and the shopper-facing copy. The rule is identical for every product in the cart. There is **no per-product shipping exception** — one existed (`midiJeanTwins.ts`, hardcoding free shipping for two specific dresses) and was deleted because it was a core-code-reaching-into-a-specific-product violation. If a future promo needs product-specific shipping behavior, it needs a generic DB-backed mechanism, not a name/id match in this file.

**The carrier integration is a separate thing.** `src/lib/tr/shipping/registry.ts` (`SHIPPING_BY_SLUG`, `boutiqueHasCarrierIntegration()`) still gates which boutiques have a live Basit Kargo integration (label purchase, tracking) — currently just `lilabutik`, and it is still a per-slug code touch (roadmap P4-T2 moves it to per-boutique credentials). Boutiques without one use their own carrier: the owner updates the order status by hand (there is no tracking-code entry yet — roadmap P4-T3). `AUTO_BUY_FEE_CAP_KURUS` (`shipping/types.ts`) is the carrier label spend cap and is likewise Lila-only until P4-T2. Basit Kargo webhook: `src/app/api/tr/shipping/basitkargo/webhook/route.ts`.

## Payments (iyzico)

`src/lib/tr/payments/registry.ts` is the read path for "does this boutique take card payments and with what credentials" — `boutiqueOffersIyzicoCheckout()`, `getIyzicoBuyerProtection()`, `getIyzicoCredentials()`. Purely DB-backed: reads `tr_boutique_integrations` (credentials AES-256-GCM encrypted via `credentialEncryption.ts`) and returns `null`/`false` if no row exists. There is no env-var fallback — that legacy path (`IYZICO_CHECKOUT_SLUGS`, `IYZICO_BUYER_PROTECTION_BY_SLUG`, `CREDENTIAL_ENV_BY_SLUG`) was removed once lilabutik's real credentials were migrated into the table and verified against live production checkout (2026-09-23). A boutique with no `tr_boutique_integrations` row simply doesn't offer iyzico checkout — that's not a bug to route around, it's the correct state until someone adds a row (`scripts/migrate-lilabutik-iyzico-credentials.mts` is a worked example of how, though it's slug-specific and would need generalizing for a second boutique).

Checkout iyzico flow: `src/app/api/tr/checkout/iyzico/{start,abandon,callback}/route.ts`.

## Code map

| Concern | Path |
|---|---|
| Owner auth | `src/lib/tr/ownerAuth.ts`, `src/lib/tr/panel/ownerClient.ts` |
| Panel nav / capability gating | `src/lib/tr/panelNav.ts`, `src/lib/tr/catalogProfiles/registry.ts` |
| Product create/edit | `src/components/tr/panel/TrProductCreateWizard.tsx`, `TrProductEditorForm.tsx` |
| Batch / takım upload | `src/components/tr/panel/TrOwnerBatchCreatePage.tsx`, `TrOwnerTakimCreatePage.tsx` |
| Stock / product list | `src/components/tr/panel/TrOwnerStockPage.tsx`, `TrOwnerProductListPage.tsx` |
| Settings | `src/components/tr/panel/TrOwnerSettingsPage.tsx` |
| Checkout | `src/app/api/tr/checkout/route.ts`, `src/components/tr/commerce/TrCheckoutPageContent.tsx` |
| Orders / inventory | `src/lib/tr/orders.ts`, `src/lib/tr/inventory.ts` |
| Discount codes | `src/lib/tr/discountCodes.ts` |
| Shipping | `src/lib/tr/shipping/quoteShipping.ts`, `shippingCopy.ts`, `settings.ts` (fee rules); `registry.ts` (carrier integration) |
| Payments | `src/lib/tr/payments/registry.ts` |

## Related

- Tenant model & onboarding: [03-multi-tenant-boutiques.md](./03-multi-tenant-boutiques.md)
- Storefront rendering: [04-storefront-editorial-home.md](./04-storefront-editorial-home.md)
- Fashion vertical (owns the garment-specific parts of the panel forms above): [06-fashion-module.md](./06-fashion-module.md)
- AI-assisted listing creation (the pipeline behind the create wizard's photo upload): [08-ai-catalog-pipeline.md](./08-ai-catalog-pipeline.md)

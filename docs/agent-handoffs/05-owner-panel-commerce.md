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

`src/lib/tr/shipping/quoteShipping.ts` — flat fee, free at `FREE_SHIPPING_MIN_ITEMS`, identical for every product in the cart. There is **no per-product shipping exception** — one existed (`midiJeanTwins.ts`, hardcoding free shipping for two specific dresses) and was deleted because it was a core-code-reaching-into-a-specific-product violation. If a future promo needs product-specific shipping behavior, it needs a generic DB-backed mechanism, not a name/id match in this file.

`src/lib/tr/shipping/registry.ts` (`SHIPPING_BY_SLUG`) still gates which boutiques have "live" (non-manual) shipping at all — currently just `lilabutik`. Basit Kargo webhook: `src/app/api/tr/shipping/basitkargo/webhook/route.ts`.

## Payments (iyzico)

`src/lib/tr/payments/registry.ts` is the read path for "does this boutique take card payments and with what credentials" — `boutiqueOffersIyzicoCheckout()`, `getIyzicoBuyerProtection()`, `getIyzicoCredentials()`. **DB-first**: reads `tr_boutique_integrations` (credentials AES-256-GCM encrypted) before falling back to hardcoded `TR_LILABUTIK_IYZICO_*` env vars. The env-var fallback exists only until every live boutique has a verified integrations row — treat it as scaffolding being phased out, not the primary mechanism, when reading or writing this file.

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
| Shipping | `src/lib/tr/shipping/quoteShipping.ts`, `registry.ts` |
| Payments | `src/lib/tr/payments/registry.ts` |

## Related

- Tenant model & onboarding: [03-multi-tenant-boutiques.md](./03-multi-tenant-boutiques.md)
- Storefront rendering: [04-storefront-editorial-home.md](./04-storefront-editorial-home.md)
- Fashion vertical (owns the garment-specific parts of the panel forms above): [06-fashion-module.md](./06-fashion-module.md)
- AI-assisted listing creation (the pipeline behind the create wizard's photo upload): [08-ai-catalog-pipeline.md](./08-ai-catalog-pipeline.md)

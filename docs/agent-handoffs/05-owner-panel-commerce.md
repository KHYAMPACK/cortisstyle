# 05 — Owner panel & commerce rails

**What this is:** the owner-facing product/order management UI (`/tr/panel`) and the money-moving path behind it — cart, checkout, shipping, discounts, payments. This is the highest-traffic surface for both bugs and future feature work, and the one place where "generic vs. fashion-specific" is still genuinely unresolved in several files — read the caveat below before editing panel product forms.

## Owner panel structure

Routes live under `src/app/tr/panel/`, gated by owner auth (`src/lib/tr/ownerAuth.ts`) and Bearer + `owner_user_id` on the API side. What an owner sees is gated by `catalog_profile` capability flags (`src/lib/tr/catalogProfiles/registry.ts` — `showProductsNav`, `showStockNav`, `allowProductRoutes`, `pdpLayout`, `skipStockValidation`, `skipInventoryDecrement`, etc.), not by slug checks.

Product management pages: `urun/yeni` (create wizard), `urun/[id]` (edit form), `urun/takim` (two-piece garment set upload), `urun/toplu` (batch create), `urunler` (list), `stok` (stock table). Order pages: `siparisler` (list/detail). `ayarlar` is boutique settings (brand, WhatsApp, IG, contact — all writing straight to `tr_boutiques` columns).

**Important caveat for anyone editing these:** `TrProductCreateWizard.tsx`, `TrProductEditorForm.tsx`, `TrOwnerGuidedPhotoUpload.tsx`, `TrOwnerBatchCreatePage.tsx` (and its step components), `TrOwnerStorePreview.tsx`, `TrOwnerProductListPage.tsx`, and `TrOwnerStockPage.tsx` are large files (several are 1500+ lines) that interleave **generic** product fields (title, price, stock, images) with **garment-specific** UI (size charts, construction chips, category taxonomy) in the same component. This is known, deliberate technical debt from the fashion-module extraction (see [06-fashion-module.md](./06-fashion-module.md)) — splitting them cleanly is a bigger, riskier job than a file move and was deferred on purpose. Don't assume everything in `src/components/tr/panel/` is generic just because it's not under `src/components/tr/fashion/panel/`.

## Panel shell & navigation (how pages load — follow this for every new page)

**The shell mounts once.** `TrPanelShell` (`src/components/tr/panel/TrPanelShell.tsx`) is rendered by `src/app/tr/panel/layout.tsx`. It owns sign-in, the boutique list, the sidebar / mobile chrome, order alerts, and the leave-guard and restyle-session providers, and it stays mounted while the user moves between panel pages — only the page slot below it changes. It used to be mounted *by each page* (via `TrOwnerPanelGate`), which tore the sidebar down, showed a skeleton and re-fetched the boutique list on every click; that was the whole "not instant" feeling. A page must never mount its own shell.

**Pages read the shell, they don't build it.** `TrOwnerPanelGate` is now only a consumer: `<TrOwnerPanelGate>{({ activeBoutique }) => …}</TrOwnerPanelGate>` hands the page the active boutique, the boutique list, `isStaff` and `setActiveBoutiqueId` (the same shape as before, so pages didn't change). Add a new panel page as a route under `src/app/tr/panel/` that renders a client component wrapped in it — nothing else.

**How a click stays fast:**
1. **Prefetch the whole route.** Panel routes are dynamic, so `prefetch="auto"` only fetches down to the loading boundary and the click still waits on the server. Nav links use `prefetch` (full route, cached 5 min by the client router — no global `staleTimes` change, so the storefront's no-cache behavior is untouched). In-page links use `TrPanelLink` (`TrPanelLink.tsx`), which arms the same full prefetch on hover, focus or touch so a long list doesn't prefetch every row on load. **Use `TrPanelLink`, not `next/link`, for panel links.** Prefetching only runs in production builds — judge speed on `npm run build && npm start` or a deploy, not on `npm run dev`.
2. **Optimistic active state.** `TrPanelNavLinks` moves the active pill on click, before the route commits. It is tied to the path it was clicked from, so it stops applying on its own once the real path changes. A navigation the leave guard blocks never reaches the click handler (the guard stops it in the capture phase), so the pill can't get ahead of a blocked click.
3. **No exit animation.** `app/tr/panel/template.tsx` re-mounts per navigation and replays a 140 ms opacity-only fade (`.tr-panel-enter` in `globals.css`); nothing waits for the old page to leave. Opacity only — a transform on that wrapper breaks `position: sticky` descendants (list filters).
4. **Instant fallback.** `app/tr/panel/loading.tsx` shows a skeleton in the page slot the moment a navigation starts if the route wasn't prefetched; the shell stays put.
5. **Data is cached separately** in `src/lib/tr/panel/ownerCache.ts` (20 s, in-flight de-duplication, prefix invalidation). Fetch through `cachedOwnerFetch` so a revisit renders immediately.

**Sidebar.** Collapses to a 64 px icon rail (state remembered in `localStorage` via `panelSidebarState.ts` → `usePanelStoredFlag` in `panelStoredFlag.ts`, read with `useSyncExternalStore` so hydration stays clean; reuse that hook for any other remembered on/off preference). The active pill and accent bar slide between items (framer-motion `layoutId`, scoped per instance). Nav rows and footer actions share `panelSidebarRowClass` in `panelUi.ts`, so hover/focus/spacing can't drift. The shell publishes the current width as `--panel-sidebar-w`; anything positioned against the sidebar (the wizard's sticky action bar) must use that variable, never a hard-coded 232 px.

**Panel-wide state that persists across pages** (because it lives in the shell): the leave guard and the AI restyle session (`TrOwnerElbiseRestyleSession`). Pages release their leave-guard registration on unmount (`useRegisterLeaveBusy` cleans up), so a persistent guard is safe.

## Home dashboard (Giriş)

`TrOwnerHomePage.tsx` composes the panel home from `src/components/tr/panel/dashboard/`: a sticky toolbar (date-range menu, "Önceki döneme göre" compare switch, Raporlar link, "Mağazayı aç"), a KPI strip whose selected KPI drives the trend chart and a footer under it that splits that same KPI into fixed slices (Kart ile ödeme, Havale / manuel ödeme, İndirimli siparişler — `TrDashboardKpis.segments`; card and manual add up to the total, discounted orders overlap both), best sellers (products / categories), growth metrics, recent orders, and a floating action pill (orders to ship, manual payments awaiting approval, low stock — dismissible, cycles when there are several). The structure follows the reference admin; colours and the accent are ours. There is no visitor/session analytics in the schema, so those widgets are deliberately absent — Yeni Müşteri, Ödeme Tamamlama Oranı and İptaller stand in for them.

**Data flow.** `GET /api/tr/owner/dashboard?boutiqueId&range[&from&to]` → `ownerDashboard.ts` loads the boutique's orders and products and calls the pure `computeOwnerDashboard` (`dashboardMetrics.ts`). The client reads it through `fetchOwnerDashboard` / `peekOwnerDashboard` in `ownerClient.ts` (cached under `dashboard:` keys, invalidated with the order and product lists). Aggregation is in memory — fine for a boutique's order volume; at tens of thousands of orders replace `ownerDashboard.ts` with SQL aggregation returning the same `TrOwnerDashboard` and the UI does not change.

**Definitions live in one place — the header of `dashboardMetrics.ts` (tests in `dashboardMetrics.test.ts`).** Revenue and order count are paid, non-cancelled, non-test orders; revenue is the boutique's own line total minus its share of the order discount, shipping excluded (the same rule as the Raporlar summary — both use `orderRevenue.ts`). A new customer is one whose first paid order overall (lower-cased email) falls in the window. İptal is an order that was paid and then cancelled. Payment completion exists only for card-enabled boutiques: card-paid ÷ (card-paid + failed + pending checkouts). Card vs manual is decided by whether the order has an iyzico payment id.

**Date ranges** (`dashboardRange.ts`, tests in `dashboardRange.test.ts`) use Europe/Istanbul as a constant UTC+3. Calendar ranges (Bu Hafta / Bu Ay / Bu Yıl…) compare against the same elapsed span of the previous unit; rolling ranges (Son 7 Gün…) compare against the equal-length window before. Bucket size (hour / day / week / month) follows the span. Custom ranges are validated server-side (real dates, not in the future, at most a year).

**Adding a KPI:** add the field to `TrDashboardKpis` and its computation in `dashboardMetrics.ts` (with a test), then add a row to `TR_DASHBOARD_METRICS` in `dashboard/dashboardFormat.ts` if it should drive the chart. A chart KPI must also live on `TrDashboardSegmentKpis` (computed in `summarize`) so the footer can show it per slice. Raporlar (`TrOwnerReportsPage.tsx`) still uses the older `ownerSummary.ts`.

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
| Home dashboard | `src/components/tr/panel/TrOwnerHomePage.tsx`, `src/components/tr/panel/dashboard/`, `src/lib/tr/panel/dashboardMetrics.ts`, `dashboardRange.ts`, `ownerDashboard.ts`, `src/app/api/tr/owner/dashboard/route.ts` |
| Panel shell / navigation | `src/app/tr/panel/layout.tsx`, `template.tsx`, `loading.tsx`, `src/components/tr/panel/TrPanelShell.tsx`, `TrPanelNavLinks.tsx`, `TrPanelDesktopSidebar.tsx`, `TrPanelLink.tsx`, `panelUi.ts` |
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

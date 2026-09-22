# 04 — Storefront & editorial home

**What this is:** how a resolved boutique (see [03-multi-tenant-boutiques.md](./03-multi-tenant-boutiques.md)) actually renders as a public storefront — home page, category browsing, PDP, cart/favorites. This is UI-shell concern, not tenant resolution or commerce logic (checkout/orders live in [05-owner-panel-commerce.md](./05-owner-panel-commerce.md)).

## Two layout axes, don't confuse them

- **`home_layout`** (DB column on `tr_boutiques`, `"default"` | `"editorial"`) — picks the whole storefront shell. `"default"` is the Cadde-marketplace-style layout (shared cross-boutique cart/browse — see [09-cadde-marketplace.md](./09-cadde-marketplace.md)). `"editorial"` is a standalone boutique shell with its own local cart/favorites, own `giris`/`sepet`/`odeme`/`siparis-onay`/`yasal` routes. New boutiques should almost always use `"editorial"` unless they're meant to sell inside Cadde. Resolved by `resolveBoutiqueHomeLayout()` in `src/lib/tr/boutiqueHome/registry.ts` — the function itself says the DB column is the source of truth.
- **Editorial skin** (`"classic"` | `"atelier"`, `src/lib/tr/boutiqueHome/editorialSkin.ts`) — a *visual* choice within the editorial layout, resolved by a hardcoded `SLUG_SKINS` map with no DB equivalent. `lilabutik` is `"atelier"`; everything else defaults to `"classic"`. This is one of the few remaining per-slug code touches (see doc 03).

## Editorial home content

`src/lib/tr/boutiqueHome/editorialContent.ts` builds the home page content by merging code-owned defaults (`buildBoutiqueEditorialDefaults()`) with the boutique's `editorial_content` jsonb column. Shape is defined in `editorialDemoContent.ts` (`EditorialDemoContent`, `EditorialNavItem`, `EditorialHeroPromotion`, `EditorialCampaignAction`, `EDITORIAL_SALE_RED`).

`demo-maya` isn't a real boutique — it never made it past a demo — but its stock photography is still served as shared template assets (`TEMPLATE_ASSET = (name) => \`/tr/boutiques/demo-maya/${name}\``) for every editorial-skin boutique, including lilabutik. Don't delete `public/tr/boutiques/demo-maya/`.

**Cautionary example, worth knowing before you add anything product-specific here:** a previous feature (`midiJeanTwins.ts`) hardcoded a single product-name match ("Midi Jean Elbise") directly into the homepage builder, the cart page, checkout shipping, and PDP returns copy, to special-case free shipping and a homepage "twin story" section for two specific dresses. It was deleted outright once found, because it was a real core→fashion-specific-product boundary violation, not a relocatable one. If you need boutique- or product-specific promotional behavior, it needs a generic mechanism (a DB flag, a campaign config) — not a name match baked into shared UI code.

## Category browsing

There is currently **no generic category-tree system** — every category-browsing component (`TrBoutiqueCategoryDrawer`, `TrBoutiqueProductGrid`, `TrBoutiqueCatalogContext`, the `TrBoutiqueAtelier*`/`TrBoutiqueEditorial*` PLP components under `src/components/tr/boutique/`) reads directly from the fashion module's Turkish garment taxonomy (`src/lib/tr/fashion/categories.ts`). This is intentional debt, not an oversight: `custom_art` (minimora) has zero category concept today, so building an unused multi-vertical category registry would be premature. If a second vertical ever needs real categories, that's when the registry gets built — see [06-fashion-module.md](./06-fashion-module.md) for the module-boundary reasoning.

## Product detail page (PDP)

`src/components/tr/product/TrProductDetailPanel.tsx` is the render choke point — it renders the fashion-specific size chart/model-measurement components (`src/components/tr/fashion/pdp/`) and the mixed `TrBoutiquePdpInfoSections` (generic accordion layout, garment-specific care-instructions content inside it). `custom_art` boutiques render a different panel, `TrCustomArtProductPanel` (`src/components/tr/boutique/pdp/`), gated by `catalog_profile` through the capability-flags in `src/lib/tr/catalogProfiles/`.

## Local cart & favorites

Editorial-layout boutiques keep cart/favorites in `localStorage`, scoped per boutique slug — `src/store/trBoutiqueLocalCartStore.ts`, `trBoutiqueLocalFavoritesStore.ts`. This is deliberately separate from the Cadde platform cart (`trCartStore.ts`) — never merge them. `TrBoutiqueCommerceScope.tsx` wraps the editorial shell to provide this scoping.

## Contact email & delivery copy

`resolveBoutiqueContactEmail()` (`src/lib/tr/commerce/checkoutMode.ts`) resolves the boutique's support email: DB `contact_email` first, then `info@{customDomain}`, then a platform default. Delivery/returns copy on the PDP comes from `src/lib/tr/catalog/pdpReturns.ts` — flat shipping-fee copy only, no per-product exceptions (see the `midiJeanTwins` note above for why).

## Code map

| Concern | Path |
|---|---|
| Home layout resolution | `src/lib/tr/boutiqueHome/registry.ts`, `types.ts` |
| Editorial skin | `src/lib/tr/boutiqueHome/editorialSkin.ts` |
| Editorial content builder | `src/lib/tr/boutiqueHome/editorialContent.ts`, `editorialDemoContent.ts` |
| Editorial home sections (atelier) | `src/components/tr/boutique/editorial/TrBoutiqueAtelierHomeSections.tsx` |
| Cart page | `src/components/tr/boutique/editorial/TrBoutiqueCartPageContent.tsx` |
| Category browsing | `src/components/tr/boutique/TrBoutiqueCategoryDrawer.tsx`, `TrBoutiqueProductGrid.tsx`, `TrBoutiqueCatalogContext.tsx` |
| PDP shell | `src/components/tr/product/TrProductDetailPanel.tsx`, `src/components/tr/boutique/pdp/TrBoutiquePdpInfoSections.tsx` |
| Fashion-specific PDP pieces | `src/components/tr/fashion/pdp/` (size chart, model measurements) |
| Custom-art PDP | `src/components/tr/boutique/pdp/TrCustomArtProductPanel.tsx` |
| Local cart / favorites | `src/store/trBoutiqueLocalCartStore.ts`, `trBoutiqueLocalFavoritesStore.ts` |
| Commerce scope wrapper | `src/components/tr/boutique/TrBoutiqueCommerceScope.tsx` |
| Delivery/returns copy | `src/lib/tr/catalog/pdpReturns.ts` |

## Related

- Tenant model & onboarding: [03-multi-tenant-boutiques.md](./03-multi-tenant-boutiques.md)
- Checkout/orders/shipping: [05-owner-panel-commerce.md](./05-owner-panel-commerce.md)
- Fashion vertical (category taxonomy owner): [06-fashion-module.md](./06-fashion-module.md)
- Custom-art vertical: [07-custom-art-module.md](./07-custom-art-module.md)
- The separate Cadde marketplace surface: [09-cadde-marketplace.md](./09-cadde-marketplace.md)

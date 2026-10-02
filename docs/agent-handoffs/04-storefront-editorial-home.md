# 04 — Storefront & editorial home

**What this is:** how a resolved boutique (see [03-multi-tenant-boutiques.md](./03-multi-tenant-boutiques.md)) actually renders as a public storefront — home page, category browsing, PDP, cart/favorites. This is UI-shell concern, not tenant resolution or commerce logic (checkout/orders live in [05-owner-panel-commerce.md](./05-owner-panel-commerce.md)).

## Every boutique is the editorial shell now

The cross-boutique "Cadde" marketplace (shared browse/cart across boutiques) was retired along with its whole route tree. Every boutique now renders through the standalone editorial shell — its own local cart/favorites, own `giris`/`sepet`/`odeme`/`siparis-onay`/`yasal` routes. There is no layout switch any more: the old `resolveBoutiqueHomeLayout()` / `resolveStorefrontTheme()` registries (which always returned `"editorial"`) and the `tr_boutiques.home_layout` column were removed. If a genuine second layout ever returns, add it as a real theme model (roadmap P5-T1) rather than reviving a per-boutique layout flag. The DB column was dropped in production on 2026-09-24 via `supabase/patch_drop_tr_boutiques_home_layout.sql` (applied by hand after the app version that stopped reading it was deployed).

- **Editorial skin** (`"classic"` | `"atelier"`, `src/lib/tr/boutiqueHome/editorialSkin.ts`) — a *visual* choice within the editorial layout, resolved by a hardcoded `SLUG_SKINS` map with no DB equivalent. `lilabutik` is `"atelier"`; everything else defaults to `"classic"`. This is one of the few remaining per-slug code touches (see doc 03).

## Editorial home content

`src/lib/tr/boutiqueHome/editorialContent.ts` builds the home page content by merging code-owned defaults (`buildBoutiqueEditorialDefaults()`) with the boutique's `editorial_content` jsonb column. Shape is defined in `editorialDemoContent.ts` (`EditorialDemoContent`, `EditorialNavItem`, `EditorialHeroPromotion`, `EditorialCampaignAction`, `EDITORIAL_SALE_RED`).

`demo-maya` isn't a real boutique — it never made it past a demo — but its stock photography is still served as shared template assets (`TEMPLATE_ASSET = (name) => \`/tr/boutiques/demo-maya/${name}\``) for every editorial-skin boutique, including lilabutik. Don't delete `public/tr/boutiques/demo-maya/`.

**Cautionary example, worth knowing before you add anything product-specific here:** a previous feature (`midiJeanTwins.ts`) hardcoded a single product-name match ("Midi Jean Elbise") directly into the homepage builder, the cart page, checkout shipping, and PDP returns copy, to special-case free shipping and a homepage "twin story" section for two specific dresses. It was deleted outright once found, because it was a real core→fashion-specific-product boundary violation, not a relocatable one. If you need boutique- or product-specific promotional behavior, it needs a generic mechanism (a DB flag, a campaign config) — not a name match baked into shared UI code.

## Category browsing

**Categories go through one seam, `TrStorefrontTaxonomy`** (`src/lib/tr/categories/taxonomy.ts`). Storefront components never import `fashion/categories.ts` directly; they call `useStorefrontTaxonomy()` (`src/components/tr/boutique/TrBoutiqueTaxonomy.tsx`) and use its `label`, `roots`, `navChildren`, `isMatch`, `shopAllLabel`… The boutique layout loads the boutique's own `tr_categories` (`loadStorefrontTaxonomyNodes`; empty on error, so the menu is empty rather than broken) and builds `customTaxonomy(nodes)`; there is no built-in fallback any more (F1, 2026-10-02). Plain helpers take the taxonomy as a parameter (`homeCategoryRows.ts`, `pickRelatedProducts`, `getEditorialContent(boutique, taxonomy)`). **Category pages are `/kategori/<slug>`** and render the store's own PLP (`categoryId` + `categoryScope` props; `catalog/plpLocation.ts` builds the addresses: category in the path, filters in the query); `/urunler?kategori=x` permanently redirects there. When adding a category-aware storefront component, use the hook, not `fashion/categories.ts`.

## Product detail page (PDP)

`src/components/tr/product/TrProductDetailPanel.tsx` is the render choke point — it renders the fashion-specific size chart/model-measurement components (`src/components/tr/fashion/pdp/`) and the mixed `TrBoutiquePdpInfoSections` (generic accordion layout, garment-specific care-instructions content inside it). `custom_art` boutiques render a different panel, `TrCustomArtProductPanel` (`src/components/tr/boutique/pdp/`), gated by `catalog_profile` through the capability-flags in `src/lib/tr/catalogProfiles/`.

## Local cart & favorites

Every boutique keeps cart/favorites in `localStorage`, scoped per boutique slug — `src/store/trBoutiqueLocalCartStore.ts`, `trBoutiqueLocalFavoritesStore.ts`. `TrBoutiqueCommerceScope.tsx` wraps the editorial shell to provide this scoping via `useTrScopedCart()`/`useTrScopedFavorites()`; every boutique route renders inside this provider, so there is no other cart/favorites path to keep in sync with.

## Contact email & delivery copy

`resolveBoutiqueContactEmail()` (`src/lib/tr/commerce/checkoutMode.ts`) resolves the boutique's support email: DB `contact_email` first, then `info@{customDomain}`, then a platform default. Delivery/returns copy on the PDP comes from `src/lib/tr/catalog/pdpReturns.ts` — flat shipping-fee copy only, no per-product exceptions (see the `midiJeanTwins` note above for why).

## Code map

| Concern | Path |
|---|---|
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

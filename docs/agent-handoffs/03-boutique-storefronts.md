# 03 — Boutique storefronts (Phase 1)

**Business job:** Get boutiques off WhatsApp/Shopier-only selling onto a branded site we host — first step into ecommerce.

## What we do today

- Per-tenant storefront at `/tr/[boutiqueSlug]` (home, PLP, PDP, local cart, checkout, legal, login)
- **Custom domains** rewrite storefront paths into `/tr/{slug}/…` (`src/lib/tr/customDomain.ts` + middleware). **Origin crawler files** (`/sitemap.xml`, `/robots.txt`, `/.well-known/`, …) **passthrough** so Search Console works on every boutique host — do not add a per-tenant sitemap route. Cadde (`/tr`, other slugs) is not served on a white-label host.
- **Storefront themes** — same panel/APIs for all; **unique UI per boutique** via theme packs / editorial skins (Pervin = `classic` editorial; Lila = `atelier` skin). See [lila-butik-e-ticaret-setup.md](../lila-butik-e-ticaret-setup.md). Do not skin with `if (slug)` inside one chrome tree.
- **Editorial** home/PDP templates via registries (`src/lib/tr/boutiqueHome/`, `boutiquePdp/`) — moving toward `storefront/themes/{id}/`
- **PDP extras (all boutiques):** size chart modal (letter XS–3XL vs numeric 24–40), AI-filled **Ürün özellikleri**, category **Yıkama talimatı** registry, **İade & Teslimat** from boutique `shippingNote` / `exchangePolicy`. Not Cadde `/tr/parca`.
- **Owner panel** at `/tr/panel` — primary nav: Ana Sayfa · Siparişler · Ürünler · Stok · Müşteriler · Kampanyalar · Raporlar · Ayarlar · Faturalar (`src/lib/tr/panel/panelNav.ts`). **Yeni ürün** is a list/home CTA (`/tr/panel/urun/yeni`), not a sidebar item. **İçerik** (`/tr/panel/icerik`) stays a URL-only route until pack UI ships.
- Owner APIs: `src/app/api/tr/owner/*` authenticated via boutique `owner_user_id`
- Onboarding seeds: `scripts/seed-pervinsoysalbutik.*`, `src/data/tr/pervinsoysalbutik-seed.json`
- Brand fields: WhatsApp/IG, theme, commission, option presets, stock, compare-at pricing

## What we will do / direction

- Onboard more boutiques with vergi levhası + signed contract (ops; see roadmap)
- Strengthen editorial templates without turning into generic card grids
- Keep boutique-local cart separate from marketplace platform cart
- Grow owner panel into real day-to-day ops (fulfillment, discounts, catalog quality)
- **Later:** store boutique storefront photos (backgrounds) as WebP/JPEG; keep packshot cutouts PNG — [15-boutique-storefront-image-formats.md](./15-boutique-storefront-image-formats.md)

## Key paths

| Concern | Path |
|---------|------|
| Routes | `src/app/tr/[boutiqueSlug]/`, `src/app/tr/panel/` |
| UI | `src/components/tr/boutique/`, `src/components/tr/panel/` |
| Data | `src/lib/tr/boutiques.ts`, `products.ts`, `storefront.ts`, `publicData.ts` |
| Auth | `src/lib/tr/ownerAuth.ts`, `ownerClient.ts` |
| URLs | `src/lib/tr/paths.ts` (`trBoutiquePath`, product paths) |
| Domain | `src/lib/tr/customDomain.ts` (`BOUTIQUE_DOMAIN_ORIGIN_PASSTHROUGH_PATHS` — sitemap/robots for all custom domains) |
| Types | `src/types/tr-marketplace.ts` |
| Schema | `supabase/patch_tr_marketplace.sql` + `patch_tr_boutique_*`, `patch_tr_product_*` (`patch_tr_product_features.sql` for PDP specs) |
| Platform credit (Ekiz Yazılım) | `TrPlatformCredit` + `src/lib/platform/platformCredit.ts` — all boutique footers |

## Agent rules of thumb

- Tenant boundary is `boutique_id` / slug — never leak another boutique’s products in owner APIs.
- New origin file for Google/Apple (sitemap, ads.txt, `/.well-known/…`)? Add it once to `BOUTIQUE_DOMAIN_ORIGIN_PASSTHROUGH_PATHS` (or `/.well-known/` prefix). Do **not** add `xml` to the static-asset regex — Merchant `/feeds/*.xml` must still rewrite.
- Do not add **Yeni ürün** or **İçerik** back to `TR_PANEL_NAV`. Keep Yeni ürün as the Ürünler/home CTA; keep İçerik as a route until pack UI ships.
- Prefer extending **boutiqueHome / boutiquePdp registries** over forking a new layout per client.
- Boutique cart: `src/store/trBoutiqueLocalCartStore.ts` (not the Cadde platform cart).
- Demo/editorial content (`demo-maya`, `editorialDemo*`) is placeholder — don’t treat as production inventory.

## Clone / health / design

- Audit (Pervin as reference tenant): [08-boutique-audit-pervin.md](./08-boutique-audit-pervin.md)
- Onboard next boutique (system checklist): [09-boutique-clone-playbook.md](./09-boutique-clone-playbook.md)
- External visual inspiration / **storefront templates** (1 Balmoral, 2 Cecilie, 3 Marine Layer — pick by catalog/vibe, numbers ≠ priority): [10-boutique-design-inspiration.md](./10-boutique-design-inspiration.md)

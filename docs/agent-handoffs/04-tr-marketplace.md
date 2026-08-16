# 04 — TR marketplace / Cadde (Phase 2)

**Business job:** Multi-tenant pazaryeri where customers discover **looks** and pieces across boutiques, not only visit one store.

## What we do today

- Route group `src/app/tr/(marketplace)/` with marketplace chrome (`TrMarketplaceChrome`)
- Surfaces: home `/tr`, lookbook `/tr/kombinler`, products, search, favorites, boutiques directory, look PDP `/tr/kombin/[slug]`, piece routes, cart/checkout aliases
- Cross-boutique **looks** composed from pieces (`src/lib/tr/looks/`)
- Platform cart store (`src/store/trCartStore.ts`) distinct from boutique-local cart
- Public catalog reads via `src/lib/tr/publicData.ts` / mappers
- Demo catalog fallback when live inventory is empty (`isTrDemoCatalogActive` in `platform.ts`)
- Geo entry from main site into `/tr`
- Cadde home `/tr` has a photo-stack intro (`CaddeIntroStack` via `IntroLoader`). Frames are dedicated JPEGs in `public/images/tr/intro/` (`caddeIntro.ts`) — do not point the loader at lookbook PNGs. Boutique custom-domain intro stays the logo mask. Do **not** run the Cadde stack on `/tr/[slug]`, `/tr/panel`, or white-label hosts.
- Cadde home hero is a Serotoninn-style torn split (`CaddeSplitHero`): two waist-up PhotoRoom cutouts (Ayla + Lila, black dress) in `public/images/tr/hero/campaign/`. After the intro lifts, an intact color sheet folds top-to-bottom to reveal the split and type. A two-line slogan (`KENDI` / `KOMBININ` · `TARZIN`) is clipped to the same tear — red on the intact side, white on the torn side. **Mobile** uses that as the only type, plus `[ Kombinler ]`. **Desktop** also keeps the CORTIS/STYLE lockup (left) and “Kendi kombinin” (right); the split slogan sits smaller and lower. The Kombinler block is a raised sheet that slides up over the sticky hero on scroll. Try-on with `npm run tr:generate-cadde-hero`, then `npm run tr:prepare-cadde-hero`. Keep the pose cap at 2 until we add more house models.
- Cadde marketplace chrome (`TrMarketplaceChrome`) plays a Serotoninn-style page curtain (`CaddePageTransition`) on **major** in-Cadde hops (home, lookbook, look, piece, PLP, search, boutiques, favorites) via `TrSoftNavLink`, product cards, and Geri. Same-page filters/hashes and cart/checkout skip it. Boutique `/tr/[slug]`, panel, and custom domains do **not** mount this overlay. Floating chrome (wordmark, menu, Ara/Sepet) uses `mix-blend-difference` on white ink so it flips against the hero and ice floor — same trick as the intro wordmark. Account dropdown stays solid.
- Cadde **below-fold / inner pages** match the torn hero + Serotoninn catalog: Anton display, Oswald labels, hero red `#E10600` (`cadde-red` / `CADDE_HERO_SLOGAN_RED`), hairline black rules, numbered kickers (`01. Kombinler`), bracket CTAs (`[ Ürünlere git ]`). Tokens live in `lib/tr/marketplace/caddeUi.ts`. **Do not** change `CaddeSplitHero` or global `--brand-primary` (boutiques still use teal / serif via default `TrSectionHeader`). Pass `tone="cadde"` only on marketplace headers.
- Cadde home `/tr` shows the first 6 look cards (`TrLookMosaic` — tall sides + 2×2 middle on desktop, 2-col grid on phone) then `[ Tüm kombinleri gör ]`. Mosaic clicks go to `/tr/kombinler#kombin-{slug}`.
- Below that CTA a plus aperture (`CaddePlusReveal`) expands from the `+` (scroll or tap) into a full-viewport studio tease: `[ Kendi kombinin oluştur ]` / yakında. A torn ice lip then yields the marketplace footer. Do not put more home sections between the plus and the footer. Boutique storefronts do not use this.
- Lookbook `/tr/kombinler` (`TrLookLookbook`) is the full editorial rhythm: showcase (`TrLookSplit` / mobile stack) → 3-card strip → showcase → 4-card strip → repeat. Look photo and `[ Kombine bak ]` open `/tr/kombin/[slug]`. Pieces sit in a horizontal rail that auto-crawls (`useCaddeLookRailAutoplay`); wheel first pans the rail, then the page continues. Rail arrows sit **under** the cards so floating Sepet chrome does not cover them. Boutique storefronts do not use this layout.

## What we will do / direction

- Outfit-first discovery as the wedge vs Shopier/Trendyol grids
- Real multi-seller checkout split + boutique notifications (see commerce handoff)
- Featured / paid look placement later (Phase 3 revenue)
- Replace demo catalog with live boutique inventory as onboarding succeeds

## Key paths

| Concern | Path |
|---------|------|
| Routes | `src/app/tr/(marketplace)/` |
| Layout/chrome | `TrMarketplaceChrome`, `TrMarketplaceShell` |
| Looks | `src/lib/tr/looks/`, `/tr/kombinler`, `/tr/kombin/[slug]` |
| Catalog | `src/lib/tr/products.ts`, `boutiques.ts`, `mappers.ts` |
| Platform flags | `src/lib/tr/platform.ts` |
| Types | `src/types/tr-marketplace.ts`, `tr-look.ts`, `tr-cart.ts` |
| Concept | `docs/turkey-marketplace-concept.md` |
| Cadde intro | `CaddeIntroStack`, `lib/platform/caddeIntro.ts`, gated in `lib/platform/introLoader.ts` |
| Cadde hero | `CaddeSplitHero`, `lib/tr/marketplace/caddeHero.ts` (2 try-on poses) |
| Cadde page curtain | `CaddePageTransition`, `lib/platform/caddeTransition.ts` (Cadde marketplace only) |
| Cadde type/color | `lib/tr/marketplace/caddeUi.ts`, `tone="cadde"` on `TrSectionHeader` |

## Agent rules of thumb

- Marketplace UX and boutique storefront UX share data but **different shells and carts**.
- PDP links from Cadde should preserve `from=cadde` where helpers support it (`TR_PDP_FROM_CADDE` in `paths.ts`).
- Do not hardcode boutique demos into marketplace home forever — registry/demo flags only.
- Money fields are integer **kuruş** in DB/types.

# Homepage rebuild + Cadde retirement — plan

_Prepared 2026-09-23, verified against the live repo and production Supabase schema. Planning only — nothing built yet._

## Confirmed scope (from Mert)

1. **Retire the "Cadde" consumer marketplace entirely** — outfit/look browsing, cross-boutique cart, the whole `/tr` shopping experience. `cortisstyle.com` becomes a marketing/pitch site for the platform itself (ikas/ideasoft-style), not a shopping destination. This matches `platform-roadmap.md`'s actual stated business model (Mert sells store-builder software to boutique owners one at a time) — Cadde was building for a consumer marketplace that model doesn't call for.
2. **New homepage lives at root `/`**, replacing the current `redirect("/tr")`. One page: logo/name, headline, one-line explanation of what the platform does, a CTA to talk to Mert. Reference: Claude's own homepage (logo, "Question what's next" headline, tagline, CTA, nothing else).
3. Individual boutique storefronts (`/tr/{slug}`, e.g. `/tr/lilabutik`) are **unaffected** — they're a separate surface from the Cadde marketplace and don't get torn down.

## What "Cadde" actually is (verified, not guessed)

| Area | What | Verdict |
|---|---|---|
| Routes | `src/app/tr/(marketplace)/` — 15 pages: `ara`, `butikler`, `cart`, `checkout`, `favoriler`, `kombin/[slug]`, `kombinler`, `layout`, `odeme`, `page`, `parca/[productId]`, `sepet`, `siparis-onay`, `urunler`, `yakinda` | Delete entirely |
| Components | `src/components/tr/marketplace/` (31 files) + ~21 more Cadde/"look"-named components elsewhere (`TrLookMosaic`, `TrLookLookbook`, `TrLookSplit`, `CaddeSplitHero`, `CaddeIntroStack`, `CaddePageTransition`, `CaddePlusReveal`, etc.) | Delete entirely |
| Global cart/favorites stores | `src/store/trCartStore.ts`, `src/store/trFavoritesStore.ts` | **Confirmed Cadde-only at runtime.** `useTrScopedCart`/`useTrScopedFavorites` in `TrBoutiqueCommerceScope.tsx` branch on whether a `TrBoutiqueCommerceScopeProvider` is present — every boutique page has one, so boutiques always take the "local" branch (`trBoutiqueLocalCartStore`/`trBoutiqueLocalFavoritesStore`) and never touch these. Only Cadde pages (which have no scope provider) reach the global branch. Delete the two global stores, then **simplify `TrBoutiqueCommerceScope.tsx`** to drop the now-dead "unscoped" branch entirely — this is real simplification, not just deletion (the file currently carries dual-mode branching for a mode that's about to not exist). |
| Cart line type | `src/types/tr-cart.ts` (`TrCartLineItem`, `cartLineKey`) | **Keep** — this is the shared line-item shape used by the boutique-local cart too, not Cadde-specific despite living in a Cadde-adjacent spot. |
| Look type | `src/types/tr-look.ts` | Delete — purely Cadde ("kombin"/outfit definitions). |
| `src/lib/tr/looks/` | `list.ts`, `scrollToLook.ts` | Pure Cadde, delete. |
| | `demoCatalog.ts`, `editorialDemoProducts.ts` | Looked load-bearing at first (imported by real boutique pages: `page.tsx`, `layout.tsx`, `sepet`, `urunler`, `favoriler`, `publicData.ts`, `cartCheckout.ts`) — **investigated and confirmed dead in practice, not just in theory**: `withEditorialDemoProducts()` is a no-op whenever a boutique has ≥1 available product (`if (available.length > 0) return products`) — lilabutik has 61. `isTrDemoBoutiqueSlug()` just checks for a `demo-` prefix no real boutique has. Every boutique these functions were built for (`pervinsoysalbutik`, `newtenant`, `ozeltablo`, `demo-maya`-style demo tenants) is already deleted. Safe to delete wholesale, but every import site listed above needs the now-dead call removed too, not just the file. |
| Assets | `public/images/clothes/` (56MB, 9 outfit folders — referenced only by `src/data/tr/lookbookPieceImages.ts`) | Cadde-only, delete. |
| | `public/images/tr/{hero,intro}` (part of 7.9MB `public/images/tr/`, referenced by `caddeIntro.ts`/`caddeHero.ts`/`TrHeroImportPanel.tsx`/`heroSlotPieces.ts`) | Cadde-only, delete. `catalog/productImages.ts` has one path-prefix check against `/images/tr/hero/` (classifying URLs, not requiring the files) — becomes vestigial, remove in the same pass. |
| Scripts | `npm run tr:generate-cadde-hero` / `tr:prepare-cadde-hero` (`scripts/generate-cadde-hero-tryons.mts`, `scripts/prepare-cadde-hero-cutouts.mts`) | Cadde-only, delete script files + `package.json` entries. |
| Database | Checked `information_schema.tables` for anything look-related — zero results. Looks are entirely code/data-file driven (`TrLookDefinition` static data), not DB-backed. | No migration needed. |
| `home_layout: "default"` | The DB enum value + `boutiqueHome/registry.ts`'s branch for it | Once Cadde is gone, "default" layout has nothing to render into — lilabutik is already `"editorial"`, and no boutique uses `"default"` today (confirmed: only one boutique exists). **Open question below** — simplify away now, or leave as a dormant unused option? |

## Also found, unrelated cruft worth clearing in the same pass

Four loose `temp_image_*.WEBP` files sitting at `public/images/` root (UUID-style names, 744K/548K/476K/284K) — obvious scratch/debug leftovers, already flagged in `docs/codebase-cleanup-audit.md` from Phase 0 and never actually removed.

## Open questions (need your call before I build)

1. **The actual homepage copy.** I don't have your positioning statement. Need: one-sentence "what this is" (e.g. "The store-builder platform for Turkish boutiques" — your call), what the CTA should say and where it goes (a `mailto:`, a WhatsApp link, a simple contact form that emails you?), and whether you want any visual (a product screenshot, or text-only like Claude's reference).
2. **`home_layout: "default"` — simplify away now, or leave dormant?** Recommend simplifying: collapse `boutiqueHome/registry.ts` to always resolve `"editorial"`, drop the enum's other value. It's currently unused dead weight, and "go back to the foundation" argues for cutting it now rather than carrying an unused branch forward. But it's your call since it's not required for the homepage change itself.
3. **`/tr/butikler` (the boutique directory page)** — part of the marketplace route group, so it's slated for deletion. Confirming: no need for a "browse all boutiques" page anywhere on the platform-marketing side? Each boutique is found via its own domain/marketing now, not discovered through cortisstyle.com.
4. **Is `/tr` itself (the boutique-slug route, not the marketplace root) still needed as a path prefix**, or should boutique URLs stay exactly as they are (`/tr/lilabutik`) regardless of what happens at `/`? Assuming the latter (no change to boutique routing) — flagging so it's explicit.

## Order of work (separate commits, verified at each step)

1. **Build the new homepage** at `src/app/page.tsx` (remove the redirect), once copy is confirmed (open question 1). Lowest-risk, most visible change — ships independently of the Cadde teardown.
2. **Verify lilabutik is untouched** by step 1 (she's a fully separate route tree).
3. **Delete the confirmed-clean Cadde surface**: route group, marketplace components, global cart/favorites stores + simplify `TrBoutiqueCommerceScope.tsx`, `tr-look.ts`, pure-Cadde `looks/` files, Cadde assets (`images/clothes`, `images/tr/{hero,intro}`), Cadde npm scripts.
4. **Delete `demoCatalog.ts`/`editorialDemoProducts.ts`** and clean up every real-boutique-page import site that called into them (confirmed dead-in-practice, but the call sites still need the dead code removed, not just the file).
5. **Delete the 4 stray temp images.**
6. **`home_layout` simplification**, if agreed (open question 2).
7. **Docs**: delete `docs/agent-handoffs/09-cadde-marketplace.md` (no longer describes anything real), update `03-multi-tenant-boutiques.md`/`04-storefront-editorial-home.md` wherever they reference `home_layout: "default"` or Cadde, update the README index.
8. **Full verification**: `tsc`/`build`/lint clean, then a real browser pass on lilabutik specifically — home, PDP, cart, checkout, favorites — since steps 3–4 touch shared components (`TrBoutiqueCommerceScope`) her live storefront actually uses.

## Acceptance criteria

- `cortisstyle.com/` shows the new one-page marketing site, no redirect.
- `grep` confirms zero remaining references to deleted Cadde files/components/stores.
- lilabutik's storefront, cart, checkout, and favorites verified unchanged in the browser (screenshot before/after on the risky shared-component changes).
- `public/images` shrinks from 66MB to only what real boutiques actually reference.
- `tsc --noEmit`, `npm run build`, and lint all clean.

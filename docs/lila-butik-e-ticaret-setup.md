# Lila Butik — shared system + Cecilie UI skin

**Decision:** Lila is a **tenant** on the same Phase 1 rails as Pervin (local cart, checkout, panel, `/tr/[slug]`). Visual difference is an **editorial skin**, not a separate app or forked commerce tree.

## Where it lives

| Concern | Location |
|---------|----------|
| Tenant slug | `lilabutik` → `/tr/lilabutik` |
| Domain (optional) | `lilaboutiquedenizli.com` in `src/lib/tr/customDomain.ts` |
| Home layout | `editorial` via `src/lib/tr/boutiqueHome/registry.ts` |
| Visual skin | `atelier` via `src/lib/tr/boutiqueHome/editorialSkin.ts` |
| Shell hook | `data-editorial-skin` on `TrBoutiqueEditorialShell` |
| Accent | `#9B7EBD` (`themeAccent` in seed / DB) |
| Seed | `src/data/tr/lilabutik-seed.json` · `scripts/seed-lilabutik.md` |
| Logo | `logo.png` (black) · `logo-white.png` (campaigns) · `favicon.png` (white-bg tab icon) |

```text
editorial shell (shared)
  ├── skin classic → pervinsoysalbutik (unchanged)
  └── skin atelier → lilabutik (Cecilie-structure calm + lilac brandify)
```

## What not to do

- Do **not** put `if (slug === "lilabutik")` deep inside commerce/checkout.
- Do **not** change Pervin’s classic look when tuning atelier classes.
- Do **not** invent a parallel cart/checkout for Lila.

## Category taxonomy

Shared registry: `src/lib/tr/categories.ts` (hierarchical `parentId`).

**Tops (nav / home tiles):** `elbise` · `ust-giyim` · `alt-giyim` · `aksesuar` · `ev`

Atelier header nav is **taxonomy-owned** (`buildAtelierTaxonomyNav`) — not DB `editorialContent.nav` — so Alt giyim can’t disappear and Çanta stays under Aksesuar.

**Shop leaves (mega / panel):**

```text
elbise
ust-giyim → gömlek · tunik · triko · penye · bluz · tişört · ceket · mont · trençkot · kaban · takım
alt-giyim → etek · pantolon · eşofman
aksesuar  → çanta · eşarp · şal
ev        → nevresim
```

**Style variants** (not in nav; still match under the leaf): `deri-ceket`→ceket · `kase-kaban`/`kurk-mont`→mont · `kot-pantolon`/`kumas-pantolon`→pantolon · `nevresim-takimi`→nevresim.

Products should store a **shop leaf** (`mont`, not `kase-kaban`). Filtering `?kategori=ust-giyim` or `?kategori=mont` includes variants via `isTrCategoryMatch`.

**Nav (atelier):** Desktop hover mega lists `getTrCategoryNavChildren` + featured tiles. Mobile is drill-down. Shop-all copy via `getTrCategoryShopAllLabel` (e.g. `Tüm elbiseler`). Implementation: `TrBoutiqueEditorialHeader.tsx`.

**Category photos (drop-in):**

```text
public/tr/boutiques/lilabutik/categories/
  elbise.jpg
  ust-giyim.jpg
  alt-giyim.jpg
  aksesuar.jpg
  ev.jpg
```

Seed `shopCategories` / tiles / trends point at these paths. Atelier homepage category row is **code-owned** (`buildAtelierShopCategories`) so DB stock art can’t replace Elbise · Üst giyim · Alt giyim · Aksesuar · Ev.

**Trends 2×2** (also code-owned via `buildAtelierTrends`): Zarif elbiseler · Günlük üstler · Aksesuarlar · İndirimdekiler — images under `public/tr/boutiques/lilabutik/trends/`.

## Home body (atelier / PF structure)

After the campaign hero, Lila home uses:

1. Shop by category (horizontal row)  
2. Info strip (iade / kargo / değişim)  
3. Trends 2×2  
4. Mid campaign split  
5. Join + benefits  
6. Dark footer  

Content keys in `editorial_content`: `shopCategories`, `infoStrip`, `trends`, `midCampaign`, `join`.


Hero slides in `editorial_content.heroPromotions[]` support a **campaign** layout (Paul Fredrick–style):

| Field | Role |
|-------|------|
| `template: "campaign"` | PF stack (vs classic single CTA) |
| `subText` / `promoLine` | Top eyebrow |
| `campaignName` / `discountLine` | Big title |
| `actions[]` | 1–6 buttons `{ label, target, indirim? }` — **1** centered · **2** pair · **3** three-up · **4–6** category grid |
| `subText2` | Bottom lines (string or string[]) |
| `backgroundColor` / `image` | Solid fill or photo |
| `watermark` | Optional giant faint word |

Atelier heroes are **code-owned** (`buildAtelierHeroPromotions`): Yeni **1 / 2 / 3 CTA** slides + İndirim with main categories (`Tüm indirimler` + Elbise / Üst / Alt / Aksesuar / Ev). Sale photo from DB is kept when present. Yeni / İndirim nav megas also use `listTrCategoryRoots`.

Owners will eventually edit these in panel; seed JSON mirrors the pack.

## Hero / campaign (atelier)

- Auto **brand intro** slide (`template: "brand"`) prepended when `campaignPreferred`
- Then two **photo** campaigns: Keşfet (`contentAlign: "left"`) + İndirimler (`contentAlign: "right"`) — CTAs sit in open space opposite the model
- Photo heroes shift/crop downward so heads clear the sticky header
- Images: `public/tr/boutiques/lilabutik/hero/{kesfet,indirim}.jpg`
- Assets: black `logo.png`, `logo-white.png` for accent slides, `favicon.png` (white bg)

## Storefront imagery

- PDP gallery uses marketplace cutouts; raw front/back hanger uploads stay owner-only when cutouts exist (`getStorefrontGalleryImages`)

## AI house model (Lila only)

- Registry: `BOUTIQUE_AI_MODELS.lilabutik` in `src/lib/tr/aiModel/registry.ts`
- Ref plate: `public/tr/ai-models/lilabutik-lila.jpg` — same woman as category/hero campaigns
- Panel picker id: `boutique:lilabutik` (default for Lila; Ayla/Deniz still available)
- Do **not** reuse this ref for other boutiques

## Auth (branded)

- Reset emails: `token_hash` callback + boutique domain preference — see [07-platform-ops.md](./agent-handoffs/07-platform-ops.md) and [13-boutique-wire-in-and-go-live.md](./agent-handoffs/13-boutique-wire-in-and-go-live.md)

## Legal pages (taslak)

Templates in `src/lib/tr/legal/docs.ts` — KVKK, gizlilik, çerez, mesafeli satış, ön bilgilendirme, iade, üyelik, künye.

Lila seller snapshot (fill Ayarlar / re-seed to sync DB):

- Satıcı: Nefise Gül Cengiz Peker  
- Vergi no: 2390389751 (künye’de yayınlanır; IBAN yayınlanmaz)  
- Adres / iade: Bahçelievler Mh. Gülistan Cd. No:7/A Merkezefendi/Denizli  
- Domain: lilaboutiquedenizli.com (`info@…` placeholder until mailbox exists)  
- Kargo: anlaşmalı kargo mağazadan alır  
- KEP / MERSİS: TBD · Marketing: yes (İYS / ayrı açık rıza later)

Pages show amber “Taslak — avukat onayı” until lawyer signs off.

## Ops checklist

1. Run seed (`scripts/seed-lilabutik.md`)
2. Link owner (`scripts/link-tr-boutique-owner.md`) when ready
3. Point DNS when go-live; smoke `/tr/lilabutik` vs `/tr/pervinsoysalbutik`
4. Full pre-live list: [13-boutique-wire-in-and-go-live.md](./agent-handoffs/13-boutique-wire-in-and-go-live.md)

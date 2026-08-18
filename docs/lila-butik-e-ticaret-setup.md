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
2. Product catalog (ürünler)  
3. Trends 2×2  
4. Mid campaign split  
5. Join + benefits  
6. Info strip (iade / kargo / değişim)  
7. Dark footer  

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

## Domain & Search Console

| Concern | Value |
|---------|--------|
| Custom domain | `lilaboutiquedenizli.com` (+ `www`) in `src/lib/tr/customDomain.ts` / `TR_BOUTIQUE_DOMAINS` |
| Google site verification | Root layout `metadata.verification.google` in `src/app/layout.tsx` → meta `google-site-verification` |
| Current token | `lUtcENaTLXt-I3qvbtU_N3haAJ9CNXZ0QL7I1hZdGm8` |
| `robots.txt` | Host-aware `src/app/robots.ts` — **passthrough on every custom domain** (`BOUTIQUE_DOMAIN_ORIGIN_PASSTHROUGH_PATHS`). Allows storefront; blocks panel/cart/checkout/auth/api; `Sitemap:` at same host |
| `sitemap.xml` | Host-aware `src/app/sitemap.ts` — same passthrough. On boutique domain: `/`, `/urunler`, `/urun/{id}`, `/yasal/*`; on platform: marketing + `/tr/{slug}/…` for verified boutiques. **Do not** add a Lila-only sitemap route. |
| SEO helpers | `src/lib/tr/seo/storefrontSeo.ts` |
| Google Merchant Center | Ops checklist in [13-boutique-wire-in-and-go-live.md](./agent-handoffs/13-boutique-wire-in-and-go-live.md) § C2 |
| Merchant product feed | `https://lilaboutiquedenizli.com/feeds/google-merchant.xml` (also `/tr/lilabutik/feeds/google-merchant.xml`) — lib `src/lib/tr/googleMerchant/feed.ts` |

**Google Merchant feed (automatic catalog):**

1. Deploy feed route.
2. Merchant Center → Veri kaynakları → Dosyadan ürün ekle → URL: `https://lilaboutiquedenizli.com/feeds/google-merchant.xml`
3. Set **zamanlanmış çekme** (daily). New/updated panel products appear on next fetch.
4. Feed uses boutique-domain product links, `identifier_exists=false` (no GTIN yet), TRY prices, stock availability.

**Search Console (Lila):**

1. Deploy so verification meta + `/robots.txt` + `/sitemap.xml` are live on `https://lilaboutiquedenizli.com` (and www if used).
2. Add property for the boutique domain (Domain or URL-prefix).
3. Confirm HTML tag verification.
4. **Sitemaps** → submit `https://www.lilaboutiquedenizli.com/sitemap.xml` (apex 308s to www; match the property).
5. Spot-check Coverage / Page indexing after crawl.

Verify in Search Console **after deploy** (token must be live on the custom domain HTML). One root meta covers all hosts on this Next app; rotate/replace the token in `layout.tsx` if Google issues a new one.

## Auth (branded)

- Reset emails: `token_hash` callback + boutique domain preference — see [07-platform-ops.md](./agent-handoffs/07-platform-ops.md) and [13-boutique-wire-in-and-go-live.md](./agent-handoffs/13-boutique-wire-in-and-go-live.md)

## Legal pages

Shared templates (all boutiques): runtime `src/lib/tr/legal/docs.ts` · clone/placeholder pack [tr-boutique-legal-templates.md](./tr-boutique-legal-templates.md).

Docs: KVKK, gizlilik, çerez, mesafeli satış, ön bilgilendirme, tüketici hakları/iade, üyelik, künye — filled from boutique Ayarlar / seed.

Lila seller snapshot (fill Ayarlar / re-seed to sync DB):

- Satıcı: Nefise Gül Cengiz Peker  
- Vergi no: 2390389751 (künye’de yayınlanır; IBAN yayınlanmaz)  
- Adres / iade: Bahçelievler Mh. Gülistan Cd. No:7/A Merkezefendi/Denizli  
- Domain: lilaboutiquedenizli.com  
- E-posta (storefront / yasal): `ncp20@outlook.com` (`CONTACT_EMAIL_BY_SLUG` in `src/lib/tr/checkoutMode.ts`)  
- Kargo: anlaşmalı kargo mağazadan alır  
- KEP / MERSİS: TBD · Marketing: yes (İYS / ayrı açık rıza later)

## Ops checklist

1. Run seed (`scripts/seed-lilabutik.md`) against the **production** Supabase project (not only local)
2. Confirm `status = verified` in `tr_boutiques_public` (`supabase/fix_tr_boutiques_public_visibility.sql`)
3. Link owner (`scripts/link-tr-boutique-owner.md`) when ready
4. Point DNS when go-live; smoke `/tr/lilabutik` vs `/tr/pervinsoysalbutik` **and** custom domain (private window)
5. If 404 while SQL shows verified rows: redeploy + purge Vercel cache; hit `/api/tr/admin/boutique-health`
6. Confirm Google Search Console meta on live domain (see Domain & Search Console above)
7. Submit boutique `sitemap.xml` in Search Console; confirm `/robots.txt`
8. **Google Merchant Center**
   - [ ] Claim / verify `lilaboutiquedenizli.com`
   - [ ] İade URL: `https://lilaboutiquedenizli.com/yasal/iade` (pakete dahil · restocking yok · 14 gün)
   - [ ] Feed URL live: `https://lilaboutiquedenizli.com/feeds/google-merchant.xml`
   - [ ] Add feed in Merchant → **zamanlanmış çekme (daily)** for automatic product sync
   - [ ] Fix product disapprovals before Shopping ads
9. **iyzico website criteria**
   - [ ] Hakkımızda `/yasal/kunye` · Gizlilik · Mesafeli Satış · Teslimat ve İade in footer
   - [ ] Footer payment band (Visa / MC / iyzico) + checkout “iyzico ile öde” badge
   - [ ] HTTPS on custom domain
10. **Ekiz Yazılım** footer watermark (`TrPlatformCredit`) live on storefront — shared for every boutique
11. Full pre-live list: [13-boutique-wire-in-and-go-live.md](./agent-handoffs/13-boutique-wire-in-and-go-live.md)

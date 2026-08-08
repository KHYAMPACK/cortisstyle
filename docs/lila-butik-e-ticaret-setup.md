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
| `actions[]` | Up to 4 buttons `{ label, target }` |
| `subText2` | Bottom lines (string or string[]) |
| `backgroundColor` / `image` | Solid fill or photo |
| `watermark` | Optional giant faint word |

Owners will eventually edit these in panel; until then seed/DB JSON is the source of truth.

## Ops checklist

1. Run seed (`scripts/seed-lilabutik.md`)
2. Link owner (`scripts/link-tr-boutique-owner.md`) when ready
3. Point DNS when go-live; smoke `/tr/lilabutik` vs `/tr/pervinsoysalbutik`

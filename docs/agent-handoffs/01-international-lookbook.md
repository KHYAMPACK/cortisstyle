# 01 — International lookbook + wardrobe

**Role:** Non-TR Cortisstyle. Editorial looks that drive traffic; monetize via **affiliate** shop links (not TR checkout). Feeds visual language and content pipeline for Turkey.

## What we do today

- Home lookbook experience (`src/app/page.tsx`, `HomePageClient.tsx`)
- Digital wardrobe + saved outfits (`/wardrobe`, `src/lib/wardrobe*.ts`, Supabase `user_wardrobe` / `user_saved_outfits`)
- Dynamic look registry (`src/lib/dynamicLooks/`, data in `src/data/dynamic-looks/`)
- Collage / layout helpers shared with studio (`canvasLayout`, `collageLayout`, `resolveLookItems`, etc.)
- Auth via Supabase (`src/context/AuthContext.tsx`, `/auth/*`)
- Legal/compliance pages + affiliate disclosure
- Geo preference: Turkish IPs steered toward `/tr` (`src/lib/marketPreference.ts`)

## What we will do / direction

- Keep international affiliate funnel healthy while TR commerce grows
- Reuse looks/photography across markets (same content, different CTA: affiliate vs buy)
- Avoid mixing TR checkout into international routes

## Key paths

| Concern | Path |
|---------|------|
| Home | `src/app/page.tsx` |
| Wardrobe | `src/app/wardrobe/` |
| Look data | `src/lib/dynamicLooks/`, `src/data/dynamic-looks/` |
| Affiliate | `src/lib/affiliateUrls.ts`, `src/app/affiliate-disclosure/` |
| Auth | `src/context/AuthContext.tsx`, `src/lib/supabaseClient.ts` |
| Schema | `supabase/schema.sql` |

## Agent rules of thumb

- Do not route international users into TR cart/checkout by accident.
- Extend looks via **registry/data**, not one-off conditionals in the home page.
- Affiliate compliance lives in `docs/legal-and-affiliate-compliance.md`.

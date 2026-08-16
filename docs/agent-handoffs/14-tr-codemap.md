# 14 — TR codemap (where things live)

**Role:** After the international lookbook was archived to sibling repo `cortisstyle-international`, this is the live **Turkey-first** product map.

## Product

- Root `/` → redirects to `/tr` (middleware + `src/app/page.tsx`)
- Boutiques, Cadde, owner panel, commerce — all in this repo
- International lookbook / wardrobe / Lookbook Studio → **`cortisstyle-international`** (bootable archive)

## Folder map

```
src/
├── app/
│   ├── page.tsx                 → redirect /tr
│   ├── auth/                    → callback, reset-password
│   ├── privacy/, terms/         → platform legal
│   ├── api/auth/, api/tr/       → auth check + TR APIs
│   └── tr/                      → App Router (do not move)
│       ├── (marketplace)/       → Cadde
│       ├── [boutiqueSlug]/     → tenant storefronts
│       └── panel/               → owner panel
├── components/
│   ├── auth/                    → AuthPopup, callback, redirect bridge
│   ├── providers/               → Providers, AppShell, IntroLoader, MaintenanceGate
│   ├── brand/                   → BrandLogo
│   ├── legal/                   → CookieNotice, LegalPageShell, AuthTermsNotice
│   └── tr/
│       ├── marketplace/         → Cadde chrome, looks, search, directory, CaddeIntroStack
│       ├── commerce/            → cart, checkout, WhatsApp, size gate
│       ├── product/             → cards, gallery, pickers, favorites
│       ├── boutique/            → tenant storefront UI (editorial/, pdp/)
│       ├── panel/               → owner UI
│       ├── shared/              → SoftNavLink, BackButton, ScrollRestoration
│       └── demo/, dev/
├── lib/
│   ├── auth/                    → redirects, email status, types, ensureUserProfile
│   ├── supabase/                → client, admin, cookie storage
│   ├── platform/                → introLoader, launchGates, siteLegal, cookieConsent
│   ├── mail/                    → platform email
│   └── tr/
│       ├── paths.ts, platform.ts, customDomain.ts, rateLimit.ts
│       ├── catalog/             → boutiques, products, mappers, publicData
│       ├── commerce/            → checkout*, orders, inventory, discounts, whatsapp
│       ├── storefront/          → brand, storefront context, storefront helpers
│       ├── panel/               → ownerAuth, ownerClient, panelNav, adminAuth
│       ├── marketplace/         → (looks/, outfitFrame/ stay as subtrees)
│       ├── ai/                  → photoroomRemoveBg, resolveLlmProvider, aiUsage
│       │                         + aiCatalog/, aiModel/, fashn/, contentPacks/, …
│       ├── assets/              → upload/storage helpers
│       ├── notify/              → push + order notifications
│       └── legal/, seo/, …      → boutique legal + SEO
├── store/                       → Zustand TR carts/favorites
├── types/                       → tr-marketplace, tr-cart, tr-look, user (AuthUser)
└── data/tr/                     → seeds, hero slots, TR looks data
```

## Where to put new code

| New work | Put it in |
|----------|-----------|
| Cadde UI | `components/tr/marketplace/` |
| Cart/checkout UI | `components/tr/commerce/` |
| PDP/product UI | `components/tr/product/` or `boutique/` |
| Owner panel UI | `components/tr/panel/` |
| Checkout/orders logic | `lib/tr/commerce/` |
| Boutique catalog queries | `lib/tr/catalog/` |
| Owner auth / panel APIs helpers | `lib/tr/panel/` |
| PhotoRoom cutout | **`lib/tr/ai/photoroomRemoveBg.ts`** (never delete with “studio”) |
| Auth helpers | `lib/auth/` |
| Supabase clients | `lib/supabase/` (browser · `supabaseAdmin` · **`supabaseServer` anon-first public catalog**) |

## Compatibility stubs

Old import paths like `@/lib/tr/products` or `@/components/tr/TrHeader` still work via one-line `export *` re-exports at the previous location. Prefer new paths for new code; stubs can be removed later once imports are updated.

## Security notes (ops)

- Orders / discounts / invoices: **service role after app-layer owner auth** — RLS is not the owner tenancy boundary.
- Public boutique sensitive columns: apply `supabase/patch_tr_boutiques_public_view.sql` (view without IBAN/contact/shipping). Supabase may show the view as **UNRESTRICTED** — that means no RLS on the view; grants are **SELECT-only** and rows are verified-only safe columns.
- Public catalog SSR reads use **anon-first** (`getPublicCatalogSupabase`) so a bad `SUPABASE_SERVICE_ROLE_KEY` cannot 404 storefronts. Diagnose with `GET /api/tr/admin/boutique-health` + `supabase/fix_tr_boutiques_public_visibility.sql`.
- Order confirm HMAC requires `TR_ORDER_CONFIRM_SECRET` in production (no service-role fallback).
- `/api/auth/check-email` is rate-limited.
- Dormant intl tables: run `supabase/patch_drop_international_tables.sql` once (drops `studio_*`, `user_wardrobe`, `user_saved_outfits`). **Keep `profiles`.**

## Related

- Overview: [00-overview.md](./00-overview.md)
- Ops: [07-platform-ops.md](./07-platform-ops.md)
- International archive: sibling folder/repo `cortisstyle-international`

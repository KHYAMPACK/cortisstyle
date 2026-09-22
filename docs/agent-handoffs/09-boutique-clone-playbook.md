# 09 — Boutique onboarding playbook

**Status (2026-09-23):** Rewritten to match the current DB-first architecture. The previous version predated the tenant-config-to-DB migration (`docs/phase1-tenant-config-plan.md`) and the generic-foundation/fashion-module extraction (`docs/agent-handoffs/17-generic-foundation-fashion-module.md`) — it described a "copy Pervin's files" workflow and a schema-migration checklist that no longer apply. `pervinsoysalbutik`, `newtenant`, and `ozeltablo` (all referenced in the old version) have been fully purged; only `lilabutik` (fashion) and `minimora` (custom_art) exist in `tr_boutiques` today.

## The short version

Onboarding a new boutique is mostly a **database operation**, not a code change: one `tr_boutiques` row (created via `POST /api/tr/admin/seed`), an optional `tr_boutique_integrations` row for payments, and an owner linked via `PATCH /api/tr/admin/boutiques/[id]/owner`. The schema already has every column a boutique needs — there is no "apply these migrations" step anymore. A handful of small per-slug code maps still exist for cosmetic overrides (see "What still needs a code touch" below), but none of them block a boutique from going live.

Never fork panel/checkout/storefront components per boutique, and never write `if (slug === "...")` anywhere — every one of those checks was deleted at least once already during the newtenant/pervinsoysalbutik/ozeltablo purges. Differences between boutiques belong in DB rows or the fashion/customArt module split, not in conditionals.

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│  Custom domain (optional)                                   │
│  DB tr_boutiques.custom_domain is the source of truth.       │
│  src/lib/tr/customDomain.ts + src/proxy.ts resolve host →    │
│  slug and rewrite to /tr/{slug}/…  TR_BOUTIQUE_DOMAINS env   │
│  only covers hosts not yet in the DB.                        │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Storefront  /tr/[boutiqueSlug]                              │
│  home_layout (DB): "default" (Cadde-style) or "editorial"    │
│  (standalone shell, local cart/favorites, own giris/sepet/   │
│  odeme/siparis-onay/yasal). New boutiques should use          │
│  "editorial" unless they're meant to sell inside Cadde.       │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  APIs                                                        │
│  POST /api/tr/checkout · /api/tr/customer/auth/* (branded)   │
│  /api/tr/owner/* (Bearer + owner_user_id)                     │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Owner panel  /tr/panel  (shared UI, switch boutique)        │
│  products · stock · orders · customers · settings · …        │
└─────────────────────────────────────────────────────────────┘
```

**Tenant key:** one `tr_boutiques` row (`slug`, `owner_user_id`, brand fields). Products/orders scoped by `boutique_id`. `catalog_profile` (`"fashion"` or `"custom_art"`) picks which vertical module's product logic applies — see `src/lib/tr/catalogProfiles/registry.ts`.

## Checklist — new boutique

### A. Decide the vertical

Is this another **fashion** boutique (garments, sizes, the Turkish category tree) or another **custom_art** boutique (print-on-demand, no categories, no sizing)? Set `catalogProfile` accordingly in the seed payload. A genuinely new third vertical is real engineering work — see "When you actually need to write code" below — not something this checklist covers.

### B. Ops / legal (outside code)

- Vergi levhası / contract (see `docs/boutique-partnership-agreement-draft.md`)
- Owner email that will sign up on Cortisstyle
- WhatsApp number, Instagram handle, shipping/iade text, legal contact + `contact_email`
- Legal fields for shared yasal templates (`legalName`, address, vergi) — pack: `docs/tr-boutique-legal-templates.md`
- Logo/favicon files. There's no image-upload widget yet — drop the PNG/SVG under `public/tr/boutiques/{slug}/` and reference that path from the seed payload's `logoUrl` (or paste it into Ayarlar → Logo later). This is a repo content change, not a code change.

### C. Create the boutique

One call: `POST /api/tr/admin/seed` with `Authorization: Bearer {TR_ADMIN_SECRET}` and a JSON body — see `src/app/api/tr/admin/seed/route.ts` for the full `SeedBoutiquePayload` shape (slug, name, brand fields, `homeLayout`, `customDomain`, `catalogProfile`, optional starter `products`/`sampleOrders`/`discountCodes`). No file needs to be committed to the repo for this — the payload is just a request body. Keep a local copy for your own records if you want one, but don't recreate the old `src/data/tr/{slug}-seed.json` pattern; those files were deleted as dead weight once the seed API stopped reading from disk.

Payments: if the boutique will take real iyzico payments, add a row to `tr_boutique_integrations` (`provider: "iyzico"`, encrypted credentials) — see `src/lib/tr/payments/registry.ts` for how it's read. Until then, checkout creates **pending** orders and the owner marks them paid manually (`TR_CHECKOUT_SANDBOX` for staging).

### D. Owner link

1. Owner signs up (panel AuthPopup or storefront `/giris`).
2. `PATCH /api/tr/admin/boutiques/{id}/owner` with `{ "ownerUserId": "..." }` (Bearer `TR_ADMIN_SECRET`) — see `scripts/link-tr-boutique-owner.md`/`.mts` for a scripted version of the same call.
3. Smoke `/tr/panel` → boutique appears; create one product; confirm on `/tr/{slug}`.

### E. White-label domain (optional)

1. DNS → app host.
2. Set `tr_boutiques.custom_domain` (via the seed payload or a direct update) — that's the only step that matters. `TR_BOUTIQUE_DOMAINS` env is only needed to serve a host *before* it's in the DB (e.g. testing DNS propagation).
3. `src/proxy.ts` handles the rewrite automatically; short paths (`/`, `/urunler`, `/sepet`, `/odeme`, `/giris`, …) are already generic per `rewriteBoutiqueDomainPath()` in `src/lib/tr/customDomain.ts`.

### F. Smoke test (minimum)

Storefront: `/tr/{slug}` loads · add a sized product to sepet · favoriler scoped to this slug only · `/giris` branded OTP path · checkout creates a **pending** order (unless sandboxed) → panel Siparişler + badge · legal pages + WhatsApp link · owner can mark pending → ödendi until iyzico is wired.

Panel: owner login only sees this boutique · ürün oluştur / stok / gizle · sipariş fulfillment status change · Ayarlar save reflects on storefront.

## What still needs a code touch

Everything below is optional cosmetic polish, not a blocker for going live — but if you want it, it's a real code change (a PR), not a settings toggle:

| Concern | File | What happens if you skip it |
|---|---|---|
| Editorial visual skin (`classic` vs `atelier`) | `src/lib/tr/boutiqueHome/editorialSkin.ts` — `SLUG_SKINS` map, no DB equivalent | Boutique gets the `classic` skin by default |
| Branded auth-email logo | `src/lib/tr/authMail/templates.ts` — `EMAIL_LOGO_PATHS` map | Auth emails send with no logo |
| Brand color/logo/favicon/title fallback overrides | `src/lib/tr/storefront/boutiqueBrand.ts` | DB `theme_accent`/`logo_url`/`name` are used directly — only add an override if you need to show a different asset than what's in the DB |
| Custom AI try-on house-model persona (fashion only) | `src/lib/tr/aiModel/registry.ts` | Boutique uses the shared/default AI models |

Prefer `resolveBoutiqueBrandLabel(slug, name)` / DB fields over adding new hardcodes anywhere else. If you find yourself writing `if (slug === "...")` outside these four files, stop — that's very likely something that belongs in a DB column instead.

## When you actually need to write real code

- **A third product vertical** (not fashion, not custom_art): a new `catalog_profile` value, a capabilities struct in `src/lib/tr/catalogProfiles/registry.ts`, and a new module mirroring `src/lib/tr/fashion/`/`src/lib/tr/customArt/`. See `docs/agent-handoffs/17-generic-foundation-fashion-module.md` for the module-boundary pattern to follow.
- **A new home-page layout** beyond `default`/`editorial`, or a new editorial skin beyond `classic`/`atelier`.
- **A new payment provider** beyond iyzico.

## Code map

| Concern | Path |
|---|---|
| Paths | `src/lib/tr/paths.ts` |
| Domain rewrite | `src/lib/tr/customDomain.ts`, `src/proxy.ts` |
| Brand helpers | `src/lib/tr/storefront/boutiqueBrand.ts` |
| Home layout | `src/lib/tr/boutiqueHome/` |
| Catalog profile / vertical capabilities | `src/lib/tr/catalogProfiles/` |
| Fashion module | `src/lib/tr/fashion/`, `src/components/tr/fashion/` |
| Custom-art module | `src/lib/tr/customArt/` |
| Commerce scope | `src/components/tr/boutique/TrBoutiqueCommerceScope.tsx` |
| Local cart / fav | `src/store/trBoutiqueLocalCartStore.ts`, `trBoutiqueLocalFavoritesStore.ts` |
| Owner auth | `src/lib/tr/ownerAuth.ts`, `src/lib/tr/panel/ownerClient.ts` |
| Panel nav | `src/lib/tr/panelNav.ts` |
| Checkout | `src/app/api/tr/checkout/route.ts`, `TrCheckoutPageContent.tsx` |
| Payments registry | `src/lib/tr/payments/registry.ts` |
| Admin boutique APIs | `src/app/api/tr/admin/seed/route.ts`, `src/app/api/tr/admin/boutiques/` |
| Types | `src/types/tr-marketplace.ts` |

## Still open before real money at scale

- iyzico card capture is per-boutique via `tr_boutique_integrations`, but full SSO cookie strategy across custom domains isn't solved — session on a custom host isn't shared with `.cortisstyle.com` yet.
- No carrier API/tracking integration.
- No image-upload widget for boutique branding — logos are still a manual file-drop + path paste (see checklist B above).

## Agent rules

- One boutique = one slug. Never leak another boutique's products in owner APIs.
- A new boutique is a new DB row, not a new layout fork or a new `if (slug)`.
- Prefer DB/settings for contact email, brand name, domain, home layout, payments. If you touch a file with a leftover per-slug conditional or a stale boutique name, delete it.
- Keep boutique local cart separate from the Cadde platform cart.
- Update this playbook whenever the checklist above stops matching reality — it's meant to be re-derivable from the code, so don't let it silently drift again.

## Related

- Tenant-config-to-DB migration background: `docs/phase1-tenant-config-plan.md`
- Generic foundation + fashion module: `docs/agent-handoffs/17-generic-foundation-fashion-module.md`
- Custom-art vertical reference: `docs/agent-handoffs/16-custom-art-boutique.md`
- Visual direction for a new boutique's storefront: `docs/agent-handoffs/10-boutique-design-inspiration.md`
- Legal templates: `docs/tr-boutique-legal-templates.md`

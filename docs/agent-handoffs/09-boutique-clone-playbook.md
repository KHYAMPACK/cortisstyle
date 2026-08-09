# 09 — Boutique clone playbook (system, not UI)

**Goal:** Spin up another Instagram boutique on the **same rails** as Pervin Soysal Butik — shared Next/Supabase stack, **new tenant row**, own slug/domain/branding — without inventing a parallel shop **or** forking panel/checkout.

**UI:** Unique per boutique via **editorial skins** / theme packs (`classic` vs `atelier`), not `if (slug)` inside Pervin’s chrome. See [lila-butik-e-ticaret-setup.md](../lila-butik-e-ticaret-setup.md).

**Day-of ops:** use **[13-boutique-wire-in-and-go-live.md](./13-boutique-wire-in-and-go-live.md)** — wire-in registry + pre-live checklist (includes Lila 2026-08 learnings).

**Read first:** [08-boutique-audit-pervin.md](./08-boutique-audit-pervin.md) (known holes). Do not promise real card pay, live cargo, e-invoice, or working coupons until those are fixed.

**Product stance:** Phase 1 = **standalone boutique site**. Cadde marketplace cart (`trCartStore`, `/tr/sepet`) is out of scope for this playbook. New boutiques should use **editorial** home layout so local sepet/odeme/favoriler apply.

---

## Architecture to copy (the “system”)

```text
┌─────────────────────────────────────────────────────────────┐
│  Custom domain (optional)                                   │
│  TR_BOUTIQUE_DOMAINS / customDomain.ts → rewrite to         │
│  /tr/{slug}/…                                               │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Storefront  /tr/[boutiqueSlug]                             │
│  editorial shell → TrBoutiqueCommerceScope                  │
│  local cart / favorites (per-slug localStorage)             │
│  giris · sepet · odeme · siparis-onay · yasal               │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  APIs                                                       │
│  POST /api/tr/checkout (sandbox order)                      │
│  /api/tr/customer/auth/* (branded OTP/reset)                │
│  /api/tr/owner/* (Bearer + owner_user_id)                   │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Owner panel  /tr/panel  (shared UI, switch boutique)       │
│  products · stock · orders · customers · settings · …       │
└─────────────────────────────────────────────────────────────┘
```

**Tenant key:** one `tr_boutiques` row (`slug`, `owner_user_id`, brand fields). Products/orders scoped by `boutique_id`. Never hardcode the new boutique’s prices or product IDs in components.

---

## What NOT to copy

| Don’t copy | Why |
|------------|-----|
| Pervin editorial **pixels** (hero copy, Instagram grid layout quirks, Denizli address in code) | Brand-specific; prefer DB `editorial_content` / settings |
| `slug === "pervinsoysalbutik"` conditionals | Clone tax; use `resolveBoutiqueBrandLabel` / DB fields |
| Cadde marketplace cart / looks feed | Different product surface |
| Demo invoices, demo cargo labels, demo dashboard KPIs | Ops theater — don’t train the next owner on fakes |
| Assuming coupons / iyzico / stock deduction work | See audit |

UI reuse is intentional: **same components**, different `slug` + brand assets + seed data.

**UI template (visual direction):** when creating the boutique’s look, pick a storefront **standard** from [10-boutique-design-inspiration.md](./10-boutique-design-inspiration.md) based on **what the boutique sells** (1 Balmoral · 2 Cecilie · 3 Marine Layer — numbers are IDs, not priority). Do not copy Pervin’s pixels.

---

## Checklist — new boutique

### A. Ops / legal (outside code)

- [ ] Vergi levhası / contract (see roadmap + partnership draft)
- [ ] Owner email that will sign up on Cortisstyle (or custom domain `/giris`)
- [ ] WhatsApp number, Instagram handle, shipping/iade text, legal contact email
- [ ] Logo (PNG) + optional favicon/accent mark under `public/tr/boutiques/{slug}/`

### B. Schema (once per environment)

Apply patches in order (same list as `scripts/seed-pervinsoysalbutik.md`):

- boutique brand / storefront / owner
- product options, stock, compare-at, marketplace images, catalog background
- order fulfillment, discount codes, option presets, owner push (if using)

### C. Data — seed template

1. Copy `src/data/tr/pervinsoysalbutik-seed.json` → `src/data/tr/{slug}-seed.json`.
2. Change: `slug`, `name`, logos, WhatsApp, IG, `customDomain`, theme, products (real SKUs), drop Pervin sample orders/coupons or replace.
3. Set `home_layout` / seed field so layout resolves to **`editorial`** (required for local cart checkout routes).
4. `POST /api/tr/admin/seed` with `TR_ADMIN_SECRET` (see seed script).

### D. Owner link

1. Owner signs up (panel AuthPopup or storefront).
2. SQL or `PATCH /api/tr/admin/boutiques/{id}/owner` — see `scripts/link-tr-boutique-owner.md`.
3. Smoke `/tr/panel` → boutique appears; create one product; confirm on `/tr/{slug}`.

### E. Registries / env (until DB covers everything)

Prefer **DB + env** over new hardcodes. Today you still may need:

| Concern | Where |
|---------|--------|
| Custom domain map | Env `TR_BOUTIQUE_DOMAINS` JSON (preferred). Avoid growing `DEFAULT_DOMAIN_MAP` in `customDomain.ts` forever. |
| Home layout | DB `home_layout` + optional entry in `boutiqueHome/registry.ts` |
| Brand label / logo override | Prefer DB `name` / `logo_url`. Only use `boutiqueBrand.ts` maps if assets must override stale DB. Prefer `resolveBoutiqueBrandLabel(slug, name)` everywhere instead of new `if (slug === …)`. |
| Auth email logo | `authMail/templates.ts` logo map (or generalize to DB logo URL) |
| AI on-model identity | `aiModel/registry.ts` only if using that feature |
| Resend | Platform `AUTH_EMAIL_FROM` / Resend key — don’t add another `*_PERVIN_*` env alias per boutique |

### F. White-label domain

1. DNS → app host.
2. `TR_BOUTIQUE_DOMAINS={"shop.example.com":"{slug}","www.shop.example.com":"{slug}"}`.
3. Middleware rewrites short paths (`/`, `/urunler`, `/sepet`, `/odeme`, `/giris`, …).
4. Know the **auth cookie gap**: session on custom host ≠ `.cortisstyle.com` until fixed (audit #7).

### G. Smoke test (minimum)

Storefront:

1. `/tr/{slug}` loads editorial home  
2. Add sized product → sepet (line shows beden)  
3. Favoriler scoped to this slug only  
4. `/giris` branded OTP path  
5. Checkout creates **pending** order (unless `TR_CHECKOUT_SANDBOX`) → panel Siparişler + badge  
6. Legal pages + WhatsApp link  
7. Owner can mark pending → ödendi until iyzico  

Panel:

1. Login as owner only sees this boutique (or switcher if multi)  
2. Ürün oluştur / stok / gizle  
3. Sipariş fulfillment status change  
4. Ayarlar WhatsApp save reflects on storefront  

---

## Code map (extend, don’t fork)

| Concern | Path |
|---------|------|
| Paths | `src/lib/tr/paths.ts` |
| Domain rewrite | `src/lib/tr/customDomain.ts`, `src/middleware.ts` |
| Brand helpers | `src/lib/tr/boutiqueBrand.ts` |
| Home layout | `src/lib/tr/boutiqueHome/` |
| Commerce scope | `src/components/tr/boutique/TrBoutiqueCommerceScope.tsx` |
| Local cart / fav | `src/store/trBoutiqueLocalCartStore.ts`, `trBoutiqueLocalFavoritesStore.ts` |
| Owner auth | `src/lib/tr/ownerAuth.ts`, `ownerClient.ts` |
| Panel nav | `src/lib/tr/panelNav.ts` |
| Checkout | `src/app/api/tr/checkout/route.ts`, `TrCheckoutPageContent.tsx` |
| Types | `src/types/tr-marketplace.ts` |

---

## Recommended hardening before the next paid boutique

Shipped in the 2026-08-08 fix pass (verify patches applied):

1. ~~Server-side reprice + product ownership + availability in checkout~~
2. ~~Persist **size** on `tr_order_items` and send it from checkout~~
3. ~~Decrement stock / size_stocks on successful order create~~
4. ~~Honor cart line selection~~
5. ~~Real customer order confirmation (load by `orderId`)~~
6. ~~Apply discount codes in checkout~~
7. ~~Custom-domain auth reset redirect when Origin maps to boutique~~
8. ~~Kill demo KPIs; label demo cargo/fatura~~

Still open before real money (see also [12-boutique-go-live.md](./12-boutique-go-live.md)):

1. iyzico card capture → then `TR_IYZICO_ENABLED=true`
2. Full SSO cookie strategy custom-domain ↔ platform
3. Carrier API + tracking
4. Prefer DB brand fields over slug hardcodes
5. Lawyer-approved legal + real catalog photos

Until iyzico: checkout creates **pending** orders; owner marks paid manually. Staging only uses `TR_CHECKOUT_SANDBOX=true`.

---

## Agent rules

- One boutique = one slug. Never leak another boutique’s products in owner APIs.
- New boutique ≠ new layout fork — register editorial (or add one registry template).
- Prefer settings/DB for contact email, brand name, domain; delete leftover Pervin `if`s when you touch those files.
- Keep boutique local cart separate from Cadde platform cart.
- Update this playbook when checkout/stock/auth gaps close so the next clone doesn’t re-learn them.

# 13 — Boutique wire-in + go-live checklist

**Audience:** ops / agents adding the **next** Instagram boutique after Pervin (`classic`) and Lila (`atelier`).

**Goal:** Backend + commerce rails stay shared. New boutique = **tenant + brand assets + skin/content**. UI design is the creative work; do not fork cart/checkout/panel.

**Related:** architecture [09-boutique-clone-playbook.md](./09-boutique-clone-playbook.md) · payments [12-boutique-go-live.md](./12-boutique-go-live.md) · skins [lila-butik-e-ticaret-setup.md](../lila-butik-e-ticaret-setup.md) · visual standards [10-boutique-design-inspiration.md](./10-boutique-design-inspiration.md)

---

## What Lila proved (2026-08 session)

Shipped on shared rails (do not re-invent):

| Area | Outcome |
|------|---------|
| Skin | `atelier` editorial skin (`editorialSkin.ts`) — Pervin stays `classic` |
| Hero | Campaign carousel + **brand intro** slide (`template: "brand"`) + watermark wallpaper |
| Brand assets | `logo.png` (black), `logo-white.png` (campaigns), `favicon.png` (white-bg tab) |
| Header | Hide category nav on `/giris`, `/sepet`, `/favoriler` (atelier) |
| Auth | Branded OTP/reset via Resend; reset uses `token_hash` → `/auth/callback` → boutique-branded `/auth/reset-password?boutique=` |
| Auth origin | Prefer boutique custom domain for reset links (`resolveAuthRedirectOrigin`) |
| SEO | Per-boutique document title + description in `boutiqueBrand.ts` (no `— Cortisstyle` on boutique tabs) |
| Images | Storefront gallery prefers marketplace cutouts; raw front/back hanger shots stay owner-only |
| Promo bar | Atelier home skips top promo strip |

**Password note:** one platform password across boutiques; only email + reset UI are white-label.

---

## Part A — Wire-in registry (do this for every new slug)

Pick a slug: `{slug}` (e.g. `mayabutik`). Copy this table and fill it.

### 1. Assets (required)

Put under `public/tr/boutiques/{slug}/`:

| File | Purpose |
|------|---------|
| `logo.png` | Header, auth, emails (PNG, not SVG) |
| `logo-white.png` | Optional — campaign hero on accent backgrounds |
| `favicon.png` | Tab icon — **black mark on white square** (readable in dark Chrome tabs) |

### 2. Seed + owner

| Step | Where |
|------|--------|
| Copy seed | `src/data/tr/pervinsoysalbutik-seed.json` or `lilabutik-seed.json` → `{slug}-seed.json` |
| Must set | `slug`, `name`, `logoUrl`, `themeAccent`, `whatsappPhone`, `instagramHandle`, `customDomain`, `homeLayout: "editorial"`, real products |
| Editorial content | `editorial_content` (nav, heroPromotions, shopCategories, …) — this is most of the “UI content” |
| Seed script | Copy `scripts/seed-lilabutik.md` → `scripts/seed-{slug}.md` |
| Run seed | `POST /api/tr/admin/seed` + `TR_ADMIN_SECRET` |
| Link owner | `scripts/link-tr-boutique-owner.md` |

### 3. Code / env registries (minimal hardcodes)

Until brand fields are fully DB-driven, touch these maps (add one line each — **no commerce forks**):

| Concern | File | Key |
|---------|------|-----|
| Editorial skin | `src/lib/tr/boutiqueHome/editorialSkin.ts` → `SLUG_SKINS` | `"atelier"` or omit for `classic` |
| Home layout | DB `home_layout` + optional `boutiqueHome/registry.ts` | must be `editorial` for local cart |
| Logo override | `src/lib/tr/boutiqueBrand.ts` → `LOGO_OVERRIDES` | `/tr/boutiques/{slug}/logo.png` |
| White logo | `LOGO_ON_DARK_OVERRIDES` | campaigns on accent |
| Favicon | `FAVICON_OVERRIDES` | white-bg PNG |
| Display name | `INTRO_BRAND_LABELS` | short UI name |
| SEO title | `DOCUMENT_TITLES` | e.g. `{Name} \| Shop Women's Clothing` |
| SEO description | `DOCUMENT_DESCRIPTIONS` | 1–2 sentences |
| Accent fallback | `THEME_ACCENT_OVERRIDES` | auth pages without DB row |
| Email logo | `src/lib/tr/authMail/templates.ts` → `EMAIL_LOGO_PATHS` | PNG path |
| Custom domain (code fallback) | `src/lib/tr/customDomain.ts` → `DEFAULT_DOMAIN_MAP` | prefer env instead |
| Custom domain (prod) | Env `TR_BOUTIQUE_DOMAINS` JSON | `{"shop.com":"{slug}","www.shop.com":"{slug}"}` |

### 4. Supabase Auth URL allow-list

**Authentication → URL Configuration → Redirect URLs** — add:

```text
https://www.cortisstyle.com/**
https://cortisstyle.com/**
https://{custom-domain}/**
https://www.{custom-domain}/**
http://localhost:3000/**
```

Site URL stays the platform (`https://www.cortisstyle.com`), not the boutique domain.

### 5. DNS / hosting

1. Boutique domain → same app host as Cortisstyle.
2. Confirm middleware passthrough for `/auth/*` and `/api/*`.
3. Know gap: custom-domain session cookie ≠ `.cortisstyle.com` SSO until fixed.

---

## Part B — UI-only work (what designers / agents should spend time on)

Everything below is content + CSS skin — **not** new checkout.

1. Pick a visual standard from [10-boutique-design-inspiration.md](./10-boutique-design-inspiration.md) (by what they sell).
2. Choose skin: reuse `classic` / `atelier`, or add a new id in `editorialSkin.ts` + shell classes (still shared commerce).
3. Fill `editorial_content` in seed/DB:
   - `nav`, `heroPromotions` (`campaign` / `brand` templates), watermarks, CTAs
   - `shopCategories`, `infoStrip`, `trends`, `midCampaign`, `join`, footer copy
4. Accent hex + logo lockups (black / white / favicon).
5. Real catalog photos; run owner guided upload so **marketplace cutouts** exist (storefront hides raw front/back hanger shots when cutouts exist).

**Do not:** `if (slug === "…")` inside checkout, cart, or stock deduction.

---

## Part C — Pre-live checklist (every boutique)

Copy for each launch. Check before announcing Instagram → site.

### C1. Legal & ops

- [ ] Contract / vergi levhası path agreed
- [ ] `legalName`, tax, address, MERSIS filled (or honest placeholders only if lawyer OK)
- [ ] Panel **Ayarlar** → ticari unvan, vergi no, IBAN (from vergi levhası / IBAN; **never** upload kimlik scans)
- [ ] Shipping / iade / değişim copy real (`shippingNote`, `exchangePolicy`)
- [ ] WhatsApp + Instagram correct on storefront + panel Ayarlar
- [ ] Legal pages reviewed (remove “Taslak” only after lawyer)

### C2. Brand & SEO

- [ ] Logo PNG + white campaign logo + white-bg favicon live
- [ ] Tab title is boutique SEO title (no `— Cortisstyle`)
- [ ] Meta description set
- [ ] Favicon readable on dark browser chrome
- [ ] Google Search Console: HTML meta via `src/app/layout.tsx` → `metadata.verification.google` (Lila token documented in [lila-butik-e-ticaret-setup.md](../lila-butik-e-ticaret-setup.md)); verify after deploy on custom domain

### C3. Catalog & imagery

- [ ] No `demo-maya` / placeholder product images on prod
- [ ] Front/back have marketplace cutouts; PDP does not show raw hanger shots for those slots
- [ ] Sizes + `size_stocks` filled for sized SKUs
- [ ] Prices in TRY; compare-at only when true
- [ ] Hidden / draft products not customer-visible

### C4. Auth & email

- [ ] `/giris` OTP works (branded From name)
- [ ] Password reset: new email → boutique-branded reset page (not CS logo) → returns to boutique `/giris`
- [ ] Supabase redirect allow-list includes boutique domain(s)
- [ ] Spot-check spam: Gmail/Outlook; Resend domain DKIM/SPF/DMARC green on `cortisstyle.com`
- [ ] Owner linked (`owner_user_id`) and can open `/tr/panel`

### C5. Commerce (honest mode until iyzico)

- [ ] `TR_CHECKOUT_SANDBOX` **false** on production
- [ ] `TR_IYZICO_ENABLED` **false** until card capture ships
- [ ] `TR_ORDER_CONFIRM_SECRET` set in production
- [ ] Add to cart with beden → sepet → odeme → **pending** order in panel
- [ ] Owner can mark **Ödendi**; cancel restores stock
- [ ] Mark-paid creates **Faturalar** draft; owner can mark issued offline + external no
- [ ] Coupon (if any) applies server-side
- [ ] No demo fatura / fake kargo etiket / fake takip / no fake GİB claims

### C6. Domain & paths

- [ ] `TR_BOUTIQUE_DOMAINS` includes apex + www
- [ ] Custom domain: `/`, `/urunler`, `/urun/…`, `/sepet`, `/odeme`, `/giris`, `/favoriler`, `/yasal/…`
- [ ] Platform path `/tr/{slug}` still works as backup
- [ ] Atelier: category nav hidden on hesap / sepet / favoriler (if using atelier)

### C7. Smoke script (30 min)

1. Home hero (brand + campaign slides) + CTAs  
2. PLP filter / sale chip  
3. PDP gallery (cutouts only for front/back) + add to cart  
4. Favoriler scoped to this slug  
5. Checkout → panel order + badge  
6. Logout / login OTP  
7. Reset password end-to-end on **boutique domain**  
8. Mobile header (logo, morph/icons, no category row on cart/auth)

---

## Part D — Still platform-wide (not per boutique)

Do not block a boutique launch waiting for these — communicate honestly:

- iyzico card capture
- Carrier API + tracking
- Full GİB e-Fatura / e-Arşiv API (özel entegratör) — **offline Faturalar registry exists** (`tr_invoices`, mark issued after manual cut)
- Full SSO cookie between custom domain and `.cortisstyle.com`
- Per-boutique sending domain (`noreply@butik.com`) — optional Resend upgrade; today all auth mail is `AUTH_EMAIL_FROM` / `noreply@cortisstyle.com` with boutique **display name**

### Seller documents pack (what papers unlock)

| Document | Use | Do not |
|----------|-----|--------|
| Vergi levhası | `legal_name`, `vergi_no`, address → Ayarlar | Upload PDF into the app |
| IBAN | `iban` → Ayarlar (payouts) | Show on storefront |
| İkametgah / kimlik | iyzico / bank KYC pack offline | Store ID scans in Supabase or panel |

Product sales invoice seller = **boutique**. Cortisstyle commission invoices = separate later.

SQL: apply `supabase/patch_tr_invoices.sql` on the project DB.

---

## Agent rules

1. New boutique ≠ new app. Extend registries + seed.
2. After wiring, update this doc if you invent a new registry key.
3. Prefer DB `logo_url` / `theme_accent` / `editorial_content` over growing slug maps — delete obsolete `if (slug)` when you touch a file.
4. Update [09](./09-boutique-clone-playbook.md) when architecture changes; keep **this** file as the day-of checklist.

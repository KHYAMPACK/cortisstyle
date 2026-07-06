# Turkey Shop Roadmap — Cortisstyle / Lookbook

Operational roadmap for launching the Turkish boutique marketplace on `cortisstyle.com/tr/...` (rebrand to Lookbook when `lookbook.com` is acquired).

**Model:** Curated outfit marketplace for independent boutiques with vergi levhası. Platform takes commission + optional monthly fee. International affiliate side continues separately on main domain.

**Target:** First real sale within 1–2 months of starting execution.

> **Disclaimer:** Internal planning doc — not legal or tax advice. Confirm registration, contracts, and compliance with a muhasebeci and lawyer before launch.

---

## Vision (one line)

Give Instagram boutiques a real storefront + put them inside a curated outfit marketplace where customers can mix pieces from different boutiques and buy through Cortisstyle.

---

## Business model

| Revenue | Notes |
|--------|--------|
| Commission per sale | 10–15% suggested at launch (covers iyzico cost + platform value) |
| Monthly fee | Optional — add after first 3 boutiques prove sales |
| Featured looks | Later — paid placement in homepage/editorial looks |
| Setup fee | Optional one-time for photography/page setup |

**Pitch to boutiques:** Not "cheaper than Shopier" — **"We bring sales through styled outfits, not just a payment link."**

**Hard rule:** No vergi levhası = no listing. No signed contract = no listing.

---

## Architecture

```
cortisstyle.com              → International lookbook + affiliate (unchanged)
cortisstyle.com/tr           → Turkish marketplace homepage
cortisstyle.com/tr/boutique1 → Boutique storefront
cortisstyle.com/tr/shop/...  → Product detail, cart, checkout
```

- Geo-detect Turkish IPs → redirect/rewrite to `/tr`
- Manual country toggle for diaspora / VPN users
- Same looks and aesthetic; different action per region (Buy vs affiliate link)

---

## Phase 0 — Business foundation (Week 1–2)

**Blockers — nothing goes live without these.**

- [ ] Register business → **vergi levhası** (esnaf or şirket; şirket better at scale)
- [ ] **Ticari banka hesabı**
- [ ] **KEP adresi** (required for ETBİS)
- [ ] **ETBİS** registration (e-Devlet) — register as e-commerce / aracı hizmet sağlayıcı
- [ ] **iyzico** application (start early; use sandbox while building)
- [ ] **Muhasebeci** (monthly retainer)
- [ ] **Kargo anlaşması** (Yurtiçi / Aras / MNG e-ticaret paketi)

**Note on naming:** If Lookbook rebrand is coming, either wait to register until `lookbook.com` is bought, or register now as Cortisstyle and update ticari unvan later (doable, slightly annoying).

---

## Phase 1 — Boutique pipeline (Week 1–3, parallel)

**Leverage mom's network — target 3–5 boutiques with vergi levhası and real demand.**

- [ ] Create boutique onboarding checklist (documents to collect)
- [ ] Draft boutique sözleşmesi (seller = boutique, platform = you)
- [ ] Sign first boutique before listing any products
- [ ] Verify vergi levhası manually (name, activity code, active status)

**Onboarding checklist per boutique:**

- [ ] Vergi levhası (copy)
- [ ] Legal business name (matches vergi levhası)
- [ ] IBAN (business account preferred)
- [ ] Contact person + phone
- [ ] Return/shipping address
- [ ] Confirmation: they ship orders and handle returns
- [ ] Signed boutique contract

---

## Phase 2 — Website build (Week 2–4)

**Technical — extend existing Cortisstyle stack (Next.js + Supabase + Vercel).**

### Routes

- [ ] `/tr` — marketplace homepage (hero looks + boutique grid)
- [ ] `/tr/[boutiqueSlug]` — boutique storefront
- [ ] `/tr/shop/[itemId]` — product detail (photos, price, size, condition, seller name)
- [ ] `/tr/cart` — cart (zustand)
- [ ] `/tr/checkout` — address + ön bilgilendirme + pay
- [ ] `/tr/siparis-onay` — order confirmation

### Middleware

- [ ] Geo-detection via Vercel `x-vercel-ip-country` in `src/middleware.ts`
- [ ] Turkish IP → `/tr` experience
- [ ] Country toggle (International / Türkiye)

### Data model (Supabase or JSON v1)

```
boutiques: id, slug, name, logo, description, vergiNo, iban, status
products:  id, boutiqueId, title, price, size, condition, images[], lookId, status
orders:    id, customerEmail, address, total, paymentStatus, createdAt
order_items: orderId, productId, boutiqueId, price, status
```

### Payments

- [ ] `POST /api/tr/checkout/initiate` — iyzico payment start
- [ ] `POST /api/tr/checkout/callback` — payment webhook
- [ ] Mark product `sold` on successful payment (one-of-a-kind inventory)
- [ ] Order notification (email / Telegram / Discord to you + boutique)

### Reuse from current Cortisstyle

- Look / item presentation (`LookItemsPanel`, outfit composition)
- Studio for curating cross-boutique looks
- Supabase auth (optional buyer accounts v2)
- Legal page shell + footer patterns

---

## Phase 3 — Legal pages (Week 2–4, before first sale)

**Turkish shop only — separate from international affiliate disclosures.**

- [ ] Mesafeli satış sözleşmesi (shown before payment)
- [ ] Ön bilgilendirme formu (pre-checkout, per order)
- [ ] İade / cayma hakkı politikası (14 gün)
- [ ] KVKK aydinlatma metni
- [ ] Platform kullanım koşulları
- [ ] Hakkımızda + iletişim (operator identity visible)
- [ ] Aracı hizmet sağlayıcı bilgisi — "Satıcı: [Boutique Name]" on every product

**Checkout:** Customer must accept mesafeli satış sözleşmesi before paying.

**Returns flow:**

```
Customer requests return (14 days)
→ Platform notifies boutique
→ Boutique provides return address / kargo
→ Boutique inspects item
→ Refund processed via iyzico
→ Commission reversed on returned item
→ Return shipping: boutique pays (2026 rule)
```

---

## Phase 4 — Content & curation (Week 2–4, parallel)

- [ ] Boutiques submit product photos, prices, sizes
- [ ] Curate 10–20 cross-boutique looks for launch
- [ ] Each look = 3–5 items from 1–3 boutiques
- [ ] Write short item descriptions (condition, measurements, fabric)

**Differentiator:** Outfit-first shopping, not product grid only.

---

## Phase 5 — Soft launch (Week 4–5)

- [ ] End-to-end test in iyzico sandbox
- [ ] Switch to production iyzico credentials
- [ ] One real test order (friend/family)
- [ ] Launch to mom's boutique network (3–5 boutiques)
- [ ] Manual payout to boutiques (weekly, after 14-day return window)
- [ ] Packing/kargo workflow documented per boutique

**Skip for v1:**

- iyzico marketplace auto-split
- Seller dashboard (email notifications enough)
- Automated returns portal
- Inventory management system (spreadsheet OK)

---

## Phase 6 — Growth (Week 5–8)

- [ ] Instagram / TikTok TR content ("Bu kombin X TL", styled looks)
- [ ] 2–3 posts per week
- [ ] Collect customer photos / reviews
- [ ] Track: which looks convert, which boutiques sell, price points
- [ ] Restock / onboard more boutiques based on data

---

## Phase 7 — Scale (Month 2+)

- [ ] iyzico pazaryeri (automated split payments)
- [ ] Seller dashboard (orders, earnings, stock)
- [ ] Featured look placement (paid)
- [ ] Lawyer-reviewed policies
- [ ] İYS registration (only when sending marketing SMS/email)
- [ ] E-fatura for commission invoices to boutiques
- [ ] Rebrand to Lookbook when `lookbook.com` purchased (domain + ticari unvan update)

---

## Timeline summary

```
Week 1–2   Vergi levhası, bank, KEP, ETBİS, iyzico, muhasebeci, kargo
Week 2–4   Build /tr routes, legal pages, boutique contracts, curate looks
Week 3–4   Sign boutiques, verify vergi levhası, iyzico integration
Week 4–5   Sandbox test → production → soft launch → first sales
Week 5–8   Social content, iterate, grow boutique count
Month 2+   Auto payouts, dashboard, scale, Lookbook rebrand
```

---

## Critical path (if late, everything slips)

1. Vergi levhası → blocks iyzico
2. iyzico approval → blocks real payments
3. Boutique contract + inventory → blocks site content
4. Mesafeli satış on site → blocks legal checkout

---

## Coexistence with international affiliate

| | International (`/`) | Turkey (`/tr`) |
|--|---------------------|----------------|
| Monetization | Affiliate commission | Platform commission + monthly fee |
| Checkout | External retailer | iyzico on site |
| Legal | Affiliate disclosure, privacy | Mesafeli satış, ETBİS, KVKK |
| Returns | Retailer's policy | 14-day Turkish consumer law |
| Seller | Foreign retailer | Boutique (you = platform) |

**No conflict** if routes and checkout flows stay separated.

---

## Launch pricing suggestion

**Month 1–3 (onboarding):**

- Commission only: **12–15%**
- No monthly fee
- Free boutique page setup for first 3–5 partners

**After traction:**

- Add monthly fee for outfit-builder participation (e.g. 299–999 TL)
- Or keep commission-only for boutiques that only want a storefront

---

## What NOT to do

- Don't onboard boutiques without vergi levhası
- Don't launch checkout without mesafeli satış + ön bilgilendirme
- Don't mix TR "Satın Al" with international affiliate buttons on same page
- Don't claim Amazon Associate on international side before approval
- Don't build seller dashboard / auto-split before first 3 boutiques sell

---

## Success metrics (first 90 days)

- 3–5 boutiques live with vergi levhası
- 10–20 curated cross-boutique looks
- First 10 orders
- Return rate tracked (<20% target)
- At least 1 boutique gets incremental sale they wouldn't get via WhatsApp alone

---

## Revision log

| Date | Change |
|------|--------|
| 2026-07-06 | Initial Turkey shop roadmap |
